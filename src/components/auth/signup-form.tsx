"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { signUp } from "@/lib/actions/auth";
import { Field } from "./field";

export function SignupForm() {
  const [state, action, pending] = useActionState(signUp, null);
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  if (state?.ok) {
    return <p className="rounded-lg bg-muted p-4 text-sm">{state.data}</p>;
  }

  return (
    <form action={action} className="grid gap-4">
      <Field label="Name" name="displayName" autoComplete="name" required error={fieldErrors?.displayName} />
      <Field
        label="Username"
        name="username"
        autoComplete="username"
        required
        placeholder="lowercase, 3–15 characters"
        error={fieldErrors?.username}
      />
      <Field label="Email" name="email" type="email" autoComplete="email" required error={fieldErrors?.email} />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        error={fieldErrors?.password}
      />
      {state && !state.ok && !fieldErrors && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="h-10 rounded-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
