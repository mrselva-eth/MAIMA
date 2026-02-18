import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'App | MAIMA',
  description: 'Chat interface for swap and bridge requests. Get reports and process tracking.',
};

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
