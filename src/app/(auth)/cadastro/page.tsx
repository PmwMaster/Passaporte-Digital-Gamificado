'use client';

import React, { Suspense } from 'react';
import { AuthPortalView } from '@/components/auth/AuthPortalView';

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center font-body-md text-on-surface-variant">
          Carregando cadastro do Passaporte Capim Dourado...
        </div>
      }
    >
      <AuthPortalView initialTab="register" />
    </Suspense>
  );
}
