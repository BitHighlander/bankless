/*

    Bankless API

    Create LP pools

    Communicate to wallet REST api

    Communicate to bill acceptor socket api

*/

const TAG = " | Bankless-Backend | "
const queue = require('@pioneer-platform/redis-queue');
const uuid = require('short-uuid');

const log = require('@pioneer-platform/loggerdog')()
const {subscriber, publisher, redis, redisQueue} = require('@pioneer-platform/default-redis')
let connection  = require("@pioneer-platform/default-mongo")

//hdwallet-core
// import * as core from "@shapeshiftoss/hdwallet-core";
// let SDK = require('@pioneer-sdk/sdk')
// import { NativeAdapter } from '@shapeshiftoss/hdwallet-native'
//
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

module.exports = {
    status: async function () {
        return get_status();
    },
    poolInfo: async function () {
        return get_pool_info();
    },
    startSession: async function (type:OrderTypes) {
        return start_session(type);
    }
}

let get_status = async function () {
    let tag = TAG + " | get_and_rescan_pubkeys | "
    try {
        //

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

let start_session = async function (type) {
    let tag = TAG + " | deposit_fiat | "
    try {
        //

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