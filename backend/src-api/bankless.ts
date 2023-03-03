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
const {subscriber, publisher, redis, redisQueue} = require('@pioneer-platform/default-redis')
let signer = require("eth_mnemonic_signer")


let wait = require('wait-promise');
let sleep = wait.sleep;

let URL_WALLET = "http://localhost:3001"
let WALLET_MAIN = process.env['WALLET_MAIN']
if(!WALLET_MAIN) throw Error("Missing WALLET_MAIN from ENV!")

let NO_BROADCAST = process.env['WALLET_NO_BROADCAST']
if(NO_BROADCAST) log.info(" NERFED! wallet will not send crypto!")

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

//bill acceptor
let eSSP:any
let ACCEPTOR_ONLINE = false
let ALL_BILLS = {
    "1": 0,
    "5": 0,
    "10":  0,
    "20":  0,
    "50":  0,
    "100":  0
}
let TOTAL_CASH = 0
let TOTAL_LUSD = 0
//current session
let CURRENT_SESSION
let SESSION_FUNDING_USD = 0
let SESSION_FUNDING_LUSD = 0
let SESSION_FULLFILLED = false
let TXIDS_REVIEWED = []

/*
    Create LP pools
 */

let ACCOUNTS_LP_OWNERS = []

let onStartAcceptor = async function(){
    try{
        const channels = []

        const serialPortConfig = {
            baudRate: 9600, // default: 9600
            dataBits: 8, // default: 8
            stopBits: 2, // default: 2
            parity: 'none', // default: 'none'
        }

        eSSP = new SspLib({
            id: 0x00,
            debug: false, // default: false
            timeout: 3000, // default: 3000
            encryptAllCommand: true, // default: true
            fixedKey: '0123456701234567', // default: '0123456701234567'
        })

        eSSP.on('OPEN', async () => {
            console.log('Port opened!')
        })

        eSSP.on('CLOSE', async () => {
            console.log('Port closed!')
        })

        eSSP.on('READ_NOTE', async result => {
            if (result.channel === 0) return
            const channel = channels[result.channel - 1]
            console.log('READ_NOTE', channel)

            // if (channel.value === 500) {
            //   eSSP.command('REJECT_BANKNOTE')
            // }
        })

        eSSP.on('NOTE_REJECTED', async result => {
            console.log('NOTE_REJECTED', result)
            console.log(await eSSP.command('LAST_REJECT_CODE'))
        })

        eSSP.on('CREDIT_NOTE', async result => {
            if (result.channel === 0) return
            const channel = channels[result.channel - 1]
            console.log('CREDIT_NOTE', channel)
            publisher.publish("payments",JSON.stringify({amount:channel.value/100,asset:"USD"}))
            let amount = (parseInt(channel.value)/100).toString()
            console.log('credit amount: ', amount)
            credit_session(amount,"USD")
        })
        
        //await eSSP.open('/dev/ttyUSB0', serialPortConfig)
        //dev/tty.usbserial-AQ031MU7
        await eSSP.open('/dev/tty.usbserial-AQ031MU7', serialPortConfig)
        await eSSP.command('SYNC')
        await eSSP.command('HOST_PROTOCOL_VERSION', { version: 6 })
        console.log('disabling payin')
        await eSSP.disable()

        console.log('encryption init')
        await eSSP.initEncryption()
        console.log('SERIAL NUMBER:', (await eSSP.command('GET_SERIAL_NUMBER'))?.info?.serial_number)

        const setup_result = await eSSP.command('SETUP_REQUEST')
        for (let i = 0; i < setup_result.info.channel_value.length; i++) {
            channels[i] = {
                value: setup_result.info.expanded_channel_value[i] * setup_result.info.real_value_multiplier,
                country_code: setup_result.info.expanded_channel_country_code[i],
            }
        }

        console.log('set channel inhibits')
        await eSSP.command('SET_CHANNEL_INHIBITS', {
            channels: Array(channels.length).fill(1),
        })

        console.log('resetting routes')
        const payoutDenoms = [100, 500, 1000, 2000]
        for (let i = 0; i < channels.length; i++) {
            const channel = channels[i]
            // TODO: country code check
            if (!payoutDenoms.includes(channel.value)) {
                await eSSP.command('SET_DENOMINATION_ROUTE', {route: 'cashbox', value: channel.value, country_code: channel.country_code})
            }
        }
        for (let i = 0; i < channels.length; i++) {
            const channel = channels[i]
            // TODO: country code check
            if (payoutDenoms.includes(channel.value)) {
                await eSSP.command('SET_DENOMINATION_ROUTE', {route: 'payout', value: channel.value, country_code: channel.country_code})
            }
        }

        console.log('checking routes')
        for (const channel of channels) {
            console.log(channel, (await eSSP.command('GET_DENOMINATION_ROUTE', {value: channel.value, country_code: channel.country_code}))?.info)
        }

        console.log('enable refill mode')
        await eSSP.command('SET_REFILL_MODE', { mode: 'on' })

        console.log('enable payin')
        await eSSP.enable()

        console.log('enable payout')
        await eSSP.command('ENABLE_PAYOUT_DEVICE', {REQUIRE_FULL_STARTUP: false, GIVE_VALUE_ON_STORED: true})

        console.log('get levels')
        const levels = (await eSSP.command('GET_ALL_LEVELS'))?.info?.counter;
        console.log(levels)

        for(let i = 0; i < levels.length; i++){
            let level = levels[i]
            console.log('level: ', level)
            if(level.value == 100){
                ALL_BILLS["1"] = level.denomination_level
            }
            if(level.value == 500){
                ALL_BILLS["5"] = level.denomination_level
            }
            if(level.value == 1000){
                ALL_BILLS["10"] = level.denomination_level
            }
            if(level.value == 2000){
                ALL_BILLS["20"] = level.denomination_level
            }
            if(level.value == 5000){
                ALL_BILLS["50"] = level.denomination_level
            }
            if(level.value == 10000){
                ALL_BILLS["100"] = level.denomination_level
            }
        }
        ACCEPTOR_ONLINE = true
        onStartSession()
    }catch(e){
        console.error(e)
    }
}
onStartAcceptor()

