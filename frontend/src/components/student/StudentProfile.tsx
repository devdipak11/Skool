import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Phone, GraduationCap, CalendarDays, DollarSign, CheckCircle, Clock, MapPin, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/layout/AppHeader';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BACKEND_URL } from '@/utils/utils';

export default function StudentProfile() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [feeHistory, setFeeHistory] = useState<any[]>([]);
  const [classFee, setClassFee] = useState<number | null>(null);
  const [monthlyFeeAmount, setMonthlyFeeAmount] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editProfile, setEditProfile] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/students/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load profile');
        const data = await res.json();
        setProfile(data);

        // Fetch monthly fee amount for this student
        const feeAmountRes = await fetch(`${BACKEND_URL}/api/students/fees/monthly-amount`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        let fetchedMonthlyFeeAmount = null;
        if (feeAmountRes.ok) {
          const feeAmountData = await feeAmountRes.json();
          fetchedMonthlyFeeAmount = feeAmountData.amount ?? null;
          setMonthlyFeeAmount(fetchedMonthlyFeeAmount);
          setClassFee(fetchedMonthlyFeeAmount);
        } else {
          setMonthlyFeeAmount(null);
        }

        // Fetch monthly fee status for this student
        const now = new Date();
        const year = now.getFullYear();
        const feeStatusRes = await fetch(`${BACKEND_URL}/api/students/fees/monthly-status?year=${year}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (feeStatusRes.ok) {
          const feeStatusData = await feeStatusRes.json();
          // Fill for all months Jan-Dec, use backend amount if present, else use monthlyFeeAmount
          const months = Array.from({ length: 12 }, (_, i) => i + 1);
          const feeHistoryArr = months.map(monthNum => {
            const found = feeStatusData.find((f: any) => Number(f.month) === monthNum);
            const monthLabel = new Date(year, monthNum - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
            return {
              month: monthLabel,
              // Use backend amount if present, else use monthlyFeeAmount
              amount: typeof found?.amount === 'number' && found.amount !== undefined && found.amount !== null
                ? found.amount
                : fetchedMonthlyFeeAmount,
              status: found?.status || 'Pending',
              paidDate: found?.paidAt ? new Date(found.paidAt).toISOString().slice(0, 10) : null
            };
          });
          setFeeHistory(feeHistoryArr);
        } else {
          // fallback: show all months with monthlyFeeAmount and Pending
          const months = Array.from({ length: 12 }, (_, i) => i + 1);
          setFeeHistory(months.map(monthNum => ({
            month: new Date(new Date().getFullYear(), monthNum - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' }),
            amount: fetchedMonthlyFeeAmount,
            status: 'Pending',
            paidDate: null
          })));
        }
      } catch (e: any) {
        toast({ title: 'Profile Error', description: e.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    // eslint-disable-next-line
  }, [token]);

  if (!user) return null;

  const display = profile || user; // fallback to user info from login

  const mockResults = [
    { subject: 'Mathematics', marks: 85, total: 100, grade: 'A' },
    { subject: 'Physics', marks: 78, total: 100, grade: 'B+' },
    { subject: 'Computer Science', marks: 92, total: 100, grade: 'A+' },
  ];

  const getGradeBadgeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-success text-success-foreground';
    if (grade.startsWith('B')) return 'bg-primary text-primary-foreground';
    if (grade.startsWith('C')) return 'bg-warning text-warning-foreground';
    return 'bg-destructive text-destructive-foreground';
  };

  const getFeeBadgeColor = (status: string) => {
    return status?.toLowerCase() === 'paid' 
      ? 'bg-success text-success-foreground' 
      : 'bg-warning text-warning-foreground';
  };

  // Open edit modal with current profile data
  const handleEditProfileOpen = () => {
    setEditProfile({
      name: display.name || '',
      fatherName: display.fatherName || '',
      address: display.address || '',
      class: display.class || display.className || '',
      rollNo: display.rollNo || ''
    });
    setEditModalOpen(true);
  };

  // Handle profile update
  const handleProfileUpdate = async () => {
    setEditLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/students/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(editProfile),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update profile');
      }
      toast({ title: 'Profile Updated', description: 'Your profile has been updated.' });
      setEditModalOpen(false);
      // Refresh profile
      const profileRes = await fetch(`${BACKEND_URL}/api/students/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data);
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Profile" />
      <div className="p-4 pb-20 space-y-6">
        <Card
          className="shadow-card"
          style={{
            background: "#fffde7",
            color: "#333",
            border: "none"
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={display.profilePicture} alt={display.name} />
                <AvatarFallback className="text-lg" style={{ background: "#fff", color: "#3556b0" }}>
                  {display.name?.split(' ').map((n: string) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-center">
                  <h2
                    className="text-xl font-bold mb-1"
                    style={{
                      color: "#ff9800", // Orange for name
                      textShadow: "0 1px 8px #fffde7, 0 1px 1px #ffd54f"
                    }}
                  >
                    {display.name}
                  </h2>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEditProfileOpen}
                    style={{
                      background: "#fff",
                      color: "#3556b0",
                      borderColor: "#ffd54f"
                    }}
                  >
                    Edit Profile
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  {display.fatherName && (
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4" style={{ color: "#ffb300" }} />
                      <span style={{ color: "#8d6e63", fontWeight: 500 }}>
                        Father: <span style={{ color: "#6d4c41" }}>{display.fatherName}</span>
                      </span>
                    </div>
                  )}
                  {display.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" style={{ color: "#43a047" }} />
                      <span style={{ color: "#388e3c", fontWeight: 500 }}>{display.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" style={{ color: "#1976d2" }} />
                    <span style={{ color: "#1976d2", fontWeight: 500 }}>
                      {display.class || display.className}
                      <span style={{ color: "#333", fontWeight: 400 }}> • Roll No: </span>
                      <span style={{ color: "#d84315", fontWeight: 600 }}>{display.rollNo}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" style={{ color: "#6d4c41" }} />
                    <span style={{ color: "#6d4c41", fontWeight: 500 }}>{display.mobileNo}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Academic Results
            </CardTitle>
            <CardDescription>Your latest exam results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{result.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      {result.marks}/{result.total} marks
                    </p>
                  </div>
                  <Badge className={getGradeBadgeColor(result.grade)}>
                    {result.grade}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Fee Status
            </CardTitle>
            <CardDescription>
              Monthly fee payment history
              {monthlyFeeAmount !== null && (
                <span className="block mt-1 text-primary font-semibold">
                  Monthly Fee Amount: ₹{monthlyFeeAmount}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {feeHistory.length === 0 && (
                <p className="text-sm text-muted-foreground">No fee history available.</p>
              )}
              {feeHistory.map((record: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{record.month}</p>
                    <p className="text-sm text-muted-foreground">
                      Amount: ₹{record.amount !== undefined && record.amount !== null ? record.amount : '-'}
                    </p>
                    {record.paidDate && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <CalendarDays className="w-3 h-3" />
                        Paid on: {record.paidDate}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={record.status?.toLowerCase() === 'paid'
                      ? 'bg-success text-success-foreground'
                      : record.status?.toLowerCase() === 'unpaid'
                        ? 'bg-destructive text-destructive-foreground'
                        : 'bg-warning text-warning-foreground'}>
                      {record.status?.toLowerCase() === 'paid' ? (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Paid
                        </div>
                      ) : record.status?.toLowerCase() === 'unpaid' ? (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Unpaid
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Pending
                        </div>
                      )}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">3.8</div>
              <div className="text-sm text-muted-foreground">GPA</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-success mb-1">95%</div>
              <div className="text-sm text-muted-foreground">Attendance</div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Profile Modal */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-fatherName">Father's Name</Label>
                <Input
                  id="edit-fatherName"
                  value={editProfile?.fatherName || ''}
                  onChange={e => setEditProfile((p: any) => ({ ...p, fatherName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  value={editProfile?.address || ''}
                  onChange={e => setEditProfile((p: any) => ({ ...p, address: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-class">Class</Label>
                <Input
                  id="edit-class"
                  value={editProfile?.class || ''}
                  onChange={e => setEditProfile((p: any) => ({ ...p, class: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-rollNo">Roll No</Label>
                <Input
                  id="edit-rollNo"
                  value={editProfile?.rollNo || ''}
                  onChange={e => setEditProfile((p: any) => ({ ...p, rollNo: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleProfileUpdate} disabled={editLoading} className="flex-1">
                  {editLoading ? 'Saving...' : 'Save'}
                </Button>
                <Button variant="outline" onClick={() => setEditModalOpen(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}