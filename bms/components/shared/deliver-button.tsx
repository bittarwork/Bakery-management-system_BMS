"use client";

// Large delivery confirmation button for distributors (mobile-first)
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";

interface DeliverButtonProps {
  orderId: string;
}

export function DeliverButton({ orderId }: DeliverButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDeliver() {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "delivered" }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "حدث خطأ");
        return;
      }

      toast.success("تم تسجيل التسليم بنجاح!");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
      <Button
        size="lg"
        className="w-full text-base h-14 gap-2"
        onClick={handleDeliver}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <CheckCircle2 className="h-5 w-5" />
        )}
        {loading ? "جارٍ التسجيل..." : "تم التسليم ✓"}
      </Button>
    </div>
  );
}
