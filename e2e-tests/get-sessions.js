require("dotenv").config()
require("dotenv").config({path:'./.env'})
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
        // console.log("bankless: ",bankless)
        let result = await bankless.GetSessions({limit:10,skip:0});
        console.log("result: ",result.data)

        //



    } catch (e) {
        console.error(e);
    }
};

runTest();
