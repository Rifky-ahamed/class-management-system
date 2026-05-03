import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getNotices } from "@/features/student/student.service";

export const dynamic = "force-dynamic";

export default async function NoticesPage() {
  const notices = await getNotices();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notices</h1>
        <p className="text-muted-foreground mt-2">
          Important announcements and updates from the institute.
        </p>
      </div>

      <div className="space-y-4">
        {notices.length === 0 ? (
          <Card>
             <CardContent className="py-6 text-center text-muted-foreground italic text-sm">
               No notices available.
             </CardContent>
          </Card>
        ) : (
          notices.map((notice) => (
            <Card key={notice.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl font-semibold">{notice.title}</CardTitle>
                  <Badge variant={notice.target_audience === "all" ? "destructive" : "secondary"}>
                    {notice.target_audience === "all" ? "General" : "Batch"}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {new Date(notice.created_at).toLocaleDateString()}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">{notice.content}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
