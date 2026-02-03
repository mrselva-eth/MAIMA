'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface IntentBuilderProps {
  fullWidth?: boolean
}

export function IntentBuilder({ fullWidth = false }: IntentBuilderProps) {
  const [intentText, setIntentText] = useState('')
  const [selectedType, setSelectedType] = useState<'swap' | 'stake' | 'yield' | 'custom'>('swap')

  const intentTypes = [
    { id: 'swap', label: 'Token Swap', icon: '⇄' },
    { id: 'stake', label: 'Stake', icon: '📌' },
    { id: 'yield', label: 'Yield Farm', icon: '🌾' },
    { id: 'custom', label: 'Custom', icon: '⚙️' },
  ]

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>Create Intent</CardTitle>
        <CardDescription>Define your automated execution strategy</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Intent Type Selection */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">Intent Type</label>
          <div className={`grid grid-cols-2 gap-3 ${!fullWidth && 'md:grid-cols-2'}`}>
            {intentTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id as any)}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  selectedType === type.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-secondary text-foreground hover:border-accent'
                }`}
              >
                <span className="text-lg mr-2">{type.icon}</span>
                <span className="text-sm">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Intent Description */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            {selectedType === 'custom' ? 'Intent Description' : 'Execution Conditions'}
          </label>
          <textarea
            value={intentText}
            onChange={(e) => setIntentText(e.target.value)}
            placeholder={
              selectedType === 'swap'
                ? 'e.g., Swap 10 ETH for USDC when price is above $2500'
                : selectedType === 'stake'
                  ? 'e.g., Stake 50 ETH in Lido when APY exceeds 3%'
                  : 'e.g., Auto-compound yield rewards daily'
            }
            className="w-full p-3 rounded-lg bg-secondary border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-24"
          />
        </div>

        {/* Parameters */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Min Amount</label>
            <input
              type="number"
              placeholder="0.00"
              className="w-full p-2 rounded-lg bg-secondary border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Max Slippage</label>
            <input
              type="number"
              placeholder="0.5"
              className="w-full p-2 rounded-lg bg-secondary border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Execution Settings */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">Execution Trigger</label>
          <div className="grid grid-cols-3 gap-2">
            {['Cron', 'HTTP', 'Event'].map((trigger) => (
              <button
                key={trigger}
                className="p-2 rounded-lg bg-secondary border border-border text-foreground hover:border-accent transition-colors text-sm"
              >
                {trigger}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
            Create Intent
          </Button>
          <Button variant="outline" className="flex-1 border-border hover:bg-secondary bg-transparent">
            Preview
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
