import { createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';

const AGGREGATOR_V3_ABI = parseAbi([
    'function decimals() external view returns (uint8)',
    'function description() external view returns (string memory)',
    'function version() external view returns (uint256)',
    'function getRoundData(uint80 _roundId) external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
    'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
]);

// Chainlink Price Feed Addresses (Pair -> Aggregatorm - Mainnet)
const PRICE_FEEDS: Record<number, Record<string, `0x${string}`>> = {
    [1]: { // Ethereum
        'ETH/USD': '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
        'USDC/USD': '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6',
        'USDT/USD': '0x3E7d32EC1D2A478C8f395F762887640306E41974',
        'DAI/USD': '0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9',
        'LINK/USD': '0x2c1d072e956affC0D435Cb7AC38EF18d24d9127c',
        'WBTC/USD': '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
    },
    [base.id]: { // Base
        'ETH/USD': '0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70',
        'USDC/USD': '0x7e860098F58bBFC8648a4311b374B1D669a2bc6B',
        'LINK/USD': '0xbc6cc02052601ac3f2903bd8ed83ef1d23460df0',
        'WBTC/USD': '0x2a060f659631f604442c9da1682370213187ee19',
        'DAI/USD': '0x591e79239a7d679378eC8c847e5038150364C78F',
    },
    [137]: { // Polygon
        'ETH/USD': '0xF9680D99D6C9589e2a93a78A04A279e509205945',
        'MATIC/USD': '0xAB594600376Ec9fD91F8e885dADF0CE036862dE0',
        'USDC/USD': '0xfE4A4cc5b57ac781132e22Ee0EEc04c608fab2b5',
        'LINK/USD': '0xd9FF69Ab9f8a411227038C22221fb06786c5fFD3',
        'WBTC/USD': '0x09867566ca855B606e12e79603389146592231A8',
        'DAI/USD': '0x4746DeC9e833A82E32115A50962cf0C43076137a',
    },
    [42161]: { // Arbitrum
        'ETH/USD': '0x639Fe6ab55C939f4B61f22976be305a30e1ef38a',
        'USDC/USD': '0x50834F3163758fcC1Df9977b6e9190c335263C70',
        'LINK/USD': '0x86E530469A456247F15c38BcE81313463Ce858e7',
        'WBTC/USD': '0x4594A58253a693D4924A6e4E052044F49c9502b8',
        'DAI/USD': '0xcB79157C2CcaC807579848520B328E95fC240120',
    },
    [10]: { // Optimism
        'ETH/USD': '0x13e3F5531fa9900353051416e7BB769622d7a22E',
        'USDC/USD': '0x16a9FEaCfFa256372b34a6aeC23565A75454E825',
        'DAI/USD': '0x8dBa9A569bA7Cf953f63CF14af96041ec6A87B11',
    },
    [56]: { // BSC
        'ETH/USD': '0x9ef1B8c0E4F7dc8bF5719Ea496883DC6401d5b2e',
        'USDC/USD': '0x51597f405303C4D798cf67482974B377016C0841',
        'BNB/USD': '0x0567F2323251f0Aab15c8dFb1967E4E8A7D42aeE',
    },
    [43114]: { // Avalanche
        'ETH/USD': '0x976B3D034EaA7e57212019F45d652303037E0644',
        'AVAX/USD': '0x0A77230d17318075983913bC2145DB16C7366156',
        'USDC/USD': '0xF096872672F44d6EBA71458D74fe67F9a77a23B9',
    }
};

const RPC_URLS: Record<number, string> = {
    [1]: 'https://ethereum-rpc.publicnode.com',
    [base.id]: 'https://base-rpc.publicnode.com',
    [137]: 'https://polygon-bor-rpc.publicnode.com',
    [42161]: 'https://arbitrum-one-rpc.publicnode.com',
    [10]: 'https://optimism-rpc.publicnode.com',
    [56]: 'https://bsc-rpc.publicnode.com',
    [43114]: 'https://api.avax.network/ext/bc/C/rpc',
};

function normalizeSymbol(symbol: string): string {
    const s = symbol.toUpperCase().replace(/\.E$/, '');
    if (s === 'WETH') return 'ETH';
    if (s === 'WMATIC' || s === 'POL') return 'MATIC';
    if (s === 'WBNB') return 'BNB';
    if (s === 'WAVAX') return 'AVAX';
    if (s === 'AXLUSDC') return 'USDC';
    return s;
}

/**
 * Fetch price from Chainlink Price Feed aggregator.
 * @param symbol Token symbol (e.g. ETH, USDC, LINK)
 */
export async function getChainlinkPrice(symbol: string, chainId: number = base.id) {
    const normSymbol = normalizeSymbol(symbol);
    const pair = `${normSymbol}/USD`;
    const feedAddress = PRICE_FEEDS[chainId]?.[pair];

    if (!feedAddress) {
        console.warn(`No price feed for ${pair} on chain ${chainId}`);
        return null;
    }

    const rpcUrl = RPC_URLS[chainId];
    if (!rpcUrl) {
        console.warn(`No RPC URL for chain ${chainId}`);
        return null;
    }

    const client = createPublicClient({
        transport: http(rpcUrl),
    });

    try {
        const data = await client.readContract({
            address: feedAddress,
            abi: AGGREGATOR_V3_ABI,
            functionName: 'latestRoundData',
        });

        const decimals = await client.readContract({
            address: feedAddress,
            abi: AGGREGATOR_V3_ABI,
            functionName: 'decimals',
        });

        const price = Number(data[1]) / Math.pow(10, decimals);
        return {
            price,
            updatedAt: Number(data[3]) * 1000, // to ms
            pair,
            chainId,
        };
    } catch (error) {
        console.error(`Error fetching Chainlink price for ${pair} on chain ${chainId}:`, error);
        return null;
    }
}
