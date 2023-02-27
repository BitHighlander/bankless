"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
require('dotenv').config();
require('dotenv').config({ path: "./.env" });
require('dotenv').config({ path: "./../.env" });
require('dotenv').config({ path: "./../../.env" });
require('dotenv').config({ path: "../../../.env" });
require('dotenv').config({ path: "../../../../.env" });
require('dotenv').config({ path: "./../../../../.env" });
var pjson = require('../package.json');
var TAG = " | " + pjson.name + " | ";
var log = require('@bithighlander/loggerdog-client')();
var _a = require('@pioneer-platform/default-redis'), subscriber = _a.subscriber, publisher = _a.publisher, redis = _a.redis;
var cors = require('cors');
var bodyParser = require("body-parser");
var express = require("express");
var methodOverride = require("method-override");
// @ts-ignore
var routes_1 = require("./routes/routes"); // here
var swaggerUi = require('swagger-ui-express');
var swaggerDocument = require('../api/dist/swagger.json');
//Rate limiter options
//https://github.com/animir/node-rate-limiter-flexible/wiki/Overall-example#create-simple-rate-limiter-and-consume-points-on-entry-point
var RateLimiterRedis = require('rate-limiter-flexible').RateLimiterRedis;
var app = express();
var server = require('http').Server(app);
var API_PORT = parseInt(process.env["API_PORT_PIONEER"]) || 4000;
var corsOptions = {
    origin: function (origin, callback) {
        if (true) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride());
//socket
var SOCKET_MAX_CONNECTIONS = parseInt(process.env["SOCKET_MAX_CONNECTIONS"]) || 20;
//socket-io
var io = require('socket.io')(server);
io.sockets.setMaxListeners(SOCKET_MAX_CONNECTIONS);
//web
app.use('/', express.static('dist/spa'));
//docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
//swagger.json
app.use('/spec', express.static('api/dist'));
//REST API v1
routes_1.RegisterRoutes(app); // and here
subscriber.subscribe('payments');
subscriber.subscribe('pioneer:transactions:all');
subscriber.on('message', function (channel, payloadS) {
    return __awaiter(this, void 0, void 0, function () {
        var tag, payload;
        return __generator(this, function (_a) {
            tag = TAG + ' | publishToFront | ';
            try {
                log.debug(tag, "event: ", payloadS);
                //Push event over socket
                if (channel === 'payments') {
                    payload = JSON.parse(payloadS);
                    payload.event = 'transaction';
                    payloadS = JSON.stringify(payload);
                }
                //legacy hack
                if (channel === 'payments')
                    channel = 'events';
                //
                io.emit(channel, payloadS);
            }
            catch (e) {
                log.error(tag, e);
                throw e;
            }
            return [2 /*return*/];
        });
    });
});
//Error handeling
function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }
    log.error("ERROR: ", err);
    res.status(400).send({
        message: err.message,
        error: err
    });
}
app.use(errorHandler);
server.listen(API_PORT, function () { return console.log("Server started listening to port " + API_PORT); });
