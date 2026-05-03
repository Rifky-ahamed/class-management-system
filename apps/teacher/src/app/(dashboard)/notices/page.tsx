import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

async function getTeacherNotices() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return [];

  const { data: teacherData } = await supabase
    .from("teachers")
    .select("id")
    .eq("email", user.email)
    .single();

  if (!teacherData) return [];

  // Get batches this teacher teaches
  const { data: schedules } = await supabase
    .from("class_schedule")
    .select("batch_id")
    .eq("teacher_id", teacherData.id)
    .eq("is_active", true);

  const batchIds = schedules ? Array.from(new Set(schedules.map(s => s.batch_id))) : [];
  
  let query = supabase
    .from("notices")
    .select("*, batch:target_batch_id(name, class(class))")
    .order("created_at", { ascending: false });

  if (batchIds.length > 0) {
    const batchList = batchIds.join(",");
    query = query.or(`target_audience.eq.all,target_audience.eq.teachers,target_batch_id.in.(${batchList})`);
  } else {
    query = query.or("target_audience.eq.all,target_audience.eq.teachers");
  }

  const { data } = await query;
  return data || [];
}

export default async function NoticesPage() {
  const notices = await getTeacherNotices();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Notices</h1>
        <p className="text-sm text-neutral-500 mt-2">
          Important announcements and updates from the administration.
        </p>
      </div>

      <div className="space-y-4">
        {notices.length === 0 ? (
          <Card className="border-dashed border-neutral-200">
            <CardContent className="py-20 text-center">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl opacity-50">📢</span>
              </div>
              <p className="text-[15px] font-bold text-neutral-900">No notices found</p>
              <p className="text-[13px] text-neutral-500 mt-1 max-w-sm mx-auto">
                You're all caught up! There are no active announcements right now.
              </p>
            </CardContent>
          </Card>
        ) : (
          notices.map((notice) => (
            <Card key={notice.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="p-5 pb-3 bg-neutral-50/50 flex-row items-start justify-between border-b border-neutral-100">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant={notice.target_audience === "all" ? "default" : "secondary"} className="font-mono text-[10px] tracking-wider uppercase">
                      {notice.target_audience === "all" 
                        ? "General" 
                        : notice.target_audience === "teachers" 
                          ? "Teachers Only" 
                          : `Batch: ${notice.batch?.class?.class || ""} - ${notice.batch?.name || ""}`}
                    </Badge>
                    <span className="text-[11px] font-medium text-neutral-400">
                      {new Date(notice.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <CardTitle className="text-lg font-bold text-neutral-900 leading-tight">
                    {notice.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <p className="text-[14px] text-neutral-600 whitespace-pre-wrap leading-relaxed">
                  {notice.content}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
