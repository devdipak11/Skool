import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Users, BookOpen, Megaphone, UserCircle2, ChevronDown, ChevronUp, MessageSquare, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminSubjectDetail() {
  const { subjectId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [comments, setComments] = useState<{ [announcementId: string]: any[] }>({});
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState<{ [announcementId: string]: boolean }>({});
  const [expandedComments, setExpandedComments] = useState<{ [announcementId: string]: boolean }>({});

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`/api/admin/subjects/${subjectId}/details`, { headers: authHeader });
        const data = await res.json();
        setSubject(data.subject);
        setFaculty(data.faculty);
        setStudents(data.students || []);
        const annRes = await fetch(`/api/admin/subjects/${subjectId}/announcements`, { headers: authHeader });
        const annData = await annRes.json();
        setAnnouncements(Array.isArray(annData) ? annData : []);
      } catch {
        setSubject(null);
        setFaculty(null);
        setStudents([]);
        setAnnouncements([]);
      }
      setLoading(false);
    };
    if (subjectId) fetchDetails();
  }, [subjectId, token]);

  const fetchComments = async (announcementId: string) => {
    setCommentsLoading(prev => ({ ...prev, [announcementId]: true }));
    try {
      const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/admin/announcements/${announcementId}/comments`, { headers: authHeader });
      const data = await res.json();
      setComments(prev => ({ ...prev, [announcementId]: data }));
    } catch {
      setComments(prev => ({ ...prev, [announcementId]: [] }));
    } finally {
      setCommentsLoading(prev => ({ ...prev, [announcementId]: false }));
    }
  };

  const toggleComments = (announcementId: string) => {
    setExpandedComments(prev => {
      const next = { ...prev, [announcementId]: !prev[announcementId] };
      if (next[announcementId] && !comments[announcementId]) {
        fetchComments(announcementId);
      }
      return next;
    });
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!subject) return <div className="p-8 text-center text-muted-foreground">Subject not found.</div>;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-8">
      {/* Back Button */}
      <button
        className="flex items-center gap-2 text-blue-600 hover:underline mb-2 text-sm font-medium"
        onClick={() => navigate('/admin')}
        aria-label="Back to Subject Management"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Subject Management
      </button>
      {/* Subject Header */}
      <div className="flex items-center gap-4 mb-2">
        <BookOpen className="w-10 h-10 text-primary" />
        <div>
          <h1 className="text-3xl font-bold leading-tight">{subject.name} <span className="text-lg font-normal text-muted-foreground">({subject.code})</span></h1>
          <div className="text-sm text-muted-foreground mt-1">Class: <span className="font-medium text-foreground">{subject.className}</span> &nbsp;|&nbsp; Faculty: <span className="font-medium text-foreground">{faculty?.name || 'Unassigned'}</span></div>
        </div>
      </div>

      {/* Students Card */}
      <Card className="shadow-card border-primary/30">
        <CardContent className="py-4 px-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-lg">Enrolled Students <span className="text-xs text-muted-foreground">({students.length})</span></span>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 mt-2">
            {students.map((s: any) => (
              <li key={s._id} className="flex items-center gap-2 text-sm">
                <UserCircle2 className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-foreground">{s.name}</span>
                <span className="text-xs text-muted-foreground">({s.rollNo})</span>
              </li>
            ))}
            {students.length === 0 && <li className="text-muted-foreground text-sm">No students enrolled.</li>}
          </ul>
        </CardContent>
      </Card>

      {/* Announcements Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Megaphone className="w-5 h-5 text-orange-500" />
          <span className="font-semibold text-lg">Announcements</span>
        </div>
        <div className="space-y-6">
          {announcements.length === 0 ? (
            <Card className="shadow-none border-dashed border-2 border-muted-foreground/20">
              <CardContent className="p-6 text-center text-muted-foreground">No announcements yet.</CardContent>
            </Card>
          ) : (
            announcements
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((a: any) => (
                <Card key={a._id} className="shadow-card border border-muted-foreground/10">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <UserCircle2 className="w-5 h-5 text-primary" />
                      <span className="font-semibold">{a.faculty?.name || 'Faculty'}</span>
                      <span className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="text-base whitespace-pre-line mb-2">{a.content}</div>
                    <div className="w-full h-px bg-gray-200 my-3" />
                    <button
                      className="text-blue-600 font-medium text-sm flex items-center gap-1 hover:underline w-fit"
                      type="button"
                      onClick={() => toggleComments(a._id)}
                    >
                      <MessageSquare className="w-4 h-4" />
                      {comments[a._id]?.length !== undefined
                        ? `${comments[a._id].length} class comments`
                        : commentsLoading[a._id] ? <Loader2 className="w-3 h-3 animate-spin" /> : 'View comments'}
                      {expandedComments[a._id] ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                    </button>
                    {expandedComments[a._id] && (
                      <div className="border rounded bg-gray-50 p-3 mt-2">
                        {commentsLoading[a._id] ? (
                          <div className="text-xs text-muted-foreground">Loading comments...</div>
                        ) : comments[a._id] && comments[a._id].length > 0 ? (
                          comments[a._id]
                            .sort((c1, c2) => new Date(c1.createdAt).getTime() - new Date(c2.createdAt).getTime())
                            .map((c: any) => {
                              const isFaculty = !!c.facultyId;
                              const displayName = isFaculty
                                ? c.facultyId?.name || "Faculty"
                                : c.studentId?.name || "Student";
                              const avatarLetter = isFaculty
                                ? (c.facultyId?.name ? c.facultyId.name[0].toUpperCase() : "F")
                                : (c.studentId?.name ? c.studentId.name[0].toUpperCase() : "?");
                              const title = isFaculty ? "Faculty" : "Student";
                              return (
                                <div key={c._id} className="flex items-start gap-2 mb-3 relative">
                                  <div className="rounded-full bg-gray-300 text-gray-700 w-7 h-7 flex items-center justify-center font-bold text-base">
                                    {avatarLetter}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-sm">{displayName}</span>
                                      <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                      <span className="ml-2 text-xs text-blue-700 font-semibold">{title}</span>
                                    </div>
                                    <div className="text-sm mt-1 whitespace-pre-line">{c.content}</div>
                                  </div>
                                </div>
                              );
                            })
                        ) : (
                          <div className="text-xs text-muted-foreground">No comments yet.</div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
