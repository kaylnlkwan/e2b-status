"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import StatusBar from "@/components/StatusBar";

const NUM_DAYS = 90;

export default function Home() {
  const [isFetching, setIsFetching] = useState(true);
  const [statusHistory, setStatusHistory] = useState<
    { status: string; duration?: number; date: string }[]
  >(
    Array(NUM_DAYS).fill({
      status: "not monitored",
      date: new Date().toISOString(),
    })
  );
  console.log("Status History:", statusHistory);

  const [intervalTime, setIntervalTime] = useState(10000); // 10 seconds
  const [status, setStatus] = useState<string | null>(null);
  const fetchStatus = async () => {
    if (!isFetching) return;

    try {
      const res = await fetch("/api/status");
      const data = await res.json();
      const newStatus = data.status || "down";
      const newEntry = { status: newStatus, date: new Date().toISOString() };

      setStatusHistory((prev) => {
        let lastStatus = prev[prev.length - 1];
        let duration = undefined;

        if (lastStatus.status === "down" && newStatus === "operational") {
          const downTimeMinutes = Math.round(
            (new Date(newEntry.date).getTime() -
              new Date(lastStatus.date).getTime()) /
              60000
          );
          duration = downTimeMinutes;
        }

        return [...prev.slice(1), { ...newEntry, duration }];
      });
    } catch (error) {
      console.error("Error fetching status:", error);
      setStatus("down");
      setStatusHistory((prev) => [
        ...prev.slice(1),
        { status: "down", date: new Date().toISOString() },
      ]);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, intervalTime);
    return () => clearInterval(interval);
  }, [intervalTime, isFetching]);

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#fafafa] p-24">
      <div className="flex flex-col items-center justify-center max-w-[850px] w-[90%]">
        <div className="flex flex-row justify-between w-full items-center mb-6">
          <Link href="https://e2b.dev/">
            <Image
              src="/logo-gradient.svg"
              alt="E2B Logo"
              width={120}
              height={36}
              priority
            />
          </Link>
          <Button onClick={() => setIsFetching(!isFetching)}>
            {isFetching ? "pause updates" : "resume"}
          </Button>
        </div>
        <div className="w-full">
          <h2 className="text-md mono">[ All systems operational ]</h2>
        </div>

        <div className="flex flex-col w-full mt-6 border border-[#d6d6d6]">
          <StatusBar statusHistory={statusHistory} numDays={NUM_DAYS} />
          <div className="border-b border-[#d6d6d6]"></div>
          <div
            className="w-full h-[10px] bg-center bg-repeat"
            style={{
              backgroundImage: "url('/dotted.svg')",
              backgroundPosition: "center",
              backgroundSize: "auto",
            }}
          />
          <div className="border-b border-[#d6d6d6]"></div>
          <StatusBar statusHistory={statusHistory} numDays={NUM_DAYS} />
        </div>
      </div>
    </div>
  );
}
