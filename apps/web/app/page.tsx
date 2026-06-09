import type { Metadata } from 'next';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Globe2,
  Layers3,
  Play,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import { Logo } from '../components/brand';
import { PublicHeader } from '../components/public-header';
import { Button, Card, SectionTitle } from '../components/ui';

export const metadata: Metadata = {
  title: 'A Trusted Marketplace for Buyers, Suppliers, RFQs, and Quotations',
  description: 'TheDigiHubs helps organizations find suppliers, issue RFQs, receive quotations, compare offers, and award with transparency in one digital procurement platform.',
  alternates: {
    canonical: '/',
  },
};

type IconCard = {
  title: string;
  body: string;
  icon: LucideIcon;
  tone: 'blue' | 'teal' | 'yellow' | 'purple' | 'navy';
};

const toneStyles = {
  blue: 'bg-blue-50 text-[#155EEF]',
  teal: 'bg-cyan-50 text-[#13B6D8]',
  yellow: 'bg-amber-50 text-[#FFB000]',
  purple: 'bg-violet-50 text-[#6D5DFB]',
  navy: 'bg-indigo-50 text-[#0D1B4C]',
};

const heroCards: Array<IconCard & { className: string }> = [
  {
    title: 'Supplier Discovery',
    body: 'Find verified suppliers worldwide',
    icon: UsersRound,
    tone: 'blue',
    className: 'left-1/2 top-6 w-[300px] -translate-x-1/2',
  },
  {
    title: 'RFQ Workflow',
    body: 'Create, assess, manage RFQs seamlessly',
    icon: Layers3,
    tone: 'teal',
    className: 'left-[4%] top-[198px] w-[285px]',
  },
  {
    title: 'Quote Comparison',
    body: 'Compare multiple bids side by side',
    icon: BarChart3,
    tone: 'teal',
    className: 'right-[3%] top-[198px] w-[290px]',
  },
  {
    title: 'Team Visibility',
    body: 'Share, control, and uphold performance',
    icon: CircleDollarSign,
    tone: 'yellow',
    className: 'left-[13%] bottom-7 w-[300px]',
  },
  {
    title: 'Collaboration Hub',
    body: 'Work with your team and suppliers in real time',
    icon: Globe2,
    tone: 'purple',
    className: 'right-[8%] bottom-7 w-[300px]',
  },
];

const whyPoints: IconCard[] = [
  {
    title: 'One place for every sourcing need',
    body: 'Source, evaluate, and award across goods and services in one platform.',
    icon: Sparkles,
    tone: 'blue',
  },
  {
    title: 'Better decisions with real insights',
    body: 'Compare suppliers, track performance, and unlock data-driven outcomes.',
    icon: BarChart3,
    tone: 'navy',
  },
  {
    title: 'Stronger relationships, better results',
    body: 'Collaborate with suppliers and teams to deliver more value together.',
    icon: UsersRound,
    tone: 'teal',
  },
];

const outcomes: IconCard[] = [
  {
    title: 'Drive Efficiency',
    body: 'Automate workflows and reduce manual work.',
    icon: Sparkles,
    tone: 'teal',
  },
  {
    title: 'Reduce Costs',
    body: 'Find best value and negotiate with confidence.',
    icon: CircleDollarSign,
    tone: 'blue',
  },
  {
    title: 'Improve Sustainability',
    body: 'Track impact and source responsibly.',
    icon: Globe2,
    tone: 'yellow',
  },
  {
    title: 'Mitigate Risk',
    body: 'Assess suppliers and minimize disruption.',
    icon: ShieldCheck,
    tone: 'teal',
  },
  {
    title: 'Increase Visibility',
    body: 'Gain real-time insights across all spend.',
    icon: BarChart3,
    tone: 'purple',
  },
];

const modules: IconCard[] = [
  {
    title: 'Supplier Discovery',
    body: 'Find and qualify the right suppliers',
    icon: UsersRound,
    tone: 'blue',
  },
  {
    title: 'RFQ Management',
    body: 'Create, send, and manage RFQs efficiently',
    icon: Layers3,
    tone: 'teal',
  },
  {
    title: 'Quote Comparison',
    body: 'Compare smarter and choose with confidence',
    icon: CircleDollarSign,
    tone: 'yellow',
  },
  {
    title: 'Contract & Award',
    body: 'Negotiate, finalize, and award with ease',
    icon: CheckCircle2,
    tone: 'blue',
  },
  {
    title: 'Supplier Collaboration',
    body: 'Work together seamlessly in real time',
    icon: Globe2,
    tone: 'purple',
  },
  {
    title: 'Analytics & Reporting',
    body: 'Make every decision directionally data-driven',
    icon: BarChart3,
    tone: 'teal',
  },
];

