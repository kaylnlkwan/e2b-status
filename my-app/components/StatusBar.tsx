"use client";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface StatusBarProps {
  statusHistory: { status: string; duration?: number; date: string }[];
  numDays: number;
}

const STATUS_COLORS = {
  operational: "#3ecf8e",
  down: "#ef4146",
  "not monitored": "#b0b0b0",
} as const;

const formatDate = (isoString: string) => {
  return new Date(isoString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDuration = (minutes?: number) => {
  if (!minutes || minutes < 1) return "Less than a minute";

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${hours > 0 ? `${hours} hrs ` : ""}${
    mins > 0 ? `${mins} mins` : ""
  }`.trim();
};

export default function StatusBar({ statusHistory, numDays }: StatusBarProps) {
  const [hoveredStatus, setHoveredStatus] = useState<{
    status: string;
    duration?: number;
    date: string;
    x: number;
    y: number;
  } | null>(null);

  const operationalDays = statusHistory.filter(
    (entry) => entry.status === "operational"
  ).length;
  const uptimePercentage = ((operationalDays / numDays) * 100).toFixed(2);

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center w-full p-8 relative">
        <div className="flex justify-between w-full text-sm text-gray-600 mb-3 text-center">
          <div className="flex flex-row gap-2 items-center justify-center">
            <div className="text-lg text-black font-semibold flex items-center justify-center w-full h-full">
              E2B API
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
                  All E2B API services at e2b.dev/api
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-black uppercase flex justify-center mono items-center px-1.5 py-1 bg-[#EBEBEB] text-xs">
            {statusHistory.slice(-1)[0].status}
          </div>
        </div>
        <div className="relative w-full">
          <svg
            className="w-full"
            height="34"
            viewBox={`0 0 ${numDays * 5} 34`}
            preserveAspectRatio="none"
          >
            {statusHistory.map((entry, index) => (
              <Tooltip key={index} delayDuration={0}>
                <TooltipTrigger asChild>
                  <rect
                    key={index}
                    x={index * 5}
                    y="0"
                    width="3"
                    height="34"
                    fill={
                      STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS]
                    }
                    className="transition-all duration-150 hover:brightness-50"
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredStatus(() => ({
                        ...entry,
                        x: rect.left + window.scrollX + rect.width / 2,
                        y: rect.top + window.scrollY - 40,
                      }));
                    }}
                    onMouseLeave={() => setHoveredStatus(null)}
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom" key={entry.date}>
                  <>
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
                    {entry.status === "down" &&
                      entry.duration !== undefined &&
                      entry.duration > 0 && (
                        <p className="mono">{`Down for ${formatDuration(
                          entry.duration
                        )}`}</p>
                      )}

                    {entry.status === "operational" && (
                      <p className="mono">No downtime recorded on this day.</p>
                    )}

                    {entry.status === "not monitored" && (
                      <p className="mono">No monitoring data available</p>
                    )}
                  </>
                </TooltipContent>
              </Tooltip>
            ))}
          </svg>
        </div>
        <div className="flex mono justify-between gap-4 items-center w-full text-sm text-gray-600 mt-3">
          <span>60 days ago</span>
          <div className="bg-[#d6d6d6] h-[1px] flex-grow"></div>
          <span>{uptimePercentage} % uptime</span>
          <div className="bg-[#d6d6d6] h-[1px] flex-grow"></div>
          <span>Today</span>
        </div>
      </div>
    </TooltipProvider>
  );
}
