// order types
export enum OrderTypes {
    Buy,
    Sell,
    LP
}

export enum Status {
    created,
    funded,
    fulfilled,
}

export interface BuyOrder {
    orderId: string;
    type: OrderTypes;
    amountIn: number;
    amountOut: number;
    txid?: string;
    assetId: string;
    status: Status;
}

export interface SellOrder {
    orderId: string;
    type: OrderTypes;
    amountIn: number;
    amountOut: number;
    txid?: string;
    assetId: string;
    status: Status;
}

export interface LP {
    orderId: string;
    type: OrderTypes;
    amountFiat: number;
    amountCrypto: number;
    assetId: string;
    status: Status;
}
