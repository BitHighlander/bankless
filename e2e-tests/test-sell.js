

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

        let health = await bankless.Health();
        console.log("health: ",health)

        let status = await bankless.Status();
        console.log("status: ",status.data)

        //deposit LP 


        //trade 100 cash to crypto

        //trade 100 crypto to cash

        //withdraw LP all



    } catch (e) {
        console.error(e);
    }
};

runTest();
