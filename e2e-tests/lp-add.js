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

        //verify cap table
        let statusPre = await bankless.Status();
        statusPre = statusPre.data
        log.info(tag,"statusPre: ",statusPre)
        let address = await signer.getAddress(mnemonic)
        log.info(tag,"address: ",address)
        //create session
        const body = {
            terminalName:statusPre.terminalName,
            address,
            type: "lpAddAsym",
        };
        console.log("body: ", body);
        let sessionInfo = await pioneer.StartSession(body);
        sessionInfo = sessionInfo.data;
        // eslint-disable-next-line no-console
        console.log("sessionInfo: ", sessionInfo);
        assert(address,sessionInfo.address)
        //get all sessions
        let session = await bankless.GetSessionByAddressOwner({address})
        session = session.data
        log.info(tag,"session: ",session)

        //find session
        let sessions = await bankless.GetSessions({limit:10,skip:0})
        sessions = sessions.data
        log.info(tag,"sessions: ",sessions)
        
        //push payment
        let payment = {
            "address":"0xb6cb910de6519f57354729753dbc89a91606ea11",
            "tx":{
                "txid":"0x34d1e7542b63cfcfca5d79022dca32ca1338209b006b70c1084a9eda9074a715",
                "vin":[
                    {
                        "n":0,
                        "addresses":[
                            "0x141D9959cAe3853b035000490C03991eB70Fc4aC"
                        ],
                        "isAddress":true
                    }
                ],
                "vout":[
                    {
                        "value":"0",
                        "n":0,
                        "addresses":[
                            "0xb6cb910de6519f57354729753dbc89a91606ea11"
                        ],
                        "isAddress":true
                    }
                ],
                "blockHeight":0,
                "confirmations":0,
                "blockTime":1690404034,
                "value":"0",
                "fees":"0",
                "rbf":true,
                "tokenTransfers":[
                    {
                        "type":"ERC20",
                        "from":address.toLowerCase(),
                        "to":sessionInfo.address,
                        "contract":"0x6B175474E89094C44Da98b954EedeAC495271d0F",
                        "name":"Dai Stablecoin",
                        "symbol":"DAI",
                        "decimals":18,
                        "value":"100000000000000000000"
                    }
                ],
                "ethereumSpecific":{
                    "status":-1,
                    "nonce":151,
                    "gasLimit":34706,
                    "gasPrice":"66531221484",
                    "data":"0xa9059cbb000000000000000000000000c3affff54122658b89c31183cec4f15514f346240000000000000000000000000000000000000000000000000de0b6b3a7640000"
                }
            }
        }
        let result = await bankless.Payment(payment);
        console.log("result: ",result.data)

        //verify cap table
        let statusPost = await bankless.Status();
        statusPost = statusPost.data
        log.info(tag,"statusPost: ",statusPost)

    } catch (e) {
        console.error(e);
    }
};

runTest();
