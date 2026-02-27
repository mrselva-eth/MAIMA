import { createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';

const AGGREGATOR_V3_ABI = parseAbi([
    'function decimals() external view returns (uint8)',
    'function description() external view returns (string memory)',
    'function version() external view returns (uint256)',
    'function getRoundData(uint80 _roundId) external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
    'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
]);

// Dynamic feed cache: chainId -> { 'ETH/USD': address }
const feedCache: Record<number, Record<string, `0x${string}`>> = {};

const RDD_URLS: Record<number, string> = {
    [1]: 'https://reference-data-directory.vercel.app/feeds-mainnet.json',
    [base.id]: 'https://reference-data-directory.vercel.app/feeds-ethereum-mainnet-base-1.json',
    [137]: 'https://reference-data-directory.vercel.app/feeds-matic-mainnet.json',
    [42161]: 'https://reference-data-directory.vercel.app/feeds-arbitrum-mainnet.json',
    [10]: 'https://reference-data-directory.vercel.app/feeds-ethereum-mainnet-optimism-1.json',
    [56]: 'https://reference-data-directory.vercel.app/feeds-bsc-mainnet.json',
    [43114]: 'https://reference-data-directory.vercel.app/feeds-avalanche-mainnet.json',
};

async function getFeeds(chainId: number): Promise<Record<string, `0x${string}`>> {
    if (feedCache[chainId]) return feedCache[chainId];

    const url = RDD_URLS[chainId];
    if (!url) {
        console.warn(`No RDD URL for chain ${chainId}`);
        return {};
    }

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const feeds: Record<string, `0x${string}`> = {};
        for (const item of data) {
            if (item.proxyAddress && item.name) {
                // Normalize 'ETH / USD' to 'ETH/USD'
                const normalizedName = item.name.replace(/\s+/g, '').toUpperCase();
                feeds[normalizedName] = item.proxyAddress;
            }
        }
        feedCache[chainId] = feeds;
        return feeds;
    } catch (error) {
        console.error(`Error fetching RDD for chain ${chainId}:`, error);
        return {};
    }
}

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

    // Dynamically fetch and cache feeds for this chain
    const feeds = await getFeeds(chainId);
    const feedAddress = feeds[pair];

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
