import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppHeader from '@/components/layout/AppHeader';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, MoreVertical } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

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
  const key = subject?._id || subject?.id || subject?.code || '';
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

export default function StudentSubjectDetail() {
  const { id: subjectId } = useParams<{ id: string }>();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [subject, setSubject] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentingId, setCommentingId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [announcementId: string]: any[] }>({});
  const [commentsLoading, setCommentsLoading] = useState<{ [announcementId: string]: boolean }>({});
  const [editCommentId, setEditCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [expandedComments, setExpandedComments] = useState<{ [announcementId: string]: boolean }>({});
  const [students, setStudents] = useState<any[]>([]);
  const [showAllStudents, setShowAllStudents] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch subject details
        const subjectRes = await fetch(`/api/subjects/${subjectId}`);
        if (!subjectRes.ok) throw new Error('Failed to fetch subject details');
        const subjectData = await subjectRes.json();
        setSubject(subjectData);

        // Fetch enrolled students for this subject (student endpoint)
        let studentsList = [];
        try {
          const studentsRes = await fetch(`/api/students/subjects/${subjectId}/students`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          if (studentsRes.ok) {
            studentsList = await studentsRes.json();
          }
        } catch {}
        setStudents(studentsList);

        // Fetch announcements for this subject (student endpoint)
        const annRes = await fetch(`/api/students/subjects/${subjectId}/announcements`, {
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
    if (subjectId && token) fetchData();
  }, [subjectId, token]);

  // Fetch comments for an announcement
  const fetchComments = async (announcementId: string) => {
    setCommentsLoading(prev => ({ ...prev, [announcementId]: true }));
    try {
      const res = await fetch(`/api/students/comments/${announcementId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error('Failed to fetch comments');
      const data = await res.json();
      setComments(prev => ({ ...prev, [announcementId]: data }));
    } catch (err) {
      // Optionally handle error
    } finally {
      setCommentsLoading(prev => ({ ...prev, [announcementId]: false }));
    }
  };

  // Post comment handler (update to refresh comments)
  const handlePostComment = async (announcementId: string) => {
    if (!commentText.trim()) return;
    setCommentLoading(true);
    setCommentError(null);
    try {
      const res = await fetch(`/api/students/announcements/${announcementId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: commentText }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to post comment');
      }
      setCommentText('');
      setCommentingId(null);
      fetchComments(announcementId); // Refresh comments
    } catch (err: any) {
      setCommentError(err.message || 'Failed to post comment');
    } finally {
      setCommentLoading(false);
    }
  };

  // Edit comment handler
  const handleEditComment = async (announcementId: string, commentId: string) => {
    if (!editCommentText.trim()) return;
    setCommentLoading(true);
    setCommentError(null);
    try {
      const res = await fetch(`/api/students/comments/${commentId}`, {
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

  // Delete comment handler
  const handleDeleteComment = async (announcementId: string, commentId: string) => {
    setCommentLoading(true);
    setCommentError(null);
    try {
      const res = await fetch(`/api/students/comments/${commentId}`, {
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

  // Fetch comments when announcements change
  useEffect(() => {
    if (announcements.length > 0 && token) {
      announcements.forEach((a: any) => fetchComments(a._id));
    }
    // eslint-disable-next-line
  }, [announcements, token]);

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

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Subject" />
      <div className="p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <span className="text-muted-foreground">Loading...</span>
          </div>
        ) : error ? (
          <Card className="border-destructive bg-destructive/10 mb-4">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-destructive">{error}</div>
            </CardContent>
          </Card>
        ) : (
          <>
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
                </div>
              </div>
            </div>

            {/* Enrolled Students Card */}
            <Card className="shadow-card border-primary/30 mb-6">
              <CardContent className="py-4 px-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-lg">Enrolled Students <span className="text-xs text-muted-foreground">({students.length})</span></span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllStudents((prev) => !prev)}
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
                    maxHeight: '800px', // Increased from 400px to 800px
                    overflowY: 'auto',
                    paddingRight: '4px'
                  }}
                >
                  {[...announcements]
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((a: any) => (
                      <div key={a._id} className="border rounded-lg p-4 bg-white flex flex-col gap-2 relative shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="rounded-full bg-primary text-white w-8 h-8 flex items-center justify-center font-bold text-lg">
                            {a.faculty?.name ? a.faculty.name[0].toUpperCase() : "?"}
                          </div>
                          <div>
                            <div className="font-semibold">{a.faculty?.name || "Faculty"}</div>
                            <div className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="font-medium mt-2 whitespace-pre-line">{a.content}</div>
                        {/* Comments Section */}
                        <div className="mt-2">
                          <button
                            className="text-blue-600 font-medium text-sm mb-1 flex items-center gap-1 hover:underline"
                            onClick={() => toggleComments(a._id)}
                            type="button"
                          >
                            <span role="img" aria-label="comments">👥</span>
                            {comments[a._id]?.length !== undefined
                              ? `${comments[a._id].length} class comments`
                              : '0 class comments'}
                          </button>
                          {expandedComments[a._id] && (
                            commentsLoading[a._id] ? (
                              <div className="text-xs text-muted-foreground">Loading comments...</div>
                            ) : comments[a._id] && comments[a._id].length > 0 ? (
                              <div className="border rounded bg-gray-50 p-2 mb-2">
                                {[...comments[a._id]]
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
                                          {editCommentId === c._id ? (
                                            <div className="flex flex-col gap-1 mt-1">
                                              <Textarea
                                                value={editCommentText}
                                                onChange={e => setEditCommentText(e.target.value)}
                                                rows={2}
                                                className="bg-gray-50"
                                              />
                                              <div className="flex gap-2 mt-1">
                                                <Button size="sm" onClick={() => handleEditComment(a._id, c._id)} disabled={commentLoading || !editCommentText.trim()}>
                                                  {commentLoading ? 'Saving...' : 'Save'}
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => { setEditCommentId(null); setEditCommentText(''); }}>Cancel</Button>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="text-sm mt-1 whitespace-pre-line">{c.content}</div>
                                          )}
                                        </div>
                                        {/* 3-dot menu for own comment, only Edit option */}
                                        {c.studentId?._id === user?.id && editCommentId !== c._id && (
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
                                                  className="px-4 py-2 text-left hover:bg-gray-100"
                                                  onClick={() => { setEditCommentId(c._id); setEditCommentText(c.content); setCommentingId(null); }}
                                                >Edit</button>
                                                {/* Delete option removed */}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                              </div>
                            ) : null
                          )}
                        </div>
                        {/* Post Comment Button and Form */}
                        {commentingId === a._id ? (
                          <div className="mt-2 space-y-2">
                            <Textarea
                              value={commentText}
                              onChange={e => setCommentText(e.target.value)}
                              placeholder="Write your comment..."
                              rows={2}
                              className="bg-gray-50"
                            />
                            {commentError && <div className="text-red-500 text-xs">{commentError}</div>}
                            <div className="flex gap-2">
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
                                onClick={() => { setCommentingId(null); setCommentText(''); }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 w-fit"
                            onClick={() => { setCommentingId(a._id); setCommentText(''); setCommentError(null); }}
                          >
                            Post Comment
                          </Button>
                        )}
                      </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}