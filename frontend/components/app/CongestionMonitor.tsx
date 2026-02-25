'use client';

import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

type CongestionData = {
    chainId: string;
    blockNumber: number;
    baseFee: string;
    utilization: number;
    status: string;
    color: string;
    timestamp: number;
};

export default function CongestionMonitor() {
    const [data, setData] = useState<CongestionData | null>(null);

    useEffect(() => {
        const fetchCongestion = async () => {
            try {
                const res = await fetch('/api/maima?action=congestion&chainId=8453');
                const json = await res.json();
                if (json.success && json.data) {
                    setData(json.data);
                }
            } catch (e) {
                // Silently fail
            }
        };

        fetchCongestion();
        const interval = setInterval(fetchCongestion, 10000);
        return () => clearInterval(interval);
    }, []);

    if (!data) return null;

    const colorMap = {
        Green: { bg: 'bg-green-500', text: 'text-green-700', fade: 'bg-green-50', border: 'border-green-200' },
        Yellow: { bg: 'bg-yellow-500', text: 'text-yellow-700', fade: 'bg-yellow-50', border: 'border-yellow-200' },
        Red: { bg: 'bg-red-500', text: 'text-red-700', fade: 'bg-red-50', border: 'border-red-200' },
    };

    const theme = colorMap[data.color as keyof typeof colorMap] || colorMap.Green;

    return (
        <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${theme.fade} ${theme.text} border ${theme.border} shadow-sm animate-in fade-in zoom-in duration-300`}
            title={`Block: ${data.blockNumber} | Base Fee: ${data.baseFee}`}
        >
            <div className="relative flex h-2 w-2">
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${theme.bg} opacity-20`} />
                <span className={`relative inline-flex h-2 w-2 rounded-full ${theme.bg}`} />
            </div>
            <span className="uppercase tracking-tight whitespace-nowrap">
                {data.status.replace(' Congestion', '')}
            </span>
            <Activity className="h-3 w-3 opacity-50" />
        </div>
    );
}
