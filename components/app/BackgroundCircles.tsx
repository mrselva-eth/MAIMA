'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Theme blue #1e40af for circle arcs
const rgba = (o: number) => `rgba(30, 64, 175, ${o})`;

export interface BackgroundCirclesProps {
  className?: string;
}

export function BackgroundCircles({ className }: BackgroundCirclesProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 flex items-center justify-center overflow-hidden bg-white',
        className,
      )}
    >
      {/* Center glow - scales with viewport */}
      <div
        className="absolute rounded-full bg-[#1e40af]/25 blur-[120px]"
        style={{
          width: 'min(60vw, 60vh)',
          height: 'min(60vw, 60vh)',
        }}
      />

      {/* Circles container - scales with viewport */}
      <div className="relative h-full w-full">
        {/* Circle 1 - smallest with gradient arc */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
          style={{
            width: 'min(20vw, 20vh)',
            height: 'min(20vw, 20vh)',
            background: `conic-gradient(from 0deg, transparent 0deg, ${rgba(0.65)} 60deg, transparent 120deg, transparent 360deg)`,
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px))',
            WebkitMask:
              'radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px))',
          }}
        />

        {/* Circle 2 with dashed effect */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 18, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
          style={{
            width: 'min(35vw, 35vh)',
            height: 'min(35vw, 35vh)',
            background: `conic-gradient(from 180deg, ${rgba(0.55)} 0deg, transparent 40deg, transparent 90deg, ${rgba(0.45)} 130deg, transparent 170deg, transparent 270deg, ${rgba(0.35)} 310deg, transparent 350deg)`,
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px))',
            WebkitMask:
              'radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px))',
          }}
        />

        {/* Circle 3 with arc */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
          style={{
            width: 'min(50vw, 50vh)',
            height: 'min(50vw, 50vh)',
            background: `conic-gradient(from 90deg, transparent 0deg, ${rgba(0.5)} 30deg, ${rgba(0.7)} 60deg, transparent 90deg, transparent 180deg, ${rgba(0.45)} 210deg, transparent 240deg, transparent 360deg)`,
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px))',
            WebkitMask:
              'radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px))',
          }}
        />

        {/* Circle 4 */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
          style={{
            width: 'min(65vw, 65vh)',
            height: 'min(65vw, 65vh)',
            background: `conic-gradient(from 270deg, ${rgba(0.45)} 0deg, transparent 50deg, transparent 120deg, ${rgba(0.35)} 150deg, transparent 200deg, transparent 300deg, ${rgba(0.4)} 330deg, transparent 360deg)`,
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 1px), black calc(100% - 1px))',
            WebkitMask:
              'radial-gradient(farthest-side, transparent calc(100% - 1px), black calc(100% - 1px))',
          }}
        />

        {/* Circle 5 - largest with subtle arc */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 35, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
          style={{
            width: 'min(80vw, 80vh)',
            height: 'min(80vw, 80vh)',
            background: `conic-gradient(from 0deg, ${rgba(0.35)} 0deg, transparent 30deg, transparent 180deg, ${rgba(0.3)} 200deg, transparent 230deg, transparent 360deg)`,
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 1px), black calc(100% - 1px))',
            WebkitMask:
              'radial-gradient(farthest-side, transparent calc(100% - 1px), black calc(100% - 1px))',
          }}
        />
      </div>

      {/* Vignette - light so circles stay visible */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at center, transparent 0%, transparent 50%, rgba(255,255,255,0.3) 80%, rgba(255,255,255,0.5) 100%)',
        }}
      />
    </div>
  );
}

export default BackgroundCircles;
