import { LoginForm } from "@/features/auth/LoginForm";

export default function CashierLoginScreen() {
  return (
    <LoginForm
      title="Sign in as Cashier"
      subtitle="Scan tickets, redeem concessions, or hand over drinks at the counter"
      expectedRole={["cinema", "cashier"]}
    />
  );
}