let sub_for_payments = async function(){
    let tag = " | sub_for_payments | "
    try{
    let address = await signer.getAddress(WALLET_MAIN)
        log.info(tag,"address: ",address)

        //let first start
        let firstStart = true
        let isScanning = true
        while(isScanning){
            log.info(tag,"scanning...")
            let url = "https://indexer.ethereum.shapeshift.com"+"/api/v2/address/"+address+"?details=all"
            let body = {
                method: 'GET',
                url,
                headers: {
                    'content-type': 'application/json'
                },
            };
            let resp = await axios(body)
            if(!resp.data) return
            if(!resp.data.txids) return
            let txids = resp.data.txids
            for(let i = 0; i < txids.length; i++){
                let txid = txids[i]
                if(CURRENT_SESSION && !TXIDS_REVIEWED.some(e => e.txid === txid)){
                    let url = "https://indexer.ethereum.shapeshift.com"+"/api/v2/tx/"+txid
                    let body = {
                        method: 'GET',
                        url,
                        headers: {
                            'content-type': 'application/json'
                        },
                    };
                    let respTx = await axios(body)
                    let paymentAmountLusd = 0
                    for(let i = 0; i < respTx.data.tokenTransfers.length; i++){
                        let transfer = respTx.data.tokenTransfers[i]
                        if(transfer["symbol"] == "LUSD" && transfer.contract === LUSD_CONTRACT){
                            paymentAmountLusd = parseInt(transfer.value) / 1000000000000000000
                            SESSION_FUNDING_LUSD += paymentAmountLusd
                        }
                    }
                    log.info("paymentAmountLusd: ",paymentAmountLusd)
                    log.info("SESSION_FUNDING_LUSD: ",SESSION_FUNDING_LUSD)
                    let payment = {
                        txid:txids[i],
                        asset:"LSD",
                        session:CURRENT_SESSION.sessionId,
                        amount:paymentAmountLusd,
                        funded:true,
                        fullfilled:false
                    }
                    TXIDS_REVIEWED.push(payment)
                    //Payment found!
                    publisher.publish("payments",JSON.stringify(payment))
                    if(CURRENT_SESSION) CURRENT_SESSION.SESSION_FUNDING_LUSD = SESSION_FUNDING_LUSD
                } else if(!TXIDS_REVIEWED.some(e => e.txid === txid) && !firstStart){
                    log.info(tag,"payment outside session!")
                    log.info(tag,"payment: !")
                    let payment = {
                        txid:txids[i],
                        session:"none",
                        status:"missed"
                    }
                    TXIDS_REVIEWED.push(payment)
                } else if(firstStart){
                    let payment = {
                        txid:txids[i],
                        session:"none",
                        status:"ignored"
                    }
                    TXIDS_REVIEWED.push(payment)
                }
            }


            firstStart = false
            await sleep(30000)
        }
    }catch(e){
        console.error(e)
    }
}
sub_for_payments()

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
    startSessionBuy: async function (input:any) {
        return start_session_buy(input);
    },
    startSessionSell: async function (input:any) {
        return start_session_sell(input);
    },
    startSessionLpAdd: async function (input:any) {
        return start_session_lp_add(input);
    },
    startSessionLpWithdraw: async function (input:any) {
        return start_session_lp_withdraw(input);
    },
    startSessionLpAddAsy: async function (input:any) {
        return start_session_lp_add_asym(input);
    },
    startSessionLpWithdrawAsym: async function (input:any) {
        return start_session_lp_withdraw_asym(input);
    },
    //credit session
    credit: async function (amount:number,asset:string) {
        return credit_session(amount,asset);
    },
    //wallet TXIDS_REVIEWED
    payments: async function () {
        return TXIDS_REVIEWED;
    },
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
    payout: async function (amount:string) {
        return payout_cash(amount);
    },
    //fullfill
    fullfill: async function (sessionId:string) {
        return fullfill_order(sessionId);
    },
}

