"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackButton() {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="-ml-2 rounded-full"
      aria-label="Back"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/home"))}
    >
      <ArrowLeft className="size-5" />
    </Button>
  );
}
