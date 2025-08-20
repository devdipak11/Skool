import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { MoreVertical, Loader2 } from 'lucide-react';
import { BACKEND_URL } from '@/utils/utils';

// Helper: Deterministic gradient assignment based on subject id or code
function getSubjectGradient(subject: any) {
  const gradients = [
    'linear-gradient(90deg, #5ba97b 60%, #3b5c6b 100%)', // green
    'linear-gradient(90deg, #4f8ef7 60%, #1e3c72 100%)', // blue
    'linear-gradient(90deg, #f7b42c 60%, #fc575e 100%)', // orange-red
    'linear-gradient(90deg, #a770ef 60%, #f6d365 100%)', // purple-yellow
    'linear-gradient(90deg, #43cea2 60%, #185a9d 100%)', // teal-blue
    'linear-gradient(90deg, #ff6a00 60%, #ee0979 100%)', // orange-pink
    'linear-gradient(90deg, #00c3ff 60%, #ffff1c 100%)', // blue-yellow
  ];
  // Use subject._id, subject.id, or subject.code for deterministic assignment
  const key = subject?._id || subject?.id || subject?.code || '';
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

export default function SubjectDetail() {
  const { id: subjectId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [subject, setSubject] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [announcementText, setAnnouncementText] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editAnnouncementId, setEditAnnouncementId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const [commentingId, setCommentingId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentsCount, setCommentsCount] = useState<{ [announcementId: string]: number }>({});
  const [comments, setComments] = useState<{ [announcementId: string]: any[] }>({});
  const [commentsLoading, setCommentsLoading] = useState<{ [announcementId: string]: boolean }>({});
  const [expandedComments, setExpandedComments] = useState<{ [announcementId: string]: boolean }>({});
  const [editCommentId, setEditCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [showAllStudents, setShowAllStudents] = useState(false);

  // Fetch subject details and announcements
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Subject details
        const subjectRes = await fetch(`${BACKEND_URL}/api/faculty/subjects/${subjectId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!subjectRes.ok) throw new Error('Failed to fetch subject details');
        const subjectData = await subjectRes.json();
        setSubject(subjectData.subject || subjectData);
        // Students (enrolled in this subject)
        if (subjectData.students) {
          setStudents(subjectData.students);
        } else if (subjectData.subject && subjectData.subject.students) {
          setStudents(subjectData.subject.students);
        } else {
          // fallback: fetch students for this subject
          const studentsRes = await fetch(`${BACKEND_URL}/api/faculty/subjects/${subjectId}/students`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          if (studentsRes.ok) {
            const studentsData = await studentsRes.json();
            setStudents(Array.isArray(studentsData) ? studentsData : []);
          } else {
            setStudents([]);
          }
        }
        // Announcements
        const annRes = await fetch(`${BACKEND_URL}/api/faculty/announcements/${subjectId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!annRes.ok) throw new Error('Failed to fetch announcements');
        const annData = await annRes.json();
        setAnnouncements(Array.isArray(annData) ? annData : []);
      } catch (err: any) {
        setError(err.message || 'Error loading data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [subjectId, token]);

  // Fetch comments count for each announcement
  useEffect(() => {
    const fetchCounts = async () => {
      if (!announcements.length || !token) return;
      const counts: { [announcementId: string]: number } = {};
      await Promise.all(
        announcements.map(async (a: any) => {
          try {
            const res = await fetch(`${BACKEND_URL}/api/comments/${a._id}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            if (res.ok) {
              const data = await res.json();
              counts[a._id] = Array.isArray(data) ? data.length : 0;
            } else {
              counts[a._id] = 0;
            }
          } catch {
            counts[a._id] = 0;
          }
        })
      );
      setCommentsCount(counts);
    };
    fetchCounts();
    // eslint-disable-next-line
  }, [announcements, token]);

  // Fetch comments for an announcement
  const fetchComments = async (announcementId: string) => {
    setCommentsLoading(prev => ({ ...prev, [announcementId]: true }));
    try {
      const res = await fetch(`${BACKEND_URL}/api/comments/${announcementId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error('Failed to fetch comments');
      const data = await res.json();
      setComments(prev => ({ ...prev, [announcementId]: data }));
    } catch {
      // Optionally handle error
    } finally {
      setCommentsLoading(prev => ({ ...prev, [announcementId]: false }));
    }
  };

  // Toggle comments visibility for an announcement
  const toggleComments = (announcementId: string) => {
    setExpandedComments(prev => {
      const next = { ...prev, [announcementId]: !prev[announcementId] };
      // If opening, fetch comments
      if (next[announcementId] && !comments[announcementId]) {
        fetchComments(announcementId);
      }
      return next;
    });
  };

  // Post new announcement
  const handlePostAnnouncement = async () => {
    if (!announcementText.trim()) return;
    setPosting(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/faculty/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ subjectId, content: announcementText }),
      });
      if (!res.ok) throw new Error('Failed to post announcement');
      setAnnouncementText('');
      // Refresh announcements
      const annRes = await fetch(`${BACKEND_URL}/api/faculty/announcements/${subjectId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const annData = await annRes.json();
      setAnnouncements(Array.isArray(annData) ? annData : []);
    } catch (err: any) {
      setError(err.message || 'Error posting announcement');
    } finally {
      setPosting(false);
    }
  };

  // Post comment handler (faculty can post as well)
  const handlePostComment = async (announcementId: string) => {
    if (!commentText.trim()) return;
    setCommentLoading(true);
    setCommentError(null);
    try {
      // Use faculty API for posting comment
      const res = await fetch(`${BACKEND_URL}/api/faculty/announcements/${announcementId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: commentText }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to post comment');
      }
      setCommentText('');
      setCommentingId(null);
      // Refresh comments count and comments for this announcement
      fetchComments(announcementId);
      setCommentsCount(prev => ({
        ...prev,
        [announcementId]: (prev[announcementId] || 0) + 1
      }));
    } catch (err: any) {
      setCommentError(err.message || 'Failed to post comment');
    } finally {
      setCommentLoading(false);
    }
  };

  // Edit comment handler (works for both faculty and student comments)
  const handleEditComment = async (announcementId: string, commentId: string) => {
    if (!editCommentText.trim()) return;
    setCommentLoading(true);
    setCommentError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: editCommentText }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to edit comment');
      }
      setEditCommentId(null);
      setEditCommentText('');
      fetchComments(announcementId);
    } catch (err: any) {
      setCommentError(err.message || 'Failed to edit comment');
    } finally {
      setCommentLoading(false);
    }
  };

  // Delete comment handler (works for both faculty and student comments)
  const handleDeleteComment = async (announcementId: string, commentId: string) => {
    setCommentLoading(true);
    setCommentError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete comment');
      }
      fetchComments(announcementId);
    } catch (err: any) {
      setCommentError(err.message || 'Failed to delete comment');
    } finally {
      setCommentLoading(false);
    }
  };

  // Handlers for menu
  const handleMenuOpen = (id: string) => setOpenMenuId(id);
  const handleMenuClose = () => setOpenMenuId(null);

  // Edit announcement handler
  const handleEdit = (announcement: any) => {
    setEditAnnouncementId(announcement._id);
    setEditContent(announcement.content);
    handleMenuClose();
    setTimeout(() => {
      editInputRef.current?.focus();
    }, 100);
  };

  // Save edited announcement
  const handleSaveEdit = async (announcement: any) => {
    if (!editContent.trim()) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/faculty/announcements`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          subjectId,
          announcementId: announcement._id,
          content: editContent,
        }),
      });
      if (!res.ok) throw new Error('Failed to update announcement');
      // Refresh announcements
      const annRes = await fetch(`${BACKEND_URL}/api/faculty/announcements/${subjectId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const annData = await annRes.json();
      setAnnouncements(Array.isArray(annData) ? annData : []);
      setEditAnnouncementId(null);
      setEditContent('');
    } catch (err: any) {
      alert(err.message || 'Error updating announcement');
    }
  };

  // Delete announcement handler
  const handleDelete = async (announcement: any) => {
    handleMenuClose();
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/faculty/announcements`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          subjectId,
          announcementId: announcement._id,
        }),
      });
      if (!res.ok) throw new Error('Failed to delete announcement');
      // Refresh announcements
      const annRes = await fetch(`${BACKEND_URL}/api/faculty/announcements/${subjectId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const annData = await annRes.json();
      setAnnouncements(Array.isArray(annData) ? annData : []);
    } catch (err: any) {
      alert(err.message || 'Error deleting announcement');
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Subject Info Card */}
      <div
        className="rounded-2xl shadow-md mb-6 flex items-center"
        style={{
          background: subject ? getSubjectGradient(subject) : 'linear-gradient(90deg, #23272f 60%, #2d3748 100%)',
          minHeight: '140px',
          padding: '2rem 2.5rem',
          position: 'relative',
        }}
      >
        <div className="flex-1">
          <div className="text-3xl md:text-4xl font-bold text-white mb-2">
            {subject?.name || 'Subject'}
          </div>
          <div className="text-lg text-white/90 mb-2">
            {subject?.code} · {subject?.className}
            {/* Removed Class Teacher badge */}
          </div>
          <div className="text-base text-white/80">
            Session: 2025-26 
          </div>
        </div>
      </div>
      {/* Students Card */}
      <Card className="shadow-card border-primary/30 mb-6">
        <CardContent className="py-4 px-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-lg">Enrolled Students <span className="text-xs text-muted-foreground">({students.length})</span></span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllStudents((prev: boolean) => !prev)}
              className="ml-2"
            >
              {showAllStudents ? 'Hide List' : 'See All Students'}
            </Button>
          </div>
          {showAllStudents && (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 mt-2">
              {[...students].sort((a, b) => {
                const rollA = parseInt(a.rollNo, 10);
                const rollB = parseInt(b.rollNo, 10);
                if (!isNaN(rollA) && !isNaN(rollB)) return rollA - rollB;
                return (a.rollNo || '').localeCompare(b.rollNo || '');
              }).map((s: any) => (
                <li key={s._id || s.id} className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-foreground">{s.name}</span>
                  <span className="text-xs text-muted-foreground">({s.rollNo})</span>
                </li>
              ))}
              {students.length === 0 && <li className="text-muted-foreground text-sm">No students enrolled.</li>}
            </ul>
          )}
        </CardContent>
      </Card>
      {/* New Announcement */}
      <div
        className="mb-6 bg-white rounded-xl shadow-lg p-4"
        style={{
          border: '1px solid #e5e7eb',
        }}
      >
        <Textarea
          placeholder="Announce something to your class..."
          value={announcementText}
          onChange={e => setAnnouncementText(e.target.value)}
          rows={2}
          className="mb-2 bg-[#fafbfc] border-none focus:ring-0 focus:outline-none text-base"
          style={{
            minHeight: '40px',
            borderRadius: '12px',
            boxShadow: 'none',
            resize: 'vertical'
          }}
        />
        <Button
          onClick={handlePostAnnouncement}
          disabled={posting || !announcementText.trim()}
          className={`mt-2 px-6 py-2 rounded-md font-medium shadow-none transition-colors duration-150
            ${announcementText.trim() && !posting
              ? 'bg-[#5b8df6] hover:bg-[#3b6eea] text-white'
              : 'bg-[#a3bffa] text-white opacity-60 cursor-not-allowed'}
          `}
          style={{ minWidth: 80 }}
        >
          {posting ? 'Posting...' : 'Post'}
        </Button>
      </div>

      {/* Announcements List */}
      <Card>
        <CardHeader>
          <CardTitle>Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 && <p className="text-muted-foreground text-sm">No announcements yet.</p>}
          <div
            className="grid gap-4"
            style={{
              maxHeight: '400px',
              overflowY: 'auto',
              paddingRight: '4px'
            }}
          >
            {[...announcements]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((a: any) => (
                <div key={a._id} className="border rounded-lg p-4 bg-white flex flex-col gap-2 relative shadow-sm">
                  {/* Top row: Avatar, Name, Date, 3-dot menu */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-primary text-white w-8 h-8 flex items-center justify-center font-bold text-lg">
                        {a.faculty?.name ? a.faculty.name[0].toUpperCase() : "?"}
                      </div>
                      <div>
                        <div className="font-semibold">{a.faculty?.name || "Faculty"}</div>
                        <div className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        aria-label="More"
                        onClick={() => handleMenuOpen(a._id)}
                      >
                        <MoreVertical size={20} />
                      </Button>
                      {openMenuId === a._id && (
                        <div
                          className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded shadow-lg z-10"
                          onMouseLeave={handleMenuClose}
                        >
                          <button
                            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                            onClick={() => handleEdit(a)}
                          >
                            Edit
                          </button>
                          <button
                            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600"
                            onClick={() => handleDelete(a)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Announcement content or edit mode */}
                  {editAnnouncementId === a._id ? (
                    <div className="flex flex-col gap-2 mt-2">
                      <Textarea
                        ref={editInputRef}
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        rows={3}
                        className="bg-[#fafbfc] border border-gray-200 rounded"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-[#5b8df6] hover:bg-[#3b6eea] text-white"
                          onClick={() => handleSaveEdit(a)}
                          disabled={!editContent.trim()}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditAnnouncementId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="font-medium mt-2 whitespace-pre-line">{a.content}</div>
                  )}
                  {/* Separator */}
                  <div className="w-full h-px bg-gray-200 my-4" />
                  {/* Comments count and Post Comment button */}
                  <div className="mt-2 flex flex-col gap-2">
                    <button
                      className="text-blue-600 font-medium text-sm flex items-center gap-1 hover:underline w-fit"
                      type="button"
                      onClick={() => toggleComments(a._id)}
                    >
                      <span role="img" aria-label="comments">👥</span>
                      {commentsCount[a._id] !== undefined
                        ? `${commentsCount[a._id]} class comments`
                        : <Loader2 className="w-3 h-3 animate-spin" />}
                    </button>
                    {expandedComments[a._id] && (
                      <div className="border rounded bg-gray-50 p-2 mb-2">
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
                                <div key={c._id} className="flex items-start gap-2 mb-2 relative">
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
                                  {/* 3-dot menu for all comments, only Delete option */}
                                  {editCommentId !== c._id && (
                                    <div className="relative ml-2">
                                      <button
                                        className="p-1 rounded-full hover:bg-gray-200 focus:outline-none"
                                        onClick={() => setCommentingId(commentingId === c._id ? null : c._id)}
                                      >
                                        <MoreVertical size={18} />
                                      </button>
                                      {commentingId === c._id && (
                                        <div className="absolute right-0 mt-2 w-24 bg-white border rounded shadow z-10 flex flex-col">
                                          <button
                                            className="px-4 py-2 text-left hover:bg-gray-100 text-red-600"
                                            onClick={() => { handleDeleteComment(a._id, c._id); setCommentingId(null); }}
                                          >Delete</button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                        ) : (
                          <div className="text-xs text-muted-foreground">No comments yet.</div>
                        )}
                      </div>
                    )}
                    {commentingId === a._id ? (
                      <div className="flex-1">
                        <Textarea
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          placeholder="Write your comment..."
                          rows={2}
                          className="bg-gray-50 mt-2"
                        />
                        {commentError && <div className="text-red-500 text-xs">{commentError}</div>}
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            onClick={() => handlePostComment(a._id)}
                            disabled={commentLoading || !commentText.trim()}
                          >
                            {commentLoading ? 'Posting...' : 'Post'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setCommentingId(null); setCommentText(''); setCommentError(null); }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-fit"
                        onClick={() => { setCommentingId(a._id); setCommentText(''); setCommentError(null); }}
                      >
                        Post Comment
                      </Button>
                    )}
                  </div>
                </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
