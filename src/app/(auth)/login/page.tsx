import { Suspense } from "react";
import { LoginForm } from "@/components/features/auth";

/** Login page */
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
