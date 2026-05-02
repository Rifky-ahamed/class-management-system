import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getExamResults } from "@/features/student/student.service";

export default async function ExamsPage() {
  const pastResults = await getExamResults();

  // In a real application, upcoming exams might be fetched from an `exams` table.
  // For now, we only have `exam_marks` which represents past graded results.
  const upcomingExams: any[] = [];

  const getGrade = (obtained: number, total: number) => {
    const percentage = (obtained / total) * 100;
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B+";
    if (percentage >= 60) return "B";
    if (percentage >= 50) return "C";
    return "F";
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Exams & Results</h1>
        <p className="text-muted-foreground mt-2">
          View your upcoming exams and check published results.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Upcoming Exams</h2>
        {upcomingExams.length === 0 ? (
           <Card>
             <CardContent className="py-6 text-center text-muted-foreground italic text-sm">
               No upcoming exams scheduled.
             </CardContent>
           </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingExams.map((exam) => (
              <Card key={exam.id} className="border-l-4 border-l-primary">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{exam.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">Syllabus: {exam.syllabus}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium text-foreground bg-muted px-2 py-1 rounded">
                      📅 {exam.date}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-foreground bg-muted px-2 py-1 rounded">
                      ⏰ {exam.time}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 pt-4">
        <h2 className="text-xl font-semibold tracking-tight">Past Results</h2>
        {pastResults.length === 0 ? (
          <Card>
             <CardContent className="py-6 text-center text-muted-foreground italic text-sm">
               No exam results published yet.
             </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Marks</TableHead>
                    <TableHead className="text-right">Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastResults.map((result) => {
                    const grade = getGrade(result.marks_obtained, result.total_marks);
                    return (
                      <TableRow key={result.id}>
                        <TableCell className="font-medium">{result.exam_name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(result.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {result.marks_obtained} / {result.total_marks}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={
                            grade.includes('A') ? 'bg-green-500/10 text-green-600 border-green-200' :
                            grade.includes('B') ? 'bg-blue-500/10 text-blue-600 border-blue-200' :
                            grade.includes('C') ? 'bg-yellow-500/10 text-yellow-600 border-yellow-200' :
                            'bg-red-500/10 text-red-600 border-red-200'
                          }>
                            {grade}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
