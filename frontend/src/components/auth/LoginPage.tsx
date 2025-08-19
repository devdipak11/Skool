import React, { useState, useEffect, useRef } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { mockBanners } from '@/data/mockData';
import type { BannerItem } from '@/data/mockData';

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
  const [showForgot, setShowForgot] = useState(false);
  const [forgotMobile, setForgotMobile] = useState('');
  const [forgotFacultyId, setForgotFacultyId] = useState('');
  const [forgotAdminId, setForgotAdminId] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [studentOtpSent, setStudentOtpSent] = useState(false);
  const [studentOtp, setStudentOtp] = useState('');
  const [studentOtpVerified, setStudentOtpVerified] = useState(false);
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [carouselApi, setCarouselApi] = useState<any | null>(null);
  const autoplayRef = useRef<number | null>(null);
  const isPausedRef = useRef<boolean>(false);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { login: loginContext } = useAuth();

  // API base url
  const API_BASE = import.meta.env.VITE_API_BASE_URL || BACKEND_URL;

  // Helper: map frontend role to backend role
  const getBackendRole = (role: UserRole) => {
    if (role === 'student') return 'Student';
    if (role === 'faculty') return 'Faculty';
    if (role === 'admin') return 'Admin';
    return '';
  };

  const resolveImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (!url.startsWith('/')) {
      return `${API_BASE}/${url.replace(/^\/+/,'')}`;
    }
    return `${API_BASE}${url}`;
  };

  useEffect(() => {
    let mounted = true;
    const fetchBanners = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/banners`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (mounted && Array.isArray(data) && data.length > 0) {
          const mapped = data.map((b: any) => ({
            id: b._id || b.id,
            title: b.title || 'Banner',
            description: b.description || '',
            image: b.image || b.imageUrl || '',
            imageUrl: b.imageUrl || b.image || '',
            link: b.link || undefined
          }));
          setBanners(mapped);
        } else if (mounted) {
          setBanners(mockBanners);
        }
      } catch (e) {
        if (mounted) setBanners(mockBanners);
      }
    };
    fetchBanners();
    return () => { mounted = false; };
  }, [API_BASE]);

  const startAutoplay = () => {
    if (autoplayRef.current) {
      window.clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
    if (!carouselApi) return;
    autoplayRef.current = window.setInterval(() => {
      if (isPausedRef.current) return;
      try { carouselApi?.scrollNext(); } catch { /* ignore */ }
    }, 5000);
  };
  const stopAutoplay = () => {
    if (autoplayRef.current) {
      window.clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
  };
  useEffect(() => {
    if (!carouselApi) return;
    startAutoplay();
    return () => stopAutoplay();
  }, [carouselApi]);

  // Send OTP API
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      name && fathersName && address && className && rollNo && mobileNo && password
    ) {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobileNo }),
        });
        const data = await res.json();
        if (res.ok) {
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

  // Student Login: Send OTP
  const handleStudentSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!mobileNo || mobileNo.length !== 10) {
      toast({ title: "Invalid Mobile Number", description: "Please enter a valid 10-digit mobile number.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNo }),
      });
      const data = await res.json();
      if (res.ok) {
        setStudentOtpSent(true);
        setStudentOtp(data?.otp || '');
        setStudentOtpVerified(false);
        toast({ title: "OTP Sent", description: `A 6-digit OTP has been sent to ${mobileNo}.` });
      } else {
        toast({ title: "OTP Error", description: data.message || "Failed to send OTP", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Network Error", description: "Could not send OTP", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Student Login: Verify OTP and Login
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNo || !studentOtp || studentOtp.length !== 6) {
      toast({ title: "Invalid OTP", description: "Please enter the 6-digit OTP.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const payload = { role: getBackendRole('student'), mobileNo, otp: studentOtp };
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: "Login Successful",
          description: `Welcome back! Logged in as student.`,
        });
        loginContext({
          ...data.user,
          fatherName: data.user?.fatherName,
          address: data.user?.address,
          className: data.user?.class,
          rollNo: data.user?.rollNo,
          mobileNo: data.user?.mobileNo
        }, data.token);
        navigate('/student');
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

  // Register API
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
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
      if (role === 'admin') payload.adminId = adminId;
      const res = await fetch(`${API_BASE}/api/auth/login`, {
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
        loginContext({
          ...data.user,
          fatherName: data.user?.fatherName,
          address: data.user?.address,
          className: data.user?.class,
          rollNo: data.user?.rollNo,
          mobileNo: data.user?.mobileNo
        }, data.token);
        if (role === 'student') {
          navigate('/student');
        }
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

  // Forgot password handler
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    let payload: any = { role: getBackendRole(role), newPassword: forgotNewPassword };
    if (role === 'student') payload.mobileNo = forgotMobile;
    if (role === 'faculty') payload.facultyId = forgotFacultyId;
    if (role === 'admin') payload.adminId = forgotAdminId;
    try {
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Password Changed', description: 'You can now login with your new password.' });
        setShowForgot(false);
        setForgotMobile(''); setForgotFacultyId(''); setForgotAdminId(''); setForgotNewPassword('');
      } else {
        toast({ title: 'Error', description: data.message || 'Failed to change password.', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Network Error', description: 'Could not change password.', variant: 'destructive' });
    } finally {
      setForgotLoading(false);
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
    <div
      className={`
        min-h-screen w-full flex flex-col items-center justify-center
        bg-[#f4f7fd]
        ${typeof window !== "undefined" && window.innerWidth < 640
          ? 'p-0'
          : 'p-0 sm:p-4'
        }
        overflow-x-hidden
      `}
      style={{
        minHeight: '100vh',
        width: '100vw',
      }}
    >
      {/* Outer background box covers everything */}
      <div
        className={`
          w-full
          min-h-screen
          flex flex-col items-center
          ${typeof window !== "undefined" && window.innerWidth < 640
            ? 'max-w-[380px] mx-auto rounded-none shadow-none px-0 py-0'
            : 'sm:max-w-xl sm:animate-fade-in rounded-3xl shadow-xl px-0 py-0'
          }
          bg-[#e3f0fc]
        `}
        style={{
          minHeight: '100vh',
          maxWidth: typeof window !== "undefined" && window.innerWidth < 640 ? 380 : undefined,
          marginLeft: typeof window !== "undefined" && window.innerWidth < 640 ? 'auto' : undefined,
          marginRight: typeof window !== "undefined" && window.innerWidth < 640 ? 'auto' : undefined,
          borderRadius: typeof window !== "undefined" && window.innerWidth < 640 ? 0 : undefined,
          boxShadow: typeof window !== "undefined" && window.innerWidth < 640 ? 'none' : undefined,
        }}
      >
        {/* School heading and icon at the top */}
        <div className="text-center mb-6 mt-8 sm:mt-0 w-full">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 shadow-card mx-auto">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight" style={{ fontWeight: 900 }}>
            Tagore Public School
          </h1>
          <p className="text-muted-foreground mt-2">School Management System</p>
        </div>
        {/* Banner Carousel just below heading */}
        {banners.length > 0 && (
          <div
            className="w-full flex justify-center mb-6 px-0 sm:px-0"
            onMouseEnter={() => { isPausedRef.current = true; stopAutoplay(); }}
            onMouseLeave={() => { isPausedRef.current = false; startAutoplay(); }}
          >
            <div className="w-full sm:w-[500px] max-w-full">
              <Carousel className="w-full" opts={{ loop: true }} setApi={setCarouselApi}>
                <CarouselContent>
                  {banners.map((banner) => {
                    const raw = banner.imageUrl || banner.image || '';
                    const imgSrc = resolveImageUrl(raw);
                    return (
                      <CarouselItem key={banner.id}>
                        <div className="border-0 shadow-card overflow-hidden rounded-lg relative h-40 md:h-48 bg-gray-100">
                          <div
                            className="absolute inset-0 bg-center bg-cover"
                            style={{ backgroundImage: imgSrc ? `url(${imgSrc})` : undefined, backgroundColor: '#fff' }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-4 left-4 right-4 z-10 text-white">
                            <h3 className="text-lg md:text-xl font-semibold leading-tight drop-shadow-md">
                              {banner.title}
                            </h3>
                            <p className="text-sm md:text-base opacity-90 mt-1 drop-shadow-md">
                              {banner.description}
                            </p>
                          </div>
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </Carousel>
            </div>
          </div>
        )}
        {/* Card with light background inside sky blue box */}
        <div
          className={`
            w-full flex flex-col items-center px-0 sm:px-6
          `}
        >
          <Card className={`
            w-full
            shadow-lg
            border-0 bg-white/95 backdrop-blur-sm
            ${typeof window !== "undefined" && window.innerWidth < 640 ? 'rounded-none shadow-lg border-none' : 'rounded-2xl'}
            px-2 py-4 sm:px-8 sm:py-8
            max-w-full
          `}>
            <CardHeader className="space-y-1">
              {/* Add label above role buttons */}
              <div className="flex flex-col items-center gap-2 mb-4">
                <span className="text-base font-medium text-muted-foreground mb-1">I am a:</span>
                <div className="flex flex-row gap-3 w-full justify-center">
                  <Button
                    type="button"
                    variant={role === 'student' ? 'default' : 'outline'}
                    onClick={() => handleRoleButton('student')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold transition-all duration-150
                      ${role === 'student' ? 'bg-[#3366e7] text-white shadow-md' : 'bg-white text-[#222] border border-gray-200'}
                    `}
                    style={{
                      minWidth: 120,
                      minHeight: 48,
                    }}
                  >
                    <GraduationCap className="w-5 h-5" /> Student
                  </Button>
                  <Button
                    type="button"
                    variant={role === 'faculty' ? 'default' : 'outline'}
                    onClick={() => handleRoleButton('faculty')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold transition-all duration-150
                      ${role === 'faculty' ? 'bg-[#f5f6fa] border border-[#3366e7] text-[#222]' : 'bg-white text-[#222] border border-gray-200'}
                    `}
                    style={{
                      minWidth: 120,
                      minHeight: 48,
                    }}
                  >
                    <Users className="w-5 h-5" /> Faculty
                  </Button>
                  <Button
                    type="button"
                    variant={role === 'admin' ? 'default' : 'outline'}
                    onClick={() => handleRoleButton('admin')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold transition-all duration-150
                      ${role === 'admin' ? 'bg-[#f5f6fa] border border-[#3366e7] text-[#222]' : 'bg-white text-[#222] border border-gray-200'}
                    `}
                    style={{
                      minWidth: 120,
                      minHeight: 48,
                    }}
                  >
                    <Settings className="w-5 h-5" /> Admin
                  </Button>
                </div>
              </div>
              <Tabs value={isLogin ? 'login' : 'register'} onValueChange={(value) => setIsLogin(value === 'login')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register" disabled={role !== 'student'}>Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-4 mt-4">
                </TabsContent>
                
                <TabsContent value="register" className="space-y-4 mt-4">
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>Register as a new student</CardDescription>
                </TabsContent>
              </Tabs>
            </CardHeader>

            <CardContent>
              <form onSubmit={role === 'student' && isLogin ? handleStudentLogin : handleSubmit} className="space-y-4">
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
                            maxLength={10}
                            pattern="[0-9]{10}"
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setMobileNo(val);
                            }}
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
                              readOnly={!!otp}
                              onChange={e => {
                                if (!otp) setOtp(e.target.value.replace(/\D/,''));
                              }}
                              required
                            />
                            {otp && (
                              <div className="text-sm text-muted-foreground flex items-center justify-between">
                                <span>Development OTP: <strong className="ml-1">{otp}</strong></span>
                              </div>
                            )}
                            <Button
                              type="button"
                              className="w-full bg-gradient-primary hover:shadow-hover transition-all duration-200"
                              onClick={async (e) => {
                                e.preventDefault();
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

                {isLogin && (
                  <>
                    {role === 'student' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="mobile">Mobile Number</Label>
                          <Input
                            id="mobile"
                            type="tel"
                            placeholder="Enter your mobile number"
                            value={mobileNo}
                            maxLength={10}
                            pattern="[0-9]{10}"
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setMobileNo(val);
                            }}
                            required
                            disabled={studentOtpSent}
                          />
                        </div>
                        {!studentOtpSent && (
                          <Button
                            type="button"
                            className="w-full bg-gradient-primary hover:shadow-hover transition-all duration-200"
                            onClick={handleStudentSendOtp}
                            disabled={loading || !mobileNo || mobileNo.length !== 10}
                          >
                            {loading ? 'Please wait...' : 'Send OTP'}
                          </Button>
                        )}
                        {studentOtpSent && (
                          <div className="space-y-2">
                            <Label htmlFor="student-otp">Enter OTP</Label>
                            <Input
                              id="student-otp"
                              type="text"
                              placeholder="Enter 6-digit OTP"
                              value={studentOtp}
                              maxLength={6}
                              onChange={e => setStudentOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              required
                            />
                            {studentOtp && studentOtp.length === 6 && (
                              <div className="text-sm text-muted-foreground flex items-center justify-between">
                                <span>Development OTP: <strong className="ml-1">{studentOtp}</strong></span>
                              </div>
                            )}
                            <Button
                              type="submit"
                              className="w-full bg-gradient-primary hover:shadow-hover transition-all duration-200"
                              disabled={loading || studentOtp.length !== 6}
                            >
                              {loading ? 'Please wait...' : 'Verify OTP & Sign In'}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full mt-2"
                              onClick={() => {
                                setStudentOtpSent(false);
                                setStudentOtp('');
                              }}
                            >
                              Change Mobile Number
                            </Button>
                          </div>
                        )}
                      </>
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
                    {(role === 'faculty' || role === 'admin') && (
                      <>
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
                        <div className="flex justify-end mb-2">
                          <button
                            type="button"
                            className="text-sm text-primary underline hover:text-primary/80 focus:outline-none"
                            onClick={() => setShowForgot(true)}
                          >
                            Forgot password?
                          </button>
                        </div>
                      </>
                    )}
                    <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      Note:- Admin and Teacher can log in directly. Only new students have to register! | Facing Problem? Contact us:- 9204520826 for help!
                    </div>
                    {(role === 'faculty' || role === 'admin') && (
                      <Button
                        type="submit"
                        className="w-full bg-gradient-primary hover:shadow-hover transition-all duration-200"
                        disabled={loading}
                      >
                        {loading ? 'Please wait...' : 'Sign In'}
                      </Button>
                    )}
                  </>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      {(role === 'faculty' || role === 'admin') && (
        <Dialog open={showForgot} onOpenChange={setShowForgot}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                {role === 'student' && 'Enter your registered mobile number and new password.'}
                {role === 'faculty' && 'Enter your Faculty ID and new password.'}
                {role === 'admin' && 'Enter your Admin ID and new password.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              {role === 'student' && (
                <Input
                  type="tel"
                  placeholder="Registered Mobile Number"
                  value={forgotMobile}
                  maxLength={10}
                  pattern="[0-9]{10}"
                  onChange={e => setForgotMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                />
              )}
              {role === 'faculty' && (
                <Input
                  type="text"
                  placeholder="Faculty ID"
                  value={forgotFacultyId}
                  onChange={e => setForgotFacultyId(e.target.value)}
                  required
                />
              )}
              {role === 'admin' && (
                <Input
                  type="text"
                  placeholder="Admin ID"
                  value={forgotAdminId}
                  onChange={e => setForgotAdminId(e.target.value)}
                  required
                />
              )}
              <Input
                type="password"
                placeholder="New Password"
                value={forgotNewPassword}
                onChange={e => setForgotNewPassword(e.target.value)}
                required
              />
              <DialogFooter>
                <Button type="submit" className="w-full" disabled={forgotLoading}>
                  {forgotLoading ? 'Please wait...' : 'Change Password'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}