"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deletePost } from "@/lib/actions/posts";

export function DeletePostButton({ postId, onDeleted }: { postId: number; onDeleted?: (postId: number) => void }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function confirm() {
    startTransition(async () => {
      const result = await deletePost(postId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setOpen(false);
      toast.success("Post deleted");
      onDeleted?.(postId);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="rounded-full text-muted-foreground hover:text-destructive" aria-label="Delete post">
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogTitle>Delete post?</DialogTitle>
        <DialogDescription>This can&apos;t be undone and it will be removed from everyone&apos;s feed.</DialogDescription>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button variant="destructive" className="h-10 rounded-full font-bold" disabled={pending} onClick={confirm}>
            {pending ? "Deleting…" : "Delete"}
          </Button>
          <DialogClose asChild>
            <Button variant="outline" className="h-10 rounded-full font-bold">
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
