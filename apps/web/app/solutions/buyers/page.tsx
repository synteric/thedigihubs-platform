import { buyerSteps, SolutionPage } from '../solution-page';

export default function BuyersSolutionPage() {
  return (
    <SolutionPage
      audience="buyers"
      eyebrow="Solutions for buyers"
      title="Source faster, compare better, and award with confidence."
      intro="TheDigiHubs gives buyer teams one place to discover verified suppliers, create RFQs, compare quotes, and move decisions forward with clear controls."
      primaryCta="Register for buyer access"
      primaryHref="/register"
      secondaryCta="View subscription plans"
      secondaryHref="/subscribe"
      metrics={[
        ['Workspace', 'Buyer teams'],
        ['Workflow', 'RFQs to awards'],
        ['Controls', 'Roles and audit'],
      ]}
      steps={buyerSteps}
      outcomes={[
        'Create RFQs with optional specifications and document context.',
        'Invite selected suppliers or external vendors into one event.',
        'Review supplier match, quote value, risk, and status in one view.',
        'Protect buyer dashboards with role and organization-aware access.',
      ]}
    />
  );
}
