import {
    cre,
    encodeCallMsg,
    LAST_FINALIZED_BLOCK_NUMBER,
} from "@chainlink/cre-sdk";
import { bytesToBigint } from "@chainlink/cre-sdk";
import { type Address } from "viem";

const AGGREGATOR_V3_ABI_SELECTORS = {
    latestRoundData: "0xfeaf968c",
    decimals: "0x313ce567",
};

// Hardcoded price feed addresses for major assets across supported chains
const PRICE_FEEDS: Record<number, Record<string, string>> = {
    1: { // Ethereum
        "ETH/USD": "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
        "BTC/USD": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
        "LINK/USD": "0x2c1d072e956affC0D43537C72ec524a66218724b",
        "USDC/USD": "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
        "USDT/USD": "0x3E7d1eAB13ad0104d2750B8863b489D65364e32d",
        "DAI/USD": "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9",
    },
    8453: { // Base
        "ETH/USD": "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70",
        "BTC/USD": "0x64c9A6f387c29758784d142E7e8e77E580A848F",
        "LINK/USD": "0xf694EDCdc79391DC578330740E74b0f7e49f697E",
        "USDC/USD": "0x7e860098F58bBFC8648a4311b374B1D669a2bc6B",
        "USDT/USD": "0x3EC31070A31baE700E2C8545e8fbe5527f549aEa",
        "DAI/USD": "0x591e79239a7d679378eC8c847e5038150364C78F",
    },
    137: { // Polygon
        "ETH/USD": "0xF9680D99D6C9589e2a929FC580BBF2bCaD189a0c",
        "BTC/USD": "0xc90F16eC73E09D37e4299bB4bE7166139C293c6A",
        "LINK/USD": "0xd9FF69Ab9f40db6eF0635f1F4998E135E3ef51b3",
        "USDC/USD": "0xfE4A436BE03C3503a45377f5B28448f4C008630b",
        "USDT/USD": "0x0A6513e40db3744ee991d833285c3e440465DE4f",
        "DAI/USD": "0x4746DeE6196dC675F309773395d90AD618956973",
    },
    42161: { // Arbitrum
        "ETH/USD": "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612",
        "BTC/USD": "0x6ce1853BDE7A74006c624dE1E9dE4E776e0C08e9",
        "LINK/USD": "0x86E53060509acA9659373919EF662580C2767118",
        "USDC/USD": "0x50834F3163758fcC1Df9973b6e91f0F0F0434aD3",
        "USDT/USD": "0x3f3f5dF88dC9F13eac63DF89EC16ef6e7E25DdE7",
        "DAI/USD": "0xc5C8E77B397E531B8EC06BFb0048328B30E9eCfB",
    },
    10: { // Optimism
        "ETH/USD": "0x13e3Ee699D1909E989722E753853AE30b17e08c5",
        "BTC/USD": "0xD702DD97995674705862099ea1Cb304599642Dba",
        "LINK/USD": "0xCc232da209675bd77603F4b260901e7Bb13d5A40",
        "USDC/USD": "0x16a9FA2FDa030272Ce99B29CF700df457752BB91",
        "USDT/USD": "0xECef83d7351608775f0D930C8638b76313777F5E",
        "DAI/USD": "0x8dBa430A8D9344421cc1DBCfD1350a86Ae7Fe982",
    },
    56: { // BSC
        "ETH/USD": "0x0567F2323251f0Aab15c8dFb1967E4E8A7D42aeE",
        "BTC/USD": "0x264990fbd0A4796A3E3d8E97C4453460d3dF5E05",
        "LINK/USD": "0xca236E327F629f9Fb2c30A637C2d440deEc51790",
        "USDC/USD": "0x51597f405303C4377E36123cBc172b13269EA163",
        "USDT/USD": "0xB97Ad0E31daA60a02955f13f009e99e03F808265",
        "DAI/USD": "0x132d3C0B1D2C31CB7F57470Ec6b75355EfB3bD08",
    },
    43114: { // Avalanche
        "ETH/USD": "0x976B3D034EaA78BDb6413e3D746bb6659fd3f273",
        "BTC/USD": "0x271fD68583486cAd94541B181284A2A2b9472e3a",
        "LINK/USD": "0x49776dE43477002AF780D21b637Ac6Cb3B8806dB",
        "USDC/USD": "0xF096872672F44d6EBA71458D74fe67F9a77a23B9",
        "USDT/USD": "0xE3F52E978ad574567206bEBAF91fc726b04939C0",
        "DAI/USD": "0x51D718489D89f15016440266068A85610f20D397",
    },
};

