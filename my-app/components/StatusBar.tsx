"use client";
import { useState, useEffect } from "react";
import StatusBarHeader from "./StatusBarHeader";
import StatusBarChart from "./StatusBarChart";
import { calculateUptime } from "@/lib/utils";
import { useMemo } from "react";

interface StatusBarProps {
  statusHistory: {
    status: string;
    date: string;
    downtimePeriods?: { start_time: string; end_time: string | null }[];
  }[];
  numDays: number;
}

export default function StatusBar({ statusHistory, numDays }: StatusBarProps) {
  const today = new Date();
  const [displayDays, setDisplayDays] = useState(numDays);

  useEffect(() => {
    const handleResize = () => {
      setDisplayDays(window.innerWidth < 768 ? 30 : numDays);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [numDays]);

  const fullStatusHistory = useMemo(() => {
    return Array.from({ length: displayDays }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      return (
        statusHistory.find((entry) => entry.date === dateStr) || {
          date: dateStr,
          status: "not monitored",
          downtimePeriods: [],
        }
      );
    }).reverse();
  }, [statusHistory, displayDays]);

  const uptimePercentage = calculateUptime(statusHistory, displayDays);

  return (
    <div className="flex flex-col items-center w-full md:p-5 p-3 relative">
      <StatusBarHeader
        currentStatus={
          fullStatusHistory[displayDays - 1]?.status || "not monitored"
        }
      />
      <StatusBarChart statusHistory={fullStatusHistory} />
      <div className="flex items-center md:gap-4 justify-between w-full text-sm text-gray-600 mt-3">
        <span className="whitespace-nowrap">{displayDays} days ago</span>
        <div className="bg-[#d6d6d6] h-[1px] flex-1 mx-2"></div>
        <span className="whitespace-nowrap">{uptimePercentage} % uptime</span>
        <div className="bg-[#d6d6d6] h-[1px] flex-1 mx-2"></div>
        <span className="whitespace-nowrap">Today</span>
      </div>
    </div>
  );
}
