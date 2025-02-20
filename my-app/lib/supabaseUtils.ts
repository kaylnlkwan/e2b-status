import { supabase } from "@/lib/supabaseClient";

type StatusEntry = {
  status: "operational" | "down";
  start_time: string;
  end_time: string | null; // null if downtime is ongoing
};

type GroupedStatus = {
  status: "operational" | "down";
  date: string;
  downtimePeriods: { start_time: string; end_time: string | null }[];
};

// aggregate status history by day
const groupByDay = (data: StatusEntry[]): GroupedStatus[] => {
  const groupedData: Record<string, GroupedStatus> = {};
  let lastStatus: "operational" | "down" = "operational";
  let currentStart: string | null = null;

  let earliestDate = new Date();
  let latestDate = new Date(0);

  data.forEach((entry) => {
    const date = new Date(entry.start_time);

    const dateStr = date.toISOString().split("T")[0];

    if (date < earliestDate) earliestDate = date;
    if (date > latestDate) latestDate = date;

    if (!groupedData[dateStr]) {
      groupedData[dateStr] = {
        status: "operational",
        date: dateStr,
        downtimePeriods: [],
      };
    }

    if (entry.status === "down") {
      let start = new Date(entry.start_time);
      let end = entry.end_time ? new Date(entry.end_time) : null;
      lastStatus = "down";

      while (
        end &&
        start.toISOString().split("T")[0] !== end.toISOString().split("T")[0]
      ) {
        const dayStr = start.toISOString().split("T")[0];

        if (!groupedData[dayStr]) {
          groupedData[dayStr] = {
            status: "operational",
            date: dayStr,
            downtimePeriods: [],
          };
        }

        let endOfDay = new Date(start);
        endOfDay.setUTCHours(23, 59, 59, 999);

        groupedData[dayStr].downtimePeriods.push({
          start_time: start.toISOString(),
          end_time: endOfDay.toISOString(),
        });

        start.setUTCDate(start.getUTCDate() + 1);
        start.setUTCHours(0, 0, 0, 0);
      }

      const finalDay = start.toISOString().split("T")[0];
      if (!groupedData[finalDay]) {
        groupedData[finalDay] = {
          status: "operational",
          date: finalDay,
          downtimePeriods: [],
        };
      }

      groupedData[finalDay].downtimePeriods.push({
        start_time: start.toISOString(),
        end_time: end ? end.toISOString() : null,
      });

      if (!end) {
        currentStart = start.toISOString();
      }
    } else if (entry.status === "operational" && currentStart) {
      groupedData[dateStr].downtimePeriods.push({
        start_time: currentStart,
        end_time: entry.start_time,
      });
      currentStart = null;
      lastStatus = "operational";
    }
  });

  let currentDate = new Date(earliestDate.getTime());
  currentDate.setUTCHours(0, 0, 0, 0);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  while (currentDate <= today) {
    let dateStr = currentDate.toISOString().split("T")[0];
    if (!groupedData[dateStr]) {
      groupedData[dateStr] = {
        status: lastStatus,
        date: dateStr,
        downtimePeriods:
          lastStatus === "down"
            ? [{ start_time: `${dateStr}T00:00:00Z`, end_time: null }]
            : [],
      };
    } else {
      lastStatus = groupedData[dateStr].status;
    }
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  Object.values(groupedData).forEach((day) => {
    if (day.downtimePeriods.length > 0) {
      day.status = "down";
    }
  });
  console.log("data: ", groupedData);
  return Object.values(groupedData).reverse();
};

export const fetchStatusHistory = async (
  numDays: number
): Promise<GroupedStatus[]> => {
  const { data, error } = await supabase
    .from("status_history")
    .select("status, start_time, end_time")
    .gte(
      "start_time",
      new Date(Date.now() - numDays * 24 * 60 * 60 * 1000).toISOString()
    )
    .order("start_time", { ascending: true });

  if (error || !data) {
    console.error("Error fetching status history:", error);
    return [];
  }

  return groupByDay(data as StatusEntry[]);
};

export const fetchStatus = async (): Promise<void> => {
  try {
    const newTimestamp = new Date();
    const res = await fetch("/api/status");
    if (!res.ok) {
      console.warn(`API Request Failed: ${res.status}`);
      return;
    }
    const data = await res.json();
    const newStatus: "operational" | "down" = data?.status || "down";

    const { data: lastEntry } = await supabase
      .from("status_history")
      .select("id, status, start_time")
      .order("start_time", { ascending: false })
      .limit(1)
      .single();

    if (!lastEntry || lastEntry.status !== newStatus) {
      await supabase.from("status_history").insert([
        {
          status: newStatus,
          start_time: newTimestamp.toISOString(),
          end_time: null,
        },
      ]);
    }

    if (lastEntry?.status === "down" && newStatus === "operational") {
      const { error: updateError } = await supabase
        .from("status_history")
        .update({ end_time: newTimestamp.toISOString() })
        .eq("id", lastEntry.id);

      if (updateError) {
        console.error("Error updating downtime period:", updateError);
      }
    }
  } catch (error) {
    console.error("Error inserting status:", error);
  }
};
