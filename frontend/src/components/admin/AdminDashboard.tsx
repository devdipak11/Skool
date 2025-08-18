import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  BookOpen, 
  Settings, 
  Image, 
  GraduationCap, 
  DollarSign,
  FileText,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Search
} from 'lucide-react';
import { mockStudents, mockSubjects, mockBanners, mockClassFees, mockTeacherPosts } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';
import AppHeader from '@/components/layout/AppHeader';
import BillingManagement from './BillingManagement';
import SubjectManagement from './SubjectManagement';
import FeeManagement from './FeeManagement';
import FacultyManagement from './facultyManagement';
import StudentManagement from './studentManagment';
import BannerManagment from './BannerManagment';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const [approvedStudentCount, setApprovedStudentCount] = useState(0);
  const [facultyCount, setFacultyCount] = useState(0);
  const [subjectCount, setSubjectCount] = useState(0);

  useEffect(() => {
    // Fetch dashboard counts from backend
    fetch('/api/admin/dashboard-counts', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        if (typeof data === 'object' && data !== null) {
          setApprovedStudentCount(data.approvedStudentsCount || 0);
          setFacultyCount(data.facultyCount || 0);
          setSubjectCount(data.subjectCount || 0);
        }
      });
  }, []);

  const handleApproveStudent = (studentId: string) => {
    toast({
      title: "Student Approved",
      description: "Student registration has been approved successfully.",
    });
  };

  const handleRejectStudent = (studentId: string) => {
    toast({
      title: "Student Rejected",
      description: "Student registration has been rejected.",
      variant: "destructive",
    });
  };

  const filteredStudents = mockStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingApprovals = mockStudents.filter(student => !student.isApproved);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Admin Dashboard" showProfile={false} />
      
      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-card border-r border-border h-screen sticky top-0 p-4">
          <nav className="space-y-2">
            <Button
              variant={activeTab === 'overview' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('overview')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Overview
            </Button>
            <Button
              variant={activeTab === 'banners' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('banners')}
            >
              <Image className="w-4 h-4 mr-2" />
              Manage Banners
            </Button>
            <Button
              variant={activeTab === 'students' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('students')}
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              Manage Students
            </Button>
            <Button
              variant={activeTab === 'teachers' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('teachers')}
            >
              <Users className="w-4 h-4 mr-2" />
              Manage Teachers
            </Button>
            <Button
              variant={activeTab === 'subjects' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('subjects')}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Manage Subjects
            </Button>
            <Button
              variant={activeTab === 'results' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('results')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Manage Results
            </Button>
            <Button
              variant={activeTab === 'billing' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('billing')}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Manage Billing
            </Button>
            <Button
              variant={activeTab === 'fees' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('fees')}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Manage Fees
            </Button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="flex flex-col items-center py-8">
                  <BookOpen className="w-10 h-10 text-blue-500 mb-2" />
                  <div className="text-3xl font-bold">{approvedStudentCount}</div>
                  <div className="text-muted-foreground mt-1">Total Students</div>
                </Card>
                <Card className="flex flex-col items-center py-8">
                  <Users className="w-10 h-10 text-green-500 mb-2" />
                  <div className="text-3xl font-bold">{facultyCount}</div>
                  <div className="text-muted-foreground mt-1">Faculty Members</div>
                </Card>
                <Card className="flex flex-col items-center py-8">
                  <BookOpen className="w-10 h-10 text-orange-500 mb-2" />
                  <div className="text-3xl font-bold">{subjectCount}</div>
                  <div className="text-muted-foreground mt-1">Active Subjects</div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'students' && <StudentManagement />}

          {activeTab === 'subjects' && <SubjectManagement />}

          {activeTab === 'billing' && <BillingManagement />}

          {activeTab === 'fees' && <FeeManagement />}

          {activeTab === 'teachers' && <FacultyManagement />}

          {activeTab === 'banners' && <BannerManagment />}
        </div>
      </div>
    </div>
  );
}