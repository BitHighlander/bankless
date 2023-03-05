
/*
import axios from 'axios';
 */

let axios = require('axios')


let run_test = async () => {
    try{

        //start session
        const bodyCreate = {
            address: "0xC3aFFff54122658b89C31183CeC4F15514F34624",
        };
        let respCreate = await axios.post(
            "http://127.0.0.1:4000/api/v1/create/lpAdd",
            bodyCreate
        );
        respCreate = respCreate.data
        console.log("respCreate: ", respCreate);
        
        //SignMessage withdrawal


        //fullfill
        const bodyFullfill = {
            amount:status.session.SESSION_FUNDING_DAI,
            sessionId:status.session.sessionId
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