'use client';

import Image from 'next/image';
import type { AnalyzeReport } from '@/lib/maima';
import { useProtocolLogos } from '@/hooks/use-protocol-logos';
import ReportProtocolChart from '@/components/app/ReportProtocolChart';

type FinalResultLike = {
  protocol: string;
  pair: string;
  fee: string;
  inputAmount: string;
  outputAmount: string;
  txHash: string;
  approvalHash: string;
  accuracy?: string;
  executionVerifiedPrices?: { symbol: string; price: string }[];
};

type ReportCardProps = {
  report: AnalyzeReport;
  executionPending?: boolean;
  result?: FinalResultLike | null;
};

function detectReportType(report: AnalyzeReport): 'swap' | 'bridge' {
  const workflowHint = report.workflow?.[0]?.details?.toLowerCase() ?? '';
  const inferredTypeFromWorkflow = workflowHint.includes('bridge')
    ? 'bridge'
    : workflowHint.includes('swap')
      ? 'swap'
      : null;
  return (
    report.intentType ??
    inferredTypeFromWorkflow ??
    report.bestRoute?.type ??
    (report.topBridges.length > 0 && report.topSwaps.length === 0 ? 'bridge' : 'swap')
  );
}

export default function ReportCard({ report, executionPending, result }: ReportCardProps) {
  const { getLogoUrl } = useProtocolLogos();
  const reportType = detectReportType(report);
  const primaryProtocols = reportType === 'bridge' ? report.topBridges : report.topSwaps;

  return (
    <div className="mt-3 pt-3 border-t border-gray-200/80 space-y-3 text-xs">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="rounded-lg border border-gray-200 bg-white px-2.5 py-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Accuracy</p>
          <p className="mt-0.5 font-semibold text-foreground">{report.accuracy}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-2.5 py-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Gas (est.)</p>
          <p className="mt-0.5 font-semibold text-foreground">{report.gasFeeEstimate}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-2.5 py-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Optimistic</p>
          <p className="mt-0.5 font-semibold text-foreground">{report.optimisticEstimate}</p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-foreground">
            {reportType === 'bridge' ? 'Top bridges' : 'Top swaps'}
          </p>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {reportType}
          </span>
        </div>
        {primaryProtocols.length ? (
          <div className="mt-2 grid grid-cols-1 gap-1.5">
            {primaryProtocols.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-2 py-1.5">
                <span className="flex items-center gap-2 min-h-[24px] text-foreground">
                  <span className="w-5 h-5 shrink-0 rounded overflow-hidden bg-white border border-gray-200 flex items-center justify-center">
                    {getLogoUrl(item.name) ? (
                      <Image
                        src={getLogoUrl(item.name)!}
                        alt=""
                        width={20}
                        height={20}
                        className="w-full h-full object-contain"
                        unoptimized
                      />
                    ) : null}
                  </span>
                  <span>{item.name}</span>
                </span>
                <span className="text-[11px] text-muted-foreground">{item.score}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 p-3 rounded-lg border border-red-200 bg-red-50 flex items-start gap-2">
            <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex flex-col">
              <p className="text-sm font-semibold text-red-700">No Routes Available</p>
              <p className="mt-1 text-xs text-red-600/90">{report.summary || 'We could not find any live routes or quotes for your request.'}</p>
            </div>
          </div>
        )}
      </div>

      {report.chainlink?.prices?.length ? (
        <div className="rounded-lg border border-gray-200 bg-white p-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-medium text-foreground">Verified price feeds</p>
            <span className="text-[10px] uppercase tracking-wide text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">
              Chainlink Oracle
            </span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {report.chainlink.prices.map((p, i) => (
              <div key={i} className="flex items-center justify-between rounded-md border border-blue-100 bg-blue-50/30 px-2 py-1.5">
                <span className="font-semibold text-blue-900">{p.symbol}</span>
                <div className="flex flex-col items-end">
                  <span className="text-foreground font-mono">{p.price}</span>
                  {p.updatedAt ? (
                    <span className="text-[9px] text-muted-foreground">
                      Updated: {new Date(p.updatedAt).toLocaleTimeString()}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {report.workflow?.length ? (
        <div className="rounded-lg border border-gray-200 bg-white p-2.5 space-y-2">
          <p className="font-medium text-foreground">Workflow report</p>
          <div className="space-y-1 text-muted-foreground">
            {report.workflow.map((step, i) => (
              <p key={i}>
                {i + 1}. {step.name} ({step.status.toUpperCase()}) - {step.details}
              </p>
            ))}
          </div>
          {report.selectionReason ? (
            <p className="text-muted-foreground">Why this protocol: {report.selectionReason}</p>
          ) : null}
        </div>
      ) : null}

      {report.ranking?.length ? (
        <div className="rounded-lg border border-gray-200 bg-white p-2.5 space-y-2">
          <p className="font-medium text-foreground">Protocol ranking chart</p>
          <ReportProtocolChart ranking={report.ranking} />
        </div>
      ) : null}

      {executionPending && !result ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4 flex flex-col items-center gap-2">
          <Image
            src="/images/logo.png"
            alt=""
            width={48}
            height={48}
            className="animate-pulse opacity-80 object-contain"
            unoptimized
          />
          <p className="text-xs text-muted-foreground">Execution in progress...</p>
        </div>
      ) : result ? (
        <div className="rounded-lg border border-gray-200 bg-white p-2.5 space-y-1.5">
          <p className="font-medium text-foreground">Final execution</p>
          <p className="flex items-center gap-2">
            <strong>Protocol:</strong>
            <span className="w-6 h-6 shrink-0 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
              {getLogoUrl(result.protocol) ? (
                <Image
                  src={getLogoUrl(result.protocol)!}
                  alt=""
                  width={24}
                  height={24}
                  className="w-full h-full object-contain"
                  unoptimized
                />
              ) : null}
            </span>
            <span>{result.protocol}</span>
          </p>
          <p><strong>Pair:</strong> {result.pair}</p>
          <p><strong>Fee:</strong> {result.fee}</p>
          <p><strong>Input:</strong> {result.inputAmount} {'->'} <strong>Output:</strong> {result.outputAmount}</p>
          <p className="break-all"><strong>Tx:</strong> {result.txHash}</p>
          <p className="break-all"><strong>Approval:</strong> {result.approvalHash}</p>
          {result.executionVerifiedPrices && (
            <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col gap-1.5">
              <p className="text-[10px] uppercase font-bold text-blue-600 tracking-tight">Final Oracle Verification</p>
              <div className="grid grid-cols-2 gap-2">
                {result.executionVerifiedPrices.map((p, i) => (
                  <div key={i} className="flex items-center justify-between rounded bg-blue-50/50 px-2 py-1 border border-blue-100/50">
                    <span className="font-bold text-blue-900">{p.symbol}</span>
                    <span className="font-mono text-foreground">{p.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      <div className="mt-2 py-1.5 px-3 rounded-md bg-blue-50/50 border border-blue-100 flex items-start gap-2">
        <div className="mt-0.5 p-0.5 rounded-full bg-blue-500 text-white flex-shrink-0">
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-[10px] leading-relaxed text-blue-800/80 font-medium">
          <strong>Note:</strong> Route data and price feeds are live, but the execution process is currently simulated via Chainlink CRE.
        </p>
      </div>
    </div>
  );
}

