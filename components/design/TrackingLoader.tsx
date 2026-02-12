'use client';

import React from 'react';
import styles from './TrackingLoader.module.css';

export function TrackingLoader() {
  return (
    <div className={styles.root} style={{ ['--twl-color' as string]: '#1e40af' }}>
      <div>
        <div className={styles.loader}>
          <span>
            <span />
            <span />
            <span />
            <span />
          </span>
          <div className={styles.base}>
            <span />
            <div className={styles.face} />
          </div>
        </div>
        <div className={styles.longfazers}>
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

export default TrackingLoader;
