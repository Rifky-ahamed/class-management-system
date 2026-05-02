import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getStudentSchedule } from "@/features/student/student.service";
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

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface ScheduleSlot {
  time: string;
  subject: string;
  teacher: string;
  room: string;
}

export default async function SchedulePage() {
  const scheduleData = await getStudentSchedule();

  if (scheduleData === null) {
    redirect("/auth/login");
  }

  // Group by day of week
  const groupedSchedule = scheduleData.reduce((acc, curr) => {
    const dayName = daysOfWeek[curr.day_of_week];
    if (!acc[dayName]) acc[dayName] = [];
    acc[dayName].push({
      time: `${formatTime(curr.start_time)} - ${formatTime(curr.end_time)}`,
      subject: "General", // Placeholder if no explicit subject column
      teacher: curr.teachers?.name || "Unknown",
      room: curr.room || "TBA"
    });
    return acc;
  }, {} as Record<string, ScheduleSlot[]>);

  // Filter out days with no classes and sort by day_of_week order
  const activeDays = daysOfWeek.filter(day => groupedSchedule[day] && groupedSchedule[day].length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Schedule</h1>
        <p className="text-muted-foreground mt-2">
          Your weekly class timetable and subjects.
        </p>
      </div>

      <div className="space-y-6">
        {activeDays.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No classes scheduled for your batch at this time.
            </CardContent>
          </Card>
        ) : (
          activeDays.map((dayName) => (
            <Card key={dayName}>
              <CardHeader className="bg-muted/40 py-4">
                <CardTitle className="text-xl">{dayName}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Time</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead className="text-right">Room</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(groupedSchedule[dayName] || []).map((slot: ScheduleSlot, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium whitespace-nowrap">
                          <Badge variant="outline" className="font-mono bg-background">
                            {slot.time}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-foreground">{slot.teacher}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{slot.room}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
