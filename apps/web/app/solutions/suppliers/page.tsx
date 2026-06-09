import type { Metadata } from 'next';
import { SolutionPage, supplierSteps } from '../solution-page';

export const metadata: Metadata = {
  title: 'Solutions for Suppliers',
  description: 'TheDigiHubs helps supplier teams find matched RFQ opportunities, review buyer requirements, prepare quotations, and track opportunity workflows.',
  alternates: {
    canonical: '/solutions/suppliers',
  },
};

export default function SuppliersSolutionPage() {
  return (
    <SolutionPage
      audience="suppliers"
      eyebrow="Solutions for suppliers"
      title="Find matched opportunities and submit stronger quotes."
      intro="TheDigiHubs helps supplier teams discover buyer RFQs, understand requirements, prepare compliant quotes, and track their opportunity pipeline."
      primaryCta="Register for supplier access"
      primaryHref="/register"
      secondaryCta="View subscription plans"
      secondaryHref="/subscribe"
      metrics={[
        ['Workspace', 'Supplier teams'],
        ['Workflow', 'Matches to quotes'],
        ['Controls', 'Pipeline visibility'],
      ]}
      steps={supplierSteps}
      outcomes={[
        'See matched RFQs with buyer, deadline, status, and fit score.',
        'Review RFQ detail and prepare quotes from a dedicated workspace.',
        'Track quote performance, buyer engagement, and award progress.',
        'Protect supplier dashboards with role and organization-aware access.',
      ]}
    />
  );
}
