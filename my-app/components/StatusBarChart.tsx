import { useState, useMemo, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import StatusTooltipContent from "./StatusTooltipContent";
import { STATUS_COLORS } from "@/lib/utils";

interface StatusBarChartProps {
  statusHistory: {
    status: string;
    date: string;
    downtimePeriods?: { start_time: string; end_time: string | null }[];
  }[];
}

export default function StatusBarChart({ statusHistory }: StatusBarChartProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const memoizedStatusHistory = useMemo(() => statusHistory, [statusHistory]);

  useEffect(() => {
    const checkIfTouchDevice = () => {
      setIsTouchDevice(
        "ontouchstart" in window || navigator.maxTouchPoints > 0
      );
    };
    checkIfTouchDevice();
    window.addEventListener("resize", checkIfTouchDevice);
    return () => window.removeEventListener("resize", checkIfTouchDevice);
  }, []);

  return (
    <TooltipProvider>
      <div
        className="w-full flex gap-[3px] justify-between items-center"
        onMouseLeave={() => {
          if (clickedIndex === null) {
            setHoveredIndex(null);
            setOpenIndex(null);
          }
        }}
      >
        {memoizedStatusHistory.map((entry, index) => (
          <Tooltip
            key={index}
            open={
              openIndex === index || (hoveredIndex === index && !isTouchDevice)
            }
            onOpenChange={(open) => {
              if (!open && clickedIndex !== index) {
                setOpenIndex(null);
              }
            }}
            delayDuration={50}
            disableHoverableContent
          >
            <TooltipTrigger asChild>
              <div
                className="h-9 w-3 md:cursor-default cursor-pointer transition-all duration-150 hover:brightness-75"
                style={{
                  backgroundColor:
                    STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS],
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isTouchDevice) {
                    if (clickedIndex === index) {
                      setClickedIndex(null);
                      setOpenIndex(null);
                    } else {
                      setClickedIndex(index);
                      setOpenIndex(index);
                    }
                  }
                }}
                onMouseEnter={() => {
                  if (!isTouchDevice && clickedIndex === null) {
                    setHoveredIndex(index);
                    setOpenIndex(index);
                  }
                }}
              />
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="bg-white p-3 shadow-md rounded-md text-xs w-64"
              onClick={(e) => e.stopPropagation()}
            >
              <StatusTooltipContent
                date={entry.date}
                downtimePeriods={entry.downtimePeriods}
              />
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
