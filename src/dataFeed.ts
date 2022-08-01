import { TickerAddress } from "./types";

const Web3 = require("web3") 
require('dotenv').config();

const WebSocket: string = process.env.ALCHEMY_WS;

class DataFeed {
    web3: any;
    tickersMap: TickerAddress;

    constructor(web3Provider: string, tickerObject: TickerAddress) {
        this.web3 = new Web3(new Web3.providers.WebsocketProvider(web3Provider));
        this.tickersMap = tickerObject;
    }

    async subscriber() {
        const aggregatorV3InterfaceABI = [{ "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "description", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint80", "name": "_roundId", "type": "uint80" }], "name": "getRoundData", "outputs": [{ "internalType": "uint80", "name": "roundId", "type": "uint80" }, { "internalType": "int256", "name": "answer", "type": "int256" }, { "internalType": "uint256", "name": "startedAt", "type": "uint256" }, { "internalType": "uint256", "name": "updatedAt", "type": "uint256" }, { "internalType": "uint80", "name": "answeredInRound", "type": "uint80" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "latestRoundData", "outputs": [{ "internalType": "uint80", "name": "roundId", "type": "uint80" }, { "internalType": "int256", "name": "answer", "type": "int256" }, { "internalType": "uint256", "name": "startedAt", "type": "uint256" }, { "internalType": "uint256", "name": "updatedAt", "type": "uint256" }, { "internalType": "uint80", "name": "answeredInRound", "type": "uint80" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "version", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }];
        
        const latestValues = await Promise.all(
            Object.keys(this.tickersMap).map(async(ticker: string) => {
                const priceFeed = new this.web3.eth.Contract(aggregatorV3InterfaceABI, this.tickersMap[ticker]);
                try {
                    const roundData = await priceFeed.methods.latestRoundData().call();
                    const price = roundData.answer;
                    // Aggregator reflects the price change only if there is a hugh diff.
                    return { [ticker]: { value: `$${price * 10**-8}`, updatedAt: new Date(roundData.updatedAt*1000).toUTCString() } };
                } catch(err: any) {
                    console.error(`Error occured while fetching latest price for ticker: ${ticker}`)
                    return null;
                }
            })
        );
        
        return latestValues;
    }

    unsubscribe() {
        this.web3.currentProvider.connection.close()
    }
}

async function main() {
    const tickerMap: TickerAddress = {
        'ETH/USD': '0xF9680D99D6C9589e2a93a78A04A279e509205945',
        'MATIC/USD': '0xAB594600376Ec9fD91F8e885dADF0CE036862dE0',
        'BTC/USD': '0xc907E116054Ad103354f2D350FD2514433D57F6f',
        'LINK/USD': '0xd9FFdb71EbE7496cC440152d43986Aae0AB76665',
        'AAVE/USD': '0x72484B12719E23115761D5DA1646945632979bB6'
    }
    const feeder = new DataFeed(WebSocket, tickerMap);

    setInterval(async () => {
        const result = await feeder.subscriber();
        console.log(result)
    }, 5000);

    // Disconnects the socket connection 
    feeder.unsubscribe();
}

main();