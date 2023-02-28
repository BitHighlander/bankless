/*

    Bankless API

    Create LP pools

    Communicate to wallet REST api

    Communicate to bill acceptor socket api

*/

const TAG = " | Bankless-Backend | "
const uuid = require('short-uuid');

import * as log from '@pioneer-platform/loggerdog'
// const {subscriber, publisher, redis, redisQueue} = require('@pioneer-platform/default-redis')
// let connection  = require("@pioneer-platform/default-mongo")

//hdwallet-core
// import * as core from "@shapeshiftoss/hdwallet-core";
// let SDK = require('@pioneer-sdk/sdk')
// import { NativeAdapter } from '@shapeshiftoss/hdwallet-native'
//np
// //constants
// let BLOCKCHAIN = 'cosmos'
// let ASSET = 'ATOM'
// let blockchains = [
//     'ethereum'
// ]
//
// let spec = process.env['URL_PIONEER_SPEC'] || 'https://pioneers.dev/spec/swagger.json'
// let wss = process.env['URL_PIONEER_SOCKET'] || 'wss://pioneers.dev'
// let WALLET:any
// let APP:any
//

let wait = require('wait-promise');
let sleep = wait.sleep;

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