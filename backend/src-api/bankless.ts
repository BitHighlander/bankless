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
var geoip2 = require('geoip2-lite');
let signer = require("eth_mnemonic_signer")
let os = require("os")
const Pioneer = require("@pioneer-platform/pioneer-client").default;
import {getIPAddress} from "./utils"
let Events = require("@pioneer-platform/pioneer-events")
let capTable = require('./capTable')
const fs = require('fs');

let wait = require('wait-promise');
let sleep = wait.sleep;

let PIONEER_WS = process.env['PIONEER_WS'] || "wss://pioneers.dev"
let URL_PIONEER_SPEC = process.env['URL_PIONEER_SPEC'] || "https://pioneers.dev/spec/swagger.json"

let WALLET_MAIN = process.env['WALLET_MAIN']
if(!WALLET_MAIN) throw Error("Missing WALLET_MAIN from ENV!")

let TERMINAL_NAME = process.env['TERMINAL_NAME']
if(!TERMINAL_NAME) throw Error("TERMINAL_NAME is required!")

let QUERY_KEY = process.env['QUERY_KEY']
if(!QUERY_KEY) throw Error("QUERY_KEY is required!")

let NO_BROADCAST = process.env['WALLET_NO_BROADCAST']
if(NO_BROADCAST) log.debug(" NERFED! wallet will not send crypto!")

let WALLET_FAKE_PAYMENTS = process.env['WALLET_FAKE_PAYMENTS']
if(WALLET_FAKE_PAYMENTS) log.debug(" WALLET_FAKE_PAYMENTS: will NOT pay crypto!")

let WALLET_FAKE_BALANCES = process.env['WALLET_FAKE_BALANCES']
if(WALLET_FAKE_BALANCES) log.debug(" WALLET_FAKE_BALANCES: will FAKE BALANCES!")

let ATM_NO_HARDWARE = process.env['ATM_NO_HARDWARE']
if(ATM_NO_HARDWARE) log.debug(" ATM_NO_HARDWARE: not attempting hardwware!")

let USB_CONNECTION = process.env['USB_CONNECTION']
if(!USB_CONNECTION) log.debug("USB_CONNECTION: REQUIRED!")

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
let balanceDAI = 0
let currentSession:any //@TODO session must use session Types


const Web3 = require("web3")
let service = "https://mainnet.infura.io/v3/fb05c87983c4431baafd4600fd33de7e"
let WEB3 = new Web3(new Web3.providers.HttpProvider(service))
let DAI_CONTRACT = "0x6b175474e89094c44da98b954eedeac495271d0f"

//pioneer
let pioneer:any

//bill acceptor
let eSSP:any
let ACCEPTOR_ONLINE = false

let ALL_BILLS = {
    "1": 0,
    "2": 0,
    "5": 0,
    "10":  0,
    "20":  0,
    "50":  0,
    "100":  0,
}
if(WALLET_FAKE_BALANCES) {
    ALL_BILLS["100"] = 12
    ALL_BILLS["50"] = 10
    ALL_BILLS["20"] = 11
    ALL_BILLS["5"] = 10
    ALL_BILLS["2"] = 10
    ALL_BILLS["1"] = 10
}

let TOTAL_CASH = 0
let TOTAL_DAI = 0
if(WALLET_FAKE_BALANCES) {
    TOTAL_DAI = 2000
}
let totalCash = 0;
Object.keys(ALL_BILLS).forEach(key => {
    totalCash = totalCash + (parseInt(key) * ALL_BILLS[key]);
});
TOTAL_CASH = totalCash
capTable.sync(TOTAL_CASH, TOTAL_DAI)
capTable.init()

//Global Session id. every time we shut down we audit reserves and create a new session!
let GLOBAL_SESSION = "unset"

//current session
let CURRENT_SESSION: {
    start?: any,
    sessionId?: string,
    type?: string,
    address?: string,
    txid?: string,
    status?: string,
    amountIn?: number,
    amountOut?: number,
    percentage?: number,
    SESSION_FUNDING_USD?: number,
    SESSION_FUNDING_DAI?: number,
    SESSION_FULLFILLED?: boolean,
}
let TXIDS_REVIEWED = []
let TXS_FULLFILLED = []

function getQuoteForBuy(usdIn: number): number {
    const quoteRate = TOTAL_DAI / (TOTAL_CASH + usdIn)
	return usdIn * quoteRate
}

function getQuoteForSellProducingCashValue(usdOut: number): number {
    const quoteRate = TOTAL_DAI / (TOTAL_CASH - usdOut)
	return usdOut * quoteRate
}

function getQuoteForSellOfExactCryptoValue(daiIn: number): number {
    //console.log('| getQuoteForSellOfExactCryptoValue | daiIn: ', daiIn)
    //console.log('| getQuoteForSellOfExactCryptoValue | TOTAL_CASH: ', TOTAL_CASH)
    //console.log('| getQuoteForSellOfExactCryptoValue | TOTAL_DAI: ', TOTAL_DAI)
    const quoteRate = TOTAL_CASH / (TOTAL_DAI + daiIn)
	return daiIn * quoteRate
}

//get LP pool cap table

//get quote for LP add liquidity
function getQuoteForAddLiquidity(usdIn: number): number {
    const liquidityRate = TOTAL_DAI / TOTAL_CASH
    return usdIn * liquidityRate;
}

//get quote for LP remove liquidity
function getQuoteForRemoveLiquidity(usdOut: number): number {
    const liquidityRate = TOTAL_CASH / TOTAL_DAI;
    return usdOut * liquidityRate;
}

