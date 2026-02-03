import { BotConfig } from "@/database/models/Ads_config.ts";
import client from "../../utils/binance/index.ts";
const bodyBuy = {
    "asset": "USDT",
    "fiatUnit": "VES",
    "tradeType": "BUY",
    "page": 1,
    "rows": 100
}

const bodySell = {
    "asset": "USDT",
    "fiatUnit": "VES",
    "tradeType": "SELL",
    "page": 1,
    "rows": 100
}

const UpdateAds = async () => {

    const config = await BotConfig.findOne({});
    if (!config) {
        console.log("No se encontró la configuración del bot.");
        return;
    }
    console.log("Configuración del bot encontrada:", config);
    if (config.enabled) {
        // Lógica para actualizar anuncios
        const adsBuy = await client.request({
            method: "POST",
            url: "/sapi/v1/c2c/ads/listWithPagination",
            data: bodyBuy,
            signed: true,
        });
        const adsSell = await client.request({
            method: "POST",
            url: "/sapi/v1/c2c/ads/listWithPagination",
            data: bodySell,
            signed: true,
        });

        const ads = {
            buy: adsBuy.data.data,
            sell: adsSell.data.data
        }
        console.log("Actualizando anuncios...");
        //   console.log("Configuración actual del bot:", config);
        console.log("Anuncios obtenidos:", ads);
    }


    // Aquí iría la lógica para actualizar los anuncios según la
}

export default UpdateAds;