/*

    REST endpoints

 */
let TAG = ' | API | '
import axios from 'axios';
const pjson = require('../../package.json');
const log = require('@pioneer-platform/loggerdog')();
const {subscriber, publisher, redis} = require('@pioneer-platform/default-redis')

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

interface BodyWithdrawCash {
    amount:string
}

//
interface BodyWelook {
    url:string
    // key:string
}

interface BodyFullfill {
    sessionId:string
}

interface BodyClear {
    sessionId:string
}

interface BodyFund {
    amount:string
    asset:string
    sessionId:string
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
    amount: string,
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

    @Get('/session/:sessionId')
    public async getSession(sessionId: string) {
        const tag = TAG + ' | getSession | ';
        try {
            log.info(tag, 'Fetching session with sessionId:', sessionId);

            // Assuming Bankless.sessions(limit, skip) fetches sessions with the specified limit and skip values
            const sessions = await Bankless.getSession(sessionId);

            // Return the fetched sessions
            return sessions;
        } catch (e) {
            const errorResp: Error = {
                success: false,
                tag,
                e,
            };
            log.error(tag, 'e: ', { errorResp });
            throw new ApiError('error', 503, 'Error while fetching sessions: ' + e.toString());
        }
    }

    @Get('/session/byOnwer/:address')
    public async getSessionByAddressOwner(address: string) {
        const tag = TAG + ' | getSessionByAddressOwner | ';
        try {
            log.info(tag, 'Fetching session with address:', address);

            // Assuming Bankless.sessions(limit, skip) fetches sessions with the specified limit and skip values
            const sessions = await Bankless.getSessionByAddressOwner(address);

            // Return the fetched sessions
            return sessions;
        } catch (e) {
            const errorResp: Error = {
                success: false,
                tag,
                e,
            };
            log.error(tag, 'e: ', { errorResp });
            throw new ApiError('error', 503, 'Error while fetching sessions: ' + e.toString());
        }
    }

    @Get('/session/byDeposit/:address')
    public async getSessionByAddressDeposit(address: string) {
        const tag = TAG + ' | getSessionByAddressDeposit | ';
        try {
            log.info(tag, 'Fetching session with address:', address);

            // Assuming Bankless.sessions(limit, skip) fetches sessions with the specified limit and skip values
            const sessions = await Bankless.getSessionByAddressDeposit(address);

            // Return the fetched sessions
            return sessions;
        } catch (e) {
            const errorResp: Error = {
                success: false,
                tag,
                e,
            };
            log.error(tag, 'e: ', { errorResp });
            throw new ApiError('error', 503, 'Error while fetching sessions: ' + e.toString());
        }
    }
    
    @Get('/sessions/:limit/:skip')
    public async getSessions(limit: number, skip: number) {
        const tag = TAG + ' | getSessions | ';
        try {
            log.info(tag, 'Fetching sessions with limit:', limit, 'and skip:', skip);

            // Assuming Bankless.sessions(limit, skip) fetches sessions with the specified limit and skip values
            const sessions = await Bankless.getSessions(limit, skip);

            // Return the fetched sessions
            return sessions;
        } catch (e) {
            const errorResp: Error = {
                success: false,
                tag,
                e,
            };
            log.error(tag, 'e: ', { errorResp });
            throw new ApiError('error', 503, 'Error while fetching sessions: ' + e.toString());
        }
    }

