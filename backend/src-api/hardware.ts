//TODO
let TAG  = " | hardware | "
const log = require('@pioneer-platform/loggerdog')();
const SspLib = require('@keepkey/encrypted-smiley-secure-protocol')

import {
    PIONEER_WS,
    URL_PIONEER_SPEC,
    WALLET_MAIN,
    TERMINAL_NAME,
    QUERY_KEY,
    NO_BROADCAST,
    WALLET_FAKE_PAYMENTS,
    WALLET_FAKE_BALANCES,
    ATM_NO_HARDWARE,
    USB_CONNECTION,
    DAI_CONTRACT,
    service
} from './config';

let eSSP

let onStartAcceptor = async function(){
    let tag = TAG  + " | onStartAcceptor | "
    try{
        log.info("onStartAcceptor")
        const channels = []

        const serialPortConfig = {
            baudRate: 9600, // default: 9600
            dataBits: 8, // default: 8
            stopBits: 2, // default: 2
            parity: 'none', // default: 'none'
        }

        eSSP = new SspLib({
            id: 0x00,
            debug: false, // default: false
            timeout: 3000, // default: 3000
            encryptAllCommand: true, // default: true
            fixedKey: '0123456701234567', // default: '0123456701234567'
        })

        let command = eSSP.command.bind(eSSP)
        let lastLock = Promise.resolve()
        eSSP.command = async function (...args: unknown[]) {
            await lastLock
            let resolver
            lastLock = new Promise<void>(resolve => resolver = resolve)
            try {
                const result = await command(...args)
                if (!result?.success) throw new Error(JSON.stringify(result))
                return result
            } finally {
                resolver()
            }
        }


        eSSP.on('OPEN', async () => {
            log.info(tag,'Port opened!')
        })

        eSSP.on('CLOSE', async () => {
            //console.log('Port closed!')
            log.info(tag,"port closed!")
        })

        eSSP.on('POLL', (x) => {
            if (x === "TIMEOUT") {
                //console.log("bill acceptor stopped responding, exiting with error")
                process.exit(1)
            }
        })

        eSSP.on('READ_NOTE', async result => {
            if (result.channel === 0) return
            const channel = channels[result.channel - 1]
            log.info(tag,'READ_NOTE', channel)

            if (channel.value === 500) {
                eSSP.command('REJECT_BANKNOTE')
            }
        })

        eSSP.on('NOTE_REJECTED', async result => {
            //console.log('NOTE_REJECTED', result)
            //console.log(await eSSP.command('LAST_REJECT_CODE'))
        })

        // eSSP.on('CREDIT_NOTE', async result => {
        //     if (result.channel === 0) return
        //     const channel = channels[result.channel - 1]
        //     //console.log('CREDIT_NOTE', channel)
        //     publisher.publish("payments",JSON.stringify({amount:channel.value/100,asset:"USD"}))
        //     let amount = (parseInt(channel.value)/100).toString()
        //     //console.log('credit amount: ', amount)
        //     let input = {
        //         amount: amount,
        //         asset: "USD",
        //         sessionId: CURRENT_SESSION.sessionId
        //     }
        //     if(CURRENT_SESSION.sessionId)credit_session(input)
        // })
        // let system = os.platform()
        // log.debug("system: ",system)
        log.info(tag,"USB_CONNECTION: ",USB_CONNECTION)
        await eSSP.open(USB_CONNECTION, serialPortConfig)
        await eSSP.command('SYNC')
        await eSSP.command('HOST_PROTOCOL_VERSION', { version: 6 })
        log.info(tag,'disabling payin')
        await eSSP.disable()

        log.info('encryption init')
        await eSSP.initEncryption()
        log.info(tag,'SERIAL NUMBER:', (await eSSP.command('GET_SERIAL_NUMBER'))?.info?.serial_number)

        const setup_result = await eSSP.command('SETUP_REQUEST')
        log.info(tag,'setup_result', setup_result)
        for (let i = 0; i < setup_result.info.channel_value.length; i++) {
            channels[i] = {
                value: setup_result.info.expanded_channel_value[i] * setup_result.info.real_value_multiplier,
                country_code: setup_result.info.expanded_channel_country_code[i],
            }
        }

        log.info(tag,'set channel inhibits')
        await eSSP.command('SET_CHANNEL_INHIBITS', {
            channels: Array(channels.length).fill(1),
        })

        log.info(tag,'resetting routes')
        const payoutDenoms = [100, 500, 1000, 2000, 5000, 10000]
        for (let i = 0; i < channels.length; i++) {
            const channel = channels[i]
            // @TODO: country code check
            // if (!payoutDenoms.includes(channel.value)) {
            //     await eSSP.command('SET_DENOMINATION_ROUTE', {route: 'cashbox', value: channel.value, country_code: channel.country_code})
            // }
        }
        for (let i = 0; i < channels.length; i++) {
            const channel = channels[i]
            // @TODO: country code check
            // if (payoutDenoms.includes(channel.value)) {
            //     await eSSP.command('SET_DENOMINATION_ROUTE', {route: 'payout', value: channel.value, country_code: channel.country_code})
            // }
        }

        log.info(tag,'checking routes')
        for (const channel of channels) {
            log.info(tag,channel, (await eSSP.command('GET_DENOMINATION_ROUTE', {value: channel.value, country_code: channel.country_code}))?.info)
        }

        log.info(tag,'enable refill mode')
        await eSSP.command('SET_REFILL_MODE', { mode: 'on' })

        // log.info(tag,'enable payin')
        // await eSSP.enable()

        log.info(tag,'enable payout')
        await eSSP.command('ENABLE_PAYOUT_DEVICE', {REQUIRE_FULL_STARTUP: false, GIVE_VALUE_ON_STORED: true})

        // log.info(tag,'get levels')
        // if(!ATM_NO_HARDWARE){
        //     const levels = (await eSSP.command('GET_ALL_LEVELS'))?.info?.counter;
        //     log.info(tag,levels)
        //     for(let i = 0; i < levels.length; i++){
        //         let level = levels[i]
        //         log.info(tag,'level: ', level)
        //         if(level.value == 100){
        //             ALL_BILLS["1"] = level.denomination_level
        //         }
        //         if(level.value == 200){
        //             ALL_BILLS["2"] = level.denomination_level
        //         }
        //         if(level.value == 500){
        //             ALL_BILLS["5"] = level.denomination_level
        //         }
        //         if(level.value == 1000){
        //             ALL_BILLS["10"] = level.denomination_level
        //         }
        //         if(level.value == 2000){
        //             ALL_BILLS["20"] = level.denomination_level
        //         }
        //         if(level.value == 5000){
        //             ALL_BILLS["50"] = level.denomination_level
        //         }
        //         if(level.value == 10000){
        //             ALL_BILLS["100"] = level.denomination_level
        //         }
        //     }
        // }
        // ACCEPTOR_ONLINE = true
        // onStartSession()
    }catch(e){
        console.error(e)
    }
}

let countBills = async function(){
    let tag =  TAG + " | countBills | "
    try{
        log.info(tag,'get levels')
        const levels = (await eSSP.command('GET_ALL_LEVELS'))?.info?.counter;
        log.info(tag,levels)

        // for(let i = 0; i < levels.length; i++){
        //     let level = levels[i]
        //     log.info(tag,'level: ', level)
        //     if(level.value == 100){
        //         ALL_BILLS["1"] = level.denomination_level
        //     }
        //     if(level.value == 500){
        //         ALL_BILLS["5"] = level.denomination_level
        //     }
        //     if(level.value == 1000){
        //         ALL_BILLS["10"] = level.denomination_level
        //     }
        //     if(level.value == 2000){
        //         ALL_BILLS["20"] = level.denomination_level
        //     }
        //     if(level.value == 5000){
        //         ALL_BILLS["50"] = level.denomination_level
        //     }
        //     if(level.value == 10000){
        //         ALL_BILLS["100"] = level.denomination_level
        //     }
        // }
    }catch(e){
        console.error(e)
    }
}