let onStartSession = async function(){
    let tag = TAG + " | onStartSession | "
    try{
        let timeStart = new Date().getTime()
        log.info(tag,"timeStart: ",timeStart)
        //if(!ACCEPTOR_ONLINE) throw Error("Acceptor not online!")

        //get balance of bill acceptor
        let totalCash = 0;
        Object.keys(ALL_BILLS).forEach(key => {
            totalCash = totalCash + (parseInt(key) * ALL_BILLS[key]);
        });
        TOTAL_CASH = totalCash
        log.info(totalCash)

        //get balance of wallet
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
        TOTAL_LUSD = await tokenBalance

        //get last state of ATM runtime
        //@TODO

        //@TODO if diff record it

        //start session
        log.info(tag,"TOTAL_CASH: ",TOTAL_CASH)
        log.info(tag,"TOTAL_LUSD: ",TOTAL_LUSD)

        //get LP owners


    }catch(e){
        console.error(e)
    }
}
onStartSession()

let fullfill_order = async function (sessionId:string) {
    let tag = TAG + " | fullfill_order | "
    try {
        log.info("CURRENT_SESSION: ",CURRENT_SESSION)
        if(!CURRENT_SESSION) throw Error("No session to fullfill!")
        if(CURRENT_SESSION.type === 'buy'){
            if(SESSION_FUNDING_USD === 0) throw Error("No session to fullfill!")
            let rate = TOTAL_CASH / TOTAL_LUSD
            log.info(tag,"rate: ",rate)
            let amountOut = SESSION_FUNDING_USD / rate
            log.info(tag,"amountOut: ",amountOut)
            amountOut = parseInt(amountOut.toString())
            log.info(tag,"amountOut (rounded): ",amountOut)
            //round to int
            let txid = await send_to_address(CURRENT_SESSION.address,amountOut.toString())
            CURRENT_SESSION.txid = txid
            return txid
        }
        if(CURRENT_SESSION.type === 'sell'){
            let rate = TOTAL_CASH / TOTAL_LUSD
            log.info(tag,"rate: ",rate)
            let amountOut = SESSION_FUNDING_LUSD * rate
            log.info(tag,"amountOut: ",amountOut)
            amountOut = parseInt(amountOut.toString())
            log.info(tag,"amountOut (rounded): ",amountOut)
            let txid = await payout_cash(amountOut.toString())
            CURRENT_SESSION.txid = txid
            return txid
        }
        if(CURRENT_SESSION.type === 'lpAdd'){
            //caluate LP tokens
            // let lpTokens = await calculate_lp_tokens(SESSION_FUNDING_LUSD,SESSION_FUNDING_USD)

            //credit owner
            let txid = "bla"
            return txid
        }
        if(CURRENT_SESSION.type === 'lpAddAsym'){
            //do swap

            //caluate LP tokens

            //credit owner
            let txid = "bla"
            return txid
        }
        SESSION_FUNDING_LUSD = 0
        SESSION_FUNDING_USD = 0
        SESSION_FULLFILLED = false
        CURRENT_SESSION = null
    } catch (e) {
        console.error(tag, "e: ", e)
        throw e
    }
}

let credit_session = async function (amount:any,asset:string) {
    let tag = TAG + " | credit_session | "
    try {
        log.info(amount, asset)
        if(asset === 'USD'){
            SESSION_FUNDING_USD = SESSION_FUNDING_USD + parseInt(amount)
        }
        if(asset === 'LUSD'){
            SESSION_FUNDING_LUSD = SESSION_FUNDING_LUSD + parseInt(amount)
        }
        publisher.publish('payments',JSON.stringify({amount,asset}))
        return true
    } catch (e) {
        console.error(tag, "e: ", e)
        throw e
    }
}

