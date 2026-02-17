'use client';

import Image from 'next/image';
import type { AnalyzeReport } from '@/lib/maima-types';
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
          <p className="mt-2 text-muted-foreground">No routes found.</p>
        )}
      </div>

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
        </div>
      ) : null}
    </div>
  );
}

