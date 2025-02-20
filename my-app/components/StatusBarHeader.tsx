import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface StatusBarHeaderProps {
  currentStatus: string;
}

export default function StatusBarHeader({
  currentStatus,
}: StatusBarHeaderProps) {
  return (
    <div className="flex justify-between w-full text-sm text-gray-600 mb-2 text-center">
      <div className="flex flex-row gap-2 items-center justify-center">
        <div className="md:text-lg text-md text-black font-semibold flex items-center justify-center w-full h-full">
          Infrastructure
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
              className="bg-black text-white text-xs px-3 py-1 rounded-md shadow-md"
            >
              Health of all E2B Infrastructure
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="text-black uppercase flex justify-center font-mono items-center px-1.5 py-1 bg-[#EBEBEB] text-xs">
        {currentStatus.toUpperCase() || "not monitored"}
      </div>
    </div>
  );
}
