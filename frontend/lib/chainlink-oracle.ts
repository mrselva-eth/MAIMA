import { createPublicClient, http, parseAbi } from 'viem';
import { base, sepolia } from 'viem/chains';

const AGGREGATOR_V3_ABI = parseAbi([
    'function decimals() external view returns (uint8)',
    'function description() external view returns (string memory)',
    'function version() external view returns (uint256)',
    'function getRoundData(uint80 _roundId) external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
    'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
]);

// Chainlink Price Feed Addresses (Pair -> Aggregator)
const PRICE_FEEDS: Record<number, Record<string, `0x${string}`>> = {
    [base.id]: {
        'ETH/USD': '0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70',
        'USDC/USD': '0x7e860098F58bBFC8648a4311b374B1D669a2bc6B',
        'LINK/USD': '0xbc6cc02052601ac3f2903bd8ed83ef1d23460df0',
        'WBTC/USD': '0x2a060f659631f604442c9da1682370213187ee19',
        'DAI/USD': '0x591e79239a7d679378eC8c847e5038150364C78F',
    },
    [sepolia.id]: {
        'ETH/USD': '0x694AA1769357215DE4FAC081bf1f309aDC325306',
        'USDC/USD': '0x7e86095690bE0d611b43936F023363321bc6BC6B',
        'LINK/USD': '0xc59E3574594C1593F6c7606196EE4F0A92215712',
        'WBTC/USD': '0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43',
        'DAI/USD': '0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9',
    },
};

const RPC_URLS: Record<number, string> = {
    [base.id]: 'https://mainnet.base.org',
    [sepolia.id]: 'https://rpc.ankr.com/eth_sepolia',
};

/**
 * Fetch price from Chainlink Price Feed aggregator.
 * @param symbol Token symbol (e.g. ETH, USDC, LINK)
 */
export async function getChainlinkPrice(symbol: string, chainId: number = base.id) {
    const pair = `${symbol.toUpperCase()}/USD`;
    const feedAddress = PRICE_FEEDS[chainId]?.[pair];
    if (!feedAddress) {
        throw new Error(`No price feed for ${pair} on chain ${chainId}`);
    }

    const client = createPublicClient({
        chain: chainId === base.id ? base : sepolia,
        transport: http(RPC_URLS[chainId]),
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
        console.error(`Error fetching Chainlink price for ${pair}:`, error);
        return null;
    }
}
