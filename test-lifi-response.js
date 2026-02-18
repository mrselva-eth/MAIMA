
const runTest = async () => {
  try {
    const payload = {
      fromChainId: 137, // Polygon
      toChainId: 100,   // Gnosis
      fromTokenAddress: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC
      toTokenAddress: '0xDDAfbb505ad214D7b80b1f9d5127b907b572965b', // USDC
      fromAmount: '1000000', // 1 USDC
      fromAddress: '0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0'
    };

    console.log('Fetching quote via fetch...');
    // Note: The endpoint is correct as per LI.FI docs: https://li.quest/v1/advanced/routes
    const response = await fetch('https://li.quest/v1/advanced/routes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${text}`);
    }

    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      // Check multiple routes to see if duration varies
      data.routes.slice(0, 3).forEach((route, i) => {
        console.log(`\n--- ROUTE ${i} DATA ---`);
        console.log('Tool:', route.steps[0].toolDetails.key);
        console.log('Duration (root):', route.duration);
        console.log('Step Est Duration:', route.steps[0].estimate?.executionDuration);
      });
    } else {
      console.log('No routes found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
};

runTest();
