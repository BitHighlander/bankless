

const Bankless = require("@pioneer-platform/pioneer-client").default;

let spec = "http://127.0.0.1:4000/spec/swagger.json"

const config = {
    queryKey:"test"
};

// Define an async function to run the test
const runTest = async () => {
    try {
        // Initialize the Pioneer instance
        let bankless = new Bankless(spec, config);
        bankless = await bankless.init();

        //get all functions
        console.log("bankless: ",bankless)

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
                        "from":"0x141D9959cAe3853b035000490C03991eB70Fc4aC",
                        "to":"0x00a20a15b5b5d44b0dda1fd64667c22d7663db3a",
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
        
        //
        


    } catch (e) {
        console.error(e);
    }
};

runTest();
