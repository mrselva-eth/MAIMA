import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function DashboardHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
            Ξ
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Intent Wallet</h1>
            <p className="text-xs text-muted-foreground">Chainlink CRE Orchestration</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm text-secondary-foreground">Sepolia Testnet</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="border-border hover:bg-secondary bg-transparent"
          >
            Connect Wallet
          </Button>
        </div>
      </div>
    </header>
  )
}
