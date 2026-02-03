/**
 * Workflow Trigger API
 * 
 * Orchestrates CRE Workflows:
 * - Intent Monitor (Cron)
 * - Intent Executor (HTTP/Events)
 * - Incident Handler (HTTP/Events)
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/workflows/trigger
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workflowType, intentId, data } = body

    if (!workflowType) {
      return NextResponse.json(
        { success: false, error: 'Missing workflowType' },
        { status: 400 }
      )
    }

    let result: any = {}

    switch (workflowType) {
      case 'monitor': {
        // Trigger Intent Monitor workflow
        result = await triggerMonitorWorkflow()
        break
      }

      case 'execute': {
        if (!intentId) {
          return NextResponse.json(
            { success: false, error: 'Missing intentId for execute' },
            { status: 400 }
          )
        }
        result = await triggerExecuteWorkflow(intentId)
        break
      }

      case 'incident': {
        if (!intentId || !data?.incidentType) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields for incident' },
            { status: 400 }
          )
        }
        result = await triggerIncidentWorkflow(intentId, data.incidentType, data)
        break
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown workflow type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      workflowType,
      result
    })
  } catch (error) {
    console.error('Workflow trigger error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to trigger workflow' },
      { status: 500 }
    )
  }
}

/**
 * Trigger Intent Monitor Workflow
 * Evaluates all active intents against current conditions
 */
async function triggerMonitorWorkflow(): Promise<any> {
  // In production: call Chainlink CRE endpoint
  // POST https://workflows.chainlink.dev/trigger/{workflowId}

  // Mock result
  return {
    status: 'triggered',
    intentsChecked: 2,
    conditionsMet: ['intent_001'],
    timestamp: Date.now()
  }
}

/**
 * Trigger Intent Executor Workflow
 * Executes a specific intent after approval
 */
async function triggerExecuteWorkflow(intentId: string): Promise<any> {
  // In production: call Chainlink CRE endpoint with HTTP trigger

  // Log execution attempt
  console.log(`[Workflow] Executing intent: ${intentId}`)

  // Mock result
  return {
    status: 'execution_initiated',
    intentId,
    txHash: `0x${Math.random().toString(16).slice(2)}`,
    timestamp: Date.now()
  }
}

/**
 * Trigger Incident Handler Workflow
 * Handles abnormal activity and triggers safety measures
 */
async function triggerIncidentWorkflow(
  intentId: string,
  incidentType: string,
  data: any
): Promise<any> {
  console.log(`[Workflow] Incident detected: ${incidentType} for intent ${intentId}`)

  // Determine action based on severity
  const severity = determineSeverity(incidentType, data)

  let action = 'alert'
  if (severity === 'critical') {
    action = 'freeze'
  } else if (severity === 'high') {
    action = 'pause'
  }

  return {
    status: 'incident_handled',
    incidentType,
    severity,
    action,
    timestamp: Date.now()
  }
}

/**
 * Helper: Determine incident severity
 */
function determineSeverity(
  type: string,
  data: any
): 'low' | 'medium' | 'high' | 'critical' {
  switch (type) {
    case 'price_anomaly':
      const priceChange = Math.abs(data.priceChange || 0)
      if (priceChange > 20) return 'critical'
      if (priceChange > 10) return 'high'
      return 'medium'

    case 'execution_failure':
      return data.retryAttempts > 3 ? 'high' : 'medium'

    case 'security_alert':
      return 'critical'

    case 'gas_spike':
      const multiplier = data.currentGasPrice / data.baselineGasPrice
      return multiplier > 3 ? 'high' : 'medium'

    default:
      return 'low'
  }
}

/**
 * GET /api/workflows/trigger - Health check
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'healthy',
    workflows: ['monitor', 'execute', 'incident'],
    timestamp: Date.now()
  })
}
