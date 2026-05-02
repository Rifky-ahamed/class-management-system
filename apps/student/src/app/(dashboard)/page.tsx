import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Bell, FileText, Clock } from "lucide-react";
import { getStudentDashboard } from "@/features/student/student.service";
import { redirect } from "next/navigation";

// Utility to format time "10:00:00" -> "10:00 AM"
const formatTime = (timeString: string) => {
  if (!timeString) return "";
  const [hourString, minute] = timeString.split(":");
  let hour = parseInt(hourString, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  hour = hour ? hour : 12; // the hour '0' should be '12'
  return `${hour.toString().padStart(2, "0")}:${minute} ${ampm}`;
};

export default async function StudentDashboard() {
  const data = await getStudentDashboard();

  if (!data) {
    redirect("/auth/login");
  }

  const { todayClasses, notices, recentExams, profile } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {profile.name}! Here's what's happening today.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Today's Classes */}
        <Card className="col-span-1 border-edu-200/50 dark:border-edu-800/50 shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-edu-500" />
              Today's Classes
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <div className="space-y-4 mt-4">
              {todayClasses.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No classes scheduled for today.</p>
              ) : (
                todayClasses.map((cls) => {
                  // Determine status roughly based on current time
                  const now = new Date();
                  const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
                  
                  const [startH, startM] = cls.start_time.split(":");
                  const startMinutes = parseInt(startH) * 60 + parseInt(startM);
                  
                  const [endH, endM] = cls.end_time.split(":");
                  const endMinutes = parseInt(endH) * 60 + parseInt(endM);

                  let status = "Upcoming";
                  if (currentTotalMinutes >= startMinutes && currentTotalMinutes <= endMinutes) status = "Ongoing";
                  if (currentTotalMinutes > endMinutes) status = "Completed";

                  return (
                    <div key={cls.id} className="flex flex-col gap-1 p-3 rounded-lg border bg-card">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{cls.room || "Classroom"}</span>
                        <Badge variant={status === "Ongoing" ? "default" : status === "Completed" ? "outline" : "secondary"}>
                          {status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {formatTime(cls.start_time)} - {formatTime(cls.end_time)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        by {cls.teachers?.name || "Unknown Teacher"}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Notices */}
        <Card className="col-span-1 border-edu-200/50 dark:border-edu-800/50 shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Bell className="h-5 w-5 text-edu-500" />
              Recent Notices
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <div className="space-y-4 mt-4">
              {notices.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No recent notices.</p>
              ) : (
                notices.map((notice) => (
                  <div key={notice.id} className="flex flex-col gap-1 p-3 rounded-lg border bg-card">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-sm line-clamp-2">{notice.title}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {notice.target_audience}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(notice.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Exam Marks */}
        <Card className="col-span-1 border-edu-200/50 dark:border-edu-800/50 shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-edu-500" />
              Recent Exam Results
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <div className="space-y-4 mt-4">
              {recentExams.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No recent exam results published.</p>
              ) : (
                recentExams.map((exam) => (
                  <div key={exam.id} className="flex flex-col gap-1 p-3 rounded-lg border bg-card">
                    <span className="font-semibold text-sm">{exam.exam_name}</span>
                    <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                      <span>{new Date(exam.created_at).toLocaleDateString()}</span>
                      <span className="font-medium text-foreground">
                        {exam.marks_obtained} / {exam.total_marks}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}