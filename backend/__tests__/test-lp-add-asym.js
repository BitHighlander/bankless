
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
            "http://127.0.0.1:4000/api/v1/create/lpAddAsym",
            bodyCreate
        );
        respCreate = respCreate.data
        console.log("respCreate: ", respCreate);

        //deposit dollars
        //hit fake endpoint
        const bodyFund = {
            amount:"100",
            asset:"DAI",
            sessionId:respCreate.sessionId
        };
        console.log("bodyFund: ",bodyFund)
        let respFund = await axios.post(
            "http://127.0.0.1:4000/api/v1/hack/fund",
            bodyFund
        );
        respFund = respFund.data
        // eslint-disable-next-line no-console
        console.log("respFund: ", respFund);

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
