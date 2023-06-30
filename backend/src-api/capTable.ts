
/*
    Get Cap table from mongo

    This is an offline account ledger that is used to calculate the current cpaitalization of the atm inventory.

 */

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
let os = require("os")

let wait = require('wait-promise');
let sleep = wait.sleep;


module.exports = {
    init: async function () {
        return init_cap();
    },
    // getCapTable: async function () {
    //perform LP removeal
    //
}


let init_cap = async function () {
    let tag = TAG + " | init_cap | "
    try {
        //get data from mongo

        //if none, assign 100pct to admin

    } catch (e) {
        console.error(tag, "e: ", e)
        throw e
    }
}
