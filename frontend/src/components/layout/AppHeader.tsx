import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Bell, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AppHeaderProps {
  title: string;
  showProfile?: boolean;
  onMenuClick?: () => void;
  showMenu?: boolean;
}

export default function AppHeader({ title, showProfile = true, onMenuClick, showMenu = false }: AppHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleProfileClick = () => {
    if (user?.role === 'student') {
      navigate('/student/profile');
    } else if (user?.role === 'faculty') {
      navigate('/faculty/profile');
    }
  };

  return (
    <header
      className="sticky top-0 z-40 border-b border-border"
      style={{
        background: "linear-gradient(90deg, #3556b0 60%, #223a7a 100%)",
        color: "#fff"
      }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {showMenu && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="lg:hidden"
              style={{ color: "#fff" }}
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h1 className="text-lg font-semibold" style={{ color: "#fff" }}>{title}</h1>
            {user && (
              <p className="text-sm capitalize" style={{ color: "#e0e7ef" }}>
                {user.role} Dashboard
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative" style={{ color: "#fff" }}>
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full text-xs text-white flex items-center justify-center">
              3
            </span>
          </Button>

          {showProfile && user && (
            <Button
              variant="ghost"
              className="flex items-center gap-2 p-2"
              onClick={handleProfileClick}
              style={{ color: "#fff" }}
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.profilePicture} alt={user.name} />
                <AvatarFallback className="text-xs" style={{ color: "#223a7a", background: "#fff" }}>
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm font-medium">{user.name}</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="hover:text-destructive"
            style={{ color: "#fff" }}
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}