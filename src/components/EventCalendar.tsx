
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

const EventCalendar = () => {
  const [value, onChange] = useState<Value>(new Date());
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && value instanceof Date) {
      router.push(`?date=${value.toISOString().split('T')[0]}`);
    }
  }, [value, isMounted, router]);
  
  if (!isMounted) {
    return (
        <div className={cn("bg-card p-3 rounded-lg shadow-md")}>
            <Skeleton className="h-[250px] w-full" />
        </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-card p-3 rounded-lg shadow-md",
        "transition-all duration-300 ease-in-out",
        "hover:shadow-xl hover:-translate-y-1"
      )}
    >
      <Calendar
        onChange={onChange}
        value={value}
        className="!border-none !font-sans"
        locale="fr-FR"
      />
    </div>
  );
};

export default EventCalendar;
