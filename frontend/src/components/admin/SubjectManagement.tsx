import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Plus, 
  Edit, 
  Trash2, 
  BookOpen, 
  Users, 
  MessageSquare,
  Calendar,
  Clock,
  Search
} from 'lucide-react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function SubjectManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [isPostsDialogOpen, setIsPostsDialogOpen] = useState(false);
  const [newSubject, setNewSubject] = useState({
    name: '',
    code: '',
    className: '',
    teacherName: ''
  });
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editSubject, setEditSubject] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [selectedFaculty, setSelectedFaculty] = useState('All Teachers');
  const [faculties, setFaculties] = useState<any[]>([]);

  // Get unique class names and faculty names for dropdowns
  const classOptions = ['All Classes', ...Array.from(new Set(subjects.map(s => s.className).filter(Boolean)))];

  // Fetch faculties for assignment and filtering
  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const authToken = token || localStorage.getItem('token');
        const res = await axios.get('/api/admin/teachers', {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });
        if (Array.isArray(res.data)) {
          setFaculties(res.data);
        } else {
          setFaculties([]);
        }
      } catch {
        setFaculties([]);
      }
    };
    fetchFaculties();
  }, [token]);

  // Updated facultyOptions to use all faculties
  const facultyOptions = ['All Teachers', ...faculties.map(f => f.name)];

  // Fetch subjects from backend (extracted for reuse)
  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const authToken = token || localStorage.getItem('token');
      const res = await axios.get('/api/admin/subjects', {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (Array.isArray(res.data)) {
        setSubjects(res.data);
      } else {
        setSubjects([]);
        toast({
          title: "Error",
          description: res.data?.message || "Failed to fetch subjects",
          variant: "destructive",
        });
      }
    } catch (err) {
      setSubjects([]);
      toast({
        title: "Error",
        description: "Failed to fetch subjects",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSubjects();
  }, [toast, token]);

  // Create subject via backend
  const handleCreateSubject = async () => {
    if (!newSubject.name || !newSubject.code || !newSubject.className || !newSubject.teacherName) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    try {
      const authToken = token || localStorage.getItem('token');
      const res = await axios.post('/api/admin/subjects', newSubject, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      setSubjects(prev => [...prev, res.data]);
      toast({
        title: "Subject Created",
        description: `Subject "${res.data.name}" has been created successfully`,
      });
      setNewSubject({ name: '', code: '', className: '', teacherName: '' });
      setIsCreateDialogOpen(false);
    } catch (err: any) {
      let errorMsg = err?.response?.data?.message || "Failed to create subject";
      if (errorMsg === 'Teacher not found') errorMsg = 'Selected teacher does not exist. Please choose a valid teacher.';
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  // Delete subject via backend
  const handleDeleteSubject = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    try {
      const authToken = token || localStorage.getItem('token');
      await axios.delete(`/api/admin/subjects/${id}`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      setSubjects(prev => prev.filter(s => (s._id || s.id) !== id));
      toast({
        title: "Subject Deleted",
        description: "Subject deleted successfully",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to delete subject",
        variant: "destructive",
      });
    }
  };

  const viewSubjectPosts = (subject: any) => {
    setSelectedSubject(subject);
    setIsPostsDialogOpen(true);
  };

  const openEditDialog = (subject: any) => {
    setEditSubject({
      _id: subject._id || subject.id,
      name: subject.name || '',
      code: subject.code || '',
      className: subject.className || '',
      teacherName: subject.faculty?.name || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateSubject = async () => {
    if (!editSubject.name || !editSubject.code || !editSubject.className) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    try {
      const authToken = token || localStorage.getItem('token');
      await axios.put(`/api/admin/subjects/${editSubject._id}`, {
        name: editSubject.name,
        code: editSubject.code,
        className: editSubject.className,
        teacherName: editSubject.teacherName
      }, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      await fetchSubjects(); // Re-fetch subjects to get populated data
      toast({
        title: "Subject Updated",
        description: `Subject \"${editSubject.name}\" updated successfully`,
      });
      setIsEditDialogOpen(false);
      setEditSubject(null);
    } catch (err: any) {
      let errorMsg = err?.response?.data?.message || "Failed to update subject";
      if (errorMsg === 'Teacher not found') errorMsg = 'Selected teacher does not exist. Please choose a valid teacher.';
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  // Filtered subjects
  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch =
      (subject.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (subject.code?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (subject.className?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (subject.faculty?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'All Classes' || subject.className === selectedClass;
    const matchesFaculty = selectedFaculty === 'All Teachers' || subject.faculty?.name === selectedFaculty;
    return matchesSearch && matchesClass && matchesFaculty;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Subject Management</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Subject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Subject</DialogTitle>
              <DialogDescription>
                Add a new subject with teacher assignment
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="subjectName">Subject Name</Label>
                <Input
                  id="subjectName"
                  placeholder="e.g., Advanced Calculus"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="subjectCode">Subject Code</Label>
                <Input
                  id="subjectCode"
                  placeholder="e.g., MATH301"
                  value={newSubject.code}
                  onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="className">Class</Label>
                <Input
                  id="className"
                  placeholder="e.g., Grade 12-A"
                  value={newSubject.className}
                  onChange={(e) => setNewSubject({ ...newSubject, className: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="teacherName">Teacher Name</Label>
                <select
                  id="teacherName"
                  value={newSubject.teacherName}
                  onChange={e => setNewSubject({ ...newSubject, teacherName: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 bg-background text-foreground"
                >
                  <option value="">-- No Teacher Assigned --</option>
                  {faculties.map(f => (
                    <option key={f._id} value={f.name}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateSubject} className="flex-1">
                  Create Subject
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md mb-2">
        <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
        <Input
          placeholder="Search subject..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <select
            className="border rounded-lg px-4 py-2 bg-background text-foreground"
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
          >
            {classOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            className="border rounded-lg px-4 py-2 bg-background text-foreground"
            value={selectedFaculty}
            onChange={e => setSelectedFaculty(e.target.value)}
          >
            {facultyOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Existing Subjects */}
      <div className="grid gap-4">
        {loading ? (
          <div>Loading...</div>
        ) : filteredSubjects.length === 0 ? (
          <div className="text-muted-foreground p-4">No subjects found.</div>
        ) : (
          filteredSubjects.map((subject) => (
            <Card
              key={subject._id || subject.id}
              className="shadow-card"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div
                    className="flex items-start gap-4 cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/admin/subject/${subject._id || subject.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/admin/subject/${subject._id || subject.id}`);
                      }
                    }}
                  >
                    <div className={`w-12 h-12 rounded-lg bg-primary flex items-center justify-center`}>
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{subject.name || "No Name"}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {subject.code || "No Code"} • {subject.className || "No Class"} • {subject.faculty?.name ?? "null"}
                      </p>
                      <p className="text-sm text-muted-foreground mb-3">{subject.description || ''}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(subject)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteSubject(subject._id || subject.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Posts and Comments Dialog */}
      <Dialog open={isPostsDialogOpen} onOpenChange={setIsPostsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedSubject?.name} - Posts & Comments</DialogTitle>
            <DialogDescription>
              Posts & comments integration coming soon.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Edit Subject Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>Update subject details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editSubjectName">Subject Name</Label>
              <Input
                id="editSubjectName"
                placeholder="e.g., Advanced Calculus"
                value={editSubject?.name || ''}
                onChange={e => setEditSubject((prev: any) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="editSubjectCode">Subject Code</Label>
              <Input
                id="editSubjectCode"
                placeholder="e.g., MATH301"
                value={editSubject?.code || ''}
                onChange={e => setEditSubject((prev: any) => ({ ...prev, code: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="editClassName">Class</Label>
              <Input
                id="editClassName"
                placeholder="e.g., Grade 12-A"
                value={editSubject?.className || ''}
                onChange={e => setEditSubject((prev: any) => ({ ...prev, className: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="editTeacherName">Teacher Name</Label>
              <select
                id="editTeacherName"
                value={editSubject?.teacherName || ''}
                onChange={e => setEditSubject((prev: any) => ({ ...prev, teacherName: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 bg-background text-foreground"
              >
                <option value="">-- No Teacher Assigned --</option>
                {faculties.map(f => (
                  <option key={f._id} value={f.name}>{f.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateSubject}>Update</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
