
const assert = require("assert")
const Bankless = require("@pioneer-platform/pioneer-client").default;
const log = require('@pioneer-platform/loggerdog')();
let spec = "http://127.0.0.1:4000/spec/swagger.json"

const config = {
    queryKey:"test"
};

let bankless

const run_buy = async (amount) => {
    let tag = " run_sell "
    try{
        //bodyCreate
        const bodyCreate = {
            address: "0xC3aFFff54122658b89C31183CeC4F15514F34624",
        };
        let respCreate = await bankless.CreateBuy(bodyCreate)
        respCreate = respCreate.data
        log.info(tag,"respCreate: ",respCreate)

        //bodyFund
        const bodyFund1 = {
            amount:amount,
            asset:"USD",
            sessionId:respCreate.sessionId
        };
        let resultFund1 = await bankless.Fund(bodyFund1)
        log.info(tag,"resultFund1: ",resultFund1)

        let totalValue5 = await get_total_value()
        log.info(tag,"totalValue5: ",totalValue5)
        assert.strictEqual(totalValue5,4305)

        const bodyFullfillAdd = {
            sessionId:respCreate.sessionId
        };
        let resultBuy = await bankless.Fullfill(bodyFullfillAdd)
        log.info(tag,"resultBuy: ",resultBuy)

        let totalValue6 = await get_total_value()
        log.info(tag,"totalValue6: ",totalValue6)
        assert.strictEqual(totalValue6,4204.772727272728)

        return true
    }catch(e){
        log.error(e)
    }
}

const run_sell = async (amount) => {
    let tag = " run_sell "
    try{
        //bodyCreate
        const bodyCreate = {
            amount: amount,
        };
        let respCreate = await bankless.CreateSell(bodyCreate)
        respCreate = respCreate.data
        log.info(tag,"respCreate: ",respCreate)
        assert(respCreate.amountIn)
        assert(respCreate.sessionId)
        let amountIn = respCreate.amountIn

        //bodyFund
        const bodyFund1 = {
            amount:amountIn.toString(),
            asset:"DAI",
            sessionId:respCreate.sessionId
        };
        log.info(tag,"bodyFund1: ",bodyFund1)
        let resultFund1 = await bankless.Fund(bodyFund1)
        log.info(tag,"resultFund1: ",resultFund1)

        let totalValue3 = await get_total_value()
        log.info(tag,"totalValue3: ",totalValue3)
        assert.strictEqual(parseInt(amountIn),105)
        assert.strictEqual(totalValue3,4305)

        const bodyFullfillAdd = {
            sessionId:respCreate.sessionId
        };
        let resultSell = await bankless.Fullfill(bodyFullfillAdd)
        log.info(tag,"resultSell: ",resultSell)

        let totalValue4 = await get_total_value()
        log.info(tag,"totalValue4: ",totalValue4)
        assert.strictEqual(totalValue4,4205)

        return true
    }catch(e){
        log.error(e)
    }
}

const lp_withdraw_asym = async (percent) => {
    let tag = " lp_withdraw_asym "
    try{
        //bodyCreate
        const bodyCreate = {
            amount: percent,
            address: "0x651982e85D5E43db682cD6153488083e1b810798",
        };
        let respCreate = await bankless.CreateLpWithdrawAsym(bodyCreate)
        respCreate = respCreate.data
        log.info(tag,"respCreate: ", respCreate);


        //bodyFullfillAdd
        const bodyFullfillAdd = {
            sessionId:respCreate.sessionId
        };
        let resultFullfillRemove = await bankless.Fullfill(bodyFullfillAdd)
        log.info(tag,"resultFullfillWithdrawal: ",resultFullfillRemove)

        return true
    }catch(e){
        log.error(e)
    }
}

