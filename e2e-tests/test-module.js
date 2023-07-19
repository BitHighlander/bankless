

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

        let health = await bankless.Health();
        // console.log("health: ",health)

        let status = await bankless.Status();
        console.log("status: ",status.data)
        console.log("cap: ",status.data.cap)
        //total USD in system
        // console.log("balanceUSD: ",status.data.balanceUSD)
        // console.log("balanceDAI: ",status.data.balanceDAI)
        //TOTAL VALUE
        console.log("totalValue: ",status.data.balanceUSD + status.data.balanceDAI)
        //total crypto in system

        //deposit LP 
        
        
        //trade 100 cash to crypto
        
        //trade 100 crypto to cash
        
        //withdraw LP all
        
        
        //get report from remote
        //audit report
        
        
        
    } catch (e) {
        console.error(e);
    }
};

runTest();
