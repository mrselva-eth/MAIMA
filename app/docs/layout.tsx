import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Docs | MAIMA',
  description: 'MAIMA documentation: getting started, API reference, Chainlink CRE.',
};

export default function DocsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
