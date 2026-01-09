export type TypeTradeMethod = {
    payType: string;
    identifier: string;
    iconUrlColor?: string;
    tradeMethodName: string;
};

export type TypeTradeMethodCommissionRate = {
    tradeMethodIdentifier: string;
    tradeMethodName: string;
    commissionRate: string;
};

export type TypeBinanceAd = {
    advNo: string;
    classify: string;
    tradeType: "BUY" | "SELL" | string;
    asset: string;
    fiatUnit: string;
    fiatSymbol?: string;

    advStatus: number;
    priceType: number;
    priceFloatingRatio: string;
    rateFloatingRatio: string;

    price: string;
    initAmount: string;
    surplusAmount: string;
    tradableQuantity?: string;

    maxSingleTransAmount: string;
    minSingleTransAmount: string;

    buyerKycLimit: number;
    buyerRegDaysLimit: number;
    buyerBtcPositionLimit: string;

    remarks?: string;
    autoReplyMsg?: string;
    payTimeLimit: number;

    tradeMethods: TypeTradeMethod[];
    tradeMethodCommissionRateVoList?: TypeTradeMethodCommissionRate[];

    commissionRate: string;

    createTime: number;
    advUpdateTime: number;

    assetLogo?: string;

    assetScale?: number;
    fiatScale?: number;
    priceScale?: number;

    offlineReason?: string;
};