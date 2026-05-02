"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const supabase = createClient();

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_COLORS: Record<number, string> = {
  0: "bg-rose-50 text-rose-700 border-rose-200",
  1: "bg-blue-50 text-blue-700 border-blue-200",
  2: "bg-violet-50 text-violet-700 border-violet-200",
  3: "bg-amber-50 text-amber-700 border-amber-200",
  4: "bg-teal-50 text-teal-700 border-teal-200",
  5: "bg-green-50 text-green-700 border-green-200",
  6: "bg-orange-50 text-orange-700 border-orange-200",
};

type ScheduleItem = {
  id: string;
  batch_name: string;
  class_name: string;
  subject_name: string | null;
  start_time: string;
  end_time: string;
  room: string | null;
  day_of_week: number;
};

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.email) {
      setLoading(false);
      return;
    }

    const { data: teacherData, error: teacherError } = await supabase
      .from("teachers")
      .select("id")
      .eq("email", user.email)
      .single();

    if (teacherError || !teacherData) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("class_schedule")
      .select(`
        id, start_time, end_time, room, day_of_week,
        batch:batch_id (
          name,
          class:class_id ( class ),
          subject:subject_id ( name )
        )
      `)
      .eq("teacher_id", teacherData.id)
      .eq("is_active", true)
      .order("start_time");

    if (error || !data) {
      console.error("Schedule fetch error:", error);
      setLoading(false);
      return;
    }

    const mapped: ScheduleItem[] = data.map((s: any) => ({
      id: s.id,
      batch_name: s.batch?.name || "—",
      class_name: s.batch?.class?.class || "—",
      subject_name: s.batch?.subject?.name || null,
      start_time: s.start_time,
      end_time: s.end_time,
      room: s.room,
      day_of_week: s.day_of_week,
    }));

    setSchedules(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  function formatTime(t: string) {
    if (!t) return "—";
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  }

  // Group schedules by day
  const scheduleByDay = DAYS.map((day, index) => {
    return {
      day,
      dayIndex: index,
      items: schedules.filter(s => s.day_of_week === index).sort((a, b) => a.start_time.localeCompare(b.start_time))
    };
  }).filter(group => group.items.length > 0);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">My Schedule</h1>
        <p className="text-sm text-neutral-500 mt-1">View your weekly timetable and assigned class times.</p>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2].map(i => (
            <Card key={i}>
              <CardHeader className="py-4 px-6 border-b border-neutral-100">
                <Skeleton className="h-6 w-32 rounded-md" />
              </CardHeader>
              <CardContent className="p-6">
                <Skeleton className="h-16 w-full rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : scheduleByDay.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-4xl mb-3 opacity-30">🗓️</p>
            <p className="text-[14px] font-semibold text-neutral-600">Your schedule is empty.</p>
            <p className="text-[12px] text-neutral-400 mt-1">No active classes assigned to your timetable.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {scheduleByDay.map(({ day, dayIndex, items }) => {
            const today = new Date().getDay();
            const isToday = today === dayIndex;

            return (
              <Card key={day} className={`overflow-hidden ${isToday ? 'border-edu-300 shadow-md ring-1 ring-edu-100' : ''}`}>
                <CardHeader className="py-3 px-5 border-b border-neutral-100 bg-neutral-50/50 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${DAY_COLORS[dayIndex]}`}>
                      {day}
                    </span>
                    {isToday && (
                      <span className="text-[10px] font-bold text-edu-600 animate-pulse">TODAY</span>
                    )}
                  </div>
                  <span className="text-[12px] font-medium text-neutral-400">
                    {items.length} {items.length === 1 ? 'class' : 'classes'}
                  </span>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-neutral-100">
                    {items.map(item => (
                      <div key={item.id} className="p-5 flex flex-col sm:flex-row gap-4 hover:bg-neutral-50 transition-colors">
                        <div className="w-32 flex-shrink-0">
                          <p className="text-[13px] font-bold text-neutral-900 font-mono">
                            {formatTime(item.start_time)}
                          </p>
                          <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                            to {formatTime(item.end_time)}
                          </p>
                        </div>
                        
                        <div className="w-0.5 bg-neutral-200 hidden sm:block rounded-full"></div>
                        
                        <div className="flex-1">
                          <h4 className="text-[15px] font-bold text-neutral-900 leading-tight mb-1.5">
                            {item.batch_name}
                          </h4>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200 px-2 py-0.5 rounded-full">
                              {item.class_name}
                            </span>
                            {item.subject_name && (
                              <span className="text-[10px] font-semibold bg-edu-50 text-edu-700 border border-edu-200/70 px-2 py-0.5 rounded-full">
                                {item.subject_name}
                              </span>
                            )}
                            {item.room && (
                              <span className="text-[10px] font-medium text-neutral-500 ml-2">
                                📍 Room {item.room}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
