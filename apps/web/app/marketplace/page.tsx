import { MarketingHeader } from '../../components/marketing-shell';
import { Badge, Card } from '../../components/ui';

const suppliers = ['MedGlobal Supplies', 'BuildRight Construction', 'TechNova Systems', 'PackCraft Global', 'Voltmax Solutions', 'GreenAgri Source'];

export default function MarketplacePage() {
  return (
    <main className="min-h-screen bg-white">
      <MarketingHeader />
      <section className="mx-auto max-w-7xl px-6 py-14">
        <h1 className="text-5xl font-black tracking-[-0.05em] text-text">Marketplace</h1>
        <p className="mt-4 max-w-2xl text-muted">Browse verified suppliers and sourcing categories. Buyers can request quotations directly or invite suppliers into an RFQ.</p>
        <div className="mt-8 rounded-2xl border border-line px-5 py-4"><input className="w-full outline-none" placeholder="Search suppliers, products, services, or RFQs" /></div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {suppliers.map((s,i)=><Card key={s} className="p-6"><div className="flex justify-between"><h2 className="text-lg font-black text-text">{s}</h2><Badge>Verified</Badge></div><p className="mt-3 text-sm text-muted">{['Medical supplies','Construction','ICT equipment','Packaging','Energy','Agriculture'][i]}</p><div className="mt-5 grid grid-cols-3 gap-3 text-center"><div><b className="text-brand-600">4.{8-i%3}</b><p className="text-xs text-muted">Rating</p></div><div><b className="text-brand-600">{20+i*7}+</b><p className="text-xs text-muted">Countries</p></div><div><b className="text-brand-600">{1+i}h</b><p className="text-xs text-muted">Response</p></div></div><button className="mt-6 w-full rounded-xl border border-brand-200 px-4 py-3 text-sm font-bold text-brand-600">Request quote</button></Card>)}
        </div>
      </section>
    </main>
  );
}
