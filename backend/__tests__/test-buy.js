
/*
import axios from 'axios';
 */

let axios = require('axios')
let assert = require('assert');
let wait = require('wait-promise');
let sleep = wait.sleep;

let run_test = async () => {
    try{

        //start session
        const bodyCreate = {
            address: "0xC3aFFff54122658b89C31183CeC4F15514F34624",
        };
        let respCreate = await axios.post(
            "http://127.0.0.1:4000/api/v1/create/buy",
            bodyCreate
        );
        respCreate = respCreate.data
        console.log("respCreate: ", respCreate);
        assert(respCreate.sessionId);
        assert(respCreate.type === "buy");
        assert(respCreate.address === bodyCreate.address);

        //deposit dollars
        //hit fake endpoint
        const bodyFund = {
            sessionId:respCreate.sessionId,
            amount:"10",
            asset:"USD"
        };
        console.log("bodyFund: ",bodyFund)
        let respFund = await axios.post(
            "http://127.0.0.1:4000/api/v1/hack/fund",
            bodyFund
        );
        respFund = respFund.data
        // eslint-disable-next-line no-console
        console.log("respFund: ", respFund);

        //get last session
        let status = await axios.get(
            "http://localhost:4000/api/v1/" + "status"
        );
        status = status.data
        console.log("status: ",status)

        //fullfill
        const bodyFullfill = {
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


    }catch(e){
        console.error(e)
    }
}
run_test()
