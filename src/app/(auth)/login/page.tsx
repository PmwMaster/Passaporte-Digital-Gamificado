'use client';

import React, { Suspense } from 'react';
import { AuthPortalView } from '@/components/auth/AuthPortalView';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center font-body-md text-on-surface-variant">
          Carregando Passaporte Capim Dourado...
        </div>
      }
    >
      <AuthPortalView initialTab="login" />
    </Suspense>
  );
}
