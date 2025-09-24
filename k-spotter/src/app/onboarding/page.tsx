import OnboardingForm from "../../app/onboarding/onboardingForm";

export default function OnboardingPage() {
  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold mb-3">What brings you to Korea?</h1>
      <OnboardingForm />
    </main>
  );
}
