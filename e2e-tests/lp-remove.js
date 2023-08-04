require("dotenv").config()
require("dotenv").config({path:'./.env'})

const Bankless = require("@pioneer-platform/pioneer-client").default;
const log = require('@pioneer-platform/loggerdog')();
let spec = "http://127.0.0.1:4000/spec/swagger.json"
let specPioneer = "http://127.0.0.1:9001/spec/swagger.json"
//https://pioneers.dev/spec/swagger.json
let signer = require("eth_mnemonic_signer")
let mnemonic = process.env['WALLET_MAIN']
const assert = require("assert")

const config = {
    queryKey:"test"
};

// Define an async function to run the test
const runTest = async () => {
    let tag = " | test | "
    try {
        // Initialize the Bankless instance
        let bankless = new Bankless(spec, config);
        bankless = await bankless.init();

        //init pioneer instance
        let pioneer = new Bankless(specPioneer, config);
        pioneer = await pioneer.init();

        let amount = 100

        //verify cap table
        let statusPre = await bankless.Status();
        statusPre = statusPre.data
        log.info(tag,"statusPre: ",statusPre)
        let address = await signer.getAddress(mnemonic)
        log.info(tag,"address: ",address)

        //filter by address
        let myCap = statusPre.cap.filter((c)=>{return c.address === address})
        log.info(tag,"myCap: ",myCap)
        assert(myCap)
        assert(myCap[0])
        assert(myCap[0].lpTokens > 0)
        let payload = `{"type": "lpWithrawAsym", "amount": "${amount.toString()}"}`;
        log.info(tag,'payload: ', payload);
        payload = JSON.stringify(payload)
        let signature = await signer.signMessage(payload,mnemonic)
        log.info(tag,"signature: ", signature);
        const body = {
            address,
            signature: signature,
            message: payload,
            terminalName:statusPre.terminalName,
            amount: amount.toString(),
            type: "lpWithdrawAsym",
        };
        log.info(tag,"body: ", body);
        let sessionInfo = await pioneer.StartSession(body);
        sessionInfo = sessionInfo.data;
        // eslint-disable-next-line no-console
        console.log("sessionInfo: ", sessionInfo);
        
    } catch (e) {
        console.error(e);
    }
};

runTest();
