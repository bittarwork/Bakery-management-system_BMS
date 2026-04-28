"use client";

// User action buttons: toggle active/inactive
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface UserActionsProps {
  userId: string;
  isActive: boolean;
}

export function UserActions({ userId, isActive }: UserActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggleActive() {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!res.ok) {
        toast.error("حدث خطأ");
        return;
      }

      toast.success(isActive ? "تم تعطيل المستخدم" : "تم تفعيل المستخدم");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={isActive ? "outline" : "default"}
      size="sm"
      onClick={toggleActive}
      disabled={loading}
      className={isActive ? "text-destructive hover:text-destructive" : ""}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
      {isActive ? "تعطيل" : "تفعيل"}
    </Button>
  );
}
