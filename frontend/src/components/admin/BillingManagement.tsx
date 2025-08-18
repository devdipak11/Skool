import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Search, 
  Eye, 
  Download,
  Calendar,
  DollarSign,
  User,
  Phone,
  MapPin,
  GraduationCap,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BACKEND_URL } from '@/utils/utils';

export default function BillingManagement() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [feeStatusMap, setFeeStatusMap] = useState<Record<string, any[]>>({});
  const { toast } = useToast();
  const { token } = useAuth();
  const [reasonModal, setReasonModal] = useState<{ open: boolean, studentId?: string, month?: string, newStatus?: string }>({ open: false });
  const [reasonInput, setReasonInput] = useState('');
  const reasonInputRef = useRef<HTMLInputElement>(null);
  const [profileDialog, setProfileDialog] = useState<{ open: boolean, student: any | null, details: any | null }>({ open: false, student: null, details: null });
  const [classFees, setClassFees] = useState<Record<string, number>>({});

  // Month names for display and filtering
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

  // Fetch all students from backend
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/admin/students`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('Failed to fetch students');
        const data = await res.json();
        setStudents(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setStudents([]);
        toast({ title: 'Error', description: e.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchStudents();
  }, [token, toast]);

  // Fetch fee status for all students for the selected year
  useEffect(() => {
    const fetchAllFeeStatus = async () => {
      if (!students.length) return;
      const map: Record<string, any[]> = {};
      await Promise.all(students.map(async (student) => {
        try {
          const res = await fetch(`${BACKEND_URL}/api/admin/students/${student._id || student.id}/fee-status?year=${yearFilter}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (!res.ok) throw new Error('Failed to fetch fee status');
          const data = await res.json();
          map[student._id || student.id] = data;
        } catch {
          map[student._id || student.id] = [];
        }
      }));
      setFeeStatusMap(map);
    };
    if (token && students.length) fetchAllFeeStatus();
  }, [token, students, yearFilter]);

  // Fetch all class fee structures
  useEffect(() => {
    const fetchClassFees = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/admin/fees`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('Failed to fetch class fees');
        const data = await res.json();
        // Map className to amount
        const feeMap: Record<string, number> = {};
        (Array.isArray(data) ? data : []).forEach((fee: any) => {
          if (fee.className && typeof fee.amount === 'number') {
            feeMap[fee.className] = fee.amount;
          }
        });
        setClassFees(feeMap);
      } catch (e: any) {
        setClassFees({});
      }
    };
    if (token) fetchClassFees();
  }, [token]);

  // Filtering logic
  const filteredStudents = students.filter(student => {
    const matchesSearch = (student.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (student.rollNo?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesClass = classFilter === 'all' || student.class === classFilter || student.className === classFilter;
    return matchesSearch && matchesClass;
  });

  // Get fee status for a student for a given month, and inject class fee if missing
  const getFeeStatusForMonth = (studentId: string, month: string) => {
    const arr = feeStatusMap[studentId] || [];
    const found = arr.find(fee => String(fee.month) === String(month));
    // Find student to get class
    const student = students.find(s => (s._id || s.id) === studentId);
    const className = student?.class || student?.className;
    const classFee = classFees[className] ?? 0;
    // If fee record exists, but amount is missing, inject classFee
    if (found) {
      return {
        ...found,
        amount: typeof found.amount === 'number' ? found.amount : classFee,
      };
    }
    // If no record, return default with classFee
    return { status: 'Pending', amount: classFee, month, year: yearFilter };
  };

  // Update payment status for a student/month
  const updatePaymentStatus = async (studentId: string, month: string, newStatus: string) => {
    const fee = getFeeStatusForMonth(studentId, month);
    // If current status is Paid/Unpaid and changing, require reason
    if (['Paid', 'Unpaid'].includes(fee.status) && fee.status !== newStatus) {
      setReasonModal({ open: true, studentId, month, newStatus });
      setReasonInput('');
      setTimeout(() => reasonInputRef.current?.focus(), 100);
      return;
    }
    // If current status is Pending or not changing, no reason needed
    await submitFeeStatusUpdate(studentId, month, newStatus);
  };

  const submitFeeStatusUpdate = async (studentId: string, month: string, newStatus: string, reason?: string) => {
    try {
      const body: any = { month: parseInt(month), year: yearFilter, status: newStatus };
      if (reason) body.reason = reason;
      const res = await fetch(`${BACKEND_URL}/api/admin/students/${studentId}/fee-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update fee status');
      }
      toast({ title: 'Payment Status Updated', description: `Fee status updated to ${newStatus} for month ${month}` });
      // Refresh fee status for this student
      const feeRes = await fetch(`${BACKEND_URL}/api/admin/students/${studentId}/fee-status?year=${yearFilter}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const feeData = await feeRes.json();
      setFeeStatusMap(prev => ({ ...prev, [studentId]: feeData }));
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleReasonModalConfirm = async () => {
    if (!reasonInput.trim()) {
      toast({ title: 'Error', description: 'Reason is required to change status from Paid/Unpaid.', variant: 'destructive' });
      return;
    }
    if (reasonModal.studentId && reasonModal.month && reasonModal.newStatus) {
      await submitFeeStatusUpdate(reasonModal.studentId, reasonModal.month, reasonModal.newStatus, reasonInput.trim());
      setReasonModal({ open: false });
      setReasonInput('');
    }
  };

  // Fetch student details for dialog
  const handleViewStudent = async (student: any) => {
    setProfileDialog({ open: true, student, details: null });
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/students/${student._id || student.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to fetch student details');
      const data = await res.json();
      setProfileDialog({ open: true, student, details: data });
    } catch (e: any) {
      setProfileDialog({ open: true, student, details: null });
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  // Stats calculation
  const getTotalStats = () => {
    let paidCount = 0, pendingCount = 0, unpaidCount = 0;
    filteredStudents.forEach(student => {
      const month = monthFilter === 'all' ? (new Date().getMonth() + 1).toString() : monthFilter;
      const fee = getFeeStatusForMonth(student._id || student.id, month);
      if (fee.status === 'Paid') paidCount++;
      else if (fee.status === 'Unpaid') unpaidCount++;
      else pendingCount++;
    });
    return { totalStudents: filteredStudents.length, paidCount, pendingCount, unpaidCount };
  };
  const stats = getTotalStats();

  // Export report as PDF
  const handleExportReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Students Billing Report", 14, 16);

    const tableColumn = [
      "Name",
      "Class",
      "Roll No",
      "Month",
      "Year",
      "Fee Amount",
      "Status"
    ];

    const tableRows: any[] = [];

    filteredStudents.forEach((student) => {
      const month = monthFilter === 'all' ? (new Date().getMonth() + 1).toString() : monthFilter;
      const fee = getFeeStatusForMonth(student._id || student.id, month);
      const monthLabel = monthNames.find(m => m.value === String(fee.month))?.label || fee.month;
      tableRows.push([
        student.name,
        student.class || student.className,
        student.rollNo,
        monthLabel,
        fee.year,
        fee.amount ?? "-",
        fee.status
      ]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 24,
      styles: { fontSize: 10 }
    });

    doc.save("students_billing_report.pdf");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Billing Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4 text-center">
            <GraduationCap className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.totalStudents}</p>
            <p className="text-sm text-muted-foreground">Total Students</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.paidCount}</p>
            <p className="text-sm text-muted-foreground">Fees Paid</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.pendingCount}</p>
            <p className="text-sm text-muted-foreground">Fees Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-accent mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.unpaidCount}</p>
            <p className="text-sm text-muted-foreground">Fees Unpaid</p>
          </CardContent>
        </Card>
      </div>
      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Fee Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Unpaid">Unpaid</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {Array.from(new Set(students.map(s => s.class || s.className).filter(Boolean))).map(className => (
                  <SelectItem key={className} value={className}>{className}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {monthNames.map(month => (
                  <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              min={2000}
              max={2100}
              value={yearFilter}
              onChange={e => setYearFilter(Number(e.target.value))}
              className="w-[120px]"
              placeholder="Year"
            />
          </div>
        </CardContent>
      </Card>
      {/* Students List */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Students Fee Status</CardTitle>
          <CardDescription>
            Showing {filteredStudents.length} of {students.length} students
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {loading ? (
              <div className="p-4">Loading...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-4 text-muted-foreground">No students found.</div>
            ) : filteredStudents.map((student) => {
              const month = monthFilter === 'all' ? (new Date().getMonth() + 1).toString() : monthFilter;
              const fee = getFeeStatusForMonth(student._id || student.id, month);
              const monthLabel = monthNames.find(m => m.value === String(fee.month))?.label || fee.month;
              return (
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
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">Month: {monthLabel} | Year: {fee.year} | ₹{fee.amount ?? '-'}</p>
                      <Badge variant={fee.status === 'Paid' ? 'default' : fee.status === 'Unpaid' ? 'destructive' : 'secondary'}>
                        {fee.status}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewStudent(student)}
                        title="View Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => updatePaymentStatus(student._id || student.id, fee.month, 'Paid')}
                        disabled={fee.status === 'Paid'}
                      >
                        Mark Paid
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => updatePaymentStatus(student._id || student.id, fee.month, 'Unpaid')}
                        disabled={fee.status === 'Unpaid'}
                      >
                        Mark Unpaid
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      {/* Reason Modal */}
      <Dialog open={reasonModal.open} onOpenChange={open => setReasonModal(r => ({ ...r, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Fee Status</DialogTitle>
            <DialogDescription>
              Please provide a reason for changing the fee status to <b>{reasonModal.newStatus?.toUpperCase()}</b>
            </DialogDescription>
          </DialogHeader>
          <Input
            ref={reasonInputRef}
            placeholder="Enter reason..."
            value={reasonInput}
            onChange={e => setReasonInput(e.target.value)}
            className="mb-4"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setReasonModal({ open: false })}>Cancel</Button>
            <Button onClick={handleReasonModalConfirm} disabled={!reasonInput.trim()}>Confirm</Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Student Profile Dialog */}
      <Dialog open={profileDialog.open} onOpenChange={open => setProfileDialog(p => ({ ...p, open }))}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>Complete student information and fee history</DialogDescription>
          </DialogHeader>
          {profileDialog.details ? (
            <div className="space-y-6">
              {/* Student Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={profileDialog.details.profilePicture} />
                      <AvatarFallback>{profileDialog.details.name?.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">{profileDialog.details.name}</h3>
                      <p className="text-sm text-muted-foreground">{profileDialog.details.class || profileDialog.details.className}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>Parents: {profileDialog.details.fatherName || profileDialog.details.parentsName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{profileDialog.details.mobileNo}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{profileDialog.details.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap className="w-4 h-4 text-muted-foreground" />
                      <span>Roll No: {profileDialog.details.rollNo}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Academic Result</h4>
                    <Badge variant={profileDialog.details.result === 'pass' ? 'default' : profileDialog.details.result === 'fail' ? 'destructive' : 'secondary'}>
                      {(profileDialog.details.result || 'pending').toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Registration Status</h4>
                    <Badge variant={profileDialog.details.approved ? 'default' : 'secondary'}>
                      {profileDialog.details.approved ? 'Approved' : 'Pending Approval'}
                    </Badge>
                  </div>
                </div>
              </div>
              {/* Fee History */}
              <div>
                <h4 className="font-medium mb-3">Fee Payment History</h4>
                <div className="space-y-2">
                  {(profileDialog.details.feePayments || []).map((fee: any, index: number) => {
                    const monthLabel = monthNames.find(m => m.value === String(fee.month))?.label || fee.month;
                    // Get class fee for this student
                    const className = profileDialog.details.class || profileDialog.details.className;
                    const classFee = classFees[className] ?? '';
                    // Prefer fee.amount if present, else show classFee
                    const displayAmount = typeof fee.amount === 'number' ? fee.amount : classFee;
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{monthLabel} {fee.year}</p>
                          <p className="text-sm text-muted-foreground">Amount: ₹{displayAmount !== '' ? displayAmount : '-'}</p>
                          {fee.paidAt && (
                            <p className="text-xs text-muted-foreground">Paid on: {new Date(fee.paidAt).toISOString().slice(0, 10)}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={fee.status === 'Paid' ? 'default' : fee.status === 'Unpaid' ? 'destructive' : 'secondary'}>
                            {fee.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4">Loading...</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}