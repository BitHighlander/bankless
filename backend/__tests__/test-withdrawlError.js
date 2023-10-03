/*

    Test LP add

    start LP session

    depsoit DAI

    deposit USD


 */

/*
import axios from 'axios';
 */

let axios = require('axios')
let assert = require('assert');

let run_test = async () => {
    try{

        //hit fake endpoint
        const bodyFund = {
            amount:"3"
        };
        console.log("bodyFund: ",bodyFund)
        let respFund = await axios.post(
            "http://127.0.0.1:4000/api/v1/hack/withdrawalCash",
            bodyFund
        );
        respFund = respFund.data
        // eslint-disable-next-line no-console
        console.log("respFund: ", respFund);



    }catch(e){
        console.error(e)
    }
}
run_test()


