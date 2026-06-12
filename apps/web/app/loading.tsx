export default function Loading() {
  return (
    <main className="min-h-screen bg-[#F8FBFF] px-4 py-10 text-[#0B1744] sm:px-8">
      <div className="mx-auto max-w-[1180px]">
        <div className="h-1 w-full overflow-hidden rounded-full bg-[#D8EAFF]">
          <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-[#155EEF] via-[#13B6D8] to-[#FFB000]" />
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-32 animate-pulse rounded-2xl border border-[#DFE9F7] bg-white shadow-sm" />
          ))}
        </div>
      </div>
    </main>
  );
}
