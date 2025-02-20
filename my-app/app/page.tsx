"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import StatusBar from "@/components/StatusBar";
import { fetchStatusHistory, fetchStatus } from "@/lib/supabaseUtils";

const NUM_DAYS = 90; // num days shown on chart
const INTERVAL = 300000; // refresh interval 5 min

export default function Home() {
  const [statusHistory, setStatusHistory] = useState<
    { status: string; date: string; duration?: number }[]
  >([]);

  useEffect(() => {
    const loadData = async () => {
      await fetchStatus();
      const history = await fetchStatusHistory(NUM_DAYS);
      setStatusHistory(history);
    };

    loadData();
    const interval = setInterval(loadData, INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const memoizedStatusHistory = useMemo(() => statusHistory, [statusHistory]);

  const latestStatus = memoizedStatusHistory.at(-1)?.status || "not monitored";

  const STATUS_MESSAGES: Record<string, string> = {
    operational: "All Systems Operational",
    down: "Service Disrupted",
    "not monitored": "Monitoring Unavailable",
  };

  const statusMessage = latestStatus
    ? STATUS_MESSAGES[latestStatus] || "Status Unknown"
    : "Fetching status...";

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#fafafa] md:p-24 p-1 ">
      <div className="flex flex-col items-center justify-center md:max-w-[850px] max-w-[750px] w-[90%] mt-4">
        <div className="flex flex-row justify-between w-full items-center mb-6">
          <Link href="https://e2b.dev/">
            <Image
              src="/E2BLogo.svg"
              alt="E2B Logo"
              width={120}
              height={36}
              priority
            />
          </Link>
        </div>
        <div className="w-full">
          <h2 className="text-md font-mono">[ {statusMessage} ]</h2>
        </div>

        <div className="flex flex-col w-full mt-6 border border-[#d6d6d6]">
          <StatusBar statusHistory={memoizedStatusHistory} numDays={NUM_DAYS} />
        </div>
      </div>
    </div>
  );
}
