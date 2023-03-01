require('dotenv').config()
require('dotenv').config({path:"./.env"})
require('dotenv').config({path:"./../.env"})
require('dotenv').config({path:"./../../.env"})
require('dotenv').config({path:"../../../.env"})
require('dotenv').config({path:"../../../../.env"})
require('dotenv').config({path:"./../../../../.env"})

const pjson = require('../package.json');
const TAG = " | "+ pjson.name +" | "
import * as log from '@pioneer-platform/loggerdog'
var cors = require('cors')
import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as methodOverride from 'method-override';
import { createClient } from 'redis'


const redisHost = process.env.HOST ?? undefined
const redisPort = process.env.PORT ?? undefined

if(!(redisHost && redisPort)){
    throw new Error('Must specify Redis host and port in .env')
}

const client = createClient({
    url: `redis://${redisHost}:${redisPort}`
})

const subscriber = client.duplicate()

const defaultListener = (message, channel) => console.log(message, channel)

subscriber.subscribe('payments', defaultListener);
subscriber.subscribe('pioneer:transactions:all', defaultListener);

subscriber.on('message', async function (channel, payloadS) {
    let tag = TAG + ' | publishToFront | ';
    try {
        log.debug(tag,"event: ",payloadS)
        //Push event over socket
        if(channel === 'payments'){
            let payload = JSON.parse(payloadS)
            payload.event = 'transaction'
            payloadS = JSON.stringify(payload)
        }

        //legacy hack
        if(channel === 'payments') channel = 'events'

        //
        io.emit(channel, payloadS);

    } catch (e) {
        log.error(tag, e);
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

var corsOptions = {
    origin: function (origin, callback) {
        if (true) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    }
}


app.use(cors(corsOptions))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride());

//socket
let SOCKET_MAX_CONNECTIONS = parseInt(process.env["SOCKET_MAX_CONNECTIONS"]) || 20

//socket-io
let io = require('socket.io')(server);
io.sockets.setMaxListeners(SOCKET_MAX_CONNECTIONS);

//web
app.use('/',express.static('dist/spa'));

//docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//swagger.json
app.use('/spec', express.static('api/dist'));


//REST API v1
RegisterRoutes(app);  // and here


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
