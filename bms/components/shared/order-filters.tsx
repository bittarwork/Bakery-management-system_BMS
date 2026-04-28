"use client";

// Date and status filter bar for the orders list page
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";

interface OrderFiltersProps {
  currentDate: string;
  currentStatus?: string;
}

const STATUS_OPTIONS = [
  { value: "all", label: "جميع الحالات" },
  { value: "draft", label: "مسودة" },
  { value: "confirmed", label: "مؤكد" },
  { value: "ready_for_distribution", label: "جاهز للتوزيع" },
  { value: "out_for_delivery", label: "في الطريق" },
  { value: "delivered", label: "مُسلَّم" },
  { value: "cancelled", label: "ملغى" },
];

export function OrderFilters({ currentDate, currentStatus }: OrderFiltersProps) {
  const router = useRouter();

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const params = new URLSearchParams();
    params.set("date", e.target.value);
    if (currentStatus) params.set("status", currentStatus);
    router.push(`/orders?${params.toString()}`);
  }

  function handleStatusChange(value: string | null) {
    if (!value) return;
    const params = new URLSearchParams();
    params.set("date", currentDate);
    if (value !== "all") params.set("status", value);
    router.push(`/orders?${params.toString()}`);
  }

  function goToday() {
    const today = new Date().toISOString().split("T")[0];
    const params = new URLSearchParams();
    params.set("date", today);
    if (currentStatus) params.set("status", currentStatus);
    router.push(`/orders?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={currentDate}
          onChange={handleDateChange}
          className="w-44"
          dir="ltr"
        />
        <Button variant="outline" size="sm" onClick={goToday}>
          <CalendarDays className="h-4 w-4 ml-1" />
          اليوم
        </Button>
      </div>

      <Select value={currentStatus ?? "all"} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-52">
          <SelectValue placeholder="جميع الحالات" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
