import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, File as FileIcon, Image as ImageIcon } from "lucide-react";
import { getStudyMaterials } from "@/features/student/student.service";

export default async function MaterialsPage() {
  const materials = await getStudyMaterials();

  const getIcon = (url: string) => {
    if (!url) return <FileIcon className="h-8 w-8 text-blue-500" />;
    const ext = url.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="h-8 w-8 text-red-500" />;
    if (['png', 'jpg', 'jpeg', 'gif'].includes(ext || '')) return <ImageIcon className="h-8 w-8 text-green-500" />;
    return <FileIcon className="h-8 w-8 text-blue-500" />;
  };

  const getFileType = (url: string) => {
    if (!url) return "Document";
    const ext = url.split('.').pop()?.toUpperCase() || "FILE";
    return ext;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Study Materials</h1>
        <p className="text-muted-foreground mt-2">
          Download notes and resources uploaded by your teachers.
        </p>
      </div>

      {materials.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No study materials uploaded for your batch yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {materials.map((material) => (
            <Card key={material.id} className="group hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-lg">
                      {getIcon(material.file_url)}
                    </div>
                    <div>
                      <h3 className="font-semibold line-clamp-1" title={material.title}>
                        {material.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {material.teachers?.name ? `By ${material.teachers.name}` : "General Material"}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="font-normal">{getFileType(material.file_url)}</Badge>
                  </div>
                  <span>{new Date(material.created_at).toLocaleDateString()}</span>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <Button variant="outline" className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-all" asChild>
                    <a href={material.file_url || "#"} target="_blank" rel="noreferrer">
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
