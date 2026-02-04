'use client';

import { Intent } from './constants';
import { IntentListItem } from './IntentListItem';

export interface IntentListProps {
  intents: Intent[];
}

export function IntentList({ intents }: IntentListProps) {
  return (
    <div className="space-y-1.5">
      {intents.map((intent) => (
        <IntentListItem key={intent.id} intent={intent} />
      ))}
    </div>
  );
}
