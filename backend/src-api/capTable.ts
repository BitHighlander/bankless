import axios from 'axios';
const SspLib = require('@keepkey/encrypted-smiley-secure-protocol');
const uuid = require('short-uuid');
const log = require('@pioneer-platform/loggerdog')();
const { subscriber, publisher, redis, redisQueue } = require('@pioneer-platform/default-redis');
let signer = require("eth_mnemonic_signer");
let os = require("os");
const database = require('./database');
let wait = require('wait-promise');
let sleep = wait.sleep;

const TAG = " | Bankless-Backend | ";
let PROTOCOL_1PCT = "0x651982e85D5E43db682cD6153488083e1b810798";

let ATM_OWNER = process.env['ATM_OWNER'];
if (!ATM_OWNER) throw Error("Invalid ENV missing ATM_OWNER");

interface CapEntry {
    id: number;
    address: string;
    lpTokens: number;
    percentage: number;
}

let CAP_TABLE: CapEntry[] = [];
let TOTAL_USD = 0;
let TOTAL_DAI = 0;
let TOTAL_LP_TOKENS = 0;

export async function init(): Promise<void> {
    try {
        await init_cap();
    } catch (error) {
        log.info(TAG + 'init_cap error:', error);
        throw error;
    }
}

export function get(): CapEntry[] {
    return CAP_TABLE;
}

export function sync(usd: number, dai: number): void {
    TOTAL_USD = usd;
    TOTAL_DAI = dai;
}

export function getByOwner(): CapEntry[] {
    return CAP_TABLE.filter(entry => entry.address === ATM_OWNER);
}

export function valueByOwner(): { address: string; valueUSD: number; valueDAI: number }[] {
    return calculateValueByOwner();
}

export function add(address: string, amountUSD: number, amountDAI: number): Promise<CapEntry> {
    try {
        return add_cap(address, amountUSD, amountDAI);
    } catch (error) {
        log.info(TAG + 'add_cap error:', error);
        throw error;
    }
}

export function remove(address: string, percent: number): Promise<CapEntry> {
    try {
        return remove_cap(address, percent);
    } catch (error) {
        log.info(TAG + 'remove_cap error:', error);
        throw error;
    }
}

function calculateValueByOwner(): { address: string; valueUSD: number; valueDAI: number }[] {
    try {
        const valueByOwner: { address: string; valueUSD: number; valueDAI: number }[] = [];
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
    } catch (error) {
        log.info(TAG + 'calculateValueByOwner error:', error);
        throw error;
    }
}

async function init_cap(): Promise<void> {
    try {
        CAP_TABLE = await database.getAllCapEntries();

        if (CAP_TABLE.length === 0) {
            const totalLPTokens = calculateTotalLPTokens(TOTAL_USD, TOTAL_DAI);
            const ownershipPercentage = 100;

            const entry: CapEntry = {
                id: 0,
                address: ATM_OWNER,
                lpTokens: totalLPTokens,
                percentage: ownershipPercentage,
            };

            CAP_TABLE.push(entry);
            await database.addCapitalEntry(ATM_OWNER, totalLPTokens, ownershipPercentage);
        }
    } catch (error) {
        log.info(TAG + 'init_cap error:', error);
        throw error;
    }
}

function add_cap(address: string, amountUSD: number, amountDAI: number): Promise<CapEntry> {
    try {
        const existingEntry = CAP_TABLE.find((entry) => entry.address === address);

        if (existingEntry) {
            const totalLPTokensBefore = getTotalLPTokens();
            TOTAL_USD += amountUSD;
            TOTAL_DAI += amountDAI;

            const totalLPTokensAfter = calculateTotalLPTokens(TOTAL_USD, TOTAL_DAI);
            const lpTokensToMint = totalLPTokensAfter - totalLPTokensBefore;

            TOTAL_LP_TOKENS += lpTokensToMint;

            existingEntry.lpTokens += lpTokensToMint;
            existingEntry.percentage = (existingEntry.lpTokens / totalLPTokensAfter) * 100;

            if (!existingEntry.lpTokens) throw Error("Invalid existingEntry.lpTokens");
            if (!existingEntry.id) throw Error("Invalid existingEntry.id");

            return database.updateCapitalEntry(existingEntry.id, existingEntry.lpTokens, existingEntry.percentage).then(() => existingEntry);
        } else {
            const totalLPTokensBefore = getTotalLPTokens();
            TOTAL_USD += amountUSD;
            TOTAL_DAI += amountDAI;

            const totalLPTokensAfter = calculateTotalLPTokens(TOTAL_USD, TOTAL_DAI);
            const lpTokensToMint = totalLPTokensAfter - totalLPTokensBefore;

            TOTAL_LP_TOKENS += lpTokensToMint;

            const percentage = (lpTokensToMint / totalLPTokensAfter) * 100;

            const entry: CapEntry = {
                id: 0,
                address: address,
                lpTokens: lpTokensToMint,
                percentage: percentage,
            };

            CAP_TABLE.push(entry);
            if (!lpTokensToMint) throw Error("Invalid lpTokensToMint");
            if (!percentage) throw Error("Invalid percentage");

            return database.addCapitalEntry(address, lpTokensToMint, percentage).then(() => entry);
        }
    } catch (error) {
        log.info(TAG + 'add_cap error:', error);
        throw error;
    }
}

function remove_cap(address: string, percent: number): Promise<CapEntry> {
    try {
        const entry = CAP_TABLE.find(e => e.address === address);

        if (!entry) {
            throw new Error(`No entry found for address: ${address}`);
        }

        const lpTokensOut = (entry.lpTokens * percent) / 100;

        if (lpTokensOut > entry.lpTokens) {
            throw new Error(`Insufficient LP tokens: User does not have enough LP tokens to withdraw ${percent}%`);
        }

        const totalLpTokensInPool = getTotalLPTokens();

        entry.lpTokens -= lpTokensOut;
        entry.percentage = (entry.lpTokens / totalLpTokensInPool) * 100;

        return database.updateCapitalEntry(entry.id, entry.lpTokens, entry.percentage).then(() => entry);
    } catch (error) {
        log.info(TAG + 'remove_cap error:', error);
        throw error;
    }
}

function getTotalLPTokens(): number {
    try {
        let totalLPTokens = 0;
        for (const entry of CAP_TABLE) {
            totalLPTokens += entry.lpTokens;
        }
        return totalLPTokens;
    } catch (error) {
        log.info(TAG + 'getTotalLPTokens error:', error);
        throw error;
    }
}

function calculateTotalLPTokens(TOTAL_USD: number, TOTAL_DAI: number): number {
    try {
        const x = TOTAL_USD;
        const y = TOTAL_DAI;
        const k = x * y;
        const totalLPTokens = Math.sqrt(k) * 10 ** 18;

        return totalLPTokens || 0;
    } catch (error) {
        log.info(TAG + 'calculateTotalLPTokens error:', error);
        throw error;
    }
}