let onStartAcceptor = async function(){
    let tag = TAG  + " | onStartAcceptor | "
    try{
        log.info("onStartAcceptor")
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

        let command = eSSP.command.bind(eSSP)
        let lastLock = Promise.resolve()
        eSSP.command = async function (...args: unknown[]) {
            await lastLock
            let resolver
            lastLock = new Promise<void>(resolve => resolver = resolve)
            try {
                const result = await command(...args)
                if (!result?.success) throw new Error(JSON.stringify(result))
                return result
            } finally {
                resolver()
            }
        }


        eSSP.on('OPEN', async () => {
            log.info(tag,'Port opened!')
        })

        eSSP.on('CLOSE', async () => {
            //console.log('Port closed!')
            log.info(tag,"port closed!")
        })

        eSSP.on('POLL', (x) => {
            if (x === "TIMEOUT") {
                //console.log("bill acceptor stopped responding, exiting with error")
                process.exit(1)
            }
        })

        eSSP.on('READ_NOTE', async result => {
            if (result.channel === 0) return
            const channel = channels[result.channel - 1]
            log.info(tag,'READ_NOTE', channel)

            if (channel.value === 500) {
              eSSP.command('REJECT_BANKNOTE')
            }
        })

        eSSP.on('NOTE_REJECTED', async result => {
            //console.log('NOTE_REJECTED', result)
            //console.log(await eSSP.command('LAST_REJECT_CODE'))
        })

        eSSP.on('CREDIT_NOTE', async result => {
            if (result.channel === 0) return
            const channel = channels[result.channel - 1]
            //console.log('CREDIT_NOTE', channel)
            publisher.publish("payments",JSON.stringify({amount:channel.value/100,asset:"USD"}))
            let amount = (parseInt(channel.value)/100).toString()
            //console.log('credit amount: ', amount)
            let input = {
                amount: amount,
                asset: "USD",
                sessionId: CURRENT_SESSION.sessionId
            }
            if(CURRENT_SESSION.sessionId)credit_session(input)
        })
        let system = os.platform()
        log.debug("system: ",system)
        log.info(tag,"USB_CONNECTION: ",USB_CONNECTION)
        await eSSP.open(USB_CONNECTION, serialPortConfig)
        await eSSP.command('SYNC')
        await eSSP.command('HOST_PROTOCOL_VERSION', { version: 6 })
        log.info(tag,'disabling payin')
        await eSSP.disable()

        log.info('encryption init')
        await eSSP.initEncryption()
        log.info(tag,'SERIAL NUMBER:', (await eSSP.command('GET_SERIAL_NUMBER'))?.info?.serial_number)

        const setup_result = await eSSP.command('SETUP_REQUEST')
        log.info(tag,'setup_result', setup_result)
        for (let i = 0; i < setup_result.info.channel_value.length; i++) {
            channels[i] = {
                value: setup_result.info.expanded_channel_value[i] * setup_result.info.real_value_multiplier,
                country_code: setup_result.info.expanded_channel_country_code[i],
            }
        }

        log.info(tag,'set channel inhibits')
        await eSSP.command('SET_CHANNEL_INHIBITS', {
            channels: Array(channels.length).fill(1),
        })

        log.info(tag,'resetting routes')
        const payoutDenoms = [100, 500, 1000, 2000, 5000, 10000]
        for (let i = 0; i < channels.length; i++) {
            const channel = channels[i]
            // @TODO: country code check
            // if (!payoutDenoms.includes(channel.value)) {
            //     await eSSP.command('SET_DENOMINATION_ROUTE', {route: 'cashbox', value: channel.value, country_code: channel.country_code})
            // }
        }
        for (let i = 0; i < channels.length; i++) {
            const channel = channels[i]
            // @TODO: country code check
            // if (payoutDenoms.includes(channel.value)) {
            //     await eSSP.command('SET_DENOMINATION_ROUTE', {route: 'payout', value: channel.value, country_code: channel.country_code})
            // }
        }

        log.info(tag,'checking routes')
        for (const channel of channels) {
            log.info(tag,channel, (await eSSP.command('GET_DENOMINATION_ROUTE', {value: channel.value, country_code: channel.country_code}))?.info)
        }

        log.info(tag,'enable refill mode')
        await eSSP.command('SET_REFILL_MODE', { mode: 'on' })

        // log.info(tag,'enable payin')
        // await eSSP.enable()

        log.info(tag,'enable payout')
        await eSSP.command('ENABLE_PAYOUT_DEVICE', {REQUIRE_FULL_STARTUP: false, GIVE_VALUE_ON_STORED: true})

        log.info(tag,'get levels')
        if(!ATM_NO_HARDWARE){
            const levels = (await eSSP.command('GET_ALL_LEVELS'))?.info?.counter;
            log.info(tag,levels)
            for(let i = 0; i < levels.length; i++){
                let level = levels[i]
                log.info(tag,'level: ', level)
                if(level.value == 100){
                    ALL_BILLS["1"] = level.denomination_level
                }
                if(level.value == 200){
                    ALL_BILLS["2"] = level.denomination_level
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
        }
        ACCEPTOR_ONLINE = true
        onStartSession()
    }catch(e){
        console.error(e)
    }
}

let countBills = async function(){
    let tag =  TAG + " | countBills | "
    try{
        log.info(tag,'get levels')
        const levels = (await eSSP.command('GET_ALL_LEVELS'))?.info?.counter;
        log.info(tag,levels)

        for(let i = 0; i < levels.length; i++){
            let level = levels[i]
            log.info(tag,'level: ', level)
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
    }catch(e){
        console.error(e)
    }
}

let sub_for_payments = async function(){
    let tag = " | sub_for_payments | "
    try{
        let address = await signer.getAddress(WALLET_MAIN)
        log.debug(tag,"address: ",address)

        //let first start
        let firstStart = true
        let isScanning = true
        while(isScanning){
            log.debug(tag,"scanning...")
            let url = "https://indexer.ethereum.shapeshift.com"+"/api/v2/address/"+address+"?details=all"
            let body = {
                method: 'GET',
                url,
                headers: {
                    'content-type': 'application/json'
                },
            };
            try{
                let resp = await axios(body)
                if(!resp.data) return
                if(!resp.data.txids) return
                let txids = resp.data.txids
                for(let i = 0; i < txids.length; i++){
                    let txid = txids[i]
                    //log.debug("txid: ",txid)
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
                        let paymentAmountDai = 0
                        for(let i = 0; i < respTx.data.tokenTransfers.length; i++){
                            let transfer = respTx.data.tokenTransfers[i]
                            if(transfer["symbol"] == "DAI" && transfer.contract.toLowerCase() === DAI_CONTRACT){
                                paymentAmountDai = parseInt(transfer.value) / 1000000000000000000
                                CURRENT_SESSION.SESSION_FUNDING_DAI = (CURRENT_SESSION.SESSION_FUNDING_DAI ?? 0) + paymentAmountDai
                            }
                        }
                        log.debug("paymentAmountDai: ",paymentAmountDai)
                        log.debug("SESSION_FUNDING_DAI: ",CURRENT_SESSION.SESSION_FUNDING_DAI)
                        let payment = {
                            txid:txids[i],
                            asset:"DAI",
                            session:CURRENT_SESSION.sessionId,
                            amount:paymentAmountDai,
                            funded:true,
                            fullfilled:false
                        }
                        TXIDS_REVIEWED.push(payment)
                        //Payment found!
                        publisher.publish("payments",JSON.stringify(payment))
                        fullfill_order(CURRENT_SESSION.sessionId)
                    } else if(!TXIDS_REVIEWED.some(e => e.txid === txid) && !firstStart){
                        log.debug(tag,"payment outside session!")
                        log.debug(tag,"payment: !")
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
                await sleep(3000)
            }catch(e){
                log.info(tag,"unable to scan, trying again")
                await sleep(3000)
            }

        }
    }catch(e){
        console.error(e)
    }
}

let onStart = async function (){
    let tag = TAG + " | onStart | "
    try{
        //atm started, issue global session
        GLOBAL_SESSION= "usersession:"+uuid.generate()
        let sessionStart = new Date().getTime()
        //
        let config = {
            queryKey:QUERY_KEY,
            username:TERMINAL_NAME,
            wss:PIONEER_WS
        }

        //sub ALL events
        let clientEvents = new Events.Events(config)
        clientEvents.init()
        clientEvents.setUsername(config.username)
        let events = await 
        //on event
        clientEvents.events.on('message', async (event:any) => {
            let tag = TAG + " | events | "
            try{
                // log.debug(tag,"event: ",event)
                // log.debug(tag,"event: ",event.payload)
                if(event.payload && event.payload.type == "lpAddAsym"){
                    if(!event.payload.address) throw Error("invalid session proposial! required address of LP owner!")
                    let session = await set_session_lp_add_asym(event.payload)
                    log.debug(tag,"session: ",session)
                    let payload = event.payload
                    log.debug(tag,"payload: ",payload)
                    payload.sessionId = session.sessionId
                    payload.address = await signer.getAddress(WALLET_MAIN)
                    clientEvents.send('message', payload)
                }else if(event.type == "lpWithdrawAsym"){
                    let session = await set_session_lp_withdraw_asym(event.payload)
                    log.debug(tag,"session: ",session)
                    let payload = event.payload
                    log.debug(tag,"payload: ",payload)
                    payload.sessionId = session.sessionId
                    payload.address = await signer.getAddress(WALLET_MAIN)
                    clientEvents.send('message', payload)
                }    
            }catch(e){
                log.error(e)
            }
        })
        
        //getIPAddress
        let ip = "0.0.0.0"
        var geo = [0,0]
        // let ip = await getIPAddress()
        // log.info("ip: ",ip)
        // await geoip2.reloadDataSync();
        // var geo = geoip2.lookup(ip);
        // log.info("geo: ",geo)

        //get terminal info
        const configPioneer = {
            queryKey:QUERY_KEY,
            spec:URL_PIONEER_SPEC
        };
        pioneer = new Pioneer(configPioneer.spec, configPioneer);
        pioneer = await pioneer.init();
        let terminalInfo = await pioneer.TerminalPrivate({terminalName:TERMINAL_NAME})
        log.info(tag,"terminalInfo: ",terminalInfo.data)
        //check total cash
        let totalCash = 0;
        Object.keys(ALL_BILLS).forEach(key => {
            totalCash = totalCash + (parseInt(key) * ALL_BILLS[key]);
        });
        log.info(tag,"TOTAL_CASH: ",TOTAL_CASH)
        log.info(tag,"TOTAL_DAI: ",TOTAL_DAI)
        let rate
        if(TOTAL_CASH == 0 || TOTAL_DAI == 0){
            rate = "0"
        } else {
            rate = (TOTAL_CASH / TOTAL_DAI)    
        }
        log.info(tag,"rate: ",rate)
        //if no info register
        let captable = await capTable.get()
        if(!terminalInfo.data.terminalInfo){
            let terminal = {
                terminalId:TERMINAL_NAME+":"+await signer.getAddress(WALLET_MAIN),
                terminalName:TERMINAL_NAME,
                tradePair: "USD_DAI",
                rate,
                captable,
                sessionId: GLOBAL_SESSION,
                TOTAL_CASH:TOTAL_CASH.toString(),
                TOTAL_DAI:TOTAL_DAI.toString(),
                pubkey:await signer.getAddress(WALLET_MAIN),
                fact:"",
                location:[ 4.5981, -74.0758 ]
            }
            let result = await pioneer.SubmitTerminal(terminal)
            log.info(tag,"result: ",result)
        } else {
            //update location and rate
            log.debug("captable: ",captable)
            if(!rate) throw Error("rate is required!")
            let payload = {
                sessionId: GLOBAL_SESSION,
                terminalName:TERMINAL_NAME,
                pubkey:await signer.getAddress(WALLET_MAIN),
                rate,
                TOTAL_CASH:TOTAL_CASH.toString(),
                TOTAL_DAI:TOTAL_DAI.toString(),
                captable,
                location:[ 4.5981, -74.0758 ]
            }
            let updateResp = await pioneer.UpdateTerminal(payload)
        }
        
        //start
        if(!WALLET_FAKE_PAYMENTS){
            sub_for_payments()
        }
        if(!ATM_NO_HARDWARE){
            log.info("starting bill acceptor")
            onStartAcceptor()
        }
        //heartbeat
        setInterval(async () => {
            try{
                let uptime = (new Date().getTime() - sessionStart) / 1000 / 60
                let captable = await capTable.get()
                let totalCash = 0;
                Object.keys(ALL_BILLS).forEach(key => {
                    totalCash = totalCash + (parseInt(key) * ALL_BILLS[key]);
                });
                let rate = (TOTAL_CASH / TOTAL_DAI)
                if(!rate) { // @ts-ignore
                    rate = "0"
                }
                let terminal = {
                    TOTAL_CASH:totalCash.toString(),
                    TOTAL_DAI:TOTAL_DAI.toString(),
                    rate,
                    pubkey:await signer.getAddress(WALLET_MAIN),
                    terminalId:TERMINAL_NAME+":"+await signer.getAddress(WALLET_MAIN),
                    terminalName:TERMINAL_NAME,
                    location:[ 4.5981, -74.0758 ],
                    sessionId: GLOBAL_SESSION,
                    captable,
                    uptime
                }
                let updateResp = await pioneer.UpdateTerminal(terminal)
                ////console.log(tag,"heartbeat: ",updateResp)
                //console.log("** RATE: "+rate+"   .... terminal uptime: ",parseInt(uptime.toString())+" (minutes)")
                
            }catch(e){
                log.error(tag,"heartbeat error: ",e)
            }
        },30 * 1000)
    }catch(e){
        log.error(e)
    }
}
onStart()

module.exports = {
    status: async function () {
        return get_status();
    },
    poolInfo: async function () {
        return get_pool_info();
    },
    startSession: async function (input:any) {
        return start_session(input);
    },
    setSessionBuy: async function (input:any) {
        return set_session_buy(input);
    },
    setSessionSell: async function (input:any) {
        return set_session_sell(input);
    },
    setSessionLpAdd: async function (input:any) {
        return set_session_lp_add(input);
    },
    setSessionLpWithdraw: async function (input:any) {
        return set_session_lp_withdraw(input);
    },
    setSessionLpAddAsym: async function (input:any) {
        return set_session_lp_add_asym(input);
    },
    setSessionLpWithdrawAsym: async function (input:any) {
        return set_session_lp_withdraw_asym(input);
    },
    credit: async function (input:any) {
        return credit_session(input);
    },
    payments: async function () {
        return TXIDS_REVIEWED;
    },
    address: async function () {
        return signer.getAddress(WALLET_MAIN);
    },
    balance: async function () {
        return get_balance();
    },
    sendToAddress: async function (address:string,amount:number) {
        return send_to_address(address,amount);
    },
    payout: async function (amount:string) {
        return payout_cash(amount);
    },
    startAcceptor: async function () {
        if(!ATM_NO_HARDWARE)eSSP.enable()
        return true;
    },
    stopAcceptor: async function () {
        if(!ATM_NO_HARDWARE)eSSP.enable()
        return true;
    },
    fullfill: async function (sessionId:string) {
        return fullfill_order(sessionId);
    },
    clear: async function (sessionId:string) {
        clear_session()
        await countBills()
        return true;
    },
}

let clear_session = function () {
    let tag = TAG + " | clear_session | "
    try {
        CURRENT_SESSION = {
            sessionId: null,
            type: null,
            address: null,
            txid: null,
            status: null,
            amountIn: null,
            amountOut: null,
            SESSION_FUNDING_USD: 0,
            SESSION_FUNDING_DAI: 0,
            SESSION_FULLFILLED: false,
        }
        if(!ATM_NO_HARDWARE){
            eSSP.disable()
        }
    } catch (e) {
        console.error(tag, "e: ", e)
        throw e
    }
}

let onStartSession = async function(){
    let tag = TAG + " | onStartSession | "
    try{
        let timeStart = new Date().getTime()
        log.debug(tag,"timeStart: ",timeStart)
        //if(!ACCEPTOR_ONLINE) throw Error("Acceptor not online!")

        //get balance of bill acceptor
        let totalCash = 0;
        Object.keys(ALL_BILLS).forEach(key => {
            totalCash = totalCash + (parseInt(key) * ALL_BILLS[key]);
        });
        TOTAL_CASH = totalCash
        log.debug(totalCash)

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
        //console.log("address: ",address)
        const newContract = new WEB3.eth.Contract(minABI, DAI_CONTRACT);
        const decimals = await newContract.methods.decimals().call();
        //console.log("decimals: ",decimals)
        const balanceBN = await newContract.methods.balanceOf(address).call()
        //console.log("input: balanceBN: ",balanceBN)
        // @ts-ignore
        let tokenBalance = parseInt(balanceBN/Math.pow(10, decimals))
        if(!WALLET_FAKE_BALANCES){
            TOTAL_DAI = await tokenBalance
        }

        //@TODO get fullfilled from DB

        //get last state of ATM runtime
        //@TODO

        //@TODO if diff record it

        //start session
        log.debug(tag,"TOTAL_CASH: ",TOTAL_CASH)
        log.debug(tag,"TOTAL_DAI: ",TOTAL_DAI)

        //get LP owners


    }catch(e){
        console.error(e)
    }
}
onStartSession()

//@TODO move me to module
//debit bills
function debitBills(amountOut) {
    let bills = {};

    // Debit bills based on the requested amount
    // @ts-ignore
    const denominations = Object.keys(ALL_BILLS).sort((a, b) => b - a);
    let remainingAmount = amountOut;

    for (const denomination of denominations) {
        const availableBills = ALL_BILLS[denomination];
        // @ts-ignore
        const billCount = Math.min(Math.floor(remainingAmount / denomination), availableBills);

        // Check if the bill count is greater than zero and available in the wallet
        if (billCount > 0 && availableBills > 0) {
            bills[denomination] = billCount;
            // @ts-ignore
            remainingAmount -= billCount * denomination;
            ALL_BILLS[denomination] -= billCount;
        }
    }

    // If the requested amount cannot be fully satisfied, throw an error
    if (remainingAmount > 0) {
        throw new Error('Insufficient funds to debit the requested amount.');
    }

    // If no bills were debited, throw an error
    if (Object.keys(bills).length === 0) {
        throw new Error('No bills available to debit.');
    }

    return bills;
}

let fullfill_order = async function (sessionId:string) {
    let tag = TAG + " | fullfill_order | "
    try {
        log.info("CURRENT_SESSION: ",CURRENT_SESSION)
        if(!CURRENT_SESSION) throw Error("No session to fullfill!")
        if(CURRENT_SESSION.type === 'buy'){
            //rate
            let rate = (TOTAL_CASH / TOTAL_DAI)
            log.info(tag,"TOTAL_CASH: ",TOTAL_CASH)
            log.info(tag,"TOTAL_DAI: ",TOTAL_DAI)
            log.info(tag,"rate: ",rate)
            
            log.info(tag,"CURRENT_SESSION: ",CURRENT_SESSION)
            if(CURRENT_SESSION.SESSION_FUNDING_USD === 0) throw Error("No session to fullfill!")
            let amountOut = getQuoteForBuy(CURRENT_SESSION.SESSION_FUNDING_USD)
            log.info(tag,"amountOut: ",amountOut)
            //round to int
            let addressFullFill = CURRENT_SESSION.address
            let txid
            if(!WALLET_FAKE_PAYMENTS){
                txid = await send_to_address(addressFullFill,amountOut)
            } else {
                //debit total
                TOTAL_DAI = TOTAL_DAI - amountOut
                txid = "FAKE:TXID:PLACEHOLDER:AMOUNT:"+amountOut
                capTable.sync(TOTAL_CASH,TOTAL_DAI)
            }
            if(!ATM_NO_HARDWARE){
                await countBills()
            }
            CURRENT_SESSION.txid = txid
            pioneer.PushEvent({
                type:"sessionFullFilledBuy",
                event:"session dispensed DAI fullfilled txid: "+txid+" | amountOut: "+amountOut,
                terminalName:TERMINAL_NAME,
                sessionId:CURRENT_SESSION.sessionId,
                rate: TOTAL_CASH / TOTAL_DAI,
                TOTAL_CASH,
                TOTAL_DAI
            })
            clear_session()
            return txid
        }
        if(CURRENT_SESSION.type === 'sell'){
            log.info("TOTAL_CASH,",TOTAL_CASH)
            log.info(tag,"CURRENT_SESSION: ",CURRENT_SESSION)
            let amountOut = CURRENT_SESSION.amountOut
            log.info(tag,"amountOut: ",amountOut)
            amountOut = parseInt(amountOut.toString())
            log.info(tag,"amountOut (rounded): ",amountOut)
            let txid = await payout_cash(amountOut.toString())
            if(WALLET_FAKE_BALANCES){
                log.info("dispensing fake bills!")
                //algo large to small
                let isDespensing = true

                let dispense = function(amountOut:number){
                    if(amountOut >= 100){
                        log.info("Dispensing 100$")
                        ALL_BILLS[100] = ALL_BILLS[100] - 1
                        amountOut = amountOut - 100
                    } else if(amountOut >= 50){
                        log.info("Dispensing 50$")
                        if(amountOut >= 50){
                            ALL_BILLS[50] = ALL_BILLS[50] - 1
                            amountOut = amountOut - 50
                        }
                    }else if(amountOut >= 20){
                        log.info("Dispensing 20$")
                        if(amountOut >= 20){
                            ALL_BILLS[20] = ALL_BILLS[20] - 1
                            amountOut = amountOut - 20
                        }
                    } else if (amountOut >= 10){
                        log.info("Dispensing 10$")
                        if(amountOut >= 10){
                            ALL_BILLS[10] = ALL_BILLS[10] - 1
                            amountOut = amountOut - 10
                        }
                    }else if (amountOut >= 5){
                        log.info("Dispensing 5")
                        if(amountOut >= 5){
                            ALL_BILLS[5] = ALL_BILLS[5] - 1
                            amountOut = amountOut - 5
                        }
                    }else if (amountOut >= 1){
                        log.info("Dispensing 1")
                        if(amountOut >= 1){
                            ALL_BILLS[1] = ALL_BILLS[1] - 1
                            amountOut = amountOut - 1
                        }
                    }
                    return amountOut
                }

                while(isDespensing){
                    amountOut = dispense(amountOut)
                    if(amountOut <= 0){
                        isDespensing = false
                    }
                }
                log.info("Done dispensing")
            }
            if(!ATM_NO_HARDWARE){
                await countBills()    
            }
            CURRENT_SESSION.txid = txid
            let totalCash = 0;
            Object.keys(ALL_BILLS).forEach(key => {
                totalCash = totalCash + (parseInt(key) * ALL_BILLS[key]);
            });
            TOTAL_CASH = totalCash
            log.info("TOTAL_CASH,",TOTAL_CASH)
            capTable.sync(TOTAL_CASH,TOTAL_DAI)
            pioneer.PushEvent({
                type:"sessionFullFilledSell",
                event:"session dispensed cash fullfilled txid: "+txid+" | amountOut: "+amountOut,
                terminalName:TERMINAL_NAME,
                sessionId:CURRENT_SESSION.sessionId,
                rate: TOTAL_CASH / TOTAL_DAI,
                TOTAL_CASH,
                TOTAL_DAI
            })
            clear_session()
            return txid
        }
        if(CURRENT_SESSION.type === 'lpAdd' || CURRENT_SESSION.type === 'lpAddAsym'){
            //caluate LP tokens
            log.debug("CURRENT_SESSION: ",CURRENT_SESSION)
            log.debug("SESSION_FUNDING_DAI: ",CURRENT_SESSION.address)
            log.debug("SESSION_FUNDING_DAI: ",CURRENT_SESSION.SESSION_FUNDING_DAI)
            log.debug("SESSION_FUNDING_USD: ",CURRENT_SESSION.SESSION_FUNDING_USD)
            let resultToken = await capTable.add(CURRENT_SESSION.address,CURRENT_SESSION.SESSION_FUNDING_USD,CURRENT_SESSION.SESSION_FUNDING_DAI)
            // let lpTokens = await calculate_lp_tokens(CURRENT_SESSION.SESSION_FUNDING_DAI ?? 0,CURRENT_SESSION.CURRENT_SESSION.SESSION_FUNDING_USD ?? 0)
            log.debug("resultToken: ",resultToken)
            pioneer.PushEvent({
                type:"sessionFullFilledLpAdd",
                event:"session credited ownership LP tokens: : "+resultToken+" | owner: "+CURRENT_SESSION.address,
                sessionId:CURRENT_SESSION.sessionId,
                terminalName:TERMINAL_NAME,
                rate: TOTAL_CASH / TOTAL_DAI,
                TOTAL_CASH,
                TOTAL_DAI
            })
            //credit owner
            return "LP:ADD:TXID:PLACEHOLDER"
        }
        if(CURRENT_SESSION.type === 'lpWithdraw'){
            log.debug("CURRENT_SESSION: ",CURRENT_SESSION)
            log.debug("address: ",CURRENT_SESSION.address)
            log.debug("amountOut: ",CURRENT_SESSION.amountOut)

            //
            let totalCash = 0;
            Object.keys(ALL_BILLS).forEach(key => {
                totalCash = totalCash + (parseInt(key) * ALL_BILLS[key]);
            });
            TOTAL_CASH = totalCash
            capTable.sync(TOTAL_CASH,TOTAL_DAI)

            //remove
            let resultRemoval = await capTable.remove(CURRENT_SESSION.address,CURRENT_SESSION.amountOut)
            log.debug("resultRemoval: ",resultRemoval)

            //withdraw USD
            if(ATM_NO_HARDWARE){
                let amountOut = resultRemoval.dispenseUSD
                log.debug("dispensing fake bills!")
                //algo large to small
                let isDespensing = true

                let dispense = function(amountOut:number){
                    if(amountOut >= 100){
                        log.debug("Dispensing 100$")
                        ALL_BILLS[100] = ALL_BILLS[100] - 1
                        amountOut = amountOut - 100
                    } else if(amountOut >= 50){
                        log.debug("Dispensing 50$")
                        if(amountOut >= 50){
                            ALL_BILLS[50] = ALL_BILLS[50] - 1
                            amountOut = amountOut - 50
                        }
                    }else if(amountOut >= 20){
                        log.debug("Dispensing 20$")
                        if(amountOut >= 20){
                            ALL_BILLS[20] = ALL_BILLS[20] - 1
                            amountOut = amountOut - 20
                        }
                    } else if (amountOut >= 10){
                        log.debug("Dispensing 10$")
                        if(amountOut >= 10){
                            ALL_BILLS[10] = ALL_BILLS[10] - 1
                            amountOut = amountOut - 10
                        }
                    }else if (amountOut >= 5){
                        log.debug("Dispensing 5")
                        if(amountOut >= 5){
                            ALL_BILLS[5] = ALL_BILLS[5] - 1
                            amountOut = amountOut - 5
                        }
                    }else if (amountOut >= 1){
                        log.debug("Dispensing 1")
                        if(amountOut >= 1){
                            ALL_BILLS[1] = ALL_BILLS[1] - 1
                            amountOut = amountOut - 1
                        }
                    }
                    return amountOut
                }

                while(isDespensing){
                    amountOut = dispense(amountOut)
                    if(amountOut <= .99){
                        isDespensing = false
                    }
                }
                log.debug("Done dispensing")
            }
            //Withdraw DAI
            if(WALLET_FAKE_PAYMENTS){
                TOTAL_DAI = TOTAL_DAI - resultRemoval.dispenseDAI
            }

            //credit owner
            //
            let totalCash2 = 0;
            Object.keys(ALL_BILLS).forEach(key => {
                totalCash2 = totalCash2 + (parseInt(key) * ALL_BILLS[key]);
            });
            TOTAL_CASH = totalCash2
            log.debug(tag,"TOTAL_CASH: ",TOTAL_CASH)
            log.debug(tag,"TOTAL_DAI: ",TOTAL_DAI)
            capTable.sync(TOTAL_CASH,TOTAL_DAI)
            pioneer.PushEvent({
                type:"sessionFullFilledLpWithdraw",
                event:"session paid out LP owner: : "+resultRemoval.dispenseUSD+" | owner: "+CURRENT_SESSION.address,
                sessionId:CURRENT_SESSION.sessionId,
                terminalName:TERMINAL_NAME,
                rate: TOTAL_CASH / TOTAL_DAI,
                TOTAL_CASH,
                TOTAL_DAI
            })
            return "LP:REMOVE:USD"+resultRemoval.dispenseUSD+":DAI"+resultRemoval.dispenseDAI+":TXID:PLACEHOLDER"
        }
        if(CURRENT_SESSION.type === 'lpWithdrawAsym'){
            log.info("TOTAL_CASH: ",TOTAL_CASH)
            log.info("CURRENT_SESSION: ",CURRENT_SESSION)
            log.info("amountOut: ",CURRENT_SESSION.percentage)
            capTable.sync(TOTAL_CASH, TOTAL_DAI)
            log.info("TOTAL VAULE PRE: ",TOTAL_CASH + TOTAL_DAI)
            //caluate LP tokens
            let {amountUSD, amountDAI} = await capTable.remove(CURRENT_SESSION.address,CURRENT_SESSION.percentage)
            log.info("amountUSD: ",amountUSD)
            log.info("amountDAI: ",amountDAI)
            
            //debit globals for LP removeal
            TOTAL_CASH -= amountUSD;
            TOTAL_DAI -= amountDAI;
            log.info("TOTAL VAULE POST: ",TOTAL_CASH + TOTAL_DAI)
            
            //post debit
            log.info("TOTAL_CASH: ",TOTAL_CASH)
            log.info("TOTAL_DAI: ",TOTAL_DAI)
            
            //remove both from total (session is now funcded ready to be fullfilled)

            //convert DAI to usd in session
            const convertedDai = getQuoteForBuy(amountUSD);
            log.info("convertedDai: ",convertedDai)
            
            //credit cash to cash
            TOTAL_CASH = TOTAL_CASH + amountUSD

            //send moniez
            let totalDai = amountDAI + convertedDai
            log.info("totalDai: ",totalDai)
            capTable.sync(TOTAL_CASH, TOTAL_DAI)
            return "LP:REMOVE:TXID:AMOUNT:"+totalDai
        }
    } catch (e) {
        console.error(tag, "e: ", e)
        throw e
    }
}

const credit_session = async function (input) {
    let tag = TAG + " | credit_session | ";
    try {
        if (!input.asset) throw Error("No asset!");
        if (!input.amount) throw Error("No amount!");
        if (!input.sessionId) throw Error("No sessionId!");
        log.debug(tag, "input: ", input);
        log.debug(tag, "CURRENT_SESSION: ", CURRENT_SESSION);
        pioneer.PushEvent({
            type:"creditSessionUSD",
            terminalName:TERMINAL_NAME,
            event:"session credited "+parseInt(input.amount)+" "+input.asset,
            sessionId:input.sessionId,
            rate: TOTAL_CASH / TOTAL_DAI,
            TOTAL_CASH,
            TOTAL_DAI
        })

        if (input.asset === 'USD') {
            CURRENT_SESSION.SESSION_FUNDING_USD = (CURRENT_SESSION.SESSION_FUNDING_USD ?? 0) + parseInt(input.amount);
            if (WALLET_FAKE_PAYMENTS) {
                let amountIn = parseInt(input.amount);
                // Credit bills
                let isCrediting = true;
                let deposit = function (amountIn) {
                    if (amountIn >= 100) {
                        log.debug("Depositing 100$");
                        ALL_BILLS[100] = ALL_BILLS[100] + 1;
                        amountIn = amountIn - 100;
                    } else if (amountIn >= 50) {
                        log.debug("Depositing 50$");
                        ALL_BILLS[50] = ALL_BILLS[50] + 1;
                        amountIn = amountIn - 50;
                    } else if (amountIn >= 20) {
                        log.debug("Depositing 20$");
                        ALL_BILLS[20] = ALL_BILLS[20] + 1;
                        amountIn = amountIn - 20;
                    } else if (amountIn >= 10) {
                        log.debug("Depositing 10$");
                        ALL_BILLS[10] = ALL_BILLS[10] + 1;
                        amountIn = amountIn - 10;
                    } else if (amountIn >= 5) {
                        log.debug("Depositing 5$");
                        ALL_BILLS[5] = ALL_BILLS[5] + 1;
                        amountIn = amountIn - 5;
                    } else if (amountIn >= 1) {
                        log.debug("Depositing 1$");
                        ALL_BILLS[1] = ALL_BILLS[1] + 1;
                        amountIn = amountIn - 1;
                    }
                    return amountIn;
                };

                while (isCrediting) {
                    amountIn = deposit(amountIn);
                    if (amountIn <= 0) {
                        isCrediting = false;
                    }
                }
                let totalCash = 0;
                Object.keys(ALL_BILLS).forEach(key => {
                    totalCash = totalCash + (parseInt(key) * ALL_BILLS[key]);
                });
                TOTAL_CASH = totalCash;
            }
        }

        if (input.asset === 'DAI') {
            CURRENT_SESSION.SESSION_FUNDING_DAI = (CURRENT_SESSION.SESSION_FUNDING_DAI ?? 0) + parseFloat(input.amount);
            if (WALLET_FAKE_PAYMENTS) {
                TOTAL_DAI = TOTAL_DAI + parseFloat(input.amount);
                capTable.sync(TOTAL_CASH, TOTAL_DAI);
            }
        }

        if (CURRENT_SESSION.type === 'lpAddAsym') {
            if (input.asset === 'USD') {
                const usdAmount = parseFloat(input.amount);
                const halfUsdAmount = usdAmount / 2;
                const convertedDai = getQuoteForBuy(halfUsdAmount);

                CURRENT_SESSION.SESSION_FUNDING_USD = halfUsdAmount;
                CURRENT_SESSION.SESSION_FUNDING_DAI = convertedDai;

                log.debug(tag, "SESSION_FUNDING_USD: ", CURRENT_SESSION.SESSION_FUNDING_USD);
                log.debug(tag, "SESSION_FUNDING_DAI: ", CURRENT_SESSION.SESSION_FUNDING_DAI);

            } else if (input.asset === 'DAI') {
                const daiAmount = parseFloat(input.amount);
                const halfDaiAmount = daiAmount / 2;
                const convertedUsd = getQuoteForSellOfExactCryptoValue(halfDaiAmount);

                CURRENT_SESSION.SESSION_FUNDING_DAI = halfDaiAmount;
                CURRENT_SESSION.SESSION_FUNDING_USD = convertedUsd;

                log.debug(tag, "SESSION_FUNDING_DAI: ", CURRENT_SESSION.SESSION_FUNDING_DAI);
                log.debug(tag, "SESSION_FUNDING_USD: ", CURRENT_SESSION.SESSION_FUNDING_USD);
            }
        }

        publisher.publish('payments', JSON.stringify(input));
        return true;
    } catch (e) {
        console.error(tag, "e: ", e);
        throw e;
    }
};

let payout_cash = async function (amount:string) {
    let tag = TAG + " | payout_cash | "
    try {
        log.info(tag,"Paying out cash!: ",amount)
        if(NO_BROADCAST){
            log.debug("NO_BROADCAST set not paying")
            return "paied bro"
        } else{
            amount = amount.toString()
            if(amount === "0") amount = "1" //@TODO WTF WTY
            log.debug(tag,"paying out cash: ",amount)
            log.debug(tag,"paying out cash: ",typeof(amount))

            //verify
            if(!ATM_NO_HARDWARE){
                const dispensed = new Promise(resolve => eSSP.once("DISPENSED", (x) => resolve(x)))
                let result = await eSSP.command('PAYOUT_AMOUNT', {
                    amount:parseInt(amount) * 100,
                    country_code: 'USD',
                    test: false,
                })
                log.info(tag,"result: ",result)
                await dispensed    
            }
        }
        return "done"
    } catch (e) {
        console.error(tag, "e: ", e)
        throw e
    }
}

let send_to_address = async function (address:string,amount:number) {
    let tag = TAG + " | send_to_address | "
    try {
        log.debug(tag,"address:",address)
        log.debug(tag,"amount:",amount)
        TXS_FULLFILLED.push(CURRENT_SESSION.sessionId)
        // @ts-ignore
        let value = parseInt(amount * Math.pow(10, 18)).toString()
        log.debug(tag,"value:",value)
        let addressFrom = await signer.getAddress(WALLET_MAIN)
        //web3 get nonce
        let nonce = await WEB3.eth.getTransactionCount(addressFrom)
        // nonce = nonce + 3
        //console.log("nonce: ",nonce)
        nonce = WEB3.utils.toHex(nonce)


        //get gas price
        let gasPrice = await WEB3.eth.getGasPrice()
        //console.log("gasPrice: ",gasPrice)
        gasPrice = WEB3.utils.toHex(gasPrice)


        //get gas limit
        let gasLimit

        //get balance
        let balance = await WEB3.eth.getBalance(address)
        //console.log("balance: ",balance)

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
            "to": DAI_CONTRACT,
            "data": tokenData,
            chainId:1,
        }
        log.debug("input: ",input)
        //signer
        let result = await signer.signTx(input, WALLET_MAIN)
        log.debug("result: ",result)

        if(NO_BROADCAST){
            return "NERFED!-nobroadcast"
        }else{
            //broadcast
            WEB3.eth.sendSignedTransaction(result)
                .once('transactionHash', function(hash){
                    //console.log("txHash", hash)
                    CURRENT_SESSION.txid = hash
                    publisher.publish("payments",JSON.stringify({txid:hash,session:CURRENT_SESSION,type:'fullfill'}))
                    return hash
                })
                .once('receipt', function(receipt){ log.debug("receipt", receipt) })
                .on('confirmation', function(confNumber, receipt){
                    if(confNumber === 1){
                        CURRENT_SESSION.status = 'fullfilled'
                        console.log("confNumber",confNumber,"receipt",receipt) }
                })
                .on('error', function(error){ log.error("error", error) })
                .then(function(receipt){
                    console.log("trasaction mined!", receipt);
                });
        }

        // log.debug("txHash: ",txHash)
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
        //console.log("address: ",address)
        const newContract = new WEB3.eth.Contract(minABI, DAI_CONTRACT);
        const decimals = await newContract.methods.decimals().call();
        //console.log("decimals: ",decimals)
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

let get_status = async function () {
    let tag = TAG + " | get_and_rescan_pubkeys | "
    try {
        let totalSelected = 0;
        Object.keys(ALL_BILLS).forEach(key => {
            totalSelected = totalSelected + (parseInt(key) * ALL_BILLS[key]);
        });
        let cap = await capTable.get()
        let output:any = {
            billacceptor: ACCEPTOR_ONLINE ? "online" : "offline",
            hotwallet:"online",
            balanceUSD: totalSelected, //TODO get this from hardware
            balanceDAI: TOTAL_DAI, //TODO get this from hotwallet
            rate: TOTAL_CASH / TOTAL_DAI,
            session: CURRENT_SESSION,
            totalUsd: totalSelected,
            cash: ALL_BILLS,
            lptokens:capTable.tokens(),
            cap
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

let start_session = async function (input:any) {
    let tag = TAG + " | start_session_buy | "
    try {
        if(CURRENT_SESSION && CURRENT_SESSION.sessionId) throw Error("already in session!")
        //if buy intake address
        let sessionId = "usersession:"+uuid.generate()
        let sessionStart = new Date().getTime()
        CURRENT_SESSION = {sessionId, start: sessionStart }
        //@TODO save to mongo
        return CURRENT_SESSION
    } catch (e) {
        console.error(tag, "e: ", e)
        throw e
    }
}

let set_session_buy = async function (input:any) {
    let tag = TAG + " | set_session_buy | "
    try {
        if(!input.address) throw Error("no address!")
        //if buy intake address
        let sessionId = uuid.generate()
        let address = input.address
        CURRENT_SESSION = {sessionId, address, type:"buy"}
        if(!ATM_NO_HARDWARE){
            await eSSP.enable()    
        }
        //push event
        pioneer.PushEvent({
            type:"sessionCreateBuy",
            event:"user ("+address+") created a buy session sessionId: "+sessionId,
            address,
            sessionId,
            terminalName:TERMINAL_NAME,
            rate: TOTAL_CASH / TOTAL_DAI,
            TOTAL_CASH,
            TOTAL_DAI
        })
        //@TODO save to mongo
        return CURRENT_SESSION
    } catch (e) {
        console.error(tag, "e: ", e)
        throw e
    }
}

let set_session_sell = async function (input) {
    let tag = TAG + " | set_session_sell | "
    try {
        log.debug(tag,"input: ",input)
        //if buy intake address
        let sessionId = uuid.generate()
        let amount = input.amount
        if(!amount) throw Error("no amount!")

        log.debug("TOTAL_CASH: ",TOTAL_CASH)
        log.debug("TOTAL_DAI: ",TOTAL_DAI)
        //amountIn
        let amountIn = getQuoteForSellProducingCashValue(amount)
        log.debug("amountIn: ",amountIn)

        //address
        let address = await signer.getAddress(WALLET_MAIN)
        
        CURRENT_SESSION = {
            sessionId,
            amountIn,
            amountOut:amount,
            type:"sell",
            address
        }
        pioneer.PushEvent({
            type:"sessionCreateSell",
            event:"user created a sell session sessionId: "+sessionId,
            address,
            sessionId,
            terminalName:TERMINAL_NAME,
            rate: TOTAL_CASH / TOTAL_DAI,
            TOTAL_CASH,
            TOTAL_DAI
        })

        log.debug("CURRENT_SESSION: ",CURRENT_SESSION)
        return CURRENT_SESSION
    } catch (e) {
        console.error(tag, "e: ", e)
        throw e
    }
}

let set_session_lp_add = async function (input) {
    let tag = TAG + " | set_session_lp | "
    try {
        //if buy intake address
        let sessionId = uuid.generate()
        let address = input.address
        log.debug(tag,"input: ",input)
        CURRENT_SESSION = {
            sessionId,
            address,
            type:"lpAdd"
        }
        pioneer.PushEvent({
            type:"sessionCreateLpAdd",
            event:"user (" +address+ ") created a LP add session sessionId: "+sessionId,
            address,
            sessionId,
            terminalName:TERMINAL_NAME,
            rate: TOTAL_CASH / TOTAL_DAI,
            TOTAL_CASH,
            TOTAL_DAI
        })
        log.debug(tag,"CURRENT_SESSION: ",CURRENT_SESSION)
        return CURRENT_SESSION
    } catch (e) {
        console.error(tag, "e: ", e)
        throw e
    }
}

let set_session_lp_add_asym = async function (input) {
    let tag = TAG + " | set_session_lp | "
    try {
        //if buy intake address
        let sessionId = uuid.generate()
        let address = input.address
        CURRENT_SESSION = {sessionId, address, type:"lpAddAsym"}
        pioneer.PushEvent({
            type:"sessionCreateLpAddAsym",
            event:"user (" +address+ ") created a LP add ASYM session sessionId: "+sessionId,
            address,
            sessionId,
            terminalName:TERMINAL_NAME,
            rate: TOTAL_CASH / TOTAL_DAI,
            TOTAL_CASH,
            TOTAL_DAI
        })
        return CURRENT_SESSION
    } catch (e) {
        console.error(tag, "e: ", e)
        throw e
    }
}

let set_session_lp_withdraw = async function (input) {
    let tag = TAG + " | set_session_lp_withdraw | "
    try {
        log.debug(tag,"set_session_lp_withdraw: ",input)
        //if buy intake address
        let sessionId = uuid.generate()
        let address = input.address
        let amountOut = input.amount
        CURRENT_SESSION = {
            sessionId,
            address,
            amountOut,
            type:"lpWithdraw"
        }
        pioneer.PushEvent({
            type:"sessionCreateLpWithdraw",
            event:"user (" +address+ ") created a LP withdraw session sessionId: "+sessionId,
            address,
            sessionId,
            terminalName:TERMINAL_NAME,
            rate: TOTAL_CASH / TOTAL_DAI,
            TOTAL_CASH,
            TOTAL_DAI
        })
        log.debug(tag,"CURRENT_SESSION: ",CURRENT_SESSION)
        return CURRENT_SESSION
    } catch (e) {
        console.error(tag, "e: ", e)
        throw e
    }
}

let set_session_lp_withdraw_asym = async function (input) {
    let tag = TAG + " | set_session_lp_withdraw_asym | "
    try {
        //if buy intake address
        let sessionId = uuid.generate()
        let address = input.address
        let amount = input.amount
        CURRENT_SESSION = {sessionId, address, percentage:amount, type:"lpWithdrawAsym"}
        pioneer.PushEvent({
            type:"sessionCreateLpWithdraw",
            event:"user created a LP withdraw ASYM session sessionId: "+sessionId,
            address,
            sessionId,
            amount,
            terminalName:TERMINAL_NAME,
            rate: TOTAL_CASH / TOTAL_DAI,
            TOTAL_CASH,
            TOTAL_DAI
        })
        return CURRENT_SESSION
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
