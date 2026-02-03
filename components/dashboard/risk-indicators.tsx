'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const riskMetrics = [
  { label: 'Protocol Risk', value: 'Low', color: 'text-green-500', bg: 'bg-green-500/10' },
  { label: 'Smart Contract', value: 'Audited', color: 'text-green-500', bg: 'bg-green-500/10' },
  { label: 'Gas Price', value: 'Moderate', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  { label: 'Slippage Risk', value: 'Low', color: 'text-green-500', bg: 'bg-green-500/10' },
  { label: 'Liquidity', value: 'High', color: 'text-green-500', bg: 'bg-green-500/10' },
  { label: 'Price Impact', value: '0.12%', color: 'text-green-500', bg: 'bg-green-500/10' },
]

export function RiskIndicators() {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>Risk Assessment</CardTitle>
        <CardDescription>Real-time safety metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-accent/30">
          <p className="text-sm text-muted-foreground mb-1">Overall Risk Level</p>
          <p className="text-2xl font-bold text-accent">Safe</p>
          <div className="mt-3 h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div className="h-full w-1/4 bg-green-500 rounded-full" />
          </div>
        </div>

        <div className="space-y-2">
          {riskMetrics.map((metric, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-secondary">
              <span className="text-sm text-muted-foreground">{metric.label}</span>
              <span className={`text-sm font-medium px-2 py-1 rounded ${metric.bg} ${metric.color}`}>
                {metric.value}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Safety Checks</p>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-foreground">Amount within safe limits</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-foreground">Recipient whitelisted</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-foreground">Time lock active</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