    /*
        push address

    */
    @Get('/push/address/:address')
    public async pushAddress(address:string) {
        let tag = TAG + " | pushAddress | "
        try{
            log.info(tag,"address: ",address)
            // @ts-ignore
            publisher.publish('address',JSON.stringify({address}))

            return(true)
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
    start Acceptor
     */
    @Get('/startAcceptor')
    public async startAcceptor() {
        let tag = TAG + " | startAcceptor | "
        try{
            Bankless.startAcceptor()
            return(true)
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
        Stop Acceptor
     */
    @Get('/stopAcceptor')
    public async stopAcceptor() {
        let tag = TAG + " | stopAcceptor | "
        try{
            Bankless.stopAcceptor()
            return(true)
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
    @Post('/welook')
    public async welook(@Body() body: BodyWelook): Promise<any> {
        let tag = TAG + " | welook | "
        try{
            if(!body.url) throw Error("missing amount!")
            // if(!body.key) throw Error("missing key!")

            //let url = "https://welook.io/nfc-card?e=663A64295E73B91F5D02841DF91C3251&c=AF0E4C323F8FC7D1&v=1"
            let input = body.url.split("=")
            log.info(tag,"input: ",input)
            let e = input[1].replace("&c","")
            let c = input[2].replace("&v","")
            let v = input[4]
            log.info(tag,"e: ",e)
            log.info(tag,"c: ",c)
            // @ts-ignore
            let headers = {
                // "api_key": body.key
                "api_key": "U2FsdGVkX1+aAvvVzif04qjF0SyYsY29W71/MQ9w9SA="
            }
            //curl -X PUT -H "api_key: U2FsdGVkX1+aAvvVzif04qjF0SyYsY29W71/MQ9w9SA=" -s "https://welook.tech/api/v2/nfc/v2/663A64295E73B91F5D02841DF91C3251/AF0E4C323F8FC7D1"
            let url = "https://welook.tech/api/v2/nfc/v2/"+e+"/"+c
            log.info(tag,"url: ",url)
            log.info(tag,"headers: ",headers)
            let resp:any = await axios.put(url, {}, {
                headers
            })
            log.info("result:",resp)
            let addressScaned = resp.data.data.address
            let data = resp.data.data
            //result.data
            // @ts-ignore
            let address = publisher.publish('address',JSON.stringify({address:addressScaned, data}))


            return true
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
    * Payments
    *
    * */
    @Post('/push/payment')
    public async payment(@Body() body: any): Promise<any> {
        let tag = TAG + " | payment | "
        try{
            // if(!body.amount) throw Error("missing amount!")
            // if(!body.asset) throw Error("missing asset!")
            // if(!body.sessionId) throw Error("missing sessionId!")
            let result
            if(ALLOW_HACK){
                result = await Bankless.pushPayment(body)                
            } else {
                result = "(Production) nerfed"
            }

            return result
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
    * HACK DEPOSIT
    *
    * */
    @Post('/hack/fund')
    public async fund(@Body() body: BodyFund): Promise<any> {
        let tag = TAG + " | fund | "
        try{
            if(!body.amount) throw Error("missing amount!")
            if(!body.asset) throw Error("missing asset!")
            if(!body.sessionId) throw Error("missing sessionId!")

            if(ALLOW_HACK){
                let input  = {
                    amount:body.amount,
                    asset:body.asset,
                    sessionId:body.sessionId
                }
                let session = await Bankless.credit(input)
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
    * HACK withdrawalCash
    *
    *
    * */
    @Post('/hack/withdrawalCash')
    public async withdrawalCash(@Body() body: BodyWithdrawCash): Promise<any> {
        let tag = TAG + " | withdrawalCash | "
        try{
            if(!body.amount) throw Error("missing amount!")
            if(ALLOW_HACK){
                let input  = {
                    amount:body.amount
                }
                let session = await Bankless.payout(input.amount)
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
    * buy dai
    *
    *
    * */
    @Post('/create')
    public async create(@Body() body: any): Promise<any> {
        let tag = TAG + " | create | "
        try{
            let input  = {}
            let session = await Bankless.startSession(input)
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
    * buy dai
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
            log.info("create Buy!")
            let session = await Bankless.setSessionBuy(input)
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
    * sell dai
    *
    *
    * */
    @Post('/create/sell')
    public async createSell(@Body() body: BodySell): Promise<any> {
        let tag = TAG + " | createSell | "
        try{
            if(!body.amount) throw Error("amount is required!")
            let input  = {
                amount:body.amount
            }
            let session = await Bankless.setSessionSell(input)
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
            let session = await Bankless.setSessionLpAdd(input)
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
    * lpAddAsym
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
            let session = await Bankless.setSessionLpAddAsym(input)
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
                amount:body.amount,
                address:body.address
            }
            let session = await Bankless.setSessionLpWithdraw(input)
            log.info(tag,"session: ",session)
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
            if(!body.amount) throw Error("amount is required!")
            let input  = {
                address:body.address,
                amount:body.amount
            }
            log.info(tag,"input: ",input)
            let session = await Bankless.setSessionLpWithdrawAsym(input)
            log.info(tag,"session: ",session)
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
    public async fullfill(@Body() body: BodyFullfill): Promise<any> {
        let tag = TAG + " | fullfill | "
        try{
            log.info(tag,"body: ",body)
            if(!body.sessionId) throw Error("sessionId is required!")
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

    /*
    *  clear session
    *  Completes the order
    *  Tell the atm the user is done in the funding stage
    * */
    @Post('/clear')
    public async clear(@Body() body: BodyFullfill): Promise<any> {
        let tag = TAG + " | clear | "
        try{
            log.info(tag,"body: ",body)
            if(!body.sessionId) throw Error("sessionId is required!")
            let session = await Bankless.clear(body.sessionId)
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
