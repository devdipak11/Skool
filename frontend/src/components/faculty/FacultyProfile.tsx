import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Phone, MapPin, UserCircle, Plus, X } from 'lucide-react';
import { BACKEND_URL } from '@/utils/utils';

export default function FacultyProfile() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [subjectsCount, setSubjectsCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({ email: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Change Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ facultyId: '', oldPassword: '', newPassword: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profileRes, subjectsRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/faculty/profile`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }),
          fetch(`${BACKEND_URL}/api/faculty/subjects`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }),
        ]);
        if (!profileRes.ok) throw new Error('Failed to fetch profile');
        if (!subjectsRes.ok) throw new Error('Failed to fetch subjects');
        const profileData = await profileRes.json();
        const subjectsData = await subjectsRes.json();
        setProfile(profileData);
        setSubjectsCount(Array.isArray(subjectsData) ? subjectsData.length : 0);
        // Prefill facultyId for password change
        setPasswordForm(f => ({ ...f, facultyId: profileData.facultyId || '' }));
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  const hasContactInfo = profile && (profile.email || profile.phone || profile.address);

  // Open modal and prefill with existing info if present
  const handleOpenContactModal = () => {
    setContactForm({
      email: profile?.email || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
    });
    setSaveError(null);
    setShowContactModal(true);
  };

  // Save contact info to backend
  const handleSaveContact = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/faculty/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(contactForm),
      });
      if (!res.ok) throw new Error('Failed to save contact info');
      // --- Re-fetch profile after save to ensure UI is up-to-date ---
      const profileRes = await fetch(`${BACKEND_URL}/api/faculty/profile`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const profileData = await profileRes.json();
      setProfile(profileData);
      setShowContactModal(false);
      // --- End re-fetch ---
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Change Password Handler
  const handleChangePassword = async () => {
    setPasswordSaving(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/faculty/profile/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(passwordForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to change password');
      setPasswordSuccess('Password changed successfully');
      setPasswordForm(f => ({ ...f, oldPassword: '', newPassword: '' }));
      setTimeout(() => setShowPasswordModal(false), 1200);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center pt-8">
      <Card className="w-full max-w-md shadow-card">
        <CardContent className="flex flex-col items-center pt-8 pb-4">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-5xl font-semibold text-gray-600 mb-4">
            {profile?.name ? profile.name[0].toUpperCase() : <UserCircle size={48} />}
          </div>
          {/* Name and ID */}
          <div className="text-2xl font-bold text-center">{profile?.name || '-'}</div>
          <div className="text-muted-foreground text-center mb-2">Faculty</div>
          <div className="bg-gray-100 rounded-full px-3 py-1 text-xs font-medium text-gray-700 mb-4">
            ID: {profile?.facultyId || '-'}
          </div>
          {/* Change Password Button */}
          <div className="flex gap-3 mb-4">
            <Button
              variant="outline"
              style={{
                background: '#f8d568',
                color: '#222',
                border: 'none',
                fontWeight: 500,
                fontSize: '1.1rem',
                boxShadow: '0 1px 2px #0001',
              }}
              onClick={() => setShowPasswordModal(true)}
            >
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="w-full max-w-md mt-6">
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="bg-blue-50 rounded-xl">
          {hasContactInfo ? (
            <div className="space-y-2">
              {profile?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  <span className="font-medium">Email</span>
                  <span className="ml-2">{profile.email}</span>
                </div>
              )}
              {profile?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-primary" />
                  <span className="font-medium">Phone</span>
                  <span className="ml-2">{profile.phone}</span>
                </div>
              )}
              {profile?.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span className="font-medium">Address</span>
                  <span className="ml-2">{profile.address}</span>
                </div>
              )}
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={handleOpenContactModal}
              >
                Edit Contact Info
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center py-4">
              <span className="text-muted-foreground mb-2">No contact information added.</span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenContactModal}
                className="flex items-center gap-1"
              >
                <Plus size={16} /> Add Contact Info
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Faculty Stats */}
      <Card className="w-full max-w-md mt-6">
        <CardHeader>
          <CardTitle>Faculty Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-pink-50 rounded-lg p-4 flex flex-col items-center">
              <span className="text-sm text-muted-foreground">Subjects Assigned</span>
              <span className="text-2xl font-bold text-pink-600">{subjectsCount}</span>
            </div>
            {/* Add more stats here if needed */}
          </div>
        </CardContent>
      </Card>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPasswordModal(false)}
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <div className="mb-4 text-lg font-semibold">Change Password</div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Faculty ID</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={passwordForm.facultyId}
                  onChange={e => setPasswordForm(f => ({ ...f, facultyId: e.target.value }))}
                  placeholder="Enter Faculty ID"
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Old Password</label>
                <input
                  type="password"
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={passwordForm.oldPassword}
                  onChange={e => setPasswordForm(f => ({ ...f, oldPassword: e.target.value }))}
                  placeholder="Enter old password"
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <input
                  type="password"
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                />
              </div>
              {passwordError && <div className="text-red-500 text-sm">{passwordError}</div>}
              {passwordSuccess && <div className="text-green-600 text-sm">{passwordSuccess}</div>}
              <Button
                className="w-full mt-2"
                onClick={handleChangePassword}
                disabled={passwordSaving}
                style={{
                  background: '#f8d568',
                  color: '#222',
                  border: 'none',
                  fontWeight: 500,
                  fontSize: '1.1rem',
                }}
              >
                {passwordSaving ? 'Saving...' : 'Change Password'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Info Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={() => setShowContactModal(false)}
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <div className="mb-4 text-lg font-semibold">Contact Information</div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={contactForm.email}
                  onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="Enter email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mobile No</label>
                <input
                  type="tel"
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={contactForm.phone}
                  onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="Enter mobile number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={contactForm.address}
                  onChange={e => setContactForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Enter address"
                />
              </div>
              {saveError && <div className="text-red-500 text-sm">{saveError}</div>}
              <Button
                className="w-full mt-2"
                onClick={handleSaveContact}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
