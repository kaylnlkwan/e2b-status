import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const STATUS_COLORS = {
  operational: "#3ecf8e",
  down: "#ef4146",
  "not monitored": "#b0b0b0",
} as const;

export const formatDate = (isoString: string) => {
  const utcDate = new Date(isoString);
  return `${utcDate.getUTCDate()} ${utcDate.toLocaleString("en-GB", {
    month: "short",
  })} ${utcDate.getUTCFullYear()}`;
};

// duration of downtime
export const formatDuration = (start: string, end: string | null) => {
  const startTime = new Date(start).getTime();
  const endTime = end ? new Date(end).getTime() : Date.now();

  const duration = Math.round((endTime - startTime) / 60000);
  const hours = Math.floor(duration / 60);
  const mins = duration % 60;

  return !end
    ? `Ongoing (${hours} hrs ${mins} mins)`
    : `${hours > 0 ? `${hours} hrs ` : ""}${
        mins > 0 ? `${mins} mins` : ""
      }`.trim();
};

export const calculateUptime = (
  statusHistory: {
    status: string;
    date: string;
    downtimePeriods?: { start_time: string; end_time: string | null }[];
  }[],
  numDays: number
): string => {
  const today = new Date();
  let totalMinutesMonitored = numDays * 24 * 60;
  let daysMissing = 0;

  const fullStatusHistory = Array.from({ length: numDays }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const entry = statusHistory.find((entry) => entry.date === dateStr);

    if (!entry) {
      daysMissing++;
      return { date: dateStr, status: "not monitored", downtimePeriods: [] };
    }
    return entry;
  });

  totalMinutesMonitored -= daysMissing * 24 * 60; // don't include days w/out monitoring as part of calculation

  const totalDowntimeMinutes = fullStatusHistory
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

  return totalMinutesMonitored > 0
    ? (
        ((totalMinutesMonitored - totalDowntimeMinutes) /
          totalMinutesMonitored) *
        100
      ).toFixed(2)
    : "N/A";
};
