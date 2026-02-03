'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const pendingApprovals = [
  {
    id: 1,
    intent: 'Swap 5 ETH to USDC',
    status: 'pending',
    approvals: 2,
    required: 3,
    signers: [
      { address: '0x1234...', approved: true },
      { address: '0x5678...', approved: true },
      { address: '0x9abc...', approved: false },
    ],
  },
  {
    id: 2,
    intent: 'Stake 10 ETH in Lido',
    status: 'pending',
    approvals: 1,
    required: 2,
    signers: [
      { address: '0xdef0...', approved: true },
      { address: '0x1111...', approved: false },
    ],
  },
]

export function MultisigPanel() {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>Multisig Approvals</CardTitle>
        <CardDescription>{pendingApprovals.length} pending approvals</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingApprovals.map((approval) => (
          <div
            key={approval.id}
            className="p-4 rounded-lg bg-secondary border border-border space-y-3"
          >
            <div className="flex items-start justify-between">
              <h4 className="font-medium text-foreground">{approval.intent}</h4>
              <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
                Pending
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Approvals</span>
                <span className="font-medium text-foreground">
                  {approval.approvals}/{approval.required}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-secondary border border-border overflow-hidden">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${(approval.approvals / approval.required) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              {approval.signers.map((signer, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{signer.address}</span>
                  <span
                    className={`px-2 py-1 rounded ${
                      signer.approved ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {signer.approved ? '✓ Signed' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <Button size="sm" className="flex-1 text-xs h-8 bg-primary hover:bg-primary/90">
                Approve
              </Button>
              <Button size="sm" variant="outline" className="flex-1 text-xs h-8 border-border bg-transparent">
                Reject
              </Button>
            </div>
          </div>
        ))}

        <Button variant="outline" className="w-full border-border hover:bg-secondary bg-transparent">
          View All
        </Button>
      </CardContent>
    </Card>
  )
}
