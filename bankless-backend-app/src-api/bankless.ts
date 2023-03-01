/*

    Bankless API

    Create LP pools

    Communicate to wallet REST api

    Communicate to bill acceptor socket api

*/

const TAG = " | Bankless-Backend | "
import axios from 'axios';
const SspLib = require('@keepkey/encrypted-smiley-secure-protocol')
const uuid = require('short-uuid');
const log = require('@pioneer-platform/loggerdog')();

let signer = require("eth_mnemonic_signer")


let wait = require('wait-promise');
let sleep = wait.sleep;

let URL_WALLET = "http://localhost:3001"
let WALLET_MAIN = process.env['WALLET_MAIN']
if(!WALLET_MAIN) throw Error("Missing WALLET_MAIN from ENV!")

// order types
enum OrderTypes {
    Buy,
    Sell,
    LP
}

enum Status {
    created,
    funded,
    fullfilled ,
}

interface buyOrder {
    orderId: string,
    type: OrderTypes,
    amountIn: number,
    amountOut: number,
    txid?: string,
    assetId: string,
    status: Status,
}

interface sellOrder {
    orderId: string,
    type: OrderTypes,
    amountIn: number,
    amountOut: number,
    txid?: string,
    assetId: string,
    status: Status,
}

interface lp {
    orderId: string,
    type: OrderTypes,
    amountFiat: number,
    amountCrypto: number,
    assetId: string,
    status: Status,
}

//STATE @TODO move this to DB?
let balanceUSD = 0
let balanceLUSD = 0

let currentSession:any //@TODO session must use session Types

const Web3 = require("web3")
let service = "https://mainnet.infura.io/v3/fb05c87983c4431baafd4600fd33de7e"
let WEB3 = new Web3(new Web3.providers.HttpProvider(service))
let LUSD_CONTRACT = "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0"

let onStart = async function(){
    try{
        const channels = [{ value: 0, country_code: 'XXX' }]


        const serialPortConfig = {
            baudRate: 9600, // default: 9600
            dataBits: 8, // default: 8
            stopBits: 2, // default: 2
            parity: 'none', // default: 'none'
        }

        const eSSP = new SspLib({
            id: 0x00,
            debug: false, // default: false
            timeout: 3000, // default: 3000
            encryptAllCommand: true, // default: true
            fixedKey: '0123456701234567', // default: '0123456701234567'
        })

        eSSP.on('OPEN', () => {
            console.log('Port opened!')
        })

        eSSP.on('CLOSE', () => {
            console.log('Port closed!')
        })

        eSSP.on('READ_NOTE', result => {
            if (result.channel === 0) return
            console.log('READ_NOTE', result, channels[result.channel])

            if (channels[result.channel].value === 500) {
                eSSP.command('REJECT_BANKNOTE')
            }
        })

        eSSP.on('NOTE_REJECTED', result => {
            console.log('NOTE_REJECTED', result)

            eSSP.command('LAST_REJECT_CODE').then(result => {
                console.log(result)
            })
        })

        eSSP
            .open('/dev/ttyUSB0', serialPortConfig)
            .then(() => eSSP.command('SYNC'))
            .then(() => eSSP.command('HOST_PROTOCOL_VERSION', { version: 6 }))
            .then(() => eSSP.initEncryption())
            .then(() => eSSP.command('GET_SERIAL_NUMBER'))
            .then(result => {
                console.log('SERIAL NUMBER:', result.info.serial_number)
                return
            })
            .then(() => eSSP.command('SETUP_REQUEST'))
            .then(result => {
                for (let i = 0; i < result.info.channel_value.length; i++) {
                    channels[i] = {
                        value: result.info.expanded_channel_value[i],
                        country_code: result.info.expanded_channel_country_code[i],
                    }
                }
                return
            })
            .then(() => eSSP.command('SET_CHANNEL_INHIBITS', {
                channels: Array(channels.length).fill(1),
            }))
            .then(() => eSSP.enable())
            .then(async () => {
                console.log('resetting routes')
                for (const i of [200, 5000, 10000]) {
                    await eSSP.command('SET_DENOMINATION_ROUTE', {route: 'cashbox', value: i, country_code: 'USD'})
                }
                for (const i of [100, 500, 1000, 2000]) {
                    await eSSP.command('SET_DENOMINATION_ROUTE', {route: 'recycler', value: i, country_code: 'USD'})
                }
                console.log('get levels')
                console.log((await eSSP.command('GET_ALL_LEVELS'))?.info?.counter)
                console.log('check barcode reader config')
                console.log(await eSSP.command('GET_BAR_CODE_READER_CONFIGURATION'))
                console.log('GO!!!')
            })
            .catch(error => {
                console.log(error)
            })
    }catch(e){
        console.error(e)
    }
}


module.exports = {
    status: async function () {
        return get_status();
    },
    creditUSD: async function (amount:number) {
        return credit_usd(amount);
    },
    creditLUSD: async function (amount:number) {
        return credit_lusd(amount);
    },
    poolInfo: async function () {
        return get_pool_info();
    },
    startSession: async function (input:any) {
        return start_session(input);
    },
    //wallet
    address: async function () {
        return signer.getAddress(WALLET_MAIN);
    },
    balance: async function () {
        return get_balance();
    },
    sendToAddress: async function (address:string,amount:string) {
        return send_to_address(address,amount);
    },
    //bill acceptor
}

