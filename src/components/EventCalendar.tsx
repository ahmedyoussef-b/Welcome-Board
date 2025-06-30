
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { cn } from "@/lib/utils";

type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];

const EventCalendar = () => {
  const [value, onChange] = useState<Value>(new Date());
  const router = useRouter();

  useEffect(() => {
    if (value instanceof Date) {
      // Format date to YYYY-MM-DD to ensure clean URL and parsing
      router.push(`?date=${value.toISOString().split('T')[0]}`);
    }
    // If value is an array (range selection), you might want to handle that differently
    // For now, this component seems to primarily use single date selection.
  }, [value, router]);

  return (
    <div
      className={cn(
        "bg-card p-3 rounded-lg shadow-md", // Card background, padding, rounded corners, shadow
        "transition-all duration-300 ease-in-out", // Smooth transition for hover effects
        "hover:shadow-xl hover:-translate-y-1" // Grow shadow and lift on hover
      )}
    >
      <Calendar
        onChange={onChange}
        value={value}
        className="!border-none !font-sans" // Remove default border, ensure consistent font
        locale="fr-FR" // Set locale to French to fix hydration mismatch
        // tileClassName, navigationLabel etc. can be used for deeper customization
      />
    </div>
  );
};

export default EventCalendar;
