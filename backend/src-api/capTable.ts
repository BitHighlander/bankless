const TAG = " | CapTable | ";
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

export function tokens() {
    return TOTAL_LP_TOKENS;
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
        // @ts-ignore
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

        if (totalLPTokens === 0) {
            // Handle division by zero case
            for (const entry of CAP_TABLE) {
                valueByOwner.push({
                    address: entry.address,
                    valueUSD: 0,
                    valueDAI: 0,
                });
            }
        } else {
            for (const entry of CAP_TABLE) {
                const address = entry.address;
                const lpTokens = entry.lpTokens;

                const valueUSD = (lpTokens / totalLPTokens) * TOTAL_USD;
                const valueDAI = (lpTokens / totalLPTokens) * TOTAL_DAI;

                // Check for NaN values and convert them to zero
                const sanitizedValueUSD = Number.isNaN(valueUSD) ? 0 : valueUSD;
                const sanitizedValueDAI = Number.isNaN(valueDAI) ? 0 : valueDAI;

                valueByOwner.push({
                    address: address,
                    valueUSD: sanitizedValueUSD,
                    valueDAI: sanitizedValueDAI,
                });
            }
        }

        return valueByOwner;
    } catch (error) {
        log.info(TAG + 'calculateValueByOwner error:', error);
        throw error;
    }
}

async function init_cap(): Promise<void> {
    let tag = TAG+" | init_cap | "
    try {
        CAP_TABLE = await database.getAllCapEntries();

        if (CAP_TABLE.length === 0) {
            log.info(tag,"TOTAL_USD:    ",TOTAL_USD)
            log.info(tag,"TOTAL_DAI:    ",TOTAL_DAI)
            const totalLPTokens = calculateTotalLPTokens(TOTAL_USD, TOTAL_DAI);
            const ownershipPercentage = 100;
            TOTAL_LP_TOKENS = totalLPTokens;
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

let add_cap = async function(address: string, amountUSD: number, amountDAI: number): Promise<any> {
    try {
        const existingEntry = CAP_TABLE.find((entry) => entry.address === address);

        const totalLPTokensBefore = getTotalLPTokens();
        TOTAL_USD += amountUSD;
        TOTAL_DAI += amountDAI;

        const totalLPTokensAfter = calculateTotalLPTokens(TOTAL_USD, TOTAL_DAI);
        const lpTokensToMint = calculateTotalLPTokens(amountUSD, amountDAI);

        TOTAL_LP_TOKENS += lpTokensToMint;
        
        if (existingEntry) {
            const newLPtokens = existingEntry.lpTokens + lpTokensToMint;
            const newPercentage = (newLPtokens / totalLPTokensAfter) * 100;

            // Check if the new total percentage exceeds 100%
            if (newPercentage > 100) {
                throw Error("Adding this entry will exceed the 100% limit.");
            }

            existingEntry.lpTokens = newLPtokens;
            existingEntry.percentage = newPercentage;

            await database.updateCapitalEntry(existingEntry.id, existingEntry.lpTokens, existingEntry.percentage);
            return existingEntry;
        } else {
            const percentage = (lpTokensToMint / totalLPTokensAfter) * 100;

            // Check if the new total percentage exceeds 100%
            const newTotalPercentage = CAP_TABLE.reduce((total, entry) => total + entry.percentage, percentage);
            if (newTotalPercentage > 100) {
                // Adjust percentages to fit within 100%
                const adjustmentFactor = 100 / newTotalPercentage;
                CAP_TABLE.forEach((entry) => {
                    entry.percentage *= adjustmentFactor;
                });
            }

            let newId = 1;
            if (CAP_TABLE.length > 0) {
                newId = Math.max(...CAP_TABLE.map((entry) => entry.id)) + 1;
            }
            const entry: CapEntry = {
                id: newId,
                address: address,
                lpTokens: lpTokensToMint,
                percentage: percentage,
            };

            CAP_TABLE.push(entry);
            await database.addCapitalEntry(address, lpTokensToMint, percentage);
            return entry;
        }
    } catch (error) {
        log.info(TAG + 'add_cap error:', error);
        throw error;
    }
}

let remove_cap = async function(address: string, percent: number) {
    let tag = TAG + 'remove_cap: ';
    try {
        log.info("CAP_TABLE:", CAP_TABLE);
        const entry = CAP_TABLE.find((e) => e.address === address);
        if (!entry) {
            throw new Error(`No entry found for address: ${address}`);
        }
        log.info("entry:", entry);
        log.info("id:", entry.id);

        const lpTokensOut = (entry.lpTokens * percent) / 100;
        log.info("lpTokensOut:", lpTokensOut);
        log.info("entry:", entry.lpTokens);

        //TODO update entry for new lpTokens
        entry.lpTokens -= lpTokensOut;

        //calulate new percentage of pool
        entry.percentage = (entry.lpTokens / TOTAL_LP_TOKENS) * 100;
        log.info("entry.percentage:", entry.percentage);
        if(entry.percentage === 0 || entry.lpTokens === 0) {
            //remove entry
            await database.deleteCapitalEntry(entry.id)
        } else {
            //update entry
            let result = await database.updateCapitalEntry(entry.id, entry.lpTokens, entry.percentage)
            log.info(tag,"result updated entry:", result)
        }

        log.info("TOTAL_USD:", TOTAL_USD);
        log.info("TOTAL_DAI:", TOTAL_DAI);
        
        const amountUSD = (lpTokensOut / TOTAL_LP_TOKENS) * TOTAL_USD;
        const amountDAI = (lpTokensOut / TOTAL_LP_TOKENS) * TOTAL_DAI;
        log.info("amountUSD: ", amountUSD);
        log.info("amountDAI: ", amountDAI);

        //calualte removal assets
        log.info("TOTAL_LP_TOKENS:", TOTAL_LP_TOKENS);
        TOTAL_LP_TOKENS -= lpTokensOut;
        log.info("TOTAL_LP_TOKENS:", TOTAL_LP_TOKENS);

        return {
            amountUSD,
            amountDAI,
        }
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