function normalizeSymbol(symbol: string): string {
    const s = symbol.toUpperCase().replace(/\.E$/, "");
    if (s === "WETH") return "ETH";
    if (s === "WMATIC" || s === "POL") return "MATIC";
    if (s === "WBNB") return "BNB";
    if (s === "WAVAX") return "AVAX";
    if (s === "AXLUSDC") return "USDC";
    return s;
}

export function getChainlinkPrice(
    runtime: any,
    symbol: string,
    chainId: number
) {
    const normSymbol = normalizeSymbol(symbol);
    const pair = `${normSymbol}/USD`;

    const chainFeeds = PRICE_FEEDS[chainId];
    const feedAddress = chainFeeds?.[pair];

    if (!feedAddress) {
        return null;
    }

    // DEBUG: Temporarily return hardcoded prices to verify UI display
    if (normSymbol === "ETH") {
        return { price: 3450.25, updatedAt: Date.now(), pair: "ETH/USD", chainId };
    }
    if (normSymbol === "USDC") {
        return { price: 1.00, updatedAt: Date.now(), pair: "USDC/USD", chainId };
    }

    // Original logic continues...
    // Use EVMClient to fetch latestRoundData and decimals
    runtime.log(`[Chainlink] DEBUG: Starting price fetch for ${pair} on chain ${chainId}`);
    runtime.log(`[Chainlink] DEBUG: Feed Address: ${feedAddress}`);

    try {
        const evmClient = new cre.capabilities.EVMClient(BigInt(chainId));
        runtime.log(`[Chainlink] DEBUG: EVMClient initialized`);

        runtime.log(`[Chainlink] Calling latestRoundData...`);
        const latestDataResp = evmClient
            .callContract(runtime, {
                call: encodeCallMsg({
                    from: "0x0000000000000000000000000000000000000000",
                    to: feedAddress as Address,
                    data: AGGREGATOR_V3_ABI_SELECTORS.latestRoundData as any,
                }),
                blockNumber: LAST_FINALIZED_BLOCK_NUMBER as any,
            })
            .result();

        runtime.log(`[Chainlink] DEBUG: latestRoundData response received, length: ${latestDataResp.data?.length}`);

        runtime.log(`[Chainlink] Calling decimals...`);
        const decimalsResp = evmClient
            .callContract(runtime, {
                call: encodeCallMsg({
                    from: "0x0000000000000000000000000000000000000000",
                    to: feedAddress as Address,
                    data: AGGREGATOR_V3_ABI_SELECTORS.decimals as any,
                }),
                blockNumber: LAST_FINALIZED_BLOCK_NUMBER as any,
            })
            .result();

        // Decode latestRoundData body: (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
        const body = latestDataResp.data;
        const answer = bytesToBigint(body.slice(32, 64));
        const updatedAt = bytesToBigint(body.slice(96, 128));

        // Decode decimals body: (uint8)
        const decimals = bytesToBigint(decimalsResp.data);

        const price = Number(answer) / Math.pow(10, Number(decimals));
        runtime.log(`[Chainlink] Price: ${price}`);

        return {
            price,
            updatedAt: Number(updatedAt) * 1000,
            pair,
            chainId,
        };
    } catch (e: any) {
        runtime.log(`[Chainlink] Error: ${e?.message || e || 'Unknown error'}`);
        return null;
    }
}
