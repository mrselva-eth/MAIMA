async function test() {
    const resp = await fetch('http://127.0.0.1:3000/api/maima', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'quote',
            payload: { fromChainId: 8453, toChainId: 42161, fromTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', toTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', fromAmount: '1000000000000000000', fromAddress: '0x1234567890123456789012345678901234567890' }
        })
    });
    console.log('Status:', resp.status);
    console.log('Body:', await resp.json());
}
test();
