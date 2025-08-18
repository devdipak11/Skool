import React from 'react';
import { Home, BookOpen, User, Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export default function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user || user.role === 'admin') return null;

  const getNavigationItems = () => {
    if (user.role === 'student') {
      return [
        { icon: Home, label: 'Home', path: '/student' },
        { icon: User, label: 'Profile', path: '/student/profile' },
      ];
    } else if (user.role === 'faculty') {
      // Removed 'Subjects' and 'Students' entries as requested — keep Dashboard and Profile only
      return [
        { icon: Home, label: 'Dashboard', path: '/faculty' },
        { icon: User, label: 'Profile', path: '/faculty/profile' },
      ];
    }
    return [];
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border z-50">
      <div className="flex items-center justify-around px-4 py-2 max-w-md mx-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-[60px]",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}