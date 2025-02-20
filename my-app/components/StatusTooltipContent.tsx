import { format } from "date-fns";
import { XCircle } from "lucide-react";
import { useMemo } from "react";

interface StatusTooltipContentProps {
  date: string;
  downtimePeriods?: { start_time: string; end_time: string | null }[];
}

const formatDuration = (start: string, end: string | null) => {
  const startTime = new Date(start).getTime();
  const endTime = end ? new Date(end).getTime() : Date.now();
  const duration = Math.round((endTime - startTime) / 60000);
  const hours = Math.floor(duration / 60);
  const mins = duration % 60;

  return `${hours > 0 ? `${hours} hrs ` : ""}${mins} mins`;
};

export default function StatusTooltipContent({
  date,
  downtimePeriods,
}: StatusTooltipContentProps) {
  const theDate = new Date(date); // put date in utc
  const utcDate = new Date(
    theDate.getUTCFullYear(),
    theDate.getUTCMonth(),
    theDate.getUTCDate()
  );

  const formattedDate = format(utcDate, "dd MMM yyyy");

  const formattedDowntimePeriods = useMemo(() => {
    return (
      downtimePeriods?.map((period) => ({
        start_time: period.start_time,
        end_time: period.end_time,
        duration: formatDuration(period.start_time, period.end_time),
      })) || []
    );
  }, [downtimePeriods]);

  return (
    <>
      <p className="text-xs font-semibold">{formattedDate}</p>

      {formattedDowntimePeriods.length > 0 ? (
        <div className="mt-2 space-y-2">
          {formattedDowntimePeriods.map((period, i) => (
            <div
              key={i}
              className="flex items-center justify-between w-full bg-gray-100 p-2 rounded-md"
            >
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <div className="flex items-left gap-4">
                  <span className="text-xs font-medium">Outage</span>
                </div>
                <span className="text-xs font-semibold">{period.duration}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500 mt-1">
          No downtime recorded on this day
        </p>
      )}
    </>
  );
}
