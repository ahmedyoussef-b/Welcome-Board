// src/components/EventCalendarContainer.tsx

import Image from "next/image";
import EventCalendar from "./EventCalendar";
import EventList from "./EventList";

// Define the type for the props object using `type`
type EventCalendarContainerProps = {
  date?: string | string[] | undefined;
};

const EventCalendarContainer = async ({ date }: EventCalendarContainerProps) => {
  const dateValue = date;
  const dateParam = Array.isArray(dateValue) ? dateValue[0] : dateValue;

  return (
    <div className="bg-muted p-4 rounded-md">
      <EventCalendar />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold my-4">Événements</h1>
        <Image src="/moreDark.png" alt="plus d'options" width={20} height={20} />
      </div>
      <div className="flex flex-col gap-4">
        <EventList dateParam={dateParam} />
      </div>
    </div>
  );
};

export default EventCalendarContainer;
