import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { BACKEND_URL } from '@/utils/utils';

// configure axios base URL if provided
if (import.meta.env.VITE_API_BASE_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
}

type Banner = {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
};

export default function BannerManagment() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editBanner, setEditBanner] = useState<Banner | null>(null);
  const [form, setForm] = useState({ title: '', description: '', image: null as File | null });
  const { toast } = useToast();
  const { token } = useAuth();

  // Backend base (serve images from backend). Set VITE_API_BASE_URL or fallback.
  const API_BASE = import.meta.env.VITE_API_BASE_URL || BACKEND_URL;

  // Fetch all banners
  const fetchBanners = async () => {
    setLoading(true);
    try {
      const authToken = token || localStorage.getItem('token');
      const res = await axios.get('/api/admin/banners', {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
      });
      // server returns { banners: [...] }
      const data = res.data?.banners ?? res.data ?? [];
      setBanners(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setBanners([]);
      toast({ title: 'Error', description: err?.response?.data?.message || 'Failed to fetch banners', variant: 'destructive' });
    }
    setLoading(false);
  };

  useEffect(() => { fetchBanners(); }, [token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, image: e.target.files?.[0] || null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const authToken = token || localStorage.getItem('token');
    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('description', form.description);
    if (form.image) formData.append('image', form.image);

    try {
      if (editBanner) {
        // Edit
        await axios.put(`/api/admin/banners/${editBanner._id}`, formData, {
          headers: {
            Authorization: authToken ? `Bearer ${authToken}` : '',
            'Content-Type': 'multipart/form-data',
          },
        });
        toast({ title: 'Updated', description: 'Banner updated successfully.' });
      } else {
        // Create
        await axios.post('/api/admin/banners', formData, {
          headers: {
            Authorization: authToken ? `Bearer ${authToken}` : '',
            'Content-Type': 'multipart/form-data',
          },
        });
        toast({ title: 'Created', description: 'Banner created successfully.' });
      }
      setShowDialog(false);
      setForm({ title: '', description: '', image: null });
      setEditBanner(null);
      fetchBanners();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Failed to save banner', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    const authToken = token || localStorage.getItem('token');
    try {
      await axios.delete(`/api/admin/banners/${id}`, {
        headers: { Authorization: authToken ? `Bearer ${authToken}` : '' },
      });
      toast({ title: 'Banner Deleted', description: 'Banner deleted successfully.' });
      fetchBanners();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Failed to delete banner', variant: 'destructive' });
    }
  };

  const openDialog = (banner?: Banner) => {
    if (banner) {
      setEditBanner(banner);
      setForm({ title: banner.title, description: banner.description, image: null });
    } else {
      setEditBanner(null);
      setForm({ title: '', description: '', image: null });
    }
    setShowDialog(true);
  };

  const resolvedImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    // imageUrl starts with /uploads/...
    return `${API_BASE}${imageUrl}`;
  };

  const filteredBanners = banners.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Banner Management</h2>
        <div className="flex items-center gap-2">
          <input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="border px-2 py-1 rounded" />
          <button onClick={() => openDialog()} className="bg-blue-600 text-white px-3 py-1 rounded">Add Banner</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <div>Loading...</div> : (
          filteredBanners.map(b => (
            <div key={b._id} className="border rounded p-3 shadow-sm">
              <div className="h-40 mb-2 bg-gray-100 flex items-center justify-center overflow-hidden">
                {b.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={resolvedImageUrl(b.imageUrl)} alt={b.title} className="object-contain h-full w-full" />
                ) : <div>No image</div>}
              </div>
              <h3 className="font-medium">{b.title}</h3>
              <p className="text-sm text-gray-600">{b.description}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => openDialog(b)} className="px-2 py-1 bg-yellow-500 text-white rounded">Edit</button>
                <button onClick={() => handleDelete(b._id)} className="px-2 py-1 bg-red-600 text-white rounded">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dialog / Form */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-4 rounded w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-2">{editBanner ? 'Edit Banner' : 'Create Banner'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-2">
                <label className="block text-sm">Title</label>
                <input name="title" value={form.title} onChange={handleInputChange} className="w-full border p-2 rounded" required />
              </div>
              <div className="mb-2">
                <label className="block text-sm">Description</label>
                <textarea name="description" value={form.description} onChange={handleInputChange} className="w-full border p-2 rounded" required />
              </div>
              <div className="mb-2">
                <label className="block text-sm">Image {editBanner ? '(leave empty to keep existing)' : ''}</label>
                <input type="file" accept="image/*" onChange={handleFileChange} />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => { setShowDialog(false); setEditBanner(null); }} className="px-3 py-1 border rounded">Cancel</button>
                <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
