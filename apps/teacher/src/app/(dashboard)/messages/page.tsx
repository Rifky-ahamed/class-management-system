"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, UserCircle, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import type { RealtimeChannel } from "@supabase/supabase-js";

const supabase = createClient();

type StudentContact = {
  id: string;
  name: string;
  email: string;
  batches: string[];
};

type Message = {
  id: string;
  teacher_id: string;
  student_id: string;
  sender_type: "teacher" | "student";
  content: string;
  is_read: boolean;
  created_at: string;
};

export default function TeacherMessagesPage() {
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<StudentContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);

  const [selectedStudent, setSelectedStudent] = useState<StudentContact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // ── 1. Load teacher identity + student contacts ─────────────────────────────
  useEffect(() => {
    async function loadContacts() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;

      const { data: teacher, error: teacherError } = await supabase
        .from("teachers")
        .select("id")
        .eq("email", user.email)
        .single();

      if (teacherError || !teacher) {
        console.error("Teacher fetch error:", teacherError?.message);
        setLoadingContacts(false);
        return;
      }

      setTeacherId(teacher.id);

      const { data: schedules, error: scheduleError } = await supabase
        .from("class_schedule")
        .select("batch_id")
        .eq("teacher_id", teacher.id)
        .eq("is_active", true);

      if (scheduleError) {
        console.error("Schedule fetch error:", scheduleError.message);
      }

      const batchIds: string[] = schedules
        ? Array.from(new Set(schedules.map((s: any) => s.batch_id)))
        : [];

      if (batchIds.length === 0) {
        setLoadingContacts(false);
        return;
      }

      const { data: studentBatches, error: sbError } = await supabase
        .from("student_batch")
        .select(`
          student(id, name, email),
          batch(name)
        `)
        .in("batch_id", batchIds);

      if (sbError) {
        console.error("Student batch fetch error:", sbError.message);
      }

      if (studentBatches) {
        const studentMap = new Map<string, StudentContact>();
        studentBatches.forEach((sb: any) => {
          if (!sb.student) return;
          const stu = Array.isArray(sb.student) ? sb.student[0] : sb.student;
          if (!stu?.id) return;
          if (!studentMap.has(stu.id)) {
            studentMap.set(stu.id, {
              id: stu.id,
              name: stu.name,
              email: stu.email,
              batches: [],
            });
          }
          const entry = studentMap.get(stu.id)!;
          if (sb.batch?.name && !entry.batches.includes(sb.batch.name)) {
            entry.batches.push(sb.batch.name);
          }
        });
        setContacts(
          Array.from(studentMap.values()).sort((a, b) =>
            a.name.localeCompare(b.name)
          )
        );
      }

      setLoadingContacts(false);
    }

    loadContacts();
  }, []);

  // ── 2. Fetch messages — ✅ with error logging ───────────────────────────────
  const fetchMessages = useCallback(
    async (targetStudentId: string, currentTeacherId: string) => {
      if (!currentTeacherId || !targetStudentId) return;

      const { data, error } = await supabase   // ✅ destructure error
        .from("messages")
        .select("*")
        .eq("teacher_id", currentTeacherId)
        .eq("student_id", targetStudentId)
        .order("created_at", { ascending: true });

      if (error) {
        // This surfaces RLS blocks, wrong IDs, etc.
        console.error("Messages fetch error:", error.message, error.details, error.hint);
        toast.error("Could not load messages: " + error.message);
        return;
      }

      setMessages((data as Message[]) ?? []);

      // Mark unread student messages as read
      const unreadIds =
        data
          ?.filter((m) => m.sender_type === "student" && !m.is_read)
          .map((m) => m.id) ?? [];

      if (unreadIds.length > 0) {
        const { error: updateError } = await supabase
          .from("messages")
          .update({ is_read: true })
          .in("id", unreadIds);
        if (updateError) {
          console.error("Mark-read error:", updateError.message);
        }
      }
    },
    []
  );

  // ── 3. Subscribe to realtime + initial fetch when student changes ───────────
  useEffect(() => {
    if (!selectedStudent || !teacherId) return;

    setMessages([]);           // clear stale messages immediately
    setLoadingMessages(true);

    fetchMessages(selectedStudent.id, teacherId).finally(() =>
      setLoadingMessages(false)
    );

    // Tear down previous channel before creating a new one
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // ✅ Unique channel name per student conversation
    const channel = supabase
      .channel(`teacher-msgs-${teacherId}-${selectedStudent.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `teacher_id=eq.${teacherId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          if (!msg || msg.student_id !== selectedStudent.id) return;

          if (payload.eventType === "INSERT") {
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev; // dedupe
              return [...prev, msg];
            });
            // Auto-mark incoming student messages as read
            if (msg.sender_type === "student" && !msg.is_read) {
              supabase
                .from("messages")
                .update({ is_read: true })
                .eq("id", msg.id)
                .then(({ error }) => {
                  if (error) console.error("Mark-read error:", error.message);
                });
            }
          } else if (payload.eventType === "UPDATE") {
            setMessages((prev) =>
              prev.map((m) => (m.id === msg.id ? msg : m))
            );
          }
        }
      )
      .subscribe((status, err) => {
        if (status === "CHANNEL_ERROR") {
          console.error("Realtime channel error:", err);
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [selectedStudent, teacherId, fetchMessages]);

  // ── 4. Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ── 5. Send message ─────────────────────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedStudent || !teacherId) return;

    setSending(true);

    const { error } = await supabase.from("messages").insert({
      teacher_id: teacherId,
      student_id: selectedStudent.id,
      sender_type: "teacher",
      content: newMessage.trim(),
    });

    if (error) {
      console.error("Send error:", error.message);
      toast.error("Failed to send message: " + error.message);
    } else {
      setNewMessage("");
      // Realtime will handle it, but fetch manually as fallback
      await fetchMessages(selectedStudent.id, teacherId);
    }

    setSending(false);
  };

  // ── UI ──────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-neutral-900">
          Student Messages
        </h1>
        <p className="text-sm text-neutral-500">
          Communicate directly with students from your batches.
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden border border-neutral-200 rounded-xl bg-white shadow-sm">
        {/* Sidebar */}
        <div className="w-80 border-r border-neutral-100 flex flex-col bg-neutral-50/30">
          <div className="p-4 border-b border-neutral-100">
            <h3 className="font-semibold text-neutral-800 text-sm">Your Students</h3>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              {contacts.length} enrolled
            </p>
          </div>
          <ScrollArea className="flex-1">
            {loadingContacts ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-md" />
                ))}
              </div>
            ) : contacts.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">
                <UserCircle className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No students found in your batches.</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {contacts.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${
                      selectedStudent?.id === student.id
                        ? "bg-edu-50 border border-edu-200 shadow-sm"
                        : "hover:bg-neutral-100 border border-transparent"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-edu-100 flex items-center justify-center text-edu-700 font-bold shrink-0">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-semibold text-sm text-neutral-900 truncate">
                        {student.name}
                      </p>
                      <p className="text-[11px] text-neutral-500 truncate">
                        {student.batches.join(", ") || "No Batch"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {!selectedStudent ? (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-400">
              <MessageCircle className="w-16 h-16 opacity-20 mb-4" />
              <p className="font-medium text-neutral-600">
                Select a student to start messaging
              </p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-neutral-100 flex items-center gap-3 bg-white">
                <div className="w-10 h-10 rounded-full bg-edu-100 flex items-center justify-center text-edu-700 font-bold">
                  {selectedStudent.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900">
                    {selectedStudent.name}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {selectedStudent.batches.join(", ") || "Student"}
                  </p>
                </div>
              </div>

              <div
                className="flex-1 overflow-y-auto p-4 bg-neutral-50"
                ref={scrollRef}
              >
                {loadingMessages ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-1/2 rounded-xl" />
                    <Skeleton className="h-12 w-1/3 rounded-xl ml-auto" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-neutral-400">
                    <p className="text-sm">
                      No messages yet. Send a message to start the conversation.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isMe = msg.sender_type === "teacher";
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${
                            isMe ? "items-end" : "items-start"
                          }`}
                        >
                          <div
                            className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-[14px] ${
                              isMe
                                ? "bg-edu-600 text-white rounded-br-sm shadow-sm"
                                : "bg-white border border-neutral-200 text-neutral-800 rounded-bl-sm shadow-sm"
                            }`}
                          >
                            {msg.content}
                          </div>
                          <span className="text-[10px] text-neutral-400 mt-1 px-1">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {isMe && (
                              <span className="ml-1 text-edu-600 font-bold">
                                {msg.is_read ? "✓✓" : "✓"}
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="p-4 bg-white border-t border-neutral-100">
                <form onSubmit={handleSend} className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 rounded-full px-4 border-neutral-200 focus-visible:ring-edu-500"
                    disabled={sending}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="rounded-full bg-edu-600 hover:bg-edu-700 text-white shrink-0"
                    disabled={!newMessage.trim() || sending}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}