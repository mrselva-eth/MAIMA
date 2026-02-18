const { getChainlinkPrice } = require('./lib/chainlink-oracle');

async function testToken(symbol, chainId) {
    try {
        const data = await getChainlinkPrice(symbol, chainId);
        console.log(`[${chainId === 8453 ? 'Base' : 'Sepolia'}] ${symbol}:`, data ? `$${data.price}` : 'Failed');
    } catch (e) {
        console.log(`[${chainId === 8453 ? 'Base' : 'Sepolia'}] ${symbol}: Error - ${e.message}`);
    }
}

async function test() {
    console.log('--- Testing Expanded Chainlink Price Feeds ---');

    console.log('\nTesting Base Mainnet (8453):');
    await testToken('ETH', 8453);
    await testToken('USDC', 8453);
    await testToken('LINK', 8453);
    await testToken('WBTC', 8453);
    await testToken('DAI', 8453);

    console.log('\nTesting Sepolia Testnet (11155111):');
    await testToken('ETH', 11155111);
    await testToken('USDC', 11155111);
    await testToken('LINK', 11155111);
    await testToken('WBTC', 11155111);
    await testToken('DAI', 11155111);
}

test();
