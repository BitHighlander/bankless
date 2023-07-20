
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
        let respCreate = await axios.get(
            "http://127.0.0.1:4000/api/v1/startAcceptor"
        );
        respCreate = respCreate.data
        console.log("respCreate: ", respCreate);


    }catch(e){
        console.error(e)
    }
}
run_test()
