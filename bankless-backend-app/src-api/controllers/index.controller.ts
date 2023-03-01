/*

    REST endpoints

 */
let TAG = ' | API | '

const pjson = require('../../package.json');
import * as log from '@pioneer-platform/loggerdog'
// const {subscriber, publisher, redis} = require('@pioneer-platform/default-redis')

let Bankless = require("../bankless")

//rest-ts
import { Body, Controller, Get, Post, Route, Tags, SuccessResponse, Query, Request, Response, Header } from 'tsoa';
import * as express from 'express';

//types
interface Error {
    success:boolean
    tag:string
    e:any
}

interface Health {
    online:boolean
    name:string
    version:string
    system:any
}

export class ApiError extends Error {
    private statusCode: number;
    constructor(name: string, statusCode: number, message?: string) {
        super(message);
        this.name = name;
        this.statusCode = statusCode;
    }
}

//route
@Route('')
export class IndexController extends Controller {

    /*
        Health endpoint


    */

    @Get('/health')
    public async health() {
        let tag = TAG + " | health | "
        try{

            // let status:any = await redis.hgetall("info:health")

            let output:any = {
                online:true,
                name:pjson.name,
                version:pjson.version,
                // system:status
            }

            return(output)
        }catch(e){
            let errorResp:Error = {
                success:false,
                tag,
                e
            }
            log.error(tag,"e: ",{errorResp})
            throw new ApiError("error",503,"error: "+e.toString());
        }
    }

    /*
    status endpoint

    */

    @Get('/status')
    public async status() {
        let tag = TAG + " | status | "
        try{

            let output:any = Bankless.status()

            return(output)
        }catch(e){
            let errorResp:Error = {
                success:false,
                tag,
                e
            }
            log.error(tag,"e: ",{errorResp})
            throw new ApiError("error",503,"error: "+e.toString());
        }
    }

    /*
    * Blocknative TX Simulator
    *
    *
    * */
    @Post('create/buy')
    public async createBuy(@Header('Authorization') authorization: string, @Body() body: any): Promise<any> {
        let tag = TAG + " | createBuy | "
        try{
            if(!body.address) throw Error("address is required!")
            let input  = {
                address:body.address
            }
            let session = await Bankless.startSession(input.address)
            return session
        } catch(e){
            let errorResp:Error = {
                success:false,
                tag,
                e
            }
            log.error(tag,"e: ",{errorResp})
            throw new ApiError("error",503,"error: "+e.toString());
        }
    }

    /*
    * @TODO REMOVEME (this should be done via hardware!
    *
    *
    * */
    @Post('credit/usd')
    public async creditUSD(@Header('Authorization') authorization: string, @Body() body: any): Promise<any> {
        let tag = TAG + " | creditUSD | "
        try{
            if(!body.amount) throw Error("address is required!")
            let session = await Bankless.creditUSD(body.amount)
            return session
        } catch(e){
            let errorResp:Error = {
                success:false,
                tag,
                e
            }
            log.error(tag,"e: ",{errorResp})
            throw new ApiError("error",503,"error: "+e.toString());
        }
    }

    /*
    * @TODO REMOVEME (this should be done via HOTWALLET!
    *
    *
    * */
    @Post('credit/lusd')
    public async creditLUSD(@Header('Authorization') authorization: string, @Body() body: any): Promise<any> {
        let tag = TAG + " | creditLUSD | "
        try{
            if(!body.amount) throw Error("amount is required!")
            let session = await Bankless.creditLUSD(body.amount)
            return session
        } catch(e){
            let errorResp:Error = {
                success:false,
                tag,
                e
            }
            log.error(tag,"e: ",{errorResp})
            throw new ApiError("error",503,"error: "+e.toString());
        }
    }

    /*
    *  Fullfillment
    *  Completes the order
    *  Tell the atm the user is done in the funding stage
    * */
    @Post('fullfill')
    public async fullfill(@Header('Authorization') authorization: string, @Body() body: any): Promise<any> {
        let tag = TAG + " | fullfill | "
        try{
            if(!body.sessionId) throw Error("amount is required!")
            let session = await Bankless.fullfill()
            return session
        } catch(e){
            let errorResp:Error = {
                success:false,
                tag,
                e
            }
            log.error(tag,"e: ",{errorResp})
            throw new ApiError("error",503,"error: "+e.toString());
        }
    }

}
