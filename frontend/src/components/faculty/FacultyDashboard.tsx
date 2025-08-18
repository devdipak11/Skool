import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, FileText, Plus, MessageSquare, UserCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import AppHeader from '@/components/layout/AppHeader';
import { useAuth } from '@/contexts/AuthContext';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { mockBanners } from '@/data/mockData';
import type { BannerItem } from '@/data/mockData';
import { BACKEND_URL } from '@/utils/utils';

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const { token } = useAuth();

  // Banner carousel state and autoplay refs (mirrors StudentHome behavior)
  const [banners, setBanners] = useState<BannerItem[]>(mockBanners);
  const [carouselApi, setCarouselApi] = useState<any | null>(null);
  const autoplayRef = useRef<number | null>(null);
  const isPausedRef = useRef<boolean>(false);

  // Backend base
  const API_BASE = import.meta.env.VITE_API_BASE_URL || BACKEND_URL;

  const resolveImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (!url.startsWith('/')) {
      return `${API_BASE}/${url.replace(/^\/+/, '')}`;
    }
    return `${API_BASE}${url}`;
  };

  // Fetch banners
  useEffect(() => {
    let mounted = true;
    const fetchBanners = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/banners`);
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data)) return;
        const mapped = data.map((b: any) => ({
          id: b._id || b.id,
          title: b.title || 'Banner',
          description: b.description || '',
          image: b.image || b.imageUrl || '',
          imageUrl: b.imageUrl || b.image || '',
          link: b.link || undefined
        }));
        if (mounted && mapped.length > 0) setBanners(mapped);
      } catch (e) {
        // ignore, fallback to mockBanners
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

  const [assignedSubjects, setAssignedSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${BACKEND_URL}/api/faculty/subjects`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error(`Server responded ${res.status}`);
        const data = await res.json();
        setAssignedSubjects(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error('Failed to load assigned subjects', err);
        setError(err.message || 'Failed to load subjects');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [token]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Faculty Dashboard" />
      
      {/* Banner Carousel (same as Student view) */}
      <div
        className="p-4"
        onMouseEnter={() => { isPausedRef.current = true; stopAutoplay(); }}
        onMouseLeave={() => { isPausedRef.current = false; startAutoplay(); }}
      >
        <Carousel className="w-full" opts={{ loop: true }} setApi={setCarouselApi}>
          <CarouselContent>
            {banners.map((banner) => {
              const raw = banner.imageUrl || banner.image || '';
              const imgSrc = resolveImageUrl(raw);
              return (
                <CarouselItem key={banner.id}>
                  <Card className="border-0 shadow-card overflow-hidden">
                    <div className="relative h-40 md:h-48 bg-gray-100 overflow-hidden rounded-lg">
                      <div
                        className="absolute inset-0 bg-center bg-cover"
                        style={{
                          backgroundImage: imgSrc ? `url(${imgSrc})` : undefined,
                          backgroundColor: '#fff',
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
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
      
      <div className="p-4 pb-20 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-4 text-center">
              <BookOpen className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{assignedSubjects.length}</p>
              <p className="text-sm text-muted-foreground">Subjects</p>
            </CardContent>
          </Card>
          {/* Removed Students, Assignments, and Messages cards */}
        </div>

        {/* Assigned Subjects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">My Subjects</h2>
            {/* New Post button removed as requested */}
          </div>
          <div className="space-y-3">
            {loading && <p className="text-sm text-muted-foreground">Loading subjects...</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
            {!loading && assignedSubjects.length === 0 && !error && (
              <p className="text-sm text-muted-foreground">No subjects assigned yet.</p>
            )}

            {assignedSubjects.map((subject: any) => (
              <div
                key={subject._id}
                className="rounded-2xl border bg-white shadow-sm overflow-hidden cursor-pointer transition hover:shadow-lg"
                style={{ minHeight: 260, maxWidth: 340, width: '100%' }}
                onClick={() => navigate(`/faculty/subject/${subject._id}`)}
              >
                {/* Card header with gradient and subject info */}
                <div
                  className="relative px-6 pt-6 pb-4"
                  style={{
                    background: 'linear-gradient(90deg, #5ba97b 60%, #3b5c6b 100%)',
                    minHeight: 90,
                  }}
                >
                  <div className="text-2xl font-bold text-white truncate" title={subject.name}>
                    {subject.name}
                  </div>
                  <div className="text-white text-base mt-1">
                    {subject.faculty?.name || "Faculty Name"}
                  </div>
                  {/* Avatar or faculty initial */}
                  <div className="absolute right-6 bottom-[-28px]">
                    <div className="w-14 h-14 rounded-full bg-gray-400 flex items-center justify-center text-3xl font-semibold text-white border-4 border-white shadow-md">
                      {subject.faculty?.name
                        ? subject.faculty.name[0].toUpperCase()
                        : <UserCircle size={36} />}
                    </div>
                  </div>
                </div>
                {/* Card body */}
                <div className="pt-8 pb-8 px-6 flex flex-col gap-2 min-h-[80px]">
                  <div className="text-gray-700 text-sm">
                    <span className="font-semibold">Code:</span> {subject.code}
                  </div>
                  <div className="text-gray-700 text-sm">
                    <span className="font-semibold">Class:</span> {subject.className}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Add a fixed bottom navigation bar with Profile icon */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t flex justify-center py-2 z-50">
        <Link to="/faculty/profile" className="flex flex-col items-center text-muted-foreground hover:text-primary transition">
          <UserCircle size={32} />
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </div>
    </div>
  );
}