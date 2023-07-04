
/*
import axios from 'axios';
 */

let axios = require('axios')

function generateRandomName() {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    let name = '';
    const length = Math.floor(Math.random() * 10) + 1; // Generate a random length between 1 and 10

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        name += characters.charAt(randomIndex);
    }

    return name;
}

let run_test = async () => {
    try{

        //start session
        const bodyCreate = {
            // address: "user: "+generateRandomName(),
            address: "0x651982e85D5E43db682cD6153488083e1b810798",
        };
        let respCreate = await axios.post(
            "http://127.0.0.1:4000/api/v1/create/lpAdd",
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

        //hit fake endpoint
        const bodyFund2 = {
            amount:"100",
            asset:"USD",
            sessionId:respCreate.sessionId
        };
        console.log("bodyFund2: ",bodyFund2)
        let respFund2 = await axios.post(
            "http://127.0.0.1:4000/api/v1/hack/fund",
            bodyFund2
        );
        respFund2 = respFund2.data
        // eslint-disable-next-line no-console
        console.log("respFund2: ", respFund2);

        //get last session
        let status = await axios.get(
            "http://localhost:4000/api/v1/" + "status"
        );
        status = status.data
        console.log("status: ",status)

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
