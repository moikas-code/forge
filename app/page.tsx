'use client'

import { AppLayout } from '@/components/layout/AppLayout';
import { LayoutErrorBoundary } from '@/components/layout/LayoutErrorBoundary';

export default function Home() {
  return (
    <LayoutErrorBoundary>
      <AppLayout />
    </LayoutErrorBoundary>
  );
}