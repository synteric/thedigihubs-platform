import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { ArrowUpRight, ChevronRight } from 'lucide-react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'dark' | 'yellow' | 'ghost';
};

export function Button({ children, variant = 'primary', className = '', ...props }: ButtonProps) {
  const styles = {
    primary: 'bg-[#155EEF] text-white shadow-[0_14px_30px_rgba(21,94,239,.18)] hover:bg-[#0f49c7]',
    secondary: 'border border-[#BFD7FF] bg-white text-[#155EEF] hover:bg-[#EFF6FF]',
    dark: 'bg-[#121D4D] text-white hover:bg-[#0D1538]',
    yellow: 'bg-[#FFB000] text-[#0B1744] hover:bg-[#F2A300]',
    ghost: 'text-[#155EEF] hover:bg-[#EFF6FF]',
  };
  return <button className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 py-3 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`} {...props}>{children}</button>;
}

export function Card({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return <div className={`rounded-[22px] border border-[#DFE9F7] bg-white shadow-[0_12px_34px_rgba(16,33,63,.06)] ${className}`} {...props}>{children}</div>;
}

export function Pill({ children, tone = 'blue' }: { children: ReactNode; tone?: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'gray' }) {
  const styles = {
    blue: 'bg-blue-50 text-[#155EEF] border-blue-100',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
    purple: 'bg-violet-50 text-violet-700 border-violet-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    gray: 'bg-slate-50 text-slate-600 border-slate-100',
  };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${styles[tone]}`}>{children}</span>;
}

export function Badge({ children }: { children: ReactNode }) {
  return <Pill tone="green">{children}</Pill>;
}

export function Kpi({ icon, label, value, change, tone = 'blue' }: { icon: ReactNode; label: string; value: string; change: string; tone?: 'blue' | 'green' | 'orange' | 'purple' }) {
  const tones = {
    blue: 'bg-blue-50 text-[#155EEF]',
    green: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-500',
    purple: 'bg-violet-50 text-violet-600',
  };
  return (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <div className={`grid h-14 w-14 place-items-center rounded-full ${tones[tone]}`}>{icon}</div>
        <div>
          <p className="text-sm font-extrabold text-[#0B1744]">{label}</p>
          <p className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#0B1744]">{value}</p>
          <p className="mt-1 text-xs font-bold text-emerald-600">↑ {change}</p>
        </div>
      </div>
    </Card>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-black tracking-[-0.04em] text-[#0B1744] sm:text-4xl">{title}</h2>
      <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-[#155EEF] via-[#13B6D8] to-[#FFB000]" />
      {subtitle && <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">{subtitle}</p>}
    </div>
  );
}

export function LineChart({ dotted = true }: { dotted?: boolean }) {
  return (
    <svg viewBox="0 0 620 230" className="h-56 w-full" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => <line key={i} x1="42" x2="590" y1={35 + i * 40} y2={35 + i * 40} stroke="#E7EEF9" />)}
      <path d="M48 165 L125 128 L205 129 L282 90 L360 104 L450 76 L575 58" fill="none" stroke="#155EEF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {dotted && <path d="M48 185 L125 170 L205 174 L282 139 L360 151 L450 145 L575 112" fill="none" stroke="#155EEF" strokeWidth="3" strokeLinecap="round" strokeDasharray="9 9" />}
      {[48,125,205,282,360,450,575].map((x,i)=><circle key={i} cx={x} cy={[165,128,129,90,104,76,58][i]} r="5" fill="#155EEF" />)}
      {['May 8','May 9','May 10','May 11','May 12','May 13','May 14'].map((l,i)=><text key={l} x={45+i*88} y="220" fontSize="12" fill="#60708F">{l}</text>)}
    </svg>
  );
}

export function Donut({ center = '$2.48M', label = 'Total Spend', items = ['IT Services 35% $868K','Professional Services 25% $620K','Manufacturing 20% $496K','Facilities 10% $248K','Other 10% $248K'] }: { center?: string; label?: string; items?: string[] }) {
  const colors = ['#155EEF', '#13B6D8', '#FFB000', '#7C3AED', '#94A3B8'];
  return (
    <div className="flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-8">
      <div className="relative h-44 w-44 shrink-0 rounded-full" style={{ background: `conic-gradient(${colors[0]} 0 35%, ${colors[1]} 35% 60%, ${colors[2]} 60% 80%, ${colors[3]} 80% 90%, ${colors[4]} 90% 100%)` }}>
        <div className="absolute inset-9 grid place-items-center rounded-full bg-white text-center">
          <p className="text-2xl font-black text-[#0B1744]">{center}</p>
          <p className="text-xs font-bold text-slate-500">{label}</p>
        </div>
      </div>
      <div className="space-y-3 text-sm">
        {items.map((item, i) => <p key={item} className="flex items-center gap-3 font-bold text-slate-600"><span className="h-3 w-3 rounded-full" style={{ background: colors[i] }} />{item}</p>)}
      </div>
    </div>
  );
}

export function LinkAction({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-1 text-sm font-extrabold text-[#155EEF]">{children} <ChevronRight size={16}/></span>;
}

export function FloatingArrow() { return <ArrowUpRight size={16} />; }
