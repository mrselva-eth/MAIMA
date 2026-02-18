'use client';

import Image from 'next/image';
import type { AnalyzeReport } from '@/lib/maima-types';
import { useProtocolLogos } from '@/hooks/use-protocol-logos';

type ReportProtocolChartProps = {
  ranking: NonNullable<AnalyzeReport['ranking']>;
  limit?: number;
};

function reliabilityToScore(value?: string) {
  if (!value) return 0;
  const parsed = Number(value.replace('%', '').trim());
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(100, parsed));
}

function liquidityToScore(value?: string) {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized === 'high') return 100;
  if (normalized === 'medium') return 65;
  if (normalized === 'low') return 35;
  return 50;
}

export default function ReportProtocolChart({ ranking, limit = 5 }: ReportProtocolChartProps) {
  const { getLogoUrl } = useProtocolLogos();
  const rows = ranking.slice(0, limit);
  const fees = rows.map((r) => r.feeUSD ?? Number.POSITIVE_INFINITY);
  const times = rows.map((r) => r.executionDuration ?? Number.POSITIVE_INFINITY);
  const minFee = Math.min(...fees);
  const maxFee = Math.max(...fees);
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const feeRange = Math.max(0.0001, maxFee - minFee);
  const timeRange = Math.max(1, maxTime - minTime);

  return (
    <div className="space-y-2 text-muted-foreground">
      {rows.map((r) => {
        const fee = r.feeUSD ?? maxFee;
        const time = r.executionDuration ?? maxTime;
        const gasScore = Number.isFinite(fee) ? 100 - ((fee - minFee) / feeRange) * 100 : 0;
        const timeScore = Number.isFinite(time) ? 100 - ((time - minTime) / timeRange) * 100 : 0;
        const liqScore = liquidityToScore(r.liquidityScore);
        const relScore = reliabilityToScore(r.reliabilityScore);
        const overall = gasScore * 0.4 + timeScore * 0.25 + liqScore * 0.15 + relScore * 0.2;

        return (
          <div
            key={`${r.rank}-${r.protocol}`}
            className={`rounded-md border px-2 py-2 ${r.isSelected ? 'border-emerald-400/60 bg-emerald-500/10' : 'border-gray-200'}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-foreground flex items-center gap-2 min-h-[28px]">
                <span className="w-6 h-6 shrink-0 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                  {getLogoUrl(r.protocol) ? (
                    <Image
                      src={getLogoUrl(r.protocol)!}
                      alt=""
                      width={24}
                      height={24}
                      className="w-full h-full object-contain"
                      unoptimized
                    />
                  ) : null}
                </span>
                <span>{r.rank}. {r.protocol}</span>
              </span>
              <div className="text-right">
                <div className="text-[11px] font-semibold text-foreground">{overall.toFixed(1)} score</div>
                <div className="text-[9px] opacity-80">
                  {r.feeUSD !== null && r.feeUSD !== undefined ? `$${r.feeUSD.toFixed(2)}` : 'N/A'}
                  {r.executionDuration ? ` | ${Math.round(r.executionDuration)}s` : ''}
                </div>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-1 text-[10px]">
              <div className="rounded bg-gray-100 px-1.5 py-1">
                <div className="mb-0.5 text-[9px] text-gray-500">Gas</div>
                <div className="h-1.5 rounded bg-gray-200 overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${Math.max(5, Math.min(100, gasScore))}%` }} />
                </div>
              </div>
              <div className="rounded bg-gray-100 px-1.5 py-1">
                <div className="mb-0.5 text-[9px] text-gray-500">Time</div>
                <div className="h-1.5 rounded bg-gray-200 overflow-hidden">
                  <div className="h-full bg-cyan-500" style={{ width: `${Math.max(5, Math.min(100, timeScore))}%` }} />
                </div>
              </div>
              <div className="rounded bg-gray-100 px-1.5 py-1">
                <div className="mb-0.5 text-[9px] text-gray-500">Liquidity</div>
                <div className="h-1.5 rounded bg-gray-200 overflow-hidden">
                  <div className="h-full bg-violet-500" style={{ width: `${Math.max(5, Math.min(100, liqScore))}%` }} />
                </div>
              </div>
              <div className="rounded bg-gray-100 px-1.5 py-1">
                <div className="mb-0.5 text-[9px] text-gray-500">Reliability</div>
                <div className="h-1.5 rounded bg-gray-200 overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${Math.max(5, Math.min(100, relScore))}%` }} />
                </div>
              </div>
            </div>

            {r.reason ? <p className="mt-1 text-[11px] text-muted-foreground">{r.reason}</p> : null}
          </div>
        );
      })}
    </div>
  );
}

