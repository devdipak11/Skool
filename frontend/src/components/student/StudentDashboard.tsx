import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Plus, Users, Clock, BookOpen, Loader2, UserCircle, MoreVertical } from 'lucide-react';
import { mockBanners } from '@/data/mockData';
import type { BannerItem } from '@/data/mockData';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import AppHeader from '@/components/layout/AppHeader';
import { useAuth } from '@/contexts/AuthContext';
import type { CarouselApi } from '@/components/ui/carousel';
import { useRef as useRefLocal } from 'react';
import { BACKEND_URL } from '@/utils/utils';

interface Subject {
  _id: string;
  id?: string;
  name: string;
  code: string;
  description: string;
  faculty: string;
  color?: string;
  students?: number;
}

export default function StudentHome() {
  const [banners, setBanners] = useState<BannerItem[]>(mockBanners);
  const [subjectCode, setSubjectCode] = useState('');
  const [enrolledSubjects, setEnrolledSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, token } = useAuth();

  // Autoplay for banner carousel
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const autoplayRef = useRef<number | null>(null);
  const isPausedRef = useRef<boolean>(false);

  const startAutoplay = () => {
    // clear existing
    if (autoplayRef.current) {
      window.clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
    if (!carouselApi) return;
    autoplayRef.current = window.setInterval(() => {
      if (isPausedRef.current) return;
      try {
        carouselApi?.scrollNext();
      } catch (e) {
        // ignore
      }
    }, 5000); // 5 seconds
  };

  const stopAutoplay = () => {
    if (autoplayRef.current) {
      window.clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
  };

  // Start autoplay when api becomes available; cleanup on unmount
  useEffect(() => {
    if (!carouselApi) return;
    startAutoplay();
    return () => {
      stopAutoplay();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carouselApi]);

  // Backend base (use VITE_API_BASE_URL if provided, else backend default)
  // Important: frontend dev server origin (window.location.origin) cannot serve backend /uploads,
  // so default to backend URL used in admin management component.
  const API_BASE = import.meta.env.VITE_API_BASE_URL || BACKEND_URL;

  // Helper to resolve image URLs to an absolute URL
  const resolveImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    // Ensure leading slash
    if (!url.startsWith('/')) {
      // treat as filename or relative path under uploads
      return `${API_BASE}/${url.replace(/^\/+/, '')}`;
    }
    return `${API_BASE}${url}`;
  };

  // Fetch enrolled subjects when component mounts or token changes
  useEffect(() => {
    console.log('StudentHome useEffect triggered with token:', token ? 'Present' : 'Not present');
    console.log('Current user in StudentHome:', user);
    
    if (token) {
      fetchEnrolledSubjects();
    } else {
      console.warn('No token available to fetch subjects');
      setLoading(false); // ensure the UI doesn't stay stuck in loading when token is missing
    }
  }, [token]);

  // Fetch banners from backend (use mockBanners as fallback)
  useEffect(() => {
    let mounted = true;
    const fetchBanners = async () => {
      try {
        // call backend directly so we get real banner objects and images served under backend /uploads
        const res = await fetch(`${API_BASE}/api/banners`);
        if (!res.ok) {
          console.warn('Banners fetch failed, using mock banners', res.status);
          return;
        }
        const data = await res.json();
        if (!Array.isArray(data)) return;
        const mapped = data.map((b: any) => ({
          id: b._id || b.id,
          title: b.title || 'Banner',
          description: b.description || '',
          // keep both properties; we'll resolve to absolute URL when rendering
          image: b.image || b.imageUrl || '',
          imageUrl: b.imageUrl || b.image || '',
          link: b.link || undefined
        }));
        if (mounted && mapped.length > 0) setBanners(mapped);
      } catch (e) {
        console.warn('Error fetching banners, using mock data', e);
      }
    };
    fetchBanners();
    return () => { mounted = false; };
  }, []);

  const fetchEnrolledSubjects = async () => {
    if (!token) return;
    setLoading(true);
    try {
      console.log('Fetching enrolled subjects...');
      console.log('Request headers:', { Authorization: `Bearer ${token}` });
      
      // Try with absolute URL to bypass any proxy issues
      const apiUrl = '/api/students/subjects';
      console.log('Fetching from URL:', apiUrl);
      
      const res = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Subjects API response status:', res.status);
      console.log('Response headers:', {
        'content-type': res.headers.get('content-type'),
        'cors': res.headers.get('access-control-allow-origin')
      });
      
      if (!res.ok) {
        // Read raw body for better debugging (use clone to avoid consuming original if needed later)
        let errorMessage: string | undefined;
        try {
          const rawText = await res.clone().text();
          console.error('Subjects API returned non-OK:', { status: res.status, statusText: res.statusText, rawBody: rawText });
          try {
            const parsed = JSON.parse(rawText);
            errorMessage = parsed?.message || parsed?.error || JSON.stringify(parsed);
          } catch (e) {
            // rawText isn't JSON
            errorMessage = rawText || `Status: ${res.status}`;
          }
        } catch (e) {
          console.error('Failed to read response body for error response:', e);
          errorMessage = `Failed to parse error response: ${res.status}`;
        }

        console.error('Error response message to throw:', errorMessage);
        throw new Error(`Failed to fetch subjects: ${errorMessage}`);
      }
      
      const data = await res.json();
      console.log('Enrolled subjects data:', data);
      
      if (!Array.isArray(data)) {
        console.error('Expected array but got:', typeof data);
        throw new Error('Unexpected response format');
      }
      
      // Add default color and handle faculty data
      const subjectsWithColor = data.map((subject: any, index: number) => {
        // Process faculty field which could be an ObjectId or a populated object
        let facultyName = 'Unknown';
        if (subject.faculty) {
          if (typeof subject.faculty === 'string') {
            facultyName = 'Faculty ID: ' + subject.faculty.substring(0, 8);
          } else if (subject.faculty.name) {
            facultyName = subject.faculty.name;
          }
        }
        
        return {
          ...subject,
          id: subject._id, // Add id property for frontend compatibility
          color: subject.color || ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500'][index % 4],
          faculty: facultyName
        };
      });
      
      console.log('Processed subjects:', subjectsWithColor);
      setEnrolledSubjects(subjectsWithColor);
    } catch (error) {
      // Ensure full error details are logged
      console.error('Error fetching enrolled subjects (caught):', error);
      const errorMessage = error && typeof error === 'object' && 'message' in (error as any) ? (error as any).message : String(error);
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    }
    if (menuOpenId) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpenId]);

  if (!user) {
    return <div style={{color: 'red', padding: 40, fontSize: 24}}>User not loaded from AuthContext. Please login again.</div>;
  }

  const handleEnroll = async () => {
    if (!subjectCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a subject code",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const res = await fetch('/api/students/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ subjectCode: subjectCode.trim() })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to enroll in subject');
      }
      
      toast({
        title: "Enrollment Successful",
        description: `You have been enrolled in the subject`,
      });
      
      setSubjectCode('');
      setIsEnrollDialogOpen(false);
      // Refresh the list of enrolled subjects
      fetchEnrolledSubjects();
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not enroll in subject. Please check the code and try again.",
        variant: "destructive",
      });
    }
  };

  const handleUnenroll = async (subjectCode: string) => {
    try {
      const res = await fetch('/api/students/unenroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ subjectCode })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to unenroll');
      }
      toast({
        title: 'Unenrolled',
        description: 'You have been unenrolled from the subject',
      });
      setMenuOpenId(null);
      fetchEnrolledSubjects();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to unenroll',
        variant: 'destructive',
      });
    }
  };

  // Remove the pending-approval guard — if a student reached Home they are already approved.

  // Show a loading state while initial data is fetched
  if (loading && !error && enrolledSubjects.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Home" />
        <div className="flex flex-col items-center justify-center h-[80vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading your subjects...</p>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Home" />
        <div className="p-4 pb-20">
          <Card className="border-destructive bg-destructive/10">
            <CardHeader>
              <CardTitle className="text-destructive">Error Loading Data</CardTitle>
              <CardDescription className="text-destructive/90">
                {error}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={fetchEnrolledSubjects} variant="outline" className="w-full">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Tagore Public School" />
      
      <div className="p-4 pb-20 space-y-6">
        {/* Banner Carousel */}
        <div
          className="relative"
          onMouseEnter={() => { isPausedRef.current = true; stopAutoplay(); }}
          onMouseLeave={() => { isPausedRef.current = false; startAutoplay(); }}
        >
          <Carousel className="w-full" opts={{ loop: true }} setApi={setCarouselApi}>
            <CarouselContent>
              {banners.map((banner) => {
                // resolve final src (prefer imageUrl then image)
                const raw = banner.imageUrl || banner.image || '';
                const imgSrc = resolveImageUrl(raw);

                return (
                  <CarouselItem key={banner.id}>
                    <Card className="border-0 shadow-card overflow-hidden">
                      {/* smaller banner area; image used as background to cover whole area */}
                      <div className="relative h-40 md:h-48 bg-gray-100 overflow-hidden rounded-lg">
                        {/* background layer */}
                        <div
                          className="absolute inset-0 bg-center bg-cover"
                          style={{
                            backgroundImage: imgSrc ? `url(${imgSrc})` : undefined,
                            backgroundColor: '#fff',
                          }}
                        />
                        {/* stronger gradient at bottom for text contrast */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        {/* title + description directly on image */}
                        <div className="absolute bottom-4 left-6 right-6 z-10 text-white">
                          <h3 className="text-lg md:text-xl font-semibold leading-tight drop-shadow-md">
                            {banner.title}
                          </h3>
                          <p className="text-sm md:text-base opacity-90 mt-1 drop-shadow-md">
                            {banner.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </Carousel>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4 text-center">
              <BookOpen className="w-8 h-8 text-primary mx-auto mb-2" />
              {loading ? (
                <Loader2 className="animate-spin h-6 w-6 mx-auto" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{enrolledSubjects.length}</p>
              )}
              <p className="text-sm text-muted-foreground">Subjects</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-sm text-muted-foreground">Upcoming</p>
            </CardContent>
          </Card>
        </div>

        {/* Enrolled Subjects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">My Subjects</h2>
          </div>
          
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : enrolledSubjects.length === 0 ? (
            <Card className="border-dashed border-2 p-6">
              <div className="text-center space-y-2">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto" />
                <CardTitle className="text-xl font-medium text-muted-foreground">No Subjects Yet</CardTitle>
                <CardDescription>
                  You haven't enrolled in any subjects. Use the + button to add a subject.
                </CardDescription>
              </div>
            </Card>
          ) : (
            <div className="flex flex-wrap gap-6">
              {enrolledSubjects.map((subject, index) => {
                // Use a palette of gradients for variety
                const gradients = [
                  'linear-gradient(90deg, #5ba97b 60%, #3b5c6b 100%)', // green
                  'linear-gradient(90deg, #4f8ef7 60%, #1e3c72 100%)', // blue
                  'linear-gradient(90deg, #f7b42c 60%, #fc575e 100%)', // orange-red
                  'linear-gradient(90deg, #a770ef 60%, #f6d365 100%)', // purple-yellow
                  'linear-gradient(90deg, #43cea2 60%, #185a9d 100%)', // teal-blue
                  'linear-gradient(90deg, #ff6a00 60%, #ee0979 100%)', // orange-pink
                  'linear-gradient(90deg, #00c3ff 60%, #ffff1c 100%)', // blue-yellow
                ];
                const cardGradient = gradients[index % gradients.length];
                return (
                  <div
                    key={subject._id}
                    className="rounded-2xl border bg-white shadow-sm overflow-hidden cursor-pointer transition hover:shadow-lg relative"
                    style={{ minHeight: 260, maxWidth: 340, width: '340px', flex: '0 0 auto' }}
                    onClick={() => navigate(`/student/subject/${subject._id}`)}
                  >
                    <div className="relative">
                      {/* 3-dot menu button */}
                      <div className="absolute top-3 right-3 z-20">
                        <button
                          className="p-1 rounded-full hover:bg-gray-200 focus:outline-none"
                          onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === subject._id ? null : subject._id); }}
                        >
                          <MoreVertical size={20} />
                        </button>
                        {menuOpenId === subject._id && (
                          <div ref={menuRef} className="absolute right-0 mt-2 w-32 bg-white border rounded shadow z-30 flex flex-col">
                            <button
                              className="px-4 py-2 text-left hover:bg-gray-100 text-red-600"
                              onClick={e => { e.stopPropagation(); handleUnenroll(subject.code); }}
                            >
                              Unenroll
                            </button>
                          </div>
                        )}
                      </div>
                      {/* Card header with gradient and subject info */}
                      <div
                        className="relative px-6 pt-6 pb-4"
                        style={{
                          background: cardGradient,
                          minHeight: 90,
                        }}
                      >
                        <div className="text-2xl font-bold text-white truncate" title={subject.name}>
                          {subject.name}
                        </div>
                        <div className="text-white text-base mt-1">
                          {subject.faculty || "Faculty Name"}
                        </div>
                        {/* Avatar or faculty initial */}
                        <div className="absolute right-6 bottom-[-28px]">
                          <div className="w-14 h-14 rounded-full bg-gray-400 flex items-center justify-center text-3xl font-semibold text-white border-4 border-white shadow-md">
                            {subject.faculty
                              ? subject.faculty[0].toUpperCase()
                              : <UserCircle size={36} />}
                          </div>
                        </div>
                      </div>
                      {/* Card body */}
                      <div className="pt-8 pb-8 px-6 flex flex-col gap-2 min-h-[80px]">
                        <div className="text-gray-700 text-sm">
                          <span className="font-semibold">Code:</span> {subject.code}
                        </div>
                        <div className="text-sm font-semibold text-gray-700">
                          <span className="font-bold">Class:</span> {(subject as any).className || ''}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
        <DialogTrigger asChild>
          <Button
            size="icon"
            className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-gradient-primary shadow-hover z-40"
            onClick={() => setIsEnrollDialogOpen(true)}
          >
            <Plus className="w-6 h-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enroll in Subject</DialogTitle>
            <DialogDescription>
              Enter the subject code provided by your instructor to enroll.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject-code">Subject Code</Label>
              <Input
                id="subject-code"
                placeholder="e.g. MATH101"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
              />
            </div>
            <Button onClick={handleEnroll} className="w-full">
              Enroll Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}