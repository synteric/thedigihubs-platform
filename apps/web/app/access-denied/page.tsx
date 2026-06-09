'use client';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Logo } from '../../components/brand';
import { Button, Card } from '../../components/ui';
import { dashboardFor, useSession } from '../../lib/session';

export default function AccessDeniedPage() {
  const { session } = useSession();
  const href = session ? dashboardFor(session) : '/login';

  return (
    <main className="grid min-h-screen place-items-center bg-[#F8FBFF] px-6 text-[#0B1744]">
      <Card className="max-w-xl p-8 text-center">
        <div className="mx-auto mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-50 text-red-600">
          <ShieldAlert size={30} />
        </div>
        <h1 className="mt-6 text-3xl font-black tracking-[-0.035em]">Access denied</h1>
        <p className="mt-3 leading-7 text-slate-600">
          Your active organization or role does not have permission to open this workspace.
        </p>
        <Link href={href} className="mt-7 inline-flex">
          <Button>Go to my dashboard</Button>
        </Link>
      </Card>
    </main>
  );
}
