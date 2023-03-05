require('dotenv').config()
require('dotenv').config({path:"./.env"})
require('dotenv').config({path:"./../.env"})
require('dotenv').config({path:"./../../.env"})
require('dotenv').config({path:"../../../.env"})
require('dotenv').config({path:"../../../../.env"})
require('dotenv').config({path:"./../../../../.env"})

const pjson = require('../package.json');
const TAG = " | "+ pjson.name +" | "
//import * as log from '@pioneer-platform/loggerdog' @TODO THIS BROKE
const log = require('@pioneer-platform/loggerdog')()
var cors = require('cors')
import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as methodOverride from 'method-override';

const redisHost = process.env.REDIS_HOST ?? undefined
const redisPort = process.env.REDIS_PORT ?? undefined
// const redisHost = process.env.REDIS_HOST ?? undefined
// const redisPort = process.env.REDIS_PORT ?? undefined
process.env['REDIS_CONNECTION'] = `redis://${redisHost}:${redisPort}`
const {subscriber, publisher, redis, redisQueue} = require('@pioneer-platform/default-redis')

//@TODO this also broke
// import { createClient } from 'redis'
// const redisHost = process.env.REDIS_HOST ?? undefined
// const redisPort = process.env.REDIS_PORT ?? undefined
//
// if(!(redisHost && redisPort)){
//     throw new Error('Must specify REDIS_HOST and REDIS_PORT in .env')
// }
//
// const client = createClient({
//     url: `redis://${redisHost}:${redisPort}`
// })
//
// const subscriber = client.duplicate()
//
// const defaultListener = (message, channel) => console.log(message, channel)
//
// subscriber.subscribe('payments', defaultListener);

subscriber.subscribe('payments')
subscriber.subscribe('address')
subscriber.on('message', async function (channel, payloadS) {
    let tag = TAG + ' | publishToFront | ';
    try {
        //log.info(tag,"event: ",payloadS)
        //Push event over socket
        if(channel === 'payments'){
            let payload = JSON.parse(payloadS)
            payload.event = 'payments'
            payloadS = JSON.stringify(payload)
        }
        if(channel === 'address'){
            let payload = JSON.parse(payloadS)
            payload.event = 'address'
            payloadS = JSON.stringify(payload)
        }
        //
        console.log("message: ",payloadS)
        io.emit('message', payloadS);
        // io.emit(channel, payloadS);

    } catch (e) {
        console.error(e)
        throw e
    }
});

// @ts-ignore
import { RegisterRoutes } from './routes/routes';  // here
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../api/dist/swagger.json')


const app = express();
const server = require('http').Server(app);
let API_PORT = parseInt(process.env["API_PORT_PIONEER"]) || 4000

let corsOptions = {
    origin: '*',
}


app.use(cors(corsOptions))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride());

//socket
let SOCKET_MAX_CONNECTIONS = parseInt(process.env["SOCKET_MAX_CONNECTIONS"]) || 20

//socket-io
let io = require('socket.io')(server,{cors: {origin:'*'}});
io.sockets.setMaxListeners(SOCKET_MAX_CONNECTIONS);

//web
app.use('/',express.static('dist/spa'));

//docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//swagger.json
app.use('/spec', express.static('api/dist'));


//REST API v1
RegisterRoutes(app);  // and here

//globals
let globalSockets = {}
let usersBySocketId = {}
let usersByUsername = {}
let usersByKey = {}
let channel_history_max = 10;
//socket io
io.on('connection', async function(socket){
    let tag = TAG + ' | io connection | '
    log.info(tag,'a user connected', socket.id," user: ",usersByUsername[socket.id]);
    redis.sadd("online:users",socket.id)
    redis.hincrby("globals","usersOnline",Object.keys(usersByUsername).length)

    //set into global
    globalSockets[socket.id] = socket

    socket.on('disconnect', function(){
        let username = usersByUsername[socket.id]
        log.info(tag,socket.id+" username: "+username+' disconnected');
        redis.srem('online',username)
        //remove socket.id from username list
        if(usersByUsername[username])usersByUsername[username].splice(usersByUsername[username].indexOf(socket.id), 1);
        delete globalSockets[socket.id]
        delete usersBySocketId[socket.id]
        redis.hset("globals","usersOnline",Object.keys(usersByUsername).length)
    });

    socket.on('join', async function(msg){
        log.info(tag,'**** Join event! : ', typeof(msg));
        //if(typeof(msg) === "string") msg = JSON.parse(msg)
        log.info(tag,"message: ",msg)

        let queryKey = msg.queryKey
        if(queryKey && msg.username){
            log.info(tag,"GIVEN: username: ",msg.username)
            //get pubkeyInfo
            let queryKeyInfo = await redis.hgetall(queryKey)
            log.info(tag,"ACTUAL: username: ",queryKeyInfo.username)
            if(queryKeyInfo.username === msg.username){
                usersBySocketId[socket.id] = msg.username
                if(!usersByUsername[msg.username]) usersByUsername[msg.username] = []
                usersByUsername[msg.username].push(socket.id)
                redis.sadd('online',msg.username)
                let subscribePayload = {
                    socketId:socket.id,
                    success:true,
                    username:msg.username
                }
                globalSockets[socket.id].emit('subscribedToUsername', subscribePayload);
            } else if(queryKeyInfo.username) {
                log.error(tag,"Failed to join! pubkeyInfo.username: "+queryKeyInfo.username+" msg.username: "+msg.username)
                let error = {
                    code:6,
                    msg:"(error) Failed to join! pubkeyInfo.username: "+queryKeyInfo.username+" msg.username: "+msg.username
                }
                globalSockets[socket.id].emit('errorMessage', error);
            } else {
                log.error(tag,"Failed to join! pubkeyInfo.username: "+queryKeyInfo.username+" msg.username: "+msg.username)
                let error = {
                    code:7,
                    msg:"Failed to join! unknown queryKey!"
                }
                globalSockets[socket.id].emit('errorMessage', error);
            }

        } else if(msg.queryKey){
            log.info(tag,"No username given! subbing to queryKey!")
            if(!usersByKey[msg.queryKey]) {
                usersByKey[msg.queryKey] = [socket.id]
            } else {
                usersByKey[msg.queryKey].push(socket.id)
            } //edge case multiple sockets on same key, push to all
            let connectPayload = {
                success:true,
            }
            globalSockets[socket.id].emit('connected', connectPayload);
            log.info(tag,"sdk subscribed to apiKey: ",msg.queryKey)
            log.info(tag,"usersByKey: ",usersByKey)
        } else {
            log.error(tag,"invalid join request! ")
        }
    });

    socket.on('message', async function(msg){
        log.info(tag,'**** Received by socket api from client : ', typeof(msg));
        if(typeof(msg)==="string") msg = JSON.parse(msg)
    });

});


//Error handeling
function errorHandler (err, req, res, next) {
    if (res.headersSent) {
        return next(err)
    }
    log.error("ERROR: ",err)
    res.status(400).send({
        message: err.message,
        error: err
    });
}
app.use(errorHandler)

server.listen(API_PORT, () => console.log(`Server started listening to port ${API_PORT}`));
