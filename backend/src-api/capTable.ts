const TAG = " | Bankless-Backend | ";
import axios from 'axios';
const SspLib = require('@keepkey/encrypted-smiley-secure-protocol');
const uuid = require('short-uuid');
const log = require('@pioneer-platform/loggerdog')();
const { subscriber, publisher, redis, redisQueue } = require('@pioneer-platform/default-redis');
let signer = require("eth_mnemonic_signer");
let os = require("os");

let wait = require('wait-promise');
let sleep = wait.sleep;

let PROTOCOL_1PCT = "0x651982e85D5E43db682cD6153488083e1b810798";

let ATM_OWNER = process.env['ATM_OWNER'];
if (!ATM_OWNER) throw Error("Invalid ENV missing ATM_OWNER");

// TABLE OWNER
let CAP_TABLE = [];
let TOTAL_USD = 0;
let TOTAL_DAI = 0;
let TOTAL_LP_TOKENS = 0;

module.exports = {
    init: async function () {
        return init_cap();
    },
    get: async function () {
        return CAP_TABLE;
    },
    sync: async function (usd, dai) {
        TOTAL_USD = usd;
        TOTAL_DAI = dai;
        return true;
    },
    getByOwner: async function () {
        return CAP_TABLE;
    },
    valueByOwner: async function () {
        return calculateValueByOwner();
    },
    add: async function (address, amountUSD, amountDAI) {
        return add_cap(address, amountUSD, amountDAI);
    },
    remove: async function (address, percent) {
        return remove_cap(address, percent);
    }
};

function calculateValueByOwner() {
    const valueByOwner = [];
    const totalLPTokens = getTotalLPTokens();

    for (const entry of CAP_TABLE) {
        const address = entry.address;
        const lpTokens = entry.lpTokens;

        const valueUSD = (lpTokens / totalLPTokens) * TOTAL_USD;
        const valueDAI = (lpTokens / totalLPTokens) * TOTAL_DAI;

        valueByOwner.push({
            address: address,
            valueUSD: valueUSD,
            valueDAI: valueDAI,
        });
    }

    return valueByOwner;
}

let init_cap = function () {
    let tag = TAG + " | init_cap | ";
    try {
        log.info("Initing Cap table!")
        log.info("TOTAL_DAI: ", TOTAL_DAI)
        log.info("TOTAL_USD: ", TOTAL_USD)

        const totalLPTokens = calculateTotalLPTokens(TOTAL_USD, TOTAL_DAI);
        log.info("totalLPTokens: ", totalLPTokens)

        let ownershipPercentage = 1
        CAP_TABLE.push({
            address: ATM_OWNER,
            lpTokens: totalLPTokens,
            percentage: 100
        });
        log.info("CAP_TABLE: ", CAP_TABLE)
    } catch (e) {
        console.error(tag, "e: ", e);
        throw e;
    }
};

function calculateOwnershipPercentage(amountUSD, amountDAI, totalLPTokens) {
    if (totalLPTokens === 0) {
        return 100;
    }

    const lpTokens = (amountUSD / TOTAL_USD) + (amountDAI / TOTAL_DAI);
    const ownershipPercentage = lpTokens / totalLPTokens;

    return ownershipPercentage;
}

let add_cap = async function (address, amountUSD, amountDAI) {
    let tag = TAG + " | add_cap | ";
    try {
        const totalLPTokensBefore = getTotalLPTokens();

        TOTAL_USD += amountUSD;
        TOTAL_DAI += amountDAI;

        const totalLPTokensAfter = calculateTotalLPTokens(TOTAL_USD, TOTAL_DAI);

        const lpTokensToMint = totalLPTokensAfter - totalLPTokensBefore;

        TOTAL_LP_TOKENS += lpTokensToMint; // Update total LP tokens

        let entry = {
            address: address,
            lpTokens: lpTokensToMint,
            percentage: (lpTokensToMint / totalLPTokensAfter) * 100
        };
        CAP_TABLE.push(entry);

        return entry;
    } catch (e) {
        console.error(tag, "e: ", e);
        throw e;
    }
};

