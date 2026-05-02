import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getStudentAttendance } from "@/features/student/student.service";

export default async function AttendancePage() {
  const attendanceData = await getStudentAttendance();

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-500";
    if (percentage >= 75) return "bg-blue-500";
    if (percentage >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const overallPercentage = Math.round(
    attendanceData.reduce((acc, curr) => acc + curr.percentage, 0) / Math.max(attendanceData.length, 1)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Attendance</h1>
        <p className="text-muted-foreground mt-2">
          Check your attendance percentage per subject.
        </p>
      </div>

      <Card className="bg-primary text-primary-foreground border-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-primary-foreground/80">Overall Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold">{overallPercentage}%</span>
            <span className="text-primary-foreground/70 mb-1">Average</span>
          </div>
          <Progress 
            value={overallPercentage} 
            className="h-2 mt-4 bg-primary-foreground/20" 
          />
        </CardContent>
      </Card>

      {attendanceData.length === 0 ? (
        <Card>
           <CardContent className="py-8 text-center text-muted-foreground italic text-sm">
             No attendance records found. Your teachers haven't marked attendance yet.
           </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {attendanceData.map((data, idx) => (
            <Card key={idx}>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">{data.subject}</h3>
                  <span className={`font-bold text-lg ${
                    data.percentage >= 75 ? "text-green-500" : "text-red-500"
                  }`}>
                    {data.percentage}%
                  </span>
                </div>
                <Progress 
                  value={data.percentage} 
                  className="h-2"
                />
                <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
                  <span>Classes Attended: <span className="font-medium text-foreground">{data.present}</span></span>
                  <span>Total Classes: <span className="font-medium text-foreground">{data.total}</span></span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
