let TAG  = " | payments | "
const log = require('@pioneer-platform/loggerdog')();
let blockbook = require("@pioneer-platform/blockbook")

export let acceptPayment = async function(payments:any){
    let tag = TAG + " | acceptPayment | "
    try{
        log.info(tag,"payments: ",payments)
        //address
        let address = payments.address
        let tx = payments.tx


    }catch(e){
        log.error(e)
    }
}

export let onStart = async function(address:string){
    let tag = TAG + " | onStart | "
    try{
        //
        await blockbook.init()
        let allSockets = blockbook.getBlockbookSockets()
        let ethEvents = allSockets.ETH
        // ethEvents.subscribeAddresses([address], ({ address, tx }) => console.log('new tx for address', address, tx))
        ethEvents.subscribeAddresses([address], function(payment:any){
            acceptPayment(payment)
        })
    }catch(e){
        log.error(e)
    }
}

//sub to address