const footerLinks = {
  Solutions: [
    { label: 'For Buyers', href: '/solutions/buyers' },
    { label: 'For Suppliers', href: '/solutions/suppliers' },
    { label: 'Register', href: '/register' },
    { label: 'Subscribe', href: '/subscribe' },
  ],
  Platform: [
    { label: 'Overview', href: '/platform' },
    { label: 'Marketplace', href: '/marketplace' },
    { label: 'RFQ Workflow', href: '/platform' },
    { label: 'Quote Evaluation', href: '/platform' },
  ],
  Resources: [
    { label: 'Resource Center', href: '/resources' },
    { label: 'Free Samples', href: '/samples' },
    { label: 'Support', href: '/contact' },
    { label: 'Plans', href: '/subscribe' },
  ],
  Company: [
    { label: 'Partners', href: '/partners' },
    { label: 'Contact Us', href: '/contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms of Use', href: '/terms-and-conditions' },
    { label: 'Sitemap', href: '/sitemap.xml' },
  ],
};

function HeroMapBackdrop() {
  return (
    <svg viewBox="0 0 720 535" className="absolute inset-0 h-full w-full opacity-75" aria-hidden="true">
      <defs>
        <pattern id="hero-map-dot-pattern" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="1.6" cy="1.6" r="1.1" fill="#9FD4FF" />
        </pattern>
      </defs>
      <g fill="url(#hero-map-dot-pattern)">
        <path d="M78 154c35-42 86-58 145-44 34 8 54 25 78 45-20 17-47 19-78 12-34-8-52 3-79 24-28 22-60 25-96 6 10-18 18-31 30-43Z" />
        <path d="M239 240c34 12 54 37 58 75 4 39-16 74-45 98-22-38-31-74-25-112 3-23 9-43 12-61Z" />
        <path d="M328 133c52-22 100-14 143 23 31 26 51 61 57 104-49 5-88-4-117-28-22-19-49-29-80-30-30-2-51-12-64-29 9-19 18-31 61-40Z" />
        <path d="M383 249c52 2 83 28 95 79 10 43 1 82-29 117-33-24-53-58-59-101-5-31-2-64-7-95Z" />
        <path d="M515 137c55-12 101-3 139 27 28 22 43 51 46 88-42 5-78-3-108-23-27-18-56-28-89-31-27-3-45-11-54-24 13-17 29-28 66-37Z" />
        <path d="M557 349c43-8 77 3 102 33 13 15 19 33 17 54-32 7-63 1-92-18-20-14-37-31-51-52 8-8 16-13 24-17Z" />
      </g>
    </svg>
  );
}

function FloatingCard({ title, body, className, icon: Icon, tone }: IconCard & { className: string }) {
  return (
    <div className={`absolute min-h-[104px] rounded-[20px] border border-[#D8E6F7] bg-white/95 p-4 shadow-[0_18px_44px_rgba(16,33,63,.13)] backdrop-blur ${className}`}>
      <div className="flex items-center gap-4">
        <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-full ${toneStyles[tone]}`}>
          <Icon size={25} strokeWidth={2.25} />
        </div>
        <div>
          <p className="text-base font-black text-[#0B1744]">{title}</p>
          <p className="mt-1.5 text-sm font-semibold leading-6 text-slate-600">{body}</p>
        </div>
      </div>
    </div>
  );
}

function MiniLineChart() {
  const points = [
    [34, 118],
    [92, 78],
    [152, 96],
    [214, 48],
    [278, 64],
    [338, 34],
  ];

  return (
    <svg viewBox="0 0 370 160" className="h-40 w-full" aria-hidden="true">
      {[0, 1, 2, 3].map((index) => (
        <line key={index} x1="26" x2="350" y1={30 + index * 32} y2={30 + index * 32} stroke="#E7EEF9" />
      ))}
      <path d="M34 132 L92 112 L152 120 L214 84 L278 94 L338 76" fill="none" stroke="#94C5FF" strokeWidth="3" strokeDasharray="6 7" strokeLinecap="round" />
      <path d={points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x} ${y}`).join(' ')} fill="none" stroke="#155EEF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {points.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="4.5" fill="#155EEF" stroke="#fff" strokeWidth="2" />
      ))}
      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((label, index) => (
        <text key={label} x={30 + index * 62} y="151" fontSize="10" fontWeight="700" fill="#64748B">
          {label}
        </text>
      ))}
    </svg>
  );
}

