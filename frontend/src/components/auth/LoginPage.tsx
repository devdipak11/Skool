import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, GraduationCap, Users, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BACKEND_URL } from '@/utils/utils';

export type UserRole = 'student' | 'faculty' | 'admin';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>('student');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [adminId, setAdminId] = useState('');
  const [fathersName, setFathersName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { login: loginContext } = useAuth();

  // API base url
  const API_BASE = `${BACKEND_URL}/api/auth`;

  // Helper: map frontend role to backend role
  const getBackendRole = (role: UserRole) => {
    if (role === 'student') return 'Student';
    if (role === 'faculty') return 'Faculty';
    if (role === 'admin') return 'Admin';
    return '';
  };

  // Send OTP API
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      name && fathersName && address && className && rollNo && mobileNo && password
    ) {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobileNo }),
        });
        const data = await res.json();
        if (res.ok) {
          // If backend returns OTP (dev mode), store and show it in UI; otherwise just indicate sent
          setOtpSent(true);
          setOtp(data?.otp || '');
          setOtpVerified(false);
          toast({ title: "OTP Sent", description: `A 6-digit OTP has been sent to ${mobileNo}.` });
        } else {
          toast({ title: "OTP Error", description: data.message || "Failed to send OTP", variant: "destructive" });
        }
      } catch (err) {
        toast({ title: "Network Error", description: "Could not send OTP", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    } else {
      toast({
        title: "Incomplete Details",
        description: "Please fill all details before requesting OTP.",
        variant: "destructive",
      });
    }
  };

  // OTP verification is handled on backend during register

  // Register API
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          fatherName: fathersName,
          address,
          class: className,
          rollNo,
          mobileNo,
          password,
          otp,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setRegisterSuccess(true);
        toast({
          title: "Registration Submitted",
          description: "Your request has been sent for admin approval, kindly check back later.",
          variant: "default",
        });
      } else {
        toast({
          title: "Registration Failed",
          description: data.message || "Registration failed.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Network Error",
        description: "Could not register.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Login API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let payload: Record<string, string> = { role: getBackendRole(role), password };
      if (role === 'student') payload.mobileNo = mobileNo;
      if (role === 'faculty') payload.facultyId = facultyId;
      if (role === 'admin') payload.adminId = adminId; // <-- FIXED: use adminId, not mobileNo
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: "Login Successful",
          description: `Welcome back! Logged in as ${role}.`,
        });
        // Save user and token in AuthContext & include extra fields if present
        loginContext({
          ...data.user,
          fatherName: data.user?.fatherName,
            address: data.user?.address,
            className: data.user?.class, // map backend 'class' to frontend 'className'
            rollNo: data.user?.rollNo,
            mobileNo: data.user?.mobileNo
        }, data.token);
        if (role === 'student') {
          navigate('/student');
        }
        // You can add similar redirects for faculty/admin if needed
      } else {
        toast({
          title: "Login Failed",
          description: data.message || "Invalid credentials. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Network Error",
        description: "Could not login.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'student': return <GraduationCap className="w-5 h-5" />;
      case 'faculty': return <Users className="w-5 h-5" />;
      case 'admin': return <Settings className="w-5 h-5" />;
    }
  };

  const handleRoleButton = (newRole: UserRole) => {
    setRole(newRole);
    setIsLogin(true);
    setOtpSent(false);
    setOtp('');
    setOtpVerified(false);
    setRegisterSuccess(false);
    setPassword('');
    setName('');
    setClassName('');
    setRollNo('');
    setMobileNo('');
    setFacultyId('');
    setAdminId('');
    setFathersName('');
    setAddress('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 shadow-card">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Tagore Public School</h1>
          <p className="text-muted-foreground mt-2">School Management System</p>
        </div>

        <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            {/* Role selection buttons */}
            <div className="flex justify-center gap-2 mb-4">
              <Button
                type="button"
                variant={role === 'student' ? 'default' : 'outline'}
                onClick={() => handleRoleButton('student')}
                className="flex items-center gap-2"
              >
                <GraduationCap className="w-5 h-5" /> Student
              </Button>
              <Button
                type="button"
                variant={role === 'faculty' ? 'default' : 'outline'}
                onClick={() => handleRoleButton('faculty')}
                className="flex items-center gap-2"
              >
                <Users className="w-5 h-5" /> Faculty
              </Button>
              <Button
                type="button"
                variant={role === 'admin' ? 'default' : 'outline'}
                onClick={() => handleRoleButton('admin')}
                className="flex items-center gap-2"
              >
                <Settings className="w-5 h-5" /> Admin
              </Button>
            </div>
            <Tabs value={isLogin ? 'login' : 'register'} onValueChange={(value) => setIsLogin(value === 'login')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register" disabled={role !== 'student'}>Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4 mt-4">
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>Sign in to your account to continue</CardDescription>
              </TabsContent>
              
              <TabsContent value="register" className="space-y-4 mt-4">
                <CardTitle>Create Account</CardTitle>
                <CardDescription>Register as a new student</CardDescription>
              </TabsContent>
            </Tabs>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Registration fields for student only */}
              {!isLogin && role === 'student' && (
                <>
                  {registerSuccess ? (
                    <div className="text-green-600 font-medium text-center p-4">
                      Your request has been sent for admin approval, kindly check back later.
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter your full name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fathersName">Father's Name</Label>
                        <Input
                          id="fathersName"
                          type="text"
                          placeholder="Enter your father's name"
                          value={fathersName}
                          onChange={(e) => setFathersName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          type="text"
                          placeholder="Enter your address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="class">Class</Label>
                          <Input
                            id="class"
                            type="text"
                            placeholder="e.g., Grade 10-A"
                            value={className}
                            onChange={(e) => setClassName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="rollNo">Roll No</Label>
                          <Input
                            id="rollNo"
                            type="text"
                            placeholder="e.g., 10A001"
                            value={rollNo}
                            onChange={(e) => setRollNo(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mobile">Mobile Number</Label>
                        <Input
                          id="mobile"
                          type="tel"
                          placeholder="+1234567890"
                          value={mobileNo}
                          onChange={(e) => setMobileNo(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      {/* OTP Flow */}
                      {!otpSent && (
                        <Button
                          type="button"
                          className="w-full bg-gradient-primary hover:shadow-hover transition-all duration-200"
                          onClick={handleSendOtp}
                          disabled={loading}
                        >
                          {loading ? 'Please wait...' : 'Send OTP'}
                        </Button>
                      )}
                      {otpSent && !otpVerified && (
                        <div className="space-y-2">
                          <Label htmlFor="otp">Enter OTP</Label>
                          <Input
                            id="otp"
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            maxLength={6}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/,''))}
                            required
                          />
                          {/* Development: show OTP on page if backend provided it */}
                          {otp && (
                            <div className="text-sm text-muted-foreground flex items-center justify-between">
                              <span>Development OTP: <strong className="ml-1">{otp}</strong></span>
                              <button
                                type="button"
                                className="text-sm text-primary underline ml-4"
                                onClick={() => {
                                  // already autofilled, but keep for explicit action
                                  setOtp(otp);
                                }}
                              >
                                Autofill
                              </button>
                            </div>
                          )}
                          <Button
                            type="button"
                            className="w-full bg-gradient-primary hover:shadow-hover transition-all duration-200"
                            onClick={async (e) => {
                              e.preventDefault();
                              // OTP is verified on register, so just mark as verified if 6 digits
                              if (otp.length === 6) setOtpVerified(true);
                              else toast({ title: "Invalid OTP", description: "Please enter a valid 6-digit OTP.", variant: "destructive" });
                            }}
                            disabled={loading || otp.length !== 6}
                          >
                            {loading ? 'Please wait...' : 'Verify OTP'}
                          </Button>
                        </div>
                      )}
                      {otpSent && otpVerified && (
                        <Button
                          type="button"
                          className="w-full bg-gradient-primary hover:shadow-hover transition-all duration-200"
                          onClick={handleRegister}
                          disabled={loading}
                        >
                          {loading ? 'Please wait...' : 'Register'}
                        </Button>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Login fields based on role */}
              {isLogin && (
                <>
                  {role === 'student' && (
                    <div className="space-y-2">
                      <Label htmlFor="mobile">Mobile Number</Label>
                      <Input
                        id="mobile"
                        type="tel"
                        placeholder="Enter your mobile number"
                        value={mobileNo}
                        onChange={(e) => setMobileNo(e.target.value)}
                        required
                      />
                    </div>
                  )}
                  {role === 'faculty' && (
                    <div className="space-y-2">
                      <Label htmlFor="facultyId">Faculty ID</Label>
                      <Input
                        id="facultyId"
                        type="text"
                        placeholder="Enter your faculty ID"
                        value={facultyId}
                        onChange={(e) => setFacultyId(e.target.value)}
                        required
                      />
                    </div>
                  )}
                  {role === 'admin' && (
                    <div className="space-y-2">
                      <Label htmlFor="adminId">Admin ID</Label>
                      <Input
                        id="adminId"
                        type="text"
                        placeholder="Enter your admin ID"
                        value={adminId}
                        onChange={(e) => setAdminId(e.target.value)}
                        required
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    Admin and Faculty can log in directly. Only new students have to register.
                  </div>
                  {/* Add the login button here */}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-primary hover:shadow-hover transition-all duration-200"
                    disabled={loading}
                  >
                    {loading ? 'Please wait...' : 'Sign In'}
                  </Button>
                </>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}