let payout_cash = async function (amount:string) {
    let tag = TAG + " | payout_cash | "
    try {
        log.info("paying out cash: ",amount)
        //verify
        let result = await eSSP.command('PAYOUT_AMOUNT', {
            amount:parseInt(amount) * 100,
            country_code: 'USD',
            test: false,
        })
        log.info("result: ",result)
        return "done"
    } catch (e) {
        console.error(tag, "e: ", e)
        throw e
    }
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

        if(NO_BROADCAST){
            return "NERFED!-nobroadcast"
        }else{
            //broadcast
            WEB3.eth.sendSignedTransaction(result)
                .once('transactionHash', function(hash){
                    console.log("txHash", hash)
                    CURRENT_SESSION.txid = hash
                    publisher.publish("payments",JSON.stringify({txid:hash,session:CURRENT_SESSION,type:'fullfill'}))
                    return hash
                })
                .once('receipt', function(receipt){ console.log("receipt", receipt) })
                .on('confirmation', function(confNumber, receipt){
                    CURRENT_SESSION.status = 'fullfilled'
                    console.log("confNumber",confNumber,"receipt",receipt) })
                .on('error', function(error){ console.log("error", error) })
                .then(function(receipt){
                    console.log("trasaction mined!", receipt);
                });
        }

        // log.info("txHash: ",txHash)
        // return txHash
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

let check_for_payments = async function (amount:number) {
    let tag = TAG + " | check_for_payments | "
    try {
        //@TODO amount in pennies, INT
        balanceUSD = balanceUSD + amount

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
        //
        if(CURRENT_SESSION) CURRENT_SESSION.SESSION_FUNDING_USD = SESSION_FUNDING_USD
        if(CURRENT_SESSION) CURRENT_SESSION.SESSION_FUNDING_LUSD = SESSION_FUNDING_LUSD

        let totalSelected = 0;
        Object.keys(ALL_BILLS).forEach(key => {
            totalSelected = totalSelected + (parseInt(key) * ALL_BILLS[key]);
        });

        let output:any = {
            billacceptor:"online",
            hotwallet:"online",
            balanceUSD: TOTAL_CASH, //TODO get this from hardware
            balanceLUSD: TOTAL_LUSD, //TODO get this from hotwallet
            rate: TOTAL_CASH / TOTAL_LUSD,
            session: CURRENT_SESSION,
            totalUsd: totalSelected,
            cash: ALL_BILLS
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

let start_session_buy = async function (input:any) {
    let tag = TAG + " | start_session_buy | "
    try {
        if(CURRENT_SESSION) return CURRENT_SESSION
        if(!input.address) throw Error("no address!")
        //if buy intake address
        let sessionId = uuid.generate()
        let address = input.address
        CURRENT_SESSION = {sessionId, address, type:"buy"}
        //@TODO save to mongo
        return CURRENT_SESSION
    } catch (e) {
        console.error(tag, "e: ", e)
        throw e
    }
}

let start_session_sell = async function (input) {
    let tag = TAG + " | start_session_sell | "
    try {
        log.info(tag,"input: ",input)
        //if buy intake address
        let sessionId = uuid.generate()
        let amount = input.amount
        if(!amount) throw Error("no amount!")
        //address
        let address = await signer.getAddress(WALLET_MAIN)
        
        CURRENT_SESSION = {sessionId, amount, type:"sell", address}
        log.info("CURRENT_SESSION: ",CURRENT_SESSION)
        return CURRENT_SESSION
    } catch (e) {
        console.error(tag, "e: ", e)
        throw e
    }
}

let start_session_lp_add = async function (input) {
    let tag = TAG + " | start_session_lp | "
    try {
        //if buy intake address
        let sessionId = uuid.generate()
        let address = input.address
        CURRENT_SESSION = {sessionId, address, type:"lpAdd"}
        return CURRENT_SESSION
    } catch (e) {
        console.error(tag, "e: ", e)
        throw e
    }
}

let start_session_lp_add_asym = async function (input) {
    let tag = TAG + " | start_session_lp | "
    try {
        //if buy intake address
        let sessionId = uuid.generate()
        let address = input.address
        CURRENT_SESSION = {sessionId, address, type:"lpAddAsym"}
        return CURRENT_SESSION
    } catch (e) {
        console.error(tag, "e: ", e)
        throw e
    }
}

let start_session_lp_withdraw = async function (input) {
    let tag = TAG + " | start_session_lp_withdraw | "
    try {
        //if buy intake address
        let sessionId = uuid.generate()
        let address = input.address
        CURRENT_SESSION = {sessionId, address, type:"lpAddAsym"}
        return currentSession
    } catch (e) {
        console.error(tag, "e: ", e)
        throw e
    }
}

let start_session_lp_withdraw_asym = async function (input) {
    let tag = TAG + " | start_session_lp_withdraw_asym | "
    try {
        //if buy intake address
        let sessionId = uuid.generate()
        let address = input.address
        CURRENT_SESSION = {sessionId, address}
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