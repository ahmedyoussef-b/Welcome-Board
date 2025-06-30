
import prisma from "@/lib/prisma";
import type { Event } from "@/types/index"; // Import Event type

const EventList = async ({ dateParam }: { dateParam: string | undefined }) => {
  const date = dateParam ? new Date(dateParam) : new Date();

  // Set to start of the day
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);

  // Set to end of the day
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);


  const data: Event[] = await prisma.event.findMany({
    where: {
      startTime: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  return data.map((event) => (
    <div
      className="p-5 rounded-md border-2 border-gray-100 border-t-4 odd:border-t-lamaSky even:border-t-lamaPurple"
      key={event.id}
    >
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-gray-600">{event.title}</h1>
        <span className="text-gray-300 text-xs">
          {new Date(event.startTime).toLocaleTimeString("en-UK", { // Ensure startTime is treated as Date
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}
        </span>
      </div>
      <p className="mt-2 text-gray-400 text-sm">{event.description}</p>
    </div>
  ));
};

export default EventList;