let send_to_address = async function (address:string,amount:string) {
    let tag = TAG + " | send_to_address | "
    try {
        log.info(tag,"address:",address)
        log.info(tag,"amount:",amount)
        // @ts-ignore
        let value = parseInt(amount * Math.pow(10, 18)).toString()
        log.info(tag,"value:",value)
        let addressFrom = await signer.getAddress(WALLET_MAIN)
        //web3 get nonce
        let nonce = await WEB3.eth.getTransactionCount(addressFrom)
        // nonce = nonce + 3
        console.log("nonce: ",nonce)
        nonce = WEB3.utils.toHex(nonce)


        //get gas price
        let gasPrice = await WEB3.eth.getGasPrice()
        console.log("gasPrice: ",gasPrice)
        gasPrice = WEB3.utils.toHex(gasPrice)


        //get gas limit
        let gasLimit

        //get balance
        let balance = await WEB3.eth.getBalance(address)
        console.log("balance: ",balance)

        //get token data
        let tokenData = await WEB3.eth.abi.encodeFunctionCall({
            name: 'transfer',
            type: 'function',
            inputs: [
                {
                    type: 'address',
                    name: '_to'
                },
                {
                    type: 'uint256',
                    name: '_value'
                }
            ]
        }, [address, value])

        //get gas limit
        try{
            gasLimit = await WEB3.eth.estimateGas({
                to: address,
                value: value,
                data: tokenData
            })
            gasLimit = WEB3.utils.toHex(gasLimit + 121000) // Add 21000 gas to cover the size of the data payload
        }catch(e){
            console.error("failed to get ESTIMATE GAS: ",e)
            gasLimit = WEB3.utils.toHex(30000)
        }


        //sign
        let input = {
            nonce,
            gasPrice,
            gasLimit:gasLimit,
            value: "0x0",
            "from": addressFrom,
            "to": LUSD_CONTRACT,
            "data": tokenData,
            chainId:1,
        }
        log.info("input: ",input)
        //signer
        let result = await signer.signTx(input, WALLET_MAIN)
        log.info("result: ",result)

        //broadcast
        const txHash = await WEB3.eth.sendSignedTransaction(result);

        return txHash.transactionHash
    } catch (e) {
        console.error(tag, "e: ", e)
        throw e
    }
}


let get_balance = async function () {
    let tag = TAG + " | get_balance | "
    try {
        let minABI = [
            // balanceOf
            {
                "constant":true,
                "inputs":[{"name":"_owner","type":"address"}],
                "name":"balanceOf",
                "outputs":[{"name":"balance","type":"uint256"}],
                "type":"function"
            },
            // decimals
            {
                "constant":true,
                "inputs":[],
                "name":"decimals",
                "outputs":[{"name":"","type":"uint8"}],
                "type":"function"
            }
        ];
        let address = await signer.getAddress(WALLET_MAIN)
        console.log("address: ",address)
        const newContract = new WEB3.eth.Contract(minABI, LUSD_CONTRACT);
        const decimals = await newContract.methods.decimals().call();
        console.log("decimals: ",decimals)
        const balanceBN = await newContract.methods.balanceOf(address).call()
        console.log("input: balanceBN: ",balanceBN)
        // @ts-ignore
        let tokenBalance = parseInt(balanceBN/Math.pow(10, decimals))
        return tokenBalance
    } catch (e) {
        console.error(tag, "e: ", e)
        throw e
    }
}



let credit_usd = async function (amount:number) {
    let tag = TAG + " | credit_usd | "
    try {
        //@TODO amount in pennies, INT
        balanceUSD = balanceUSD + amount

    } catch (e) {
        console.error(tag, "e: ", e)
        throw e
    }
}

let credit_lusd = async function (amount:number) {
    let tag = TAG + " | credit_usd | "
    try {
        //@TODO amount in pennies, INT
        balanceLUSD = balanceLUSD + amount

    } catch (e) {
        console.error(tag, "e: ", e)
        throw e
    }
}

let get_status = async function () {
    let tag = TAG + " | get_and_rescan_pubkeys | "
    try {
        //get balance Wallet
        let balanceLUSD = await axios.get(URL_WALLET+"/balance")
        console.log(tag,"balanceLUSD: ",balanceLUSD.data)

        //
        let output:any = {
            billacceptor:"online",
            hotwallet:"online",
            balanceUSD: 23000, //TODO get this from hardware
            balanceLUSD: 29000, //TODO get this from hotwallet
            rate: 23000 / 29000
        }
        return output
    } catch (e) {
        console.error(tag, "e: ", e)
        throw e
    }
}

let get_pool_info = async function () {
    let tag = TAG + " | get_pool_info | "
    try {
        //

    } catch (e) {
        console.error(tag, "e: ", e)
        throw e
    }
}

let start_session = async function (input) {
    let tag = TAG + " | deposit_fiat | "
    try {
        //if buy intake address
        let sessionId = uuid.v4()
        let address = input.address
        currentSession = {sessionId, address}
        return currentSession
    } catch (e) {
        console.error(tag, "e: ", e)
        throw e
    }
}

let deposit_fiat = async function () {
    let tag = TAG + " | deposit_fiat | "
    try {
        //

    } catch (e) {
        console.error(tag, "e: ", e)
        throw e
    }
}

let deposit_crypto = async function () {
    let tag = TAG + " | deposit_crypto | "
    try {
        //

    } catch (e) {
        console.error(tag, "e: ", e)
        throw e
    }
}