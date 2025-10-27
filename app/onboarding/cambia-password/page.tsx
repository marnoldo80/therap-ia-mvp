import { Suspense } from 'react';
import Client from './Client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Caricamento…</div>}>
      <Client />
    </Suspense>
  );
}