const lp_add = async (amount) => {
    let tag = " lp_add "
    try{
        //bodyCreate
        const bodyCreateLPAdd = {
            // address: "user: "+generateRandomName(),
            address: "0x651982e85D5E43db682cD6153488083e1b810798",
        };
        let resultCreate = await bankless.CreateLpAdd(bodyCreateLPAdd)
        resultCreate = resultCreate.data
        log.info(tag,"resultCreate: ",resultCreate)
        assert(resultCreate.sessionId)
        //HACk fund
        const bodyFund1 = {
            amount,
            asset:"USD",
            sessionId:resultCreate.sessionId
        };
        let resultFund1 = await bankless.Fund(bodyFund1)
        log.info(tag,"resultFund1: ",resultFund1)

        const bodyFund2 = {
            amount,
            asset:"DAI",
            sessionId:resultCreate.sessionId
        };
        let resultFund2 = await bankless.Fund(bodyFund2)
        log.info(tag,"resultFund2: ",resultFund2)

        //fullfill
        const bodyFullfillAdd = {
            sessionId:resultCreate.sessionId
        };
        let resultFullfillAdd = await bankless.Fullfill(bodyFullfillAdd)
        log.info(tag,"resultFullfillAdd: ",resultFullfillAdd)

        return true
    }catch(e){
        log.error(e)
    }
}

const get_total_value =  async () => {
    let tag = " get_total_value "
    try{
        let status = await bankless.Status();
        log.debug(tag,"status: ",status.data)
        log.debug(tag,"cap: ",status.data.cap)
        //total USD in system
        // log.info(tag,"balanceUSD: ",status.data.balanceUSD)
        // log.info(tag,"balanceDAI: ",status.data.balanceDAI)
        //TOTAL VALUE
        log.debug(tag,"totalValue: ",status.data.balanceUSD + status.data.balanceDAI)
        let totalValue = status.data.balanceUSD + status.data.balanceDAI
        return totalValue
    }catch(e){
        console.error(e)
    }
}

// Define an async function to run the test
const runTest = async () => {
    let tag = " | run_test | "
    try {
        // Initialize the Pioneer instance
        bankless = new Bankless(spec, config);
        bankless = await bankless.init();

        //get all functions
        // log.info(tag,"bankless: ",bankless)

        let health = await bankless.Health();
        assert(health)
        log.info(tag,"health: ",health)

        //verify cap table
        let statusPre = await bankless.Status();
        statusPre = statusPre.data
        log.info(tag,"statusPre: ",statusPre)
        assert.strictEqual(statusPre.lptokens,2000000000000000000000)

        //total crypto in system
        let totalValue = await get_total_value()
        log.info(tag,"totalValue: ",totalValue)
        assert.strictEqual(totalValue,4000)
        //verify cap table, 100pct owned by owner
        
        //deposit LP 
        let resultLPAdd = await lp_add("100")
        // log.info(tag,"resultLPAdd: ",resultLPAdd)

        //verify cap table
        let status = await bankless.Status();
        status = status.data
        log.info(tag,"status: ",status)
        //verify lp tokens
        assert(status.cap)
        let targetAddress = "0x651982e85D5E43db682cD6153488083e1b810798"
        let entry = status.cap.filter(item => item.address === targetAddress);
        log.info(tag,"entry: ",entry[0])
        log.info(tag,"lpTokens: ",entry[0].lpTokens)
        log.info(tag,"percentage: ",entry[0].percentage)
        assert.strictEqual(entry[0].lpTokens,100000000000000000000)
        assert.strictEqual(entry[0].percentage,4.545454545454546)
        //get total LP tokens
        assert.strictEqual(status.lptokens,2100000000000000000000)
        
        //total value
        let totalValue2 = await get_total_value()
        log.info(tag,"totalValue2: ",totalValue2)
        assert.strictEqual(totalValue2,4200)

        //trade 100 cash to crypto
        let resultSell = await run_sell("100")
        // log.info(tag,"resultSell: ",resultSell)

        //
        // // //trade 100 crypto to cash
        let resultBuy = await run_buy("100")
        // log.info(tag,"resultBuy: ",resultBuy)
        // //
        // //withdraw LP all
        let resultLPWithdraw = await lp_withdraw_asym("100")
        // log.info(tag,"resultLPWithdraw: ",resultLPWithdraw)

        let status2 = await bankless.Status();
        status2 = status2.data
        log.info(tag,"status: ",status2)
        let entry2 = status2.cap.filter(item => item.address === targetAddress);
        log.info(tag,"entry2: ",entry2[0])

        //total vaule of pool
        let totalValue7 = await get_total_value()
        log.info(tag,"totalValue7: ",totalValue7)
        assert.strictEqual(totalValue7,4000)

        //see profit from owner

        //see profit from LP adder

        //see profit from protocol
        
        //get report from remote

        //audit report
        
        
        
    } catch (e) {
        console.error(e);
    }
};

runTest();
