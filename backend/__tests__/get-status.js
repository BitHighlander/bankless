
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
        //end session

    }catch(e){
        console.error(e)
    }
}
run_test()