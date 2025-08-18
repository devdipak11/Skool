import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit, Trash2, Plus, Search } from 'lucide-react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function FacultyManagement() {
  const [faculties, setFaculties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newFaculty, setNewFaculty] = useState({ name: '', facultyId: '', password: '' });
  const [editFaculty, setEditFaculty] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { token } = useAuth();

  // Fetch all faculties
  useEffect(() => {
    const fetchFaculties = async () => {
      setLoading(true);
      try {
        const authToken = token || localStorage.getItem('token');
        const res = await axios.get('/api/admin/teachers', {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });
        // Defensive: ensure array
        if (Array.isArray(res.data)) {
          setFaculties(res.data);
        } else {
          setFaculties([]);
          toast({
            title: "Error",
            description: res.data?.message || "Failed to fetch teachers",
            variant: "destructive",
          });
        }
      } catch (err: any) {
        setFaculties([]);
        toast({
          title: "Error",
          description: err?.response?.data?.message || "Failed to fetch teachers",
          variant: "destructive",
        });
      }
      setLoading(false);
    };
    fetchFaculties();
  }, [toast, token]);

  // Add new faculty
  const handleCreateFaculty = async () => {
    if (!newFaculty.name || !newFaculty.facultyId || !newFaculty.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    try {
      const authToken = token || localStorage.getItem('token');
      const res = await axios.post('/api/admin/teachers', newFaculty, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      setFaculties(prev => [...prev, res.data.faculty]);
      toast({
        title: "Faculty Created",
        description: `Faculty "${res.data.faculty.name}" has been created successfully`,
      });
      setNewFaculty({ name: '', facultyId: '', password: '' });
      setIsCreateDialogOpen(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to create faculty",
        variant: "destructive",
      });
    }
  };

  // Delete faculty
  const handleDeleteFaculty = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this faculty?')) return;
    try {
      const authToken = token || localStorage.getItem('token');
      await axios.delete(`/api/admin/teachers/${id}`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      setFaculties(prev => prev.filter(f => (f._id || f.id) !== id));
      toast({
        title: "Faculty Deleted",
        description: "Faculty deleted successfully",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to delete faculty",
        variant: "destructive",
      });
    }
  };

  // Open edit dialog
  const openEditDialog = (faculty: any) => {
    setEditFaculty({ ...faculty, password: '' });
    setIsEditDialogOpen(true);
  };

  // Update faculty
  const handleUpdateFaculty = async () => {
    if (!editFaculty.name || !editFaculty.facultyId) {
      toast({
        title: "Error",
        description: "Name and Faculty ID are required",
        variant: "destructive",
      });
      return;
    }
    try {
      const authToken = token || localStorage.getItem('token');
      const updateData: any = { name: editFaculty.name, facultyId: editFaculty.facultyId };
      if (editFaculty.password) updateData.password = editFaculty.password;
      const res = await axios.put(`/api/admin/teachers/${editFaculty._id || editFaculty.id}`, updateData, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      setFaculties(prev =>
        prev.map(f => (f._id === res.data._id || f.id === res.data.id ? res.data : f))
      );
      toast({
        title: "Faculty Updated",
        description: `Faculty "${res.data.name}" updated successfully`,
      });
      setIsEditDialogOpen(false);
      setEditFaculty(null);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to update faculty",
        variant: "destructive",
      });
    }
  };

  // Filtered faculties
  const filteredFaculties = faculties.filter(faculty =>
    (faculty.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (faculty.facultyId?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Faculty Management</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Faculty
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Faculty</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="facultyName">Name</Label>
                <Input
                  id="facultyName"
                  placeholder="e.g., Dr. John Smith"
                  value={newFaculty.name}
                  onChange={e => setNewFaculty({ ...newFaculty, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="facultyId">Faculty ID</Label>
                <Input
                  id="facultyId"
                  placeholder="e.g., FAC123"
                  value={newFaculty.facultyId}
                  onChange={e => setNewFaculty({ ...newFaculty, facultyId: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="facultyPassword">Password</Label>
                <Input
                  id="facultyPassword"
                  type="password"
                  placeholder="Password"
                  value={newFaculty.password}
                  onChange={e => setNewFaculty({ ...newFaculty, password: e.target.value })}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateFaculty} className="flex-1">
                  Add Faculty
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md mb-2">
        <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
        <Input
          placeholder="Search faculty/teacher..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Faculty List */}
      <div className="grid gap-4">
        {loading ? (
          <div>Loading...</div>
        ) : filteredFaculties.length === 0 ? (
          <div className="text-muted-foreground p-4">No faculty found.</div>
        ) : (
          filteredFaculties.map(faculty => (
            <Card key={faculty._id || faculty.id} className="shadow-card">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{faculty.name}</h3>
                  <p className="text-sm text-muted-foreground">Faculty ID: {faculty.facultyId}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(faculty)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFaculty(faculty._id || faculty.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Faculty Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Faculty</DialogTitle>
          </DialogHeader>
          {editFaculty && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editFacultyName">Name</Label>
                <Input
                  id="editFacultyName"
                  value={editFaculty.name}
                  onChange={e => setEditFaculty({ ...editFaculty, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="editFacultyId">Faculty ID</Label>
                <Input
                  id="editFacultyId"
                  value={editFaculty.facultyId}
                  onChange={e => setEditFaculty({ ...editFaculty, facultyId: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="editFacultyPassword">Password (leave blank to keep unchanged)</Label>
                <Input
                  id="editFacultyPassword"
                  type="password"
                  value={editFaculty.password}
                  onChange={e => setEditFaculty({ ...editFaculty, password: e.target.value })}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleUpdateFaculty} className="flex-1">
                  Update
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
