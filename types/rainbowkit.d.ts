import '@rainbow-me/rainbowkit';
import type { ReactNode } from 'react';

declare module '@rainbow-me/rainbowkit' {
  export interface ConnectButtonCustomRenderProps {
    account?: {
      address: string;
      displayName: string;
      ensAvatar?: string;
    };
    chain?: { id: number; name?: string };
    mounted: boolean;
    openConnectModal: () => void;
  }

  export const ConnectButton: {
    Custom: (props: {
      children: (props: ConnectButtonCustomRenderProps) => ReactNode;
    }) => ReactNode;
  };
}
