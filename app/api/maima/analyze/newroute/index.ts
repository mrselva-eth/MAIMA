import 'dotenv/config'
import readline from 'readline'
import {
  createConfig,
  getChains,
  getRoutes,
  executeRoute,
  type Route,
  type RoutesRequest,
} from '@lifi/sdk'

// ==================================================
// LI.FI CONFIG
// ==================================================
createConfig({
  integrator: 'terminal-intent-demo',
  apiKey: process.env.LIFI_API_KEY as string,
})

// ==================================================
// CONSTANTS
// ==================================================
const CHAINS = {
  BASE: 8453,
  ARBITRUM: 42161,
} as const

const TOKENS = {
  ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  BASE_USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
} as const

// ==================================================
// TERMINAL INPUT
// ==================================================
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const ask = (q: string): Promise<string> =>
  new Promise((res) => rl.question(q, res))

// ==================================================
// API CHECK
// ==================================================
async function checkLifiConnection(): Promise<void> {
  console.log('\n🔌 Checking LI.FI API connection...')
  const chains = await getChains()
  console.log(`✅ Connected | Supported chains: ${chains.length}\n`)
}

// ==================================================
// FETCH ROUTES
// ==================================================
async function fetchRoutes(
  params: RoutesRequest
): Promise<Route[]> {
  const result = await getRoutes({
    ...params,
    options: {
      slippage: 0.5,
      order: 'RECOMMENDED',
    },
  })

  return result.routes.slice(0, 3)
}

// ==================================================
// PRINT ROUTES
// ==================================================
function printRoutes(routes: Route[]): void {
  routes.forEach((route, i) => {
    const totalTime = route.steps.reduce(
      (sum, step) => sum + (step.estimate.executionDuration ?? 0),
      0
    )

    console.log(`\n🛣️  Route ${i + 1}`)
    console.log('--------------------------------')
    console.log('Tools:', route.steps.map(s => s.tool).join(' → '))
    console.log('To Amount:', route.toAmount)
    console.log('Gas Cost (USD):', route.gasCostUSD)
    console.log('Estimated Time (sec):', totalTime)
  })
}

// ==================================================
// EXECUTE ROUTE (TX DATA)
// ==================================================
async function executeSelectedRoute(route: Route): Promise<void> {
  console.log('\n🚀 Preparing transaction via LI.FI...\n')

  const execution = await executeRoute(route)

  console.log('✅ Transaction prepared')
  console.log('--------------------------------')
  console.log('To:', execution.transactionRequest.to)
  console.log('Data:', execution.transactionRequest.data)
  console.log('Value:', execution.transactionRequest.value)
  console.log('\n📝 Sign this transaction using a wallet')
}

// ==================================================
// MAIN FLOW
// ==================================================
async function main(): Promise<void> {
  await checkLifiConnection()

  const intent = await ask(
    `Choose intent:
1) Swap  - Base ETH → Base USDC
2) Swap  - Base USDC → Base ETH
3) Bridge - Base ETH → Arbitrum ETH
4) Bridge - Arbitrum ETH → Base ETH

Enter option (1–4): `
  )

  let routeParams: RoutesRequest

  switch (intent) {
    case '1':
      routeParams = {
        fromChainId: CHAINS.BASE,
        toChainId: CHAINS.BASE,
        fromTokenAddress: TOKENS.ETH,
        toTokenAddress: TOKENS.BASE_USDC,
        fromAmount: '100000000000000000',
      }
      break

    case '2':
      routeParams = {
        fromChainId: CHAINS.BASE,
        toChainId: CHAINS.BASE,
        fromTokenAddress: TOKENS.BASE_USDC,
        toTokenAddress: TOKENS.ETH,
        fromAmount: '1000000',
      }
      break

    case '3':
      routeParams = {
        fromChainId: CHAINS.BASE,
        toChainId: CHAINS.ARBITRUM,
        fromTokenAddress: TOKENS.ETH,
        toTokenAddress: TOKENS.ETH,
        fromAmount: '100000000000000000',
      }
      break

    case '4':
      routeParams = {
        fromChainId: CHAINS.ARBITRUM,
        toChainId: CHAINS.BASE,
        fromTokenAddress: TOKENS.ETH,
        toTokenAddress: TOKENS.ETH,
        fromAmount: '100000000000000000',
      }
      break

    default:
      console.log('❌ Invalid option')
      process.exit(1)
  }

  console.log('\n🔍 Fetching top routes from LI.FI...')
  const routes = await fetchRoutes(routeParams)

  printRoutes(routes)

  const choice = await ask('\nSelect route to execute (1 / 2 / 3): ')
  const selectedRoute = routes[Number(choice) - 1]

  if (!selectedRoute) {
    console.log('❌ Invalid route selection')
    process.exit(1)
  }

  await executeSelectedRoute(selectedRoute)
  rl.close()
}

// ==================================================
main().catch(console.error)
