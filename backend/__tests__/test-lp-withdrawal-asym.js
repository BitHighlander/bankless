
/*
import axios from 'axios';
 */

let axios = require('axios')


let run_test = async () => {
    try{

        //start session
        const bodyCreate = {
            amount: "10",
            address: "0x651982e85D5E43db682cD6153488083e1b810798",
        };
        let respCreate = await axios.post(
            "http://127.0.0.1:4000/api/v1/create/lpWithdrawAsym",
            bodyCreate
        );
        respCreate = respCreate.data
        console.log("respCreate: ", respCreate);

        //SignMessage withdrawal

        //get last session
        let status = await axios.get(
            "http://localhost:4000/api/v1/" + "status"
        );
        status = status.data
        console.log("status: ",status)

        //fullfill
        // const bodyFullfill = {
        //     amount:status.session.SESSION_FUNDING_DAI,
        //     sessionId:status.session.sessionId
        // };
        // console.log("bodyFullfill: ",bodyFullfill)
        // let respFullfill = await axios.post(
        //     "http://127.0.0.1:4000/api/v1/fullfill",
        //     bodyFullfill
        // );
        // respFullfill = respFullfill.data
        // // eslint-disable-next-line no-console
        // console.log("respFullfill: ", respFullfill);


        //get crypto info

        //end session

    }catch(e){
        console.error(e)
    }
}
run_test()
