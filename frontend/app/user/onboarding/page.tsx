import { TenantOnboardingWizard } from '@/components/user/TenantOnboardingWizard';

export const metadata = {
  title: 'Get Started | Tenant Portal',
};

export default function TenantOnboardingPage() {
  return (
    <div className="py-4">
      <TenantOnboardingWizard />
    </div>
  );
}
