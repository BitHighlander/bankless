
/*
import axios from 'axios';
 */

let axios = require('axios')
let assert = require('assert');

let run_test = async () => {
    try{

        //start session
        const bodyCreate = {
            amount: "100",
        };
        let respCreate = await axios.post(
            "http://127.0.0.1:4000/api/v1/create/sell",
            bodyCreate
        );
        respCreate = respCreate.data
        console.log("respCreate: ", respCreate);
        let amountIn = respCreate.amountIn
        assert(respCreate.amountIn)
        console.log("amountIn: ", amountIn);
        //deposit crypto

        //get last session
        let status = await axios.get(
            "http://localhost:4000/api/v1/" + "status"
        );
        status = status.data
        console.log("status: ",status)
        assert(status.session.sessionId)

        //hit fake endpoint
        const bodyFund = {
            sessionId:status.session.sessionId,
            amount:amountIn.toString(),
            asset:"DAI"
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
        let status2 = await axios.get(
            "http://localhost:4000/api/v1/" + "status"
        );
        status2 = status2.data
        console.log("status2: ",status2)
        assert(status2.session.SESSION_FUNDING_DAI)

        //fullfill
        const bodyFullfill = {
            amount:status2.session.SESSION_FUNDING_DAI,
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
