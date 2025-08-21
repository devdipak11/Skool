import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppHeader from '@/components/layout/AppHeader';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckCircle, XCircle, Users, Calendar, Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BACKEND_URL } from '@/utils/utils';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const monthNames = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export default function FacultyMarkAttendance() {
  const { token } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]); // All assigned subjects
  const [classTeacherSubjects, setClassTeacherSubjects] = useState<any[]>([]); // Only class teacher subjects
  const [selectedClassSubject, setSelectedClassSubject] = useState<any>(null); // The subject (class) currently selected for attendance
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<Record<string, 'Present' | 'Absent'>>({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [viewStudent, setViewStudent] = useState<any>(null); // student object for modal
  const [studentAttendanceMonth, setStudentAttendanceMonth] = useState<number>(new Date().getMonth() + 1);
  const [studentAttendanceYear, setStudentAttendanceYear] = useState<number>(new Date().getFullYear());
  const [studentAttendanceData, setStudentAttendanceData] = useState<{ [date: string]: 'Present' | 'Absent' }>({});
  const [studentAttendanceLoading, setStudentAttendanceLoading] = useState(false);

  // Use localStorage to persist selected date
  useEffect(() => {
    // On mount, load date from localStorage if exists
    const savedDate = localStorage.getItem('faculty-attendance-date');
    if (savedDate) {
      setDate(savedDate);
      setMonth(String(new Date(savedDate).getMonth() + 1));
      setYear(String(new Date(savedDate).getFullYear()));
    }
  }, []);

  // Save date to localStorage whenever it changes
  useEffect(() => {
    if (date) {
      localStorage.setItem('faculty-attendance-date', date);
    }
  }, [date]);

  // Fetch all assigned subjects and filter class teacher subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${BACKEND_URL}/api/faculty/subjects`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error('Failed to fetch assigned subjects');
        const data = await res.json();
        setSubjects(Array.isArray(data) ? data : []);
        const classTeacherSubs = Array.isArray(data) ? data.filter((s: any) => s.isClassTeacher) : [];
        setClassTeacherSubjects(classTeacherSubs);
        // Auto-select first class teacher subject if any
        if (classTeacherSubs.length > 0) setSelectedClassSubject(classTeacherSubs[0]);
      } catch (err: any) {
        setError(err.message || 'Error loading data');
        setSubjects([]);
        setClassTeacherSubjects([]);
        setSelectedClassSubject(null);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchSubjects();
  }, [token]);

  // Fetch students for the selected class teacher subject
  useEffect(() => {
    if (!selectedClassSubject?._id) return;
    setLoading(true);
    setError(null);
    const fetchStudents = async () => {
      try {
        const studentsRes = await fetch(`${BACKEND_URL}/api/faculty/subjects/${selectedClassSubject._id}/students`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!studentsRes.ok) throw new Error('Failed to fetch students');
        const studentsData = await studentsRes.json();
        setStudents(Array.isArray(studentsData) ? studentsData : []);
        setAttendance({});
      } catch (err: any) {
        setError(err.message || 'Error loading students');
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [selectedClassSubject, token]);

  // Fetch attendance for selected date and class
  useEffect(() => {
    if (!selectedClassSubject?._id || !date || !token) return;
    const fetchAttendance = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/faculty/subjects/${selectedClassSubject._id}/attendance?date=${date}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (res.ok) {
          const data = await res.json();
          const att: Record<string, 'Present' | 'Absent' | undefined> = {};
          data.forEach((rec: any) => {
            att[rec.student?._id || rec.student?.id || rec.student] =
              rec.status === 'Present' || rec.status === 'Absent' ? rec.status : undefined;
          });
          setAttendance(att);
        } else {
          setAttendance({});
        }
      } catch {
        setAttendance({});
      }
    };
    fetchAttendance();
  }, [selectedClassSubject?._id, date, token]);

  // Fetch attendance records for export (with timestamp)
  useEffect(() => {
    if (!selectedClassSubject?._id || !date || !token) return;
    const fetchAttendanceRecords = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/faculty/subjects/${selectedClassSubject._id}/attendance?date=${date}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (res.ok) {
          const data = await res.json();
          setAttendanceRecords(Array.isArray(data) ? data : []);
        } else {
          setAttendanceRecords([]);
        }
      } catch {
        setAttendanceRecords([]);
      }
    };
    fetchAttendanceRecords();
  }, [selectedClassSubject?._id, date, token]);

  // Fetch selected student's attendance for month/year
  useEffect(() => {
    if (!viewStudent || !selectedClassSubject?._id) return;
    setStudentAttendanceLoading(true);
    fetch(`${BACKEND_URL}/api/faculty/student/${viewStudent._id || viewStudent.id}/attendance?subjectId=${selectedClassSubject._id}&month=${studentAttendanceMonth}&year=${studentAttendanceYear}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then((data) => {
        const map: { [date: string]: 'Present' | 'Absent' } = {};
        data.forEach((rec: { date: string, status: 'Present' | 'Absent' }) => {
          map[rec.date] = rec.status;
        });
        setStudentAttendanceData(map);
      })
      .catch(() => setStudentAttendanceData({}))
      .finally(() => setStudentAttendanceLoading(false));
  }, [viewStudent, studentAttendanceMonth, studentAttendanceYear, selectedClassSubject?._id, token]);

  // Save attendance to backend
  const saveAttendance = async () => {
    if (!selectedClassSubject?._id || !date) return;
    const attendanceArr = students.map(s => ({
      studentId: s._id || s.id,
      status: attendance[s._id || s.id] || null
    }));
    try {
      const res = await fetch(`${BACKEND_URL}/api/faculty/subjects/${selectedClassSubject._id}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ date, attendance: attendanceArr }),
      });
      if (!res.ok) throw new Error('Failed to save attendance');
      alert('Attendance saved!');
    } catch (e: any) {
      alert(e.message || 'Error saving attendance');
    }
  };

  // Export attendance as PDF
  const handleExportReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Attendance Report", 14, 16);
    const tableColumn = ["Name", "Roll No", "Status", "Marked At"];
    const tableRows: any[] = [];
    students.forEach((student) => {
      const rec = attendanceRecords.find(
        (r) => (r.student?._id || r.student?.id || r.student) === (student._id || student.id)
      );
      tableRows.push([
        student.name,
        student.rollNo,
        rec ? rec.status : (attendance[student._id || student.id] || 'Absent'),
        rec && rec.markedAt ? new Date(rec.markedAt).toLocaleString() : "-"
      ]);
    });
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 24,
      styles: { fontSize: 10 }
    });
    doc.save(`attendance_report_${date}.pdf`);
  };

  // Clear all attendance for current filtered students (reset to unmarked)
  const clearAttendance = () => {
    setAttendance(prev => {
      const updated = { ...prev };
      filteredStudents.forEach(s => {
        updated[s._id || s.id] = undefined;
      });
      return updated;
    });
  };

  // Filtered students (sorted by rollNo ascending)
  const filteredStudents = students
    .slice()
    .sort((a, b) => {
      const rollA = parseInt(a.rollNo, 10);
      const rollB = parseInt(b.rollNo, 10);
      if (!isNaN(rollA) && !isNaN(rollB)) return rollA - rollB;
      return (a.rollNo || '').localeCompare(b.rollNo || '');
    })
    .filter(s => {
      const matchesSearch = (s.name?.toLowerCase() || '').includes(search.toLowerCase()) || (s.rollNo || '').includes(search);
      const status = attendance[s._id || s.id];
      if (filter === 'present' && status !== 'Present') return false;
      if (filter === 'absent' && status !== 'Absent') return false;
      return matchesSearch;
    });

  // Stats: count present/absent only for students in filteredStudents
  const present = filteredStudents.filter(s => attendance[s._id || s.id] === 'Present').length;
  const absent = filteredStudents.filter(s => attendance[s._id || s.id] === 'Absent').length;
  const total = filteredStudents.length;

  // Toggle attendance
  const toggleAttendance = (studentId: string, status: 'Present' | 'Absent') => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  // Date/month/year change handlers
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
    setMonth(String(new Date(e.target.value).getMonth() + 1));
    setYear(String(new Date(e.target.value).getFullYear()));
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Attendance Management" />
      <div className="p-4 space-y-6">
        {/* Class Selector Tabs */}
        {classTeacherSubjects.length > 1 && (
          <div className="flex gap-2 mb-4">
            {classTeacherSubjects.map((sub) => (
              <Button
                key={sub._id}
                variant={selectedClassSubject?._id === sub._id ? 'default' : 'outline'}
                onClick={() => setSelectedClassSubject(sub)}
                className="rounded-full px-6 py-2 text-base font-semibold"
              >
                {sub.className}
              </Button>
            ))}
          </div>
        )}
        {/* Export Report Button */}
        <div className="flex items-center justify-between mb-2">
          <div />
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" /></svg>
            Export Report
          </Button>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{present}</p>
              <p className="text-sm text-muted-foreground">Present</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{absent}</p>
              <p className="text-sm text-muted-foreground">Absent</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-base font-medium">{monthNames.find(m => m.value === month)?.label} {year}</p>
              <p className="text-xs text-muted-foreground">Selected Date: {date}</p>
            </CardContent>
          </Card>
        </div>
        {/* Filters */}
        <Card>
          <CardContent className="p-4 flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filter} onValueChange={v => setFilter(v as any)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={date}
              onChange={handleDateChange}
              className="w-[160px]"
            />
          </CardContent>
        </Card>
        {/* Students List */}
        <Card>
          <CardHeader>
            <CardTitle>Students Attendance</CardTitle>
            {selectedClassSubject?.className && (
              <div className="text-base text-muted-foreground font-medium mt-1">
                Class: <span className="font-semibold text-primary">{selectedClassSubject.className}</span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="p-4 flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Loading...</div>
            ) : error ? (
              <div className="p-4 text-destructive">{error}</div>
            ) : (
              <div className="space-y-0">
                {filteredStudents.length === 0 ? (
                  <div className="p-4 text-muted-foreground">No students found.</div>
                ) : filteredStudents.map((student) => (
                  <div key={student._id || student.id} className="flex items-center justify-between p-4 border-b border-border last:border-b-0">
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.rollNo}</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <button
                        className="p-2 rounded-full hover:bg-gray-100"
                        title="View attendance calendar"
                        onClick={() => {
                          setViewStudent(student);
                          setStudentAttendanceMonth(new Date().getMonth() + 1);
                          setStudentAttendanceYear(new Date().getFullYear());
                        }}
                      >
                        <Eye className="w-5 h-5 text-blue-600" />
                      </button>
                      <Button
                        variant={attendance[student._id || student.id] === 'Present' ? 'default' : 'outline'}
                        onClick={() => toggleAttendance(student._id || student.id, 'Present')}
                      >
                        Present
                      </Button>
                      <Button
                        variant={attendance[student._id || student.id] === 'Absent' ? 'destructive' : 'outline'}
                        onClick={() => toggleAttendance(student._id || student.id, 'Absent')}
                      >
                        Absent
                      </Button>
                    </div>
                  </div>
                ))}
                {/* Save & Clear Attendance buttons at the end */}
                {filteredStudents.length > 0 && (
                  <div className="flex justify-end pt-6 pb-24 gap-4">
                    <Button
                      variant="outline"
                      onClick={clearAttendance}
                      className="w-[160px] h-12 text-base font-semibold"
                    >
                      Clear
                    </Button>
                    <Button
                      onClick={saveAttendance}
                      className="w-[200px] h-12 text-base font-semibold"
                    >
                      Save Attendance
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        {/* Student Attendance Modal */}
        <Dialog open={!!viewStudent} onOpenChange={open => { if (!open) setViewStudent(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Attendance for {viewStudent?.name}</DialogTitle>
              <DialogDescription>
                Select month and year to view attendance.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 items-center mb-4">
              <button
                className="p-2"
                onClick={() => setStudentAttendanceMonth(m => m === 1 ? 12 : m - 1)}
                aria-label="Previous month"
              >
                <ChevronLeft />
              </button>
              <select
                className="border rounded px-2 py-1"
                value={studentAttendanceMonth}
                onChange={e => setStudentAttendanceMonth(Number(e.target.value))}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select
                className="border rounded px-2 py-1"
                value={studentAttendanceYear}
                onChange={e => setStudentAttendanceYear(Number(e.target.value))}
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
                onClick={() => setStudentAttendanceMonth(m => m === 12 ? 1 : m + 1)}
                aria-label="Next month"
              >
                <ChevronRight />
              </button>
            </div>
            <div className="border rounded p-4 text-center text-muted-foreground">
              <div>
                <span className="font-semibold">
                  {studentAttendanceMonth && studentAttendanceYear && new Date(studentAttendanceYear, studentAttendanceMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="mt-2">
                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1 text-xs font-medium mb-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 min-h-[180px]">
                  {(() => {
                    const days: JSX.Element[] = [];
                    const firstDay = new Date(studentAttendanceYear, studentAttendanceMonth - 1, 1);
                    const lastDay = new Date(studentAttendanceYear, studentAttendanceMonth, 0);
                    const today = new Date();
                    let dayOfWeek = firstDay.getDay();
                    for (let i = 0; i < dayOfWeek; i++) {
                      days.push(<div key={"empty-" + i} />);
                    }
                    for (let d = 1; d <= lastDay.getDate(); d++) {
                      const dateStr = `${studentAttendanceYear}-${String(studentAttendanceMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                      const status = studentAttendanceData[dateStr];
                      const isToday =
                        d === today.getDate() &&
                        studentAttendanceMonth === today.getMonth() + 1 &&
                        studentAttendanceYear === today.getFullYear();
                      const isSunday = new Date(studentAttendanceYear, studentAttendanceMonth - 1, d).getDay() === 0;
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
                {studentAttendanceLoading && <div className="mt-4 text-xs text-muted-foreground">Loading attendance...</div>}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
