'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const balanceData = [
  { name: 'Jan', assets: 45000, intents: 24000 },
  { name: 'Feb', assets: 52000, intents: 28000 },
  { name: 'Mar', assets: 48000, intents: 22000 },
  { name: 'Apr', assets: 61000, intents: 35000 },
  { name: 'May', assets: 55000, intents: 31000 },
  { name: 'Jun', assets: 67000, intents: 42000 },
]

export function WalletOverview() {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>Wallet Overview</CardTitle>
        <CardDescription>Assets managed by Intent Wallet</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-secondary">
            <p className="text-xs text-muted-foreground mb-1">Total Assets</p>
            <p className="text-2xl font-bold text-primary">$67.2K</p>
            <p className="text-xs text-green-500 mt-1">↑ 12% from last month</p>
          </div>
          <div className="p-4 rounded-lg bg-secondary">
            <p className="text-xs text-muted-foreground mb-1">Active Intents</p>
            <p className="text-2xl font-bold text-accent">8</p>
            <p className="text-xs text-muted-foreground mt-1">3 pending execution</p>
          </div>
          <div className="p-4 rounded-lg bg-secondary">
            <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
            <p className="text-2xl font-bold text-green-500">98.5%</p>
            <p className="text-xs text-muted-foreground mt-1">Past 30 days</p>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={balanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                }}
                labelStyle={{ color: 'var(--foreground)' }}
              />
              <Legend />
              <Bar dataKey="assets" fill="var(--primary)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="intents" fill="var(--accent)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
