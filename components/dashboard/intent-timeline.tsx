'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const timelineEvents = [
  {
    id: 1,
    timestamp: '2024-02-01 14:32 UTC',
    type: 'intent_created',
    title: 'Intent Created',
    description: 'Swap 10 ETH for USDC',
    status: 'completed',
    txHash: '0x1234...5678',
  },
  {
    id: 2,
    timestamp: '2024-02-01 14:35 UTC',
    type: 'intent_evaluated',
    title: 'Intent Evaluated',
    description: 'CRE workflow triggered - conditions not met',
    status: 'completed',
    txHash: null,
  },
  {
    id: 3,
    timestamp: '2024-02-01 15:00 UTC',
    type: 'condition_met',
    title: 'Condition Met',
    description: 'Price threshold reached - ready for execution',
    status: 'completed',
    txHash: null,
  },
  {
    id: 4,
    timestamp: '2024-02-01 15:02 UTC',
    type: 'multisig_initiated',
    title: 'Multisig Request',
    description: 'Awaiting 2 of 3 approvals',
    status: 'in_progress',
    txHash: null,
  },
  {
    id: 5,
    timestamp: '2024-02-01 15:05 UTC',
    type: 'multisig_signed',
    title: 'Signed',
    description: 'Signer: 0x1234...',
    status: 'completed',
    txHash: null,
  },
  {
    id: 6,
    timestamp: 'Pending',
    type: 'execution_pending',
    title: 'Awaiting Execution',
    description: 'Pending final signature',
    status: 'pending',
    txHash: null,
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-500/20 text-green-400'
    case 'in_progress':
      return 'bg-blue-500/20 text-blue-400'
    case 'pending':
      return 'bg-yellow-500/20 text-yellow-400'
    default:
      return 'bg-gray-500/20 text-gray-400'
  }
}

export function IntentTimeline() {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>Execution Timeline</CardTitle>
        <CardDescription>Recent intent lifecycle events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {timelineEvents.map((event, idx) => (
            <div key={event.id} className="flex gap-4">
              {/* Timeline Line */}
              <div className="flex flex-col items-center">
                <div className={`w-4 h-4 rounded-full ${getStatusColor(event.status)} border-2 border-card`} />
                {idx < timelineEvents.length - 1 && (
                  <div className="w-0.5 h-16 bg-border mt-2" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-medium text-foreground">{event.title}</h4>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getStatusColor(event.status)} border-current`}
                  >
                    {event.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-muted-foreground">{event.timestamp}</span>
                  {event.txHash && (
                    <a
                      href="#"
                      className="text-accent hover:text-primary transition-colors font-mono"
                    >
                      {event.txHash}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-8 pt-6 border-t border-border flex gap-3">
          <button className="flex-1 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors">
            Export Timeline
          </button>
          <button className="flex-1 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground font-medium transition-colors">
            View Details
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
