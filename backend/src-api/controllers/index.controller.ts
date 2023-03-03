/*

    REST endpoints

 */
let TAG = ' | API | '

const pjson = require('../../package.json');
const log = require('@pioneer-platform/loggerdog')();
// const {subscriber, publisher, redis} = require('@pioneer-platform/default-redis')

let Bankless = require("../bankless")

//ALLOW_HACK
let ALLOW_HACK = process.env['WALLET_ALLOW_HACK']
if(ALLOW_HACK) log.info(" ALTERT! wallet will allow dummy payments! ONLY FOR DEV!")

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

interface BodySend {
    address:string
    amount:string
}

interface BodyFund {
    amount:string,
    asset:string
}

interface BodyBuy {
    address:string
}

interface BodySell {
    amount:string
}

interface BodyLPAdd {
    address:string
}

interface BodyLPWithdrawl {
    address:string
}

interface BodyLPAddAsym {
    address:string
}

interface BodyLPWithdrawlAsym {
    address:string
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
    address endpoint
    
    */

    @Get('/address')
    public async address() {
        let tag = TAG + " | address | "
        try{

            let output:any = Bankless.address()

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
        balance endpoint
    
    */

    @Get('/balance')
    public async balance() {
        let tag = TAG + " | address | "
        try{

            let output:any = Bankless.balance()

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
    balance endpoint

*/

    @Get('/payments')
    public async payments() {
        let tag = TAG + " | payments | "
        try{

            let output:any = Bankless.payments()

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
    * HACK DEPOSIT
    *
    *
    * */
    @Post('/hack/fund')
    public async fundSession(@Body() body: BodyFund): Promise<any> {
        let tag = TAG + " | createBuy | "
        try{
            if(!body.amount) throw Error("missing amount!")
            if(!body.asset) throw Error("missing asset!")
            if(ALLOW_HACK){
                let input  = {
                    amount:body.amount,
                    asset:body.asset
                }
                let session = await Bankless.credit(input.amount,input.asset)
                return session
            } else {
                return {success:false,error:"PRODUCTION MODE! NO HACKS ALLOWED!"}
            }
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
    * buy lusd
    *
    *
    * */
    @Post('/create/buy')
    public async createBuy(@Body() body: BodyBuy): Promise<any> {
        let tag = TAG + " | createBuy | "
        try{
            if(!body.address) throw Error("address is required!")
            let input  = {
                address:body.address
            }
            let session = await Bankless.startSessionBuy(input)
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
    * sell lusd
    *
    *
    * */
    @Post('/create/sell')
    public async createSell(@Body() body: BodySell): Promise<any> {
        let tag = TAG + " | createBuy | "
        try{
            if(!body.amount) throw Error("amount is required!")
            let input  = {
                amount:body.amount
            }
            let session = await Bankless.startSessionSell(input)
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
    * createLpAdd
    *
    *
    * */
    @Post('/create/lpAdd')
    public async createLpAdd(@Body() body: BodyLPAdd): Promise<any> {
        let tag = TAG + " | createLpAdd | "
        try{
            if(!body.address) throw Error("address is required!")
            let input  = {
                address:body.address
            }
            let session = await Bankless.startSessionLpAdd(input.address)
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
    * createLpAdd
    *
    *
    * */
    @Post('/create/lpAddAsym')
    public async createLpAddAsym(@Body() body: BodyLPAddAsym): Promise<any> {
        let tag = TAG + " | createLpAddAsym | "
        try{
            if(!body.address) throw Error("address is required!")
            let input  = {
                address:body.address
            }
            let session = await Bankless.startSessionLpAddAsym(input.address)
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
    * createLpWithdraw
    *
    *
    * */
    @Post('/create/lpWithdraw')
    public async createLpWithdraw(@Body() body: BodyLPWithdrawl): Promise<any> {
        let tag = TAG + " | createLpWithdraw | "
        try{
            if(!body.address) throw Error("address is required!")
            let input  = {
                address:body.address
            }
            let session = await Bankless.startSessionLpWithdraw(input.address)
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
    * createLpWithdraw
    *
    *
    * */
    @Post('/create/lpWithdrawAsym')
    public async createLpWithdrawAsym(@Body() body: BodyLPWithdrawl): Promise<any> {
        let tag = TAG + " | createLpWithdrawAsym | "
        try{
            if(!body.address) throw Error("address is required!")
            let input  = {
                address:body.address
            }
            let session = await Bankless.startSessionLpWithdrawAsym(input.address)
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
    @Post('/fullfill')
    public async fullfill(@Body() body: any): Promise<any> {
        let tag = TAG + " | fullfill | "
        try{
            if(!body.sessionId) throw Error("amount is required!")
            let session = await Bankless.fullfill(body.sessionId)
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
