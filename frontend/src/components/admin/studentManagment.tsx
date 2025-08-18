import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Edit, Trash2, Search, Eye, Check, X, Plus } from 'lucide-react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function StudentManagement() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { token } = useAuth();

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

  // View student details
  const handleViewDetails = (student: any) => {
    setSelectedStudent(student);
    setIsDetailsDialogOpen(true);
  };

  // Search filter
  const filteredStudents = students.filter(student =>
    (student.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (student.rollNo?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Manage Students</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Student
        </Button>
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
                    <Button variant="ghost" size="sm" onClick={() => handleViewDetails(student)}>
                      <Eye className="w-4 h-4" />
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
    </div>
  );
}
