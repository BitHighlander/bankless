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

export const globals = {
    balanceUSD: 0,
    balanceDAI: 0,
    currentSession: undefined, // TODO: session must use session Types

    // Pioneer
    pioneer: undefined,

    // Bill acceptor
    eSSP: undefined,
    ACCEPTOR_ONLINE: false,

    ALL_BILLS: {
        "1": 0,
        "2": 0,
        "5": 0,
        "10": 0,
        "20": 0,
        "50": 0,
        "100": 0,
    },

    TOTAL_CASH: 0,
    TOTAL_DAI: 0,
    GLOBAL_SESSION: "unset",

    CURRENT_SESSION: {
        start: undefined,
        sessionId: undefined,
        type: undefined,
        address: undefined,
        txid: undefined,
        status: undefined,
        amountIn: undefined,
        amountOut: undefined,
        percentage: undefined,
        SESSION_FUNDING_USD: undefined,
        SESSION_FUNDING_DAI: undefined,
        SESSION_FULLFILLED: undefined,
    },

    TXIDS_REVIEWED: [],
    TXS_FULLFILLED: [],
};
