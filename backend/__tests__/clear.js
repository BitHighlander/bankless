
/*
import axios from 'axios';
 */

let axios = require('axios')
let assert = require('assert');

let run_test = async () => {
    try{

        //get crypto info
        //get last session
        let status2 = await axios.get(
            "http://localhost:4000/api/v1/" + "status"
        );
        status2 = status2.data
        console.log("status2: ",status2)
        assert(status2.session.sessionId)
        //end session

        //get crypto info
        const bodyClear = {
            sessionId:status2.session.sessionId
        };
        console.log("bodyClear: ",bodyClear)
        let respClear = await axios.post(
            "http://127.0.0.1:4000/api/v1/clear",
            bodyClear
        );
        respClear = respClear.data
        // eslint-disable-next-line no-console
        console.log("respClear: ", respClear);
        //end session

    }catch(e){
        console.error(e)
    }
}
run_test()