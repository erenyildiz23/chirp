"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { signInAsDemo } from "@/lib/actions/auth";

export function DemoButton({ className }: { className?: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      className={className}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await signInAsDemo();
          if (result && !result.ok) toast.error(result.error);
        })
      }
    >
      {pending ? "Opening demo…" : "Try the demo"}
    </Button>
  );
}
