import Link from 'next/link';
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { PublicHeader } from '../../components/public-header';
import { MarketingFooter } from '../../components/marketing-footer';
import { Card, Pill } from '../../components/ui';

const sections = [
  {
    title: 'Information we collect',
    body: 'TheDigiHubs may collect contact details, organization details, registration requests, subscription requests, support messages, and workspace activity needed to operate the platform.',
  },
  {
    title: 'How information is used',
    body: 'Information is used to review access requests, support buyers and suppliers, operate RFQ and quotation workflows, manage memberships, and maintain platform records.',
  },
  {
    title: 'Access and control',
    body: 'Workspace access is role-aware and organization-aware. Admin review controls plan assignment, user access, support handling, and audit visibility.',
  },
  {
    title: 'Contact',
    body: 'Questions about privacy, contact forms, registration, and subscription requests can be sent to support@thedigihubs.com.',
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#F8FBFF] text-[#0B1744]">
      <PublicHeader />
      <section className="px-8 py-16">
        <div className="mx-auto max-w-[1080px]">
          <Pill tone="blue">Privacy</Pill>
          <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[1.04] tracking-[-0.05em]">Privacy Policy</h1>
          <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-slate-600">
            This page explains how TheDigiHubs handles public contact, registration, subscription, and platform access information.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {sections.map(({ title, body }, index) => (
              <Card key={title} className="p-7">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-blue-50 text-[#155EEF]">
                  {index === 0 ? <Mail size={23} /> : index === 1 ? <ShieldCheck size={23} /> : <LockKeyhole size={23} />}
                </div>
                <h2 className="mt-6 text-xl font-black">{title}</h2>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{body}</p>
              </Card>
            ))}
          </div>
          <div className="mt-10 rounded-[28px] bg-gradient-to-r from-[#17245D] to-[#155EEF] p-8 text-white">
            <h2 className="text-3xl font-black tracking-[-0.04em]">Need privacy support?</h2>
            <p className="mt-2 font-semibold text-blue-100">Contact TheDigiHubs support for privacy or account questions.</p>
            <Link href="/contact" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#FFB000] px-6 py-3 text-sm font-black text-[#0B1744]">
              Contact Us <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
