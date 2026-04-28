"use client";

// Date picker for the reports page
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";

interface ReportDateFilterProps {
  currentDate: string;
}

export function ReportDateFilter({ currentDate }: ReportDateFilterProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <Input
        type="date"
        value={currentDate}
        onChange={(e) => router.push(`/reports?date=${e.target.value}`)}
        className="w-44"
        dir="ltr"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          router.push(
            `/reports?date=${new Date().toISOString().split("T")[0]}`
          )
        }
      >
        <CalendarDays className="h-4 w-4 ml-1" />
        اليوم
      </Button>
    </div>
  );
}
