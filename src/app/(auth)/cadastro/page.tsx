import React, { Suspense } from 'react';
import { AuthPortalView } from '@/components/auth/AuthPortalView';

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center font-body-md text-on-surface-variant">
          Carregando cadastro do Passe Dourado...
        </div>
      }
    >
      <AuthPortalView initialTab="register" />
    </Suspense>
  );
}
