import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | Superteam Academy',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
