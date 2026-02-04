export const THEME_COLOR = '#1e40af';

export type IntentStatus = 'active' | 'pending' | 'executed' | 'expired';

export interface Intent {
  id: string;
  type: string;
  description: string;
  status: IntentStatus;
  createdAt: string;
}

export const STATUS_CONFIG: Record<IntentStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  executed: { label: 'Executed', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  expired: { label: 'Expired', className: 'bg-gray-100 text-gray-600 border-gray-200' },
};
