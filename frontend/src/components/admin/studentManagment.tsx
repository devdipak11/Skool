import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Edit, Trash2, Search, Eye, Check, X, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Label } from '@/components/ui/label';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function StudentManagement() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', class: '', rollNo: '', mobileNo: '' });
  const [addLoading, setAddLoading] = useState(false);
  const { toast } = useToast();
  const { token } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Class filter state
  const [classFilter, setClassFilter] = useState('all');

  // Get unique class options from students
  const classOptions = ['all', ...Array.from(new Set(students.map(s => s.class || s.className).filter(Boolean)))];

  // Fetch all students
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const authToken = token || localStorage.getItem('token');
      const res = await axios.get('/api/admin/students', {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setStudents([]);
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to fetch students",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line
  }, [token]);

  // Approve student
  const handleApprove = async (id: string) => {
    try {
      const authToken = token || localStorage.getItem('token');
      await axios.post(`/api/admin/students/approve/${id}`, {}, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      toast({ title: "Student Approved", description: "Student registration approved." });
      fetchStudents();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to approve student",
        variant: "destructive",
      });
    }
  };

  // Disapprove student (delete)
  const handleDisapprove = async (id: string) => {
    if (!window.confirm('Are you sure you want to disapprove and delete this student?')) return;
    try {
      const authToken = token || localStorage.getItem('token');
      await axios.delete(`/api/admin/students/disapprove/${id}`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      toast({ title: "Student Disapproved", description: "Student registration disapproved and deleted." });
      fetchStudents();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to disapprove student",
        variant: "destructive",
      });
    }
  };

  // Delete student
  const handleDeleteStudent = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      const authToken = token || localStorage.getItem('token');
      await axios.delete(`/api/admin/students/${id}`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      toast({ title: "Student Deleted", description: "Student deleted successfully." });
      setStudents(prev => prev.filter(s => (s._id || s.id) !== id));
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to delete student",
        variant: "destructive",
      });
    }
  };

  // Add new student
  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.class || !newStudent.rollNo) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    setAddLoading(true);
    try {
      const authToken = token || localStorage.getItem('token');
      // Only send mobileNo if provided
      const payload = { ...newStudent };
      if (!payload.mobileNo) delete payload.mobileNo;
      const res = await axios.post('/api/admin/students', payload, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      toast({ title: 'Student Added', description: 'Student created and approved.' });
      setIsAddDialogOpen(false);
      setNewStudent({ name: '', class: '', rollNo: '', mobileNo: '' });
      fetchStudents();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to add student',
        variant: 'destructive',
      });
    }
    setAddLoading(false);
  };

  // Edit student handler
  const handleEditStudent = (student: any) => {
    setEditStudent({
      ...student,
      class: student.class || student.className || "",
      mobileNo: student.mobileNo || "",
      fatherName: student.fatherName || student.parentsName || "",
      address: student.address || "",
    });
    setIsEditDialogOpen(true);
  };

  // Save edited student
  const handleSaveEditStudent = async () => {
    if (!editStudent.name || !editStudent.class || !editStudent.rollNo) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    setEditLoading(true);
    try {
      const authToken = token || localStorage.getItem('token');
      const payload: any = {
        name: editStudent.name,
        class: editStudent.class,
        rollNo: editStudent.rollNo,
        mobileNo: editStudent.mobileNo,
        fatherName: editStudent.fatherName,
        address: editStudent.address,
      };
      // Remove empty fields
      Object.keys(payload).forEach(k => (payload[k] === "" || payload[k] === undefined) && delete payload[k]);
      await axios.put(`/api/admin/students/${editStudent._id || editStudent.id}`, payload, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      toast({ title: 'Student Updated', description: 'Student details updated.' });
      setIsEditDialogOpen(false);
      setEditStudent(null);
      fetchStudents();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to update student',
        variant: 'destructive',
      });
    }
    setEditLoading(false);
  };

  // View student details
  const handleViewDetails = (student: any) => {
    setSelectedStudent(student);
    setIsDetailsDialogOpen(true);
  };

  // Export students as PDF (use filteredStudents, not all students)
  const handleExportReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Students Report", 14, 16);
    const tableColumn = [
      "Name",
      "Class",
      "Roll No",
      "Mobile No"
    ];
    const tableRows = filteredStudents.map((student: any) => [
      student.name,
      student.class || student.className,
      student.rollNo,
      student.mobileNo || "-"
    ]);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 24,
      styles: { fontSize: 10 }
    });
    doc.save("students_report.pdf");
  };

  // --- Attendance Modal State ---
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [attendanceStudent, setAttendanceStudent] = useState<any>(null);
  const [attendanceMonth, setAttendanceMonth] = useState<number>(new Date().getMonth() + 1);
  const [attendanceYear, setAttendanceYear] = useState<number>(new Date().getFullYear());
  const [attendanceSubjectId, setAttendanceSubjectId] = useState<string>('all');
  const [attendanceData, setAttendanceData] = useState<{ [date: string]: 'Present' | 'Absent' }>({});
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [enrolledSubjects, setEnrolledSubjects] = useState<any[]>([]);

  // Open attendance modal and fetch details
  const handleOpenAttendanceModal = async (student: any) => {
    setAttendanceStudent(student);
    setAttendanceMonth(new Date().getMonth() + 1);
    setAttendanceYear(new Date().getFullYear());
    setAttendanceSubjectId('all');
    setAttendanceModalOpen(true);
    setAttendanceData({});
    setEnrolledSubjects([]);
    // Fetch student details (with enrolled subjects)
    try {
      const authToken = token || localStorage.getItem('token');
      const res = await axios.get(`/api/admin/students/${student._id || student.id}`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      setEnrolledSubjects(res.data?.subjects || []); // <-- FIX: use .subjects
    } catch {}
    // Fetch attendance
    fetchAttendance(student._id || student.id, new Date().getMonth() + 1, new Date().getFullYear(), 'all');
  };

  // Fetch attendance for student/month/year/subject
  const fetchAttendance = async (studentId: string, month: number, year: number, subjectId: string) => {
    setAttendanceLoading(true);
    setAttendanceData({});
    try {
      const authToken = token || localStorage.getItem('token');
      let url = `/api/admin/students/${studentId}/attendance?month=${month}&year=${year}`;
      if (subjectId && subjectId !== 'all') url += `&subjectId=${subjectId}`;
      const res = await axios.get(url, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      // data: [{date: 'YYYY-MM-DD', status: 'Present'|'Absent'}]
      const map: { [date: string]: 'Present' | 'Absent' } = {};
      (res.data || []).forEach((rec: { date: string, status: 'Present' | 'Absent' }) => {
        map[rec.date] = rec.status;
      });
      setAttendanceData(map);
    } catch {
      setAttendanceData({});
    }
    setAttendanceLoading(false);
  };

  // Handle month/year/subject change
  useEffect(() => {
    if (!attendanceModalOpen || !attendanceStudent) return;
    fetchAttendance(
      attendanceStudent._id || attendanceStudent.id,
      attendanceMonth,
      attendanceYear,
      attendanceSubjectId
    );
    // eslint-disable-next-line
  }, [attendanceModalOpen, attendanceMonth, attendanceYear, attendanceSubjectId]);

  // Search and class filter with roll number sorting
  const filteredStudents = students
    .filter(student => {
      const matchesSearch = (student.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (student.rollNo?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesClass = classFilter === 'all' || student.class === classFilter || student.className === classFilter;
      return matchesSearch && matchesClass;
    })
    .sort((a, b) => {
      // Try to sort rollNo as numbers, fallback to string compare
      const rollA = parseInt(a.rollNo, 10);
      const rollB = parseInt(b.rollNo, 10);
      if (!isNaN(rollA) && !isNaN(rollB)) return rollA - rollB;
      return (a.rollNo || '').localeCompare(b.rollNo || '');
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Manage Students</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            Export Report
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          className="border rounded-lg px-4 py-2 bg-background text-foreground"
          value={classFilter}
          onChange={e => setClassFilter(e.target.value)}
        >
          {classOptions.map(option => (
            <option key={option} value={option}>{option === 'all' ? 'All Classes' : option}</option>
          ))}
        </select>
      </div>
      <Card className="shadow-card">
        <CardContent className="p-0">
          <div className="space-y-0">
            {loading ? (
              <div className="p-4">Loading...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-4 text-muted-foreground">No students found.</div>
            ) : (
              filteredStudents.map(student => (
                <div key={student._id || student.id} className="flex items-center justify-between p-4 border-b border-border last:border-b-0">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={student.profilePicture} />
                      <AvatarFallback>{student.name?.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.class || student.className} • {student.rollNo}</p>
                      <p className="text-xs text-muted-foreground">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={student.approved ? 'default' : 'secondary'}>
                      {student.approved ? 'Approved' : 'Pending'}
                    </Badge>
                    {!student.approved && (
                      <>
                        <Button size="sm" onClick={() => handleApprove(student._id || student.id)}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDisapprove(student._id || student.id)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleOpenAttendanceModal(student)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEditStudent(student)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteStudent(student._id || student.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      {/* Add Student Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>Enter student details to add a new student.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="student-name">Name</Label>
              <Input id="student-name" value={newStudent.name} onChange={e => setNewStudent(s => ({ ...s, name: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="student-class">Class</Label>
              <Input id="student-class" value={newStudent.class} onChange={e => setNewStudent(s => ({ ...s, class: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="student-roll">Roll No</Label>
              <Input id="student-roll" value={newStudent.rollNo} onChange={e => setNewStudent(s => ({ ...s, rollNo: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="student-mobile">Mobile No <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <Input id="student-mobile" value={newStudent.mobileNo} onChange={e => setNewStudent(s => ({ ...s, mobileNo: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleAddStudent} disabled={addLoading} className="flex-1">
                {addLoading ? 'Adding...' : 'Add Student'}
              </Button>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Student Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>
              Complete student information and fee history
            </DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={selectedStudent.profilePicture} />
                      <AvatarFallback>{selectedStudent.name?.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">{selectedStudent.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedStudent.class || selectedStudent.className}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span>Parents:</span>
                      <span>{selectedStudent.fatherName || selectedStudent.parentsName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span>📞</span>
                      <span>{selectedStudent.mobileNo}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span>📍</span>
                      <span>{selectedStudent.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span>🎓</span>
                      <span>Roll No: {selectedStudent.rollNo}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Academic Result</h4>
                    <Badge variant="default">PASS</Badge>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Registration Status</h4>
                    <Badge variant="default">Approved</Badge>
                  </div>
                </div>
              </div>
              {/* Optionally, add Fee Payment History here if needed */}
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Edit Student Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>Update student details below.</DialogDescription>
          </DialogHeader>
          {editStudent && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-student-name">Name</Label>
                <Input id="edit-student-name" value={editStudent.name} onChange={e => setEditStudent((s: any) => ({ ...s, name: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-student-class">Class</Label>
                <Input id="edit-student-class" value={editStudent.class} onChange={e => setEditStudent((s: any) => ({ ...s, class: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-student-roll">Roll No</Label>
                <Input id="edit-student-roll" value={editStudent.rollNo} onChange={e => setEditStudent((s: any) => ({ ...s, rollNo: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-student-mobile">Mobile No <span className="text-xs text-muted-foreground">(optional)</span></Label>
                <Input id="edit-student-mobile" value={editStudent.mobileNo || ""} onChange={e => setEditStudent((s: any) => ({ ...s, mobileNo: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-student-father">Father's Name <span className="text-xs text-muted-foreground">(optional)</span></Label>
                <Input id="edit-student-father" value={editStudent.fatherName || ""} onChange={e => setEditStudent((s: any) => ({ ...s, fatherName: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-student-address">Address <span className="text-xs text-muted-foreground">(optional)</span></Label>
                <Input id="edit-student-address" value={editStudent.address || ""} onChange={e => setEditStudent((s: any) => ({ ...s, address: e.target.value }))} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSaveEditStudent} disabled={editLoading} className="flex-1">
                  {editLoading ? 'Saving...' : 'Save'}
                </Button>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Attendance Modal */}
      <Dialog open={attendanceModalOpen} onOpenChange={setAttendanceModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Attendance Calendar</DialogTitle>
            <DialogDescription>
              View attendance for {attendanceStudent?.name}. Select month, year, and subject.
            </DialogDescription>
          </DialogHeader>
          {attendanceStudent && (
            <div className="space-y-4">
              {/* Student Info */}
              <div className="flex flex-col gap-2 border-b pb-3 mb-2">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={attendanceStudent.profilePicture} />
                    <AvatarFallback>{attendanceStudent.name?.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-lg">{attendanceStudent.name}</div>
                    <div className="text-xs text-muted-foreground">Class: {attendanceStudent.class || attendanceStudent.className} &nbsp;|&nbsp; Roll No: {attendanceStudent.rollNo}</div>
                    <div className="text-xs text-muted-foreground">Father's Name: {attendanceStudent.fatherName || attendanceStudent.parentsName || '-'}</div>
                    <div className="text-xs text-muted-foreground">Mobile: {attendanceStudent.mobileNo || '-'}</div>
                  </div>
                </div>
                {/* Enrolled Subjects List */}
                <div className="mt-2">
                  <div className="font-medium mb-1 text-sm">Enrolled Subjects</div>
                  {enrolledSubjects.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No subjects enrolled.</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {enrolledSubjects.map((sub: any) => (
                        <div key={sub._id || sub.id} className="px-3 py-1 rounded-full bg-muted text-xs font-medium border flex items-center gap-1">
                          <span>{sub.name}</span>
                          {sub.faculty?.name && <span className="text-muted-foreground">({sub.faculty.name})</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Subject Filter Dropdown */}
              <div>
                <Label>Subject</Label>
                <select
                  className="border rounded px-2 py-1 w-full mt-1"
                  value={attendanceSubjectId}
                  onChange={e => setAttendanceSubjectId(e.target.value)}
                >
                  <option value="all">All Subjects</option>
                  {enrolledSubjects.map((sub: any) => (
                    <option key={sub._id || sub.id} value={sub._id || sub.id}>
                      {sub.name} {sub.faculty?.name ? `- ${sub.faculty.name}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              {/* Month/Year Selectors */}
              <div className="flex gap-2 items-center mb-2">
                <button
                  className="p-2"
                  onClick={() => setAttendanceMonth(m => m === 1 ? 12 : m - 1)}
                  aria-label="Previous month"
                >
                  <ChevronLeft />
                </button>
                <select
                  className="border rounded px-2 py-1"
                  value={attendanceMonth}
                  onChange={e => setAttendanceMonth(Number(e.target.value))}
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
                <select
                  className="border rounded px-2 py-1"
                  value={attendanceYear}
                  onChange={e => setAttendanceYear(Number(e.target.value))}
                >
                  {Array.from({ length: 5 }).map((_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <option key={year} value={year}>{year}</option>
                    );
                  })}
                </select>
                <button
                  className="p-2"
                  onClick={() => setAttendanceMonth(m => m === 12 ? 1 : m + 1)}
                  aria-label="Next month"
                >
                  <ChevronRight />
                </button>
              </div>
              {/* Calendar Grid */}
              <div className="border rounded p-4 text-center text-muted-foreground">
                <div>
                  <span className="font-semibold">
                    {new Date(attendanceYear, attendanceMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="grid grid-cols-7 gap-1 text-xs font-medium mb-1">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                      <div key={d} className="py-1">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1 min-h-[180px]">
                    {(() => {
                      const days: JSX.Element[] = [];
                      const firstDay = new Date(attendanceYear, attendanceMonth - 1, 1);
                      const lastDay = new Date(attendanceYear, attendanceMonth, 0);
                      const today = new Date();
                      let dayOfWeek = firstDay.getDay();
                      for (let i = 0; i < dayOfWeek; i++) {
                        days.push(<div key={"empty-" + i} />);
                      }
                      for (let d = 1; d <= lastDay.getDate(); d++) {
                        const dateStr = `${attendanceYear}-${String(attendanceMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        const status = attendanceData[dateStr];
                        const isToday =
                          d === today.getDate() &&
                          attendanceMonth === today.getMonth() + 1 &&
                          attendanceYear === today.getFullYear();
                        const isSunday = new Date(attendanceYear, attendanceMonth - 1, d).getDay() === 0;
                        let bg = '';
                        let text = '';
                        if (isSunday) {
                          bg = 'bg-blue-200';
                          text = 'text-blue-900 font-bold';
                        }
                        if (status === 'Present') {
                          bg = 'bg-green-200';
                          text = 'text-green-900 font-bold';
                        } else if (status === 'Absent') {
                          bg = 'bg-red-200';
                          text = 'text-red-900 font-bold';
                        }
                        if (isToday) {
                          bg += ' ring-2 ring-yellow-400';
                        }
                        days.push(
                          <div
                            key={d}
                            className={`py-1 rounded-full transition ${bg} ${text}`}
                            title={status ? `Marked ${status}` : isSunday ? 'Sunday' : ''}
                          >
                            {d}
                          </div>
                        );
                      }
                      return days;
                    })()}
                  </div>
                  {attendanceLoading && <div className="mt-4 text-xs text-muted-foreground">Loading attendance...</div>}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
