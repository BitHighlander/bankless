/*

    Bankless API

    Create LP pools

    Communicate to wallet REST api

    Communicate to bill acceptor socket api

*/

const TAG = " | Bankless-Backend | "
import * as log from '@pioneer-platform/loggerdog'
import axios from 'axios';

const uuid = require('short-uuid');

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
        // let value = parseInt(amount/Math.pow(10, prescision))
        //
        // //web3 get nonce
        // let nonce = await web3.eth.getTransactionCount(address)
        // nonce = web3.utils.toHex(nonce)
        // //console.log("nonce: ",nonce)
        //
        // //get gas price
        // let gasPrice = await web3.eth.getGasPrice()
        // gasPrice = web3.utils.toHex(gasPrice)
        // console.log("gasPrice: ",gasPrice)
        //
        // //get gas limit
        // let gasLimit
        //
        // //get balance
        // let balance = await web3.eth.getBalance(address)
        // console.log("balance: ",balance)
        //
        // //get token data
        // let tokenData = await WEB3.eth.abi.encodeFunctionCall({
        //     name: 'transfer',
        //     type: 'function',
        //     inputs: [
        //         {
        //             type: 'address',
        //             name: '_to'
        //         },
        //         {
        //             type: 'uint256',
        //             name: '_value'
        //         }
        //     ]
        // }, [toAddress, value])
        //
        // //get gas limit
        // try{
        //     gasLimit = await web3.eth.estimateGas({
        //         to: address,
        //         value: value,
        //         data: tokenData
        //     })
        //     gasLimit = web3.utils.toHex(gasLimit + 941000) // Add 21000 gas to cover the size of the data payload
        // }catch(e){
        //     console.error("failed to get ESTIMATE GAS: ",e)
        //     gasLimit = web3.utils.toHex(30000 + 41000)
        // }
        //
        //
        // //sign
        // input = {
        //     nonce,
        //     gasPrice,
        //     gas:gasLimit,
        //     value: "0x0",
        //     "from": address,
        //     "to": contract,
        //     "data": tokenData,
        //     chainId,
        // }


        return {txid:"fakeTxidBro"}
    } catch (e) {
        console.error(tag, "e: ", e)
        throw e
    }
}


let get_balance = async function () {
    let tag = TAG + " | credit_usd | "
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
        let address = signer.getAddress(WALLET_MAIN)
        const newContract = new WEB3.eth.Contract(minABI, LUSD_CONTRACT);
        const decimals = await newContract.methods.decimals().call();
        const balanceBN = await newContract.methods.balanceOf(address).call()
        //console.log("input: balanceBN: ",balanceBN)
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