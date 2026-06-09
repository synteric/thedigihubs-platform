import Link from 'next/link';

export function PromoBanner() {
  return (
    <div className="bg-[#155EEF] text-white">
      <div className="mx-auto flex min-h-9 max-w-[1540px] items-center justify-center gap-3 px-6 py-1.5 text-center text-sm font-black">
        <span>Save 30% when you subscribe for 12 months.</span>
        <Link href="/register" className="inline-flex items-center whitespace-nowrap text-white underline decoration-white/60 underline-offset-4 hover:decoration-white">
          Register Now &rarr;
        </Link>
      </div>
    </div>
  );
}
