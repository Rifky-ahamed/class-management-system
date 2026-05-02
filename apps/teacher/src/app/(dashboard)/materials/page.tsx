"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LinkIcon, Trash2, Plus, FolderOpen, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

const supabase = createClient();

type StudyMaterial = {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  created_at: string;
  batch_name: string;
  class_name: string;
};

type TeacherBatch = {
  id: string;
  name: string;
  class_name: string;
};

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [batches, setBatches] = useState<TeacherBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState<string | null>(null);

  // Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    file_url: "",
    batch_id: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      setLoading(false);
      return;
    }

    const { data: teacherData } = await supabase
      .from("teachers")
      .select("id")
      .eq("email", user.email)
      .single();

    if (!teacherData) {
      setLoading(false);
      return;
    }

    setTeacherId(teacherData.id);

    // Fetch batches for the dropdown
    const { data: batchData } = await supabase
      .from("batch")
      .select(`
        id, name,
        class:class_id ( class )
      `)
      .eq("teacher_id", teacherData.id)
      .eq("is_active", true)
      .order("name");

    if (batchData) {
      setBatches(batchData.map((b: any) => ({
        id: b.id,
        name: b.name,
        class_name: b.class?.class || "Unknown",
      })));
    }

    // Fetch materials
    const { data: matData } = await supabase
      .from("study_materials")
      .select(`
        id, title, description, file_url, created_at,
        batch:batch_id (
          name,
          class:class_id ( class )
        )
      `)
      .eq("teacher_id", teacherData.id)
      .order("created_at", { ascending: false });

    if (matData) {
      setMaterials(matData.map((m: any) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        file_url: m.file_url,
        created_at: m.created_at,
        batch_name: m.batch?.name || "—",
        class_name: m.batch?.class?.class || "—",
      })));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId || !formData.title || !formData.batch_id || !formData.file_url) return;

    setIsSubmitting(true);
    const payload = {
      title: formData.title,
      description: formData.description || null,
      file_url: formData.file_url,
      batch_id: formData.batch_id,
      teacher_id: teacherId,
    };

    const { error } = await supabase.from("study_materials").insert(payload);

    if (!error) {
      setIsDialogOpen(false);
      setFormData({ title: "", description: "", file_url: "", batch_id: "" });
      fetchData(); // Refresh list
    } else {
      console.error("Failed to create material", error);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;
    const { error } = await supabase.from("study_materials").delete().eq("id", id);
    if (!error) {
      setMaterials(prev => prev.filter(m => m.id !== id));
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Study Materials</h1>
          <p className="text-sm text-neutral-500 mt-1">Upload notes, PDFs, and resources for students via external links.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-edu-600 hover:bg-edu-700 text-white rounded-xl shadow-sm gap-2">
              <Plus className="w-4 h-4" />
              Add Material Link
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Study Material</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateMaterial} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="batch">Select Batch <span className="text-red-500">*</span></Label>
                <select
                  id="batch"
                  required
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.batch_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, batch_id: e.target.value }))}
                >
                  <option value="" disabled>Select a batch...</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.class_name})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  required
                  placeholder="e.g. Chapter 1 Slides"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL Link <span className="text-red-500">*</span></Label>
                <Input
                  id="url"
                  type="url"
                  required
                  placeholder="e.g. https://drive.google.com/..."
                  value={formData.file_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, file_url: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description (Optional)</Label>
                <Textarea
                  id="desc"
                  placeholder="Brief summary of the material..."
                  className="resize-none h-24"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <DialogFooter className="mt-6">
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-edu-600 hover:bg-edu-700">
                  {isSubmitting ? "Adding..." : "Add Material"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-5 w-3/4 rounded-md mb-2" />
                <Skeleton className="h-4 w-1/2 rounded-md mb-6" />
                <Skeleton className="h-10 w-full rounded-md mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : materials.length === 0 ? (
        <Card className="border-dashed border-neutral-200">
          <CardContent className="py-20 text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-neutral-400" />
            </div>
            <p className="text-[15px] font-bold text-neutral-900">No Study Materials Found</p>
            <p className="text-[13px] text-neutral-500 mt-1 max-w-sm mx-auto">
              Share Google Drive links, PDFs, or YouTube videos with your students by clicking the button above.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {materials.map((material) => (
            <Card key={material.id} className="flex flex-col hover:shadow-md transition-all group">
              <CardHeader className="px-5 py-4 border-b border-neutral-100 bg-neutral-50/50 flex-row items-start justify-between space-y-0">
                <div className="flex flex-col gap-1.5">
                  <Badge variant="outline" className="w-fit bg-white text-edu-700 border-edu-200 text-[10px]">
                    {material.class_name} • {material.batch_name}
                  </Badge>
                  <h3 className="text-[15px] font-bold text-neutral-900 leading-tight line-clamp-2" title={material.title}>
                    {material.title}
                  </h3>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-neutral-400 hover:text-red-600 hover:bg-red-50 -mr-2 -mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(material.id)}
                  title="Delete Material"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-5 flex flex-col flex-1">
                <p className="text-[13px] text-neutral-600 line-clamp-3 flex-1 mb-4">
                  {material.description || <span className="italic text-neutral-400">No description provided.</span>}
                </p>
                
                <div className="pt-4 border-t border-neutral-100 mt-auto">
                  <Button variant="outline" className="w-full gap-2 bg-neutral-50 hover:bg-neutral-100 text-edu-700 hover:text-edu-800 border-edu-200" asChild>
                    <a href={material.file_url} target="_blank" rel="noopener noreferrer">
                      <LinkIcon className="w-4 h-4" />
                      Open Resource
                      <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
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
