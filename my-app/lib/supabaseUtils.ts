import { supabase } from "@/lib/supabaseClient";

const groupByDay = (data: any[]) => {
  const groupedData: Record<
    string,
    {
      status: string;
      date: string;
      downtimePeriods: { start_time: string; end_time: string | null }[];
    }
  > = {};

  let currentStart: string | null = null;
  let lastStatus: string | null = null;

  data.forEach((entry) => {
    const date = new Date(entry.start_time);
    const dateStr = date.toISOString().split("T")[0];

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

  let lastRecordedEntry = Object.values(groupedData)
    .sort((a, b) => a.date.localeCompare(b.date))
    .pop();

  if (lastRecordedEntry && lastRecordedEntry.downtimePeriods.length > 0) {
    let lastDowntime =
      lastRecordedEntry.downtimePeriods[
        lastRecordedEntry.downtimePeriods.length - 1
      ];

    if (lastDowntime.end_time === null) {
      let lastDate = lastRecordedEntry.date;
      let lastStatus = lastRecordedEntry.status;
      let currentDate = new Date(lastDate);
      let today = new Date();

      while (currentDate < today) {
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        let nextDateStr = currentDate.toISOString().split("T")[0];
        console.log(nextDateStr);
        groupedData[nextDateStr] = {
          status: lastStatus,
          date: nextDateStr,
          downtimePeriods: [
            {
              start_time: nextDateStr + "T00:00:00Z",
              end_time: null,
            },
          ],
        };
      }
    }
  }

  Object.values(groupedData).forEach((day) => {
    if (day.downtimePeriods.length > 0) {
      day.status = "down";
    }
  });

  return Object.values(groupedData).reverse();
};

export const fetchStatusHistory = async (numDays: number) => {
  const { data, error } = await supabase
    .from("status_history")
    .select("status, start_time, end_time")
    .gte(
      "start_time",
      new Date(Date.now() - numDays * 24 * 60 * 60 * 1000).toISOString()
    )
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching status history:", error);
    return [];
  }
  const res = groupByDay(data);
  console.log("res", res);
  return res;
};

export const fetchStatus = async () => {
  try {
    let forceDowntime = false;
    let newStatus;
    const newTimestamp = new Date();

    if (forceDowntime) {
      console.warn("Simulating manual downtime...");
      newStatus = "down";
    } else {
      const res = await fetch("/api/status");
      if (!res.ok) {
        console.warn(`API Request Failed: ${res.status}`);
        return;
      }

      const data = await res.json();
      newStatus = data?.status || "down";
    }
    const newDateStr = newTimestamp.toISOString().split("T")[0];

    const { data: lastEntry } = await supabase
      .from("status_history")
      .select("id, status, start_time")
      .order("start_time", { ascending: false })
      .limit(1)
      .single();

    // only insert if status has changed
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
      console.log("le", lastEntry);
      const { error: updateError } = await supabase
        .from("status_history")
        .update({ end_time: newTimestamp.toISOString() })
        .eq("id", lastEntry.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (updateError) {
        console.error("Error updating downtime period:", updateError);
      }
    }
  } catch (error) {
    console.error("Error inserting status:", error);
  }
};
