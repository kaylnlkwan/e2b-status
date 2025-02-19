"use client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { Info } from "lucide-react";

interface StatusBarProps {
  statusHistory: {
    status: string;
    date: string;
    downtimePeriods?: { start_time: string; end_time: string | null }[];
  }[];
  numDays: number;
}

const STATUS_COLORS = {
  operational: "#3ecf8e",
  down: "#ef4146",
  "not monitored": "#b0b0b0",
} as const;

const formatDate = (isoString: string) => {
  const localDate = new Date(isoString);
  return localDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDuration = (start: string, end: string | null) => {
  const startTime = new Date(start).getTime();
  const endTime = end ? new Date(end).getTime() : Date.now();
  const duration = Math.round((endTime - startTime) / 60000);

  if (!end)
    return `Ongoing (${Math.floor(duration / 60)} hrs ${duration % 60} mins)`;

  const hours = Math.floor(duration / 60);
  const mins = duration % 60;
  return `${hours > 0 ? `${hours} hrs ` : ""}${
    mins > 0 ? `${mins} mins` : ""
  }`.trim();
};

export default function StatusBar({ statusHistory, numDays }: StatusBarProps) {
  const today = new Date();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  let totalMinutesMonitored = numDays * 24 * 60;
  let daysMissing = 0;

  // fill in missing days with "not monitored"
  const fullStatusHistory = Array.from({ length: numDays }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const entry = statusHistory.find((entry) => entry.date === dateStr);

    if (!entry) {
      daysMissing++;
      return {
        date: dateStr,
        status: "not monitored",
        downtimePeriods: [],
      };
    }

    return entry;
  }).reverse();

  totalMinutesMonitored -= daysMissing * 24 * 60;

  const totalDowntimeMinutes = statusHistory
    .flatMap((entry) => entry.downtimePeriods || [])
    .reduce((total, { start_time, end_time }) => {
      const start = new Date(start_time).getTime();
      const now = Date.now();
      const monitoredEndTime = new Date(
        Date.now() - numDays * 24 * 60 * 60 * 1000
      ).getTime();
      const end = end_time
        ? new Date(end_time).getTime()
        : Math.min(now, monitoredEndTime + totalMinutesMonitored * 60000);

      return total + Math.max(0, (end - start) / 60000);
    }, 0);

  const uptimePercentage =
    totalMinutesMonitored > 0
      ? (
          ((totalMinutesMonitored - totalDowntimeMinutes) /
            totalMinutesMonitored) *
          100
        ).toFixed(2)
      : "N/A";

  return (
    <>
      <div className="flex flex-col items-center w-full p-8 relative">
        <div className="flex justify-between w-full text-sm text-gray-600 mb-3 text-center">
          <div className="flex flex-row gap-2 items-center justify-center">
            <div className="text-lg text-black font-semibold flex items-center justify-center w-full h-full">
              E2B Infrastructure
            </div>
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <span className="cursor-pointer">
                    <Info className="w-4 h-4 text-gray-500 hover:gray-600" />
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-black text-white text-xs px-3 py-2 rounded-md shadow-md"
                >
                  Health of all E2B Infrastructure
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-black uppercase flex justify-center mono items-center px-1.5 py-1 bg-[#EBEBEB] text-xs">
            {fullStatusHistory[numDays - 1]?.status || "not monitored"}
          </div>
        </div>
        <div className="relative w-full">
          <TooltipProvider>
            <svg
              className="w-full"
              height="34"
              viewBox={`0 0 ${numDays * 5} 34`}
              preserveAspectRatio="none"
            >
              {fullStatusHistory.map((entry, index) => (
                <Tooltip key={index} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <rect
                      x={index * 5}
                      y="0"
                      width="3"
                      height="34"
                      fill={
                        STATUS_COLORS[
                          entry.status as keyof typeof STATUS_COLORS
                        ]
                      }
                      className="transition-all duration-150 hover:brightness-75"
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  </TooltipTrigger>
                  {hoveredIndex === index && (
                    <TooltipContent side="bottom" key={entry.date}>
                      <p className="mb-1 mono">{formatDate(entry.date)}</p>
                      <div className="flex items-center mb-1">
                        <span
                          className="w-2 h-2 rounded-full mr-2"
                          style={{
                            backgroundColor:
                              STATUS_COLORS[
                                entry.status as keyof typeof STATUS_COLORS
                              ],
                          }}
                        />
                        <span className="font-semibold mono leading-1">
                          {entry.status.toUpperCase()}
                        </span>
                      </div>

                      {entry.downtimePeriods &&
                      entry.downtimePeriods.length > 0 ? (
                        entry.downtimePeriods.some(
                          (period) => period.end_time === null
                        ) ? (
                          <p className="mono">Currently down...</p>
                        ) : (
                          <div className="mono">
                            {entry.downtimePeriods
                              .sort(
                                (a, b) =>
                                  new Date(a.start_time).getTime() -
                                  new Date(b.start_time).getTime()
                              )
                              .map((p, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2"
                                >
                                  <span>
                                    {new Date(p.start_time).toLocaleTimeString(
                                      "en-GB",
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }
                                    )}{" "}
                                    -{" "}
                                    {p.end_time
                                      ? new Date(p.end_time).toLocaleTimeString(
                                          "en-GB",
                                          {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          }
                                        )
                                      : "Ongoing"}{" "}
                                    ({formatDuration(p.start_time, p.end_time)})
                                  </span>
                                </div>
                              ))}
                          </div>
                        )
                      ) : entry.status === "not monitored" ? (
                        <p className="mono">No monitoring data available</p>
                      ) : (
                        <p className="mono">
                          No downtime recorded on this day.
                        </p>
                      )}
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </svg>
          </TooltipProvider>
        </div>
        <div className="flex mono justify-between gap-4 items-center w-full text-sm text-gray-600 mt-3">
          <span>90 days ago</span>
          <div className="bg-[#d6d6d6] h-[1px] flex-grow"></div>
          <span>{uptimePercentage} % uptime</span>
          <div className="bg-[#d6d6d6] h-[1px] flex-grow"></div>
          <span>Today</span>
        </div>
      </div>
    </>
  );
}
