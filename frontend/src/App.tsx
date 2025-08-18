import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "@/components/auth/LoginPage";
import StudentHome from "@/components/student/StudentDashboard";
import StudentSubjectDetail from "@/components/student/studentSubjectDetail";
import StudentProfile from "@/components/student/StudentProfile";
import FacultyDashboard from "@/components/faculty/FacultyDashboard";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminSubjectDetail from "@/components/admin/AdminSubjectDetail";
import BottomNavigation from "@/components/layout/BottomNavigation";
import NotFound from "./pages/NotFound";
import SubjectDetail from "@/components/faculty/FacultySubjectDetail";
import FacultyProfile from "@/components/faculty/FacultyProfile";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, isAuthenticated, isAuthReady } = useAuth();
  
  // Wait for auth initialization to finish before deciding on redirects
  if (!isAuthReady) return null;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  const userRole = (user?.role || '').toLowerCase();
  if (!allowedRoles.map(r => r.toLowerCase()).includes(userRole)) {
    return <Navigate to={`/${userRole || 'login'}`} replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, user, token, isAuthReady } = useAuth(); // <-- use isAuthReady
  const userRole = (user?.role || '').toLowerCase();
  
  // Don't render routes until we've loaded auth from storage to avoid transient redirects
  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">Loading...</div>
    );
  }
  
  console.log('AppRoutes - Auth state:', { 
    isAuthenticated, 
    userRole,
    token: token ? `${token.substring(0, 10)}...` : null,
    user: user ? { ...user, role: userRole } : null
  });

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        {/* Redirect /Student to /student/home for case-insensitive support */}
        <Route path="/Student" element={<Navigate to="/student/home" replace />} />
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />} />
        <Route path="/" element={isAuthenticated ? <Navigate to={`/${userRole}`} replace /> : <Navigate to="/login" replace />} />
        
        {/* Student Routes */}
        {/* keep /student working but redirect to the canonical /student/home URL */}
        <Route path="/student" element={<Navigate to="/student/home" replace />} />
        <Route path="/student/home" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentHome />
          </ProtectedRoute>
        } />
        <Route path="/student/subject/:id" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentSubjectDetail />
          </ProtectedRoute>
        } />
        <Route path="/student/profile" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentProfile />
          </ProtectedRoute>
        } />
        
        {/* Faculty Routes */}
        <Route path="/faculty" element={
          <ProtectedRoute allowedRoles={['faculty']}>
            <FacultyDashboard />
          </ProtectedRoute>
        } />
        <Route path="/faculty/subject/:id" element={
          <ProtectedRoute allowedRoles={['faculty']}>
            <SubjectDetail />
          </ProtectedRoute>
        } />
        <Route path="/faculty/profile" element={
          <ProtectedRoute allowedRoles={['faculty']}>
            <FacultyProfile />
          </ProtectedRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/subject/:subjectId" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminSubjectDetail />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNavigation />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