const remove_cap = async (address, amountOut) => {
    try {
        log.info("TOTAL_USD: ", TOTAL_USD);
        log.info("TOTAL_DAI: ", TOTAL_DAI);
        console.log('remove_cap | start | address:', address, 'amountOut:', amountOut);

        if (!address || amountOut === undefined || amountOut === null) {
            throw new Error('Missing parameters: address or amountOut');
        }

        if (typeof amountOut !== 'number' || amountOut < 0 || amountOut > 100) {
            throw new Error('Invalid parameter: amountOut should be a number between 0 and 100');
        }

        const entry = CAP_TABLE.find(e => e.address === address);

        if (!entry) {
            throw new Error(`No entry found for address: ${address}`);
        }

        console.log('remove_cap | entry found:', entry);

        const lpTokensOut = (entry.lpTokens * amountOut) / 100;
        console.log('remove_cap | lpTokensOut:', lpTokensOut);

        if (lpTokensOut > entry.lpTokens) {
            throw new Error(`Insufficient LP tokens: User does not have enough LP tokens to withdraw ${amountOut}%`);
        }

        const lpTokenValueUSD = TOTAL_USD / TOTAL_LP_TOKENS;
        const lpTokenValueDAI = (TOTAL_DAI * (10 ** 18)) / TOTAL_LP_TOKENS;
        console.log('remove_cap | lpTokenValueUSD:', lpTokenValueUSD);
        console.log('remove_cap | lpTokenValueDAI:', lpTokenValueDAI);

        const dispenseUSD = lpTokensOut * lpTokenValueUSD;
        let dispenseDAI = (lpTokensOut * lpTokenValueDAI) / (10 ** 18);
        dispenseDAI = Math.round(dispenseDAI * 100) / 100; // Round to 2 decimal places
        console.log('remove_cap | dispenseUSD:', dispenseUSD);
        console.log('remove_cap | dispenseDAI:', dispenseDAI);


        // Ensure that the pool has enough USD and DAI to dispense
        if (dispenseUSD > TOTAL_USD || dispenseDAI > TOTAL_DAI) {
            throw new Error('Insufficient funds in the pool');
        }

        entry.lpTokens -= lpTokensOut;
        console.log('remove_cap | new entry.lpTokens:', entry.lpTokens);

        TOTAL_LP_TOKENS -= lpTokensOut; // Update total LP tokens
        console.log('remove_cap | new TOTAL_LP_TOKENS:', TOTAL_LP_TOKENS);

        TOTAL_USD -= dispenseUSD;
        TOTAL_DAI -= dispenseDAI;
        console.log('remove_cap | new TOTAL_USD:', TOTAL_USD);
        console.log('remove_cap | new TOTAL_DAI:', TOTAL_DAI);

        const totalLpTokensInPool = CAP_TABLE.reduce((total, e) => total + e.lpTokens, 0);
        if (totalLpTokensInPool === 0) {
            entry.percentage = 0;
        } else {
            entry.percentage = (entry.lpTokens / totalLpTokensInPool) * 100;
        }

        console.log('remove_cap | new entry.percentage:', entry.percentage);

        return {
            ...entry,
            dispenseUSD,
            dispenseDAI,
        };

    } catch (e) {
        console.error('remove_cap | e: ', e);
        throw e;
    }
};


function getTotalLPTokens() {
    let totalLPTokens = 0;
    for (const entry of CAP_TABLE) {
        totalLPTokens += entry.lpTokens;
    }
    return totalLPTokens;
}

function calculateTotalLPTokens(TOTAL_USD, TOTAL_DAI) {
    const x = TOTAL_USD;
    const y = TOTAL_DAI;
    const k = x * y;
    const totalLPTokens = Math.sqrt(k) * 10 ** 18;

    return totalLPTokens || 0;
}