function MiniDonut() {
  const items = [
    ['IT Services', '34%', '#155EEF'],
    ['Manufacturing', '26%', '#13B6D8'],
    ['Facilities', '18%', '#FFB000'],
    ['Professional', '12%', '#7C3AED'],
    ['Other', '10%', '#94A3B8'],
  ];

  return (
    <div className="flex items-center gap-5">
      <div className="relative h-32 w-32 shrink-0 rounded-full" style={{ background: 'conic-gradient(#155EEF 0 34%, #13B6D8 34% 60%, #FFB000 60% 78%, #7C3AED 78% 90%, #94A3B8 90% 100%)' }}>
        <div className="absolute inset-7 rounded-full bg-white" />
      </div>
      <div className="space-y-2 text-xs font-bold text-slate-600">
        {items.map(([name, value, color]) => (
          <p key={name} className="flex items-center justify-between gap-5">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
              {name}
            </span>
            <span className="text-[#0B1744]">{value}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

function OutcomeCard({ title, body, icon: Icon, tone }: IconCard) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[.06] p-7 text-center shadow-[0_18px_38px_rgba(0,0,0,.12)]">
      <div className={`mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full border border-cyan-300/40 bg-white/5 ${tone === 'yellow' ? 'text-[#FFB000]' : 'text-cyan-300'}`}>
        <Icon size={30} strokeWidth={1.9} />
      </div>
      <p className="font-black text-white">{title}</p>
      <p className="mt-3 text-sm leading-6 text-blue-100">{body}</p>
    </div>
  );
}

function PlatformModule({ title, body, icon: Icon, tone }: IconCard) {
  return (
    <div className="rounded-[18px] border border-white/20 bg-white p-4 text-[#0B1744] shadow-[0_18px_38px_rgba(3,10,40,.24)]">
      <div className="flex items-center gap-3">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${toneStyles[tone]}`}>
          <Icon size={19} strokeWidth={2.3} />
        </div>
        <div>
          <p className="text-sm font-black">{title}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{body}</p>
        </div>
      </div>
    </div>
  );
}

function CtaWomanIllustration() {
  return (
    <div className="relative h-[260px] overflow-hidden">
      <div className="absolute left-8 top-9 h-36 w-36 rounded-full bg-white/10" />
      <div className="absolute left-7 top-10 h-40 w-40 opacity-45" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.55) 1.4px, transparent 1.4px)', backgroundSize: '13px 13px' }} />
      <svg viewBox="0 0 300 260" className="absolute bottom-0 left-5 h-[260px] w-[300px]" role="img" aria-label="Procurement professional reviewing opportunities">
        <path d="M82 255 C90 203 111 177 150 177 C190 177 217 205 228 255 Z" fill="#0B1744" />
        <path d="M106 255 C113 209 128 189 151 189 C175 189 193 210 202 255 Z" fill="#155EEF" />
        <path d="M134 183 C141 193 160 194 168 183 L166 161 L136 161 Z" fill="#F3B48E" />
        <path d="M119 74 C111 101 110 132 123 158 C136 184 181 184 193 156 C206 127 202 91 185 73 C168 56 133 56 119 74 Z" fill="#1E2A5B" />
        <path d="M128 84 C122 96 121 119 127 141 C133 163 148 172 163 169 C178 166 190 151 192 129 C194 104 182 81 166 74 C151 68 136 72 128 84 Z" fill="#F8C19B" />
        <path d="M121 103 C138 103 153 93 162 82 C169 98 182 108 194 109 C192 86 178 69 156 66 C135 63 121 75 121 103 Z" fill="#1E2A5B" />
        <path d="M116 122 C108 119 105 129 110 138 C114 146 121 145 123 141 Z" fill="#F8C19B" />
        <path d="M194 122 C202 119 205 129 200 138 C196 146 189 145 187 141 Z" fill="#F8C19B" />
        <path d="M135 193 L150 226 L166 193 L185 203 L174 255 L126 255 L116 204 Z" fill="#FFFFFF" />
        <path d="M143 200 L150 226 L157 200" fill="none" stroke="#13B6D8" strokeWidth="3" strokeLinecap="round" />
        <rect x="162" y="159" width="82" height="104" rx="10" transform="rotate(-9 162 159)" fill="#E9F5FF" stroke="#BFD7FF" strokeWidth="3" />
        <rect x="176" y="177" width="48" height="6" rx="3" transform="rotate(-9 176 177)" fill="#155EEF" opacity=".75" />
        <rect x="179" y="195" width="44" height="6" rx="3" transform="rotate(-9 179 195)" fill="#13B6D8" opacity=".75" />
        <rect x="182" y="213" width="36" height="6" rx="3" transform="rotate(-9 182 213)" fill="#FFB000" opacity=".85" />
        <path d="M107 219 C127 206 146 203 169 211" fill="none" stroke="#F8C19B" strokeWidth="13" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function Home() {
  return (
    <main className="bg-white text-[#0B1744]">
      <PublicHeader />

      <section className="relative overflow-hidden bg-white px-10 py-8">
        <div className="absolute right-0 top-24 h-[520px] w-[920px] rounded-full bg-blue-50 blur-3xl" />
        <div className="mx-auto grid max-w-[1540px] items-center gap-12 lg:grid-cols-[.76fr_1.24fr]">
          <div className="relative z-10">
            <h1 className="max-w-[600px] text-5xl font-black leading-[1.08] tracking-[-0.045em] text-[#0B1744] lg:text-[56px]">
              A trusted marketplace for buyers, suppliers, RFQs, and quotations.
            </h1>
            <p className="mt-6 max-w-[570px] text-lg font-medium leading-8 text-[#20345F]">
              TheDigiHubs helps organizations find suppliers, issue RFQs, receive quotations, compare offers, and award with transparency in one digital procurement platform.
            </p>
            <div className="mt-8">
              <Button className="px-7 py-3.5 text-sm"><Play size={18} fill="currentColor" /> Watch Demo</Button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[30px] border border-[#DCE9F8] bg-gradient-to-br from-white via-[#F8FCFF] to-[#EEF7FF] shadow-[0_30px_80px_rgba(16,33,63,.1)]" style={{ height: 'clamp(500px, calc(100vh - 218px), 540px)' }}>
            <HeroMapBackdrop />
            <svg viewBox="0 0 720 540" className="absolute inset-0 h-full w-full" aria-hidden="true">
              <path d="M360 270 L360 80" stroke="#155EEF" strokeWidth="3" strokeDasharray="6 9" />
              <path d="M360 270 L178 250" stroke="#13B6D8" strokeWidth="3" strokeDasharray="6 9" />
              <path d="M360 270 L555 250" stroke="#13B6D8" strokeWidth="3" strokeDasharray="6 9" />
              <path d="M360 270 L250 455" stroke="#FFB000" strokeWidth="3" strokeDasharray="6 9" />
              <path d="M360 270 L505 455" stroke="#6D5DFB" strokeWidth="3" strokeDasharray="6 9" />
              <circle cx="360" cy="270" r="82" fill="none" stroke="#BFD7FF" strokeWidth="2" />
              <circle cx="360" cy="270" r="101" fill="none" stroke="#DCEBFF" strokeWidth="2" />
              <circle cx="360" cy="270" r="118" fill="none" stroke="#DCEBFF" strokeWidth="1.5" strokeDasharray="3 8" />
              {[
                [360, 80, '#155EEF'],
                [178, 250, '#13B6D8'],
                [555, 250, '#13B6D8'],
                [250, 455, '#FFB000'],
                [505, 455, '#6D5DFB'],
              ].map(([cx, cy, color]) => (
                <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="6" fill={String(color)} />
              ))}
            </svg>
            <div className="absolute left-1/2 top-1/2 grid h-[120px] w-[120px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#DCEBFF] bg-white shadow-[0_24px_58px_rgba(21,94,239,.18)]">
              <div className="absolute -inset-4 rounded-full border border-[#BFD7FF]" />
              <div className="absolute -inset-1.5 rounded-full border border-[#DCEBFF]" />
              <Logo markOnly markClassName="h-20 w-20" />
            </div>
            {heroCards.map((card) => <FloatingCard key={card.title} {...card} />)}
          </div>
        </div>
      </section>

      <section className="bg-[#F3FAFF] px-8 py-12">
        <Card className="mx-auto grid max-w-[1320px] gap-10 p-9 lg:grid-cols-[345px_1fr]">
          <div>
            <h2 className="text-3xl font-black tracking-[-0.03em]">Why teams choose TheDigiHubs</h2>
            <div className="mt-3 h-1 w-16 rounded-full bg-[#13B6D8]" />
            <div className="mt-10 space-y-8">
              {whyPoints.map(({ title, body, icon: Icon, tone }) => (
                <div key={title} className="flex gap-5">
                  <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-full shadow-[0_12px_26px_rgba(16,33,63,.08)] ${toneStyles[tone]}`}>
                    <Icon size={25} strokeWidth={2.2} />
                  </div>
                  <div>
                    <p className="font-black">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-[#DFE9F7] bg-white p-5 shadow-[0_20px_50px_rgba(16,33,63,.09)]">
            <div className="grid min-h-[430px] grid-cols-[104px_1fr] gap-5">
              <div className="rounded-[18px] bg-[#101D4E] p-4 text-white">
                <Logo markOnly light markClassName="h-11 w-11" />
                <div className="mt-8 space-y-2 text-xs font-bold text-blue-100">
                  {['Dashboard', 'Sourcing', 'RFQs', 'Auctions', 'Contracts', 'Suppliers', 'Reports', 'Settings'].map((item, index) => (
                    <p key={item} className={`rounded-lg px-3 py-2 ${index === 0 ? 'bg-[#155EEF] text-white' : ''}`}>{item}</p>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-[18px] bg-[#F8FBFF] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-[#0B1744]">Buyer Workspace</p>
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-white shadow-sm">D</span>
                    <span>Jane Smith<br /><span className="font-semibold text-slate-400">Buyer</span></span>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-4 gap-3">
                  {[
                    ['Total Spend', '$36.62M', '+12.6% vs last quarter'],
                    ['Savings Achieved', '$2.48M', '+18.7% vs last quarter'],
                    ['Active Suppliers', '1,248', '+8.4% vs last quarter'],
                    ['RFQs in Progress', '34', '+6.4% vs last quarter'],
                  ].map(([label, value, change]) => (
                    <div key={label} className="rounded-[14px] border border-[#DFE9F7] bg-white p-4 shadow-sm">
                      <p className="text-[11px] font-bold text-slate-400">{label}</p>
                      <p className="mt-2 text-xl font-black tracking-[-0.03em] text-[#0B1744]">{value}</p>
                      <p className="mt-1 text-[10px] font-bold text-emerald-600">{change}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-[1.15fr_1fr_.9fr] gap-4">
                  <div className="rounded-[14px] border border-[#DFE9F7] bg-white p-4 shadow-sm">
                    <p className="text-sm font-black">Spend Over Time</p>
                    <MiniLineChart />
                  </div>
                  <div className="rounded-[14px] border border-[#DFE9F7] bg-white p-4 shadow-sm">
                    <p className="text-sm font-black">Spending by Category</p>
                    <div className="mt-5">
                      <MiniDonut />
                    </div>
                  </div>
                  <div className="rounded-[14px] border border-[#DFE9F7] bg-white p-4 shadow-sm">
                    <p className="text-sm font-black">Supplier Mgmt.</p>
                    <div className="mt-5 space-y-4">
                      {[
                        ['Top Performers', '97% on-time delivery', 'green'],
                        ['New Suppliers', '15 onboarded', 'blue'],
                        ['Risk Reviews', '4 need attention', 'yellow'],
                      ].map(([label, value, tone]) => (
                        <div key={label} className="flex gap-3">
                          <span className={`mt-1 h-3 w-3 rounded-full ${tone === 'green' ? 'bg-emerald-500' : tone === 'blue' ? 'bg-[#155EEF]' : 'bg-[#FFB000]'}`} />
                          <div>
                            <p className="text-xs font-black text-[#0B1744]">{label}</p>
                            <p className="text-[11px] font-semibold text-slate-500">{value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-6 inline-flex items-center gap-1 text-xs font-black text-[#155EEF]">View All Suppliers <ArrowRight size={13} /></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="bg-[#0D1847] px-8 py-16 text-white">
        <div className="text-center">
          <h2 className="text-4xl font-black tracking-[-0.04em] text-white">Deliver better outcomes at every step</h2>
          <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-[#FFB000]" />
        </div>
        <div className="mx-auto mt-10 grid max-w-[1320px] gap-5 lg:grid-cols-5">
          {outcomes.map((outcome) => <OutcomeCard key={outcome.title} {...outcome} />)}
        </div>
      </section>

      <section id="platform" className="bg-[#101A46] px-8 py-16 text-white">
        <div className="mx-auto grid max-w-[1320px] items-center gap-10 lg:grid-cols-[360px_1fr]">
          <div>
            <h2 className="text-4xl font-black">TheDigiHubs Platform</h2>
            <div className="mt-4 h-1 w-20 rounded bg-[#13B6D8]" />
            <p className="mt-6 leading-8 text-blue-100">
              An integrated platform that connects people, processes, and data across the entire procurement lifecycle.
            </p>
            <Button className="mt-8">Explore Platform</Button>
          </div>

          <div className="relative overflow-hidden rounded-[30px] border border-cyan-400/40 bg-white/[.04] p-8 shadow-[0_24px_70px_rgba(0,0,0,.16)]">
            <div className="absolute inset-0 opacity-35" style={{ backgroundImage: 'radial-gradient(rgba(94,210,255,.24) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
            <svg viewBox="0 0 830 430" className="absolute inset-0 h-full w-full opacity-80" aria-hidden="true">
              <path d="M415 215 L210 82" stroke="#D9F7FF" strokeWidth="2" strokeDasharray="6 8" />
              <path d="M415 215 L210 215" stroke="#D9F7FF" strokeWidth="2" strokeDasharray="6 8" />
              <path d="M415 215 L210 348" stroke="#D9F7FF" strokeWidth="2" strokeDasharray="6 8" />
              <path d="M415 215 L630 82" stroke="#D9F7FF" strokeWidth="2" strokeDasharray="6 8" />
              <path d="M415 215 L630 215" stroke="#D9F7FF" strokeWidth="2" strokeDasharray="6 8" />
              <path d="M415 215 L630 348" stroke="#D9F7FF" strokeWidth="2" strokeDasharray="6 8" />
              <circle cx="415" cy="215" r="100" fill="none" stroke="#13B6D8" strokeWidth="2" strokeDasharray="5 8" />
              <circle cx="415" cy="215" r="76" fill="none" stroke="#155EEF" strokeWidth="2" />
            </svg>
            <div className="relative grid grid-cols-[1fr_160px_1fr] items-center gap-8">
              <div className="space-y-4">
                {modules.slice(0, 3).map((module) => <PlatformModule key={module.title} {...module} />)}
              </div>
              <div className="grid place-items-center">
                <div className="grid h-32 w-32 place-items-center rounded-full border border-cyan-200/70 bg-white shadow-[0_20px_50px_rgba(21,94,239,.22)]">
                  <Logo markOnly markClassName="h-16 w-16" />
                </div>
              </div>
              <div className="space-y-4">
                {modules.slice(3).map((module) => <PlatformModule key={module.title} {...module} />)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="resources" className="bg-[#EAF8FF] px-8 py-16">
        <SectionTitle title="Recognized by leading analysts" />
        <div className="mx-auto mt-10 grid max-w-[1100px] overflow-hidden rounded-[28px] bg-white shadow-card lg:grid-cols-[270px_1fr_330px]">
          <div className="grid place-items-center bg-gradient-to-br from-[#155EEF] to-[#0B1744] p-10 text-center text-3xl font-black tracking-[-0.04em] text-white">
            TechVista<br /><span className="text-sm font-bold tracking-[.28em] text-blue-100">RESEARCH</span>
          </div>
          <div className="p-8">
            <div className="relative h-72 rounded-xl border border-slate-300 bg-[linear-gradient(90deg,#fff_49%,#F8FAFC_50%),linear-gradient(#fff_49%,#F8FAFC_50%)]">
              <span className="absolute left-4 top-4 rounded bg-slate-200 px-3 py-1 text-[10px] font-black text-slate-500">CHALLENGERS</span>
              <span className="absolute right-4 top-4 rounded bg-slate-200 px-3 py-1 text-[10px] font-black text-slate-500">LEADERS</span>
              {[
                ['70%', '22%', '#155EEF'],
                ['78%', '36%', '#13B6D8'],
                ['64%', '58%', '#155EEF'],
                ['45%', '72%', '#94A3B8'],
                ['84%', '24%', '#FFB000'],
              ].map(([left, top, color]) => (
                <span key={`${left}-${top}`} className="absolute h-3 w-3 rounded-full" style={{ left, top, background: color }} />
              ))}
            </div>
          </div>
          <div className="p-10">
            <p className="font-black text-[#155EEF]">LEADER</p>
            <h3 className="mt-4 text-2xl font-black leading-tight">Procurement Marketplace Solutions 2025</h3>
            <p className="mt-4 leading-7 text-slate-600">Recognized for execution excellence and comprehensive vision.</p>
            <Button variant="yellow" className="mt-7">View Report</Button>
          </div>
        </div>
      </section>

      <section id="partners" className="px-8 pb-8 pt-14">
        <SectionTitle title="Trusted by forward-thinking organizations worldwide" />
        <div className="mx-auto mt-9 flex max-w-[1180px] flex-wrap items-center justify-between gap-8 text-[#1F3767]">
          {[
            ['N', 'NORTHWIND', 'TECHNOLOGIES'],
            ['S', 'SOLVANA', 'INDUSTRIES'],
            ['V', 'VERIDIAN', 'HEALTH'],
            ['A', 'AXIOM', 'ENERGY'],
            ['L', 'LUMENEA', 'FINANCIAL'],
          ].map(([mark, name, label]) => (
            <div key={name} className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#D7E9FF] bg-white text-lg font-black text-[#155EEF] shadow-sm">{mark}</span>
              <span className="text-sm font-black leading-tight tracking-wide">{name}<br /><span className="text-xs font-bold text-slate-500">{label}</span></span>
            </div>
          ))}
        </div>
      </section>

      <section className="px-8 pb-8">
        <Card className="mx-auto grid max-w-[1200px] grid-cols-[320px_1fr] items-center overflow-hidden border-0 bg-gradient-to-r from-[#17245D] to-[#155EEF] p-0 text-white shadow-[0_22px_58px_rgba(21,94,239,.18)]">
          <CtaWomanIllustration />
          <div className="p-10">
            <h2 className="text-4xl font-black tracking-[-0.04em]">Ready to transform your procurement?</h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-blue-100">
              Join sourcing teams that save more, reduce risk, and deliver greater value with TheDigiHubs.
            </p>
            <Link href="/contact" className="mt-7 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#FFB000] px-6 py-3 text-sm font-extrabold text-[#0B1744] transition hover:bg-[#F2A300]">
              Contact Us <ArrowRight size={16} />
            </Link>
          </div>
        </Card>
      </section>

      <footer className="bg-[#0D163F] px-8 py-12 text-white">
        <div className="mx-auto grid max-w-[1320px] gap-8 lg:grid-cols-[340px_repeat(5,1fr)]">
          <div>
            <Logo light />
            <p className="mt-5 text-sm leading-6 text-blue-100">
              Connecting procurement teams with verified suppliers, better RFQs, and clearer sourcing decisions.
            </p>
            <div className="mt-5 flex gap-3">
              {['in', 'x', 'yt'].map((item) => (
                <span key={item} className="grid h-8 w-8 place-items-center rounded-full border border-white/20 text-xs font-black text-blue-100">{item}</span>
              ))}
            </div>
            <p className="mt-5 text-xs font-semibold text-blue-200">&copy; 2026 TheDigiHubs. All rights reserved.</p>
          </div>
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <p className="font-black">{heading}</p>
              <div className="mt-4 space-y-3 text-sm text-blue-100">
                {links.map((link) => (
                  <Link key={link.label} href={link.href} className="block transition hover:text-white">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </footer>
    </main>
  );
}
