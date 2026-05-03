"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, UserCircle, MessageCircle } from "lucide-react";
import { toast } from "sonner";

const supabase = createClient();

type TeacherContact = {
  id: string;
  name: string;
  email: string;
  subjects: string[];
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

export default function StudentMessagesPage() {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<TeacherContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherContact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadContacts() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;

      const { data: student } = await supabase
        .from("student")
        .select("id, student_batch(batch_id)")
        .eq("email", user.email)
        .single();

      if (!student) return;
      setStudentId(student.id);

      const batchIds = student.student_batch?.map((sb: any) => sb.batch_id) || [];
      if (batchIds.length === 0) {
        setLoadingContacts(false);
        return;
      }

      // Get teachers for these batches
      const { data: schedules } = await supabase
        .from("class_schedule")
        .select(`
          teacher_id,
          teachers(id, name, email),
          batch(subject(name))
        `)
        .in("batch_id", batchIds)
        .eq("is_active", true);

      if (schedules) {
        const teacherMap = new Map<string, TeacherContact>();
        schedules.forEach((s: any) => {
          if (!s.teachers) return;
          const t = Array.isArray(s.teachers) ? s.teachers[0] : s.teachers;
          if (!t || !t.id) return;
          if (!teacherMap.has(t.id)) {
            teacherMap.set(t.id, { id: t.id, name: t.name, email: t.email, subjects: [] });
          }
          const subjectName = s.batch?.subject?.name;
          if (subjectName && !teacherMap.get(t.id)?.subjects.includes(subjectName)) {
            teacherMap.get(t.id)?.subjects.push(subjectName);
          }
        });
        setContacts(Array.from(teacherMap.values()));
      }
      setLoadingContacts(false);
    }
    loadContacts();
  }, []);

  const fetchMessages = useCallback(async (targetTeacherId: string, currentStudentId: string) => {
    if (!currentStudentId) return;
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("student_id", currentStudentId)
      .eq("teacher_id", targetTeacherId)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Fetch error: " + error.message);
      console.error(error);
    }
    
    if (data) {
      setMessages(data as Message[]);
    } else {
      setMessages([]);
    }
    
    // Mark as read if any are from teacher and unread
    const unread = data?.filter(m => m.sender_type === "teacher" && !m.is_read) || [];
    if (unread.length > 0) {
      const ids = unread.map(m => m.id);
      await supabase.from("messages").update({ is_read: true }).in("id", ids);
    }
  }, []);

  useEffect(() => {
    if (!selectedTeacher || !studentId) return;
    
    setLoadingMessages(true);
    fetchMessages(selectedTeacher.id, studentId).finally(() => setLoadingMessages(false));

    // Subscribe to realtime database changes
    const channel = supabase
      .channel(`student-messages-${studentId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERTs and UPDATEs
          schema: 'public',
          table: 'messages',
          filter: `student_id=eq.${studentId}`, // Strictly scope to this student
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as Message;
            if (newMessage.teacher_id === selectedTeacher.id) {
              setMessages((prev) => {
                if (prev.some(m => m.id === newMessage.id)) return prev;
                return [...prev, newMessage];
              });
              
              // If it's a new incoming message from the teacher, instantly mark as read
              if (newMessage.sender_type === "teacher" && !newMessage.is_read) {
                supabase.from("messages").update({ is_read: true }).eq("id", newMessage.id).then();
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedMessage = payload.new as Message;
            if (updatedMessage.teacher_id === selectedTeacher.id) {
              setMessages((prev) => prev.map(m => m.id === updatedMessage.id ? updatedMessage : m));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTeacher, studentId, fetchMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTeacher || !studentId) return;

    setSending(true);
    const payload = {
      student_id: studentId,
      teacher_id: selectedTeacher.id,
      sender_type: "student",
      content: newMessage.trim(),
    };

    const { error } = await supabase.from("messages").insert(payload);
    if (!error) {
      setNewMessage("");
      await fetchMessages(selectedTeacher.id, studentId);
    } else {
      toast.error("Failed to send message.");
    }
    setSending(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-neutral-900">Messages</h1>
        <p className="text-sm text-neutral-500">Communicate directly with your assigned teachers.</p>
      </div>

      <div className="flex flex-1 overflow-hidden border border-neutral-200 rounded-xl bg-white shadow-sm">
        {/* Left Sidebar - Contact List */}
        <div className="w-80 border-r border-neutral-100 flex flex-col bg-neutral-50/30">
          <div className="p-4 border-b border-neutral-100">
            <h3 className="font-semibold text-neutral-800 text-sm">Your Teachers</h3>
          </div>
          <ScrollArea className="flex-1">
            {loadingContacts ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
              </div>
            ) : contacts.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">
                <UserCircle className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No teachers assigned to your current batches.</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {contacts.map(teacher => (
                  <button
                    key={teacher.id}
                    onClick={() => setSelectedTeacher(teacher)}
                    className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${
                      selectedTeacher?.id === teacher.id 
                        ? 'bg-edu-50 border border-edu-200 shadow-sm' 
                        : 'hover:bg-neutral-100 border border-transparent'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-edu-100 flex items-center justify-center text-edu-700 font-bold">
                      {teacher.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-semibold text-sm text-neutral-900 truncate">{teacher.name}</p>
                      <p className="text-xs text-neutral-500 truncate">
                        {teacher.subjects.join(", ") || "General"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right Content - Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {!selectedTeacher ? (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-400">
              <MessageCircle className="w-16 h-16 opacity-20 mb-4" />
              <p className="font-medium text-neutral-600">Select a teacher to start messaging</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-neutral-100 flex items-center gap-3 bg-white">
                <div className="w-10 h-10 rounded-full bg-edu-100 flex items-center justify-center text-edu-700 font-bold">
                  {selectedTeacher.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900">{selectedTeacher.name}</h3>
                  <p className="text-xs text-neutral-500">T: {selectedTeacher.id.slice(0,8)} | S: {studentId?.slice(0,8)}</p>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 bg-neutral-50" ref={scrollRef}>
                {loadingMessages ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-1/2 rounded-xl" />
                    <Skeleton className="h-12 w-1/3 rounded-xl ml-auto" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-400 space-y-2">
                    <p className="text-sm">No messages yet. Send a message to start the conversation.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isMe = msg.sender_type === "student";
                      return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div 
                            className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-[14px] ${
                              isMe 
                                ? 'bg-edu-600 text-white rounded-br-sm shadow-sm' 
                                : 'bg-white border border-neutral-200 text-neutral-800 rounded-bl-sm shadow-sm'
                            }`}
                          >
                            {msg.content}
                          </div>
                          <span className="text-[10px] text-neutral-400 mt-1 px-1">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {isMe && <span className="ml-1 text-edu-600 font-bold">{msg.is_read ? '✓✓' : '✓'}</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-neutral-100">
                <form onSubmit={handleSend} className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
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
