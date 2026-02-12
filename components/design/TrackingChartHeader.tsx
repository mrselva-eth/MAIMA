'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from './TrackingChartHeader.module.css';

const STROKE_COLOR = '#60a5fa'; /* single color so both path segments match */

const WIDTH = 320;
const HEIGHT = 48;

/** One smooth wave period; start Y = end Y for seamless loop. */
function buildWavePath(): string {
  const steps = 50;
  const midY = HEIGHT / 2;
  const amp = HEIGHT * 0.32;
  const points: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = t * WIDTH;
    const y = midY + Math.sin(t * Math.PI * 2) * amp;
    points.push([x, y]);
  }
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ');
}

export function TrackingChartHeader() {
  const pathD = React.useMemo(() => buildWavePath(), []);

  return (
    <div className={styles.chartWrap} aria-hidden>
      <svg
        className="w-full h-full"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
      >
        <motion.g
          initial={{ x: 0 }}
          animate={{ x: -WIDTH }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'loop',
            ease: 'linear',
          }}
          style={{ opacity: 0.5 }}
        >
          <path
            d={pathD}
            fill="none"
            stroke={STROKE_COLOR}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={pathD}
            fill="none"
            stroke={STROKE_COLOR}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            transform={`translate(${WIDTH}, 0)`}
          />
        </motion.g>
      </svg>
    </div>
  );
}

export default TrackingChartHeader;
