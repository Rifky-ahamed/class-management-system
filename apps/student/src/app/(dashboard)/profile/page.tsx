import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Phone, MapPin, GraduationCap } from "lucide-react";
import { getStudentProfile } from "@/features/student/student.service";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const data = await getStudentProfile();

  if (!data || !data.profile) {
    // If not found or not logged in
    redirect("/auth/login");
  }

  const { profile } = data;
  
  // Format initials
  const initials = profile.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  // Extract batch/class info from the junction table
  const currentBatchRecord = profile.student_batch?.[0];
  const batchName = currentBatchRecord?.batch?.name ?? "No Batch Assigned";
  const className = currentBatchRecord?.batch?.class?.class ?? "No Class Assigned";
  const enrolledAt = currentBatchRecord?.enrolled_at 
    ? new Date(currentBatchRecord.enrolled_at).toLocaleDateString()
    : "N/A";
  const dob = profile.dob ? new Date(profile.dob).toLocaleDateString() : "Not Provided";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your personal details.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column - Avatar and basic info */}
        <Card className="col-span-1 border-edu-200/50 dark:border-edu-800/50 shadow-sm flex flex-col items-center p-6 text-center">
          <Avatar className="w-32 h-32 mb-4 border-4 border-primary/10">
            <AvatarImage src="" />
            <AvatarFallback className="text-4xl bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold">{profile.name}</h2>
          <p className="text-muted-foreground text-sm truncate w-full px-4">{profile.email}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
              {className} - {batchName}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${profile.is_active ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
              {profile.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <Button variant="outline" className="mt-6 w-full">Edit Profile</Button>
        </Card>

        {/* Right column - Detailed info */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Full Name</div>
                  <div className="font-medium">{profile.name}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Date of Birth</div>
                  <div className="font-medium">{dob}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Status</div>
                  <div className="font-medium">{profile.is_registered ? "Registered" : "Pending Registration"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Student ID</div>
                  <div className="font-medium font-mono text-xs truncate" title={profile.id}>{profile.id.split('-')[0]}...</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Contact Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Email
                  </div>
                  <div className="font-medium">{profile.email}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Phone
                  </div>
                  <div className="font-medium">{profile.phone || "Not Provided"}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Academic Enrollment
              </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Enrolled Class</div>
                  <div className="font-medium">{className} - {batchName}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Joined Date</div>
                  <div className="font-medium">{enrolledAt}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
