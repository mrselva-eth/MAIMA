const { getChainlinkPrice } = require('./lib/chainlink-oracle');

async function testToken(symbol, chainId) {
    try {
        const data = await getChainlinkPrice(symbol, chainId);
        console.log(`[Base] ${symbol}:`, data ? `$${data.price}` : 'Failed');
    } catch (e) {
        console.log(`[Base] ${symbol}: Error - ${e.message}`);
    }
}

async function test() {
    console.log('--- Testing Chainlink Price Feeds (Base Only) ---');

    await testToken('ETH', 8453);
    await testToken('USDC', 8453);
    await testToken('LINK', 8453);
    await testToken('WBTC', 8453);
    await testToken('DAI', 8453);
}

test();
