
/*
import axios from 'axios';
 */

let axios = require('axios')


let run_test = async () => {
    try{

        let percent = 10
        const bodyCreate = {
            amount: "10",
            // address: "user: fohqcumrj",
            address: "0x651982e85D5E43db682cD6153488083e1b810798",
        };
        let respCreate = await axios.post(
            "http://127.0.0.1:4000/api/v1/create/lpWithdraw",
            bodyCreate
        );
        // console.log("respCreate: ", respCreate);

        respCreate = respCreate.data
        // console.log("respCreate: ", respCreate);
        
        //SignMessage withdrawal


        //fullfill
        const bodyFullfill = {
            sessionId:respCreate.sessionId
        };
        console.log("bodyFullfill: ",bodyFullfill)
        let respFullfill = await axios.post(
            "http://127.0.0.1:4000/api/v1/fullfill",
            bodyFullfill
        );
        respFullfill = respFullfill.data
        // eslint-disable-next-line no-console
        console.log("respFullfill: ", respFullfill);


        //get crypto info

        //end session

    }catch(e){
        console.error(e)
    }
}
run_test()
