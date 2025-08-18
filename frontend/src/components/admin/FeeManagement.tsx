import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, DollarSign, Users, Plus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Define the ClassFee type
interface ClassFee {
  id: string;
  className: string;
  amount: number;
  createdAt: string;
}

export default function FeeManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<ClassFee | null>(null);
  const [newFee, setNewFee] = useState({
    className: '',
    amount: ''
  });
  const [fees, setFees] = useState<ClassFee[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { token, user } = useAuth();

  // Fetch all fees on mount and when token changes
  useEffect(() => {
    if (token) fetchFees();
  }, [token]);

  const fetchFees = async () => {
    if (!token) return; // Don't fetch if no token
    setLoading(true);
    try {
      const authToken = token || localStorage.getItem('token');
      console.log('Fetching fees with token:', authToken ? 'Token exists' : 'No token');
      
      const res = await fetch('/api/admin/fees', {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      
      console.log('Fee API response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch fees: ${res.status} ${errorText}`);
      }
      
      const data = await res.json();
      console.log('Fees data received:', data);
      
      // Map _id to id for frontend compatibility
      const mapped = Array.isArray(data)
        ? data.map(fee => ({ ...fee, id: fee._id }))
        : [];
      
      console.log('Mapped fees:', mapped);
      setFees(mapped);
    } catch (error) {
      console.error('Error in fetchFees:', error);
      toast({ title: 'Error', description: 'Could not fetch fees', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFee = async () => {
    if (!newFee.className || !newFee.amount) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    try {
      const authToken = token || localStorage.getItem('token');
      const res = await fetch('/api/admin/fees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          className: newFee.className,
          amount: Number(newFee.amount),
          title: newFee.className
        })
      });
      if (!res.ok) throw new Error('Failed to create fee');
      const created = await res.json();
      toast({
        title: "Fee Structure Created",
        description: `Fee of ₹${newFee.amount} has been set for ${newFee.className}`,
      });
      setNewFee({ className: '', amount: '' });
      setIsCreateDialogOpen(false);
      fetchFees();
    } catch (error) {
      toast({ title: 'Error', description: 'Could not create fee', variant: 'destructive' });
    }
  };

  const handleEditFee = async () => {
    if (!selectedFee) return;
    try {
      const authToken = token || localStorage.getItem('token');
      const res = await fetch(`/api/admin/fees/${selectedFee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          className: selectedFee.className,
          amount: selectedFee.amount,
          title: selectedFee.className
        })
      });
      if (!res.ok) throw new Error('Failed to update fee');
      toast({
        title: "Fee Updated",
        description: `Fee structure for ${selectedFee.className} has been updated`,
      });
      setIsEditDialogOpen(false);
      setSelectedFee(null);
      fetchFees();
    } catch (error) {
      toast({ title: 'Error', description: 'Could not update fee', variant: 'destructive' });
    }
  };

  const handleDeleteFee = async (feeId: string, className: string) => {
    try {
      const authToken = token || localStorage.getItem('token');
      const res = await fetch(`/api/admin/fees/${feeId}`, {
        method: 'DELETE',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (!res.ok) throw new Error('Failed to delete fee');
      toast({
        title: "Fee Structure Deleted",
        description: `Fee structure for ${className} has been removed`,
        variant: "destructive",
      });
      fetchFees();
    } catch (error) {
      toast({ title: 'Error', description: 'Could not delete fee', variant: 'destructive' });
    }
  };

  const openEditDialog = (fee: ClassFee) => {
    setSelectedFee(fee);
    setIsEditDialogOpen(true);
  };

  // If not authenticated as admin, show a message
  if (!token || (user?.role && user.role.toLowerCase() !== 'admin')) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Admin Access Required</h2>
        <p className="text-muted-foreground">You must be logged in as an admin to view and manage fees.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Fee Management</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Fee Structure
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Fee Structure</DialogTitle>
              <DialogDescription>
                Set fee amount for a specific class. This will apply to all students in that class.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="className">Class Name</Label>
                <Input
                  id="className"
                  placeholder="e.g., Grade 10-A"
                  value={newFee.className}
                  onChange={(e) => setNewFee({ ...newFee, className: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="amount">Fee Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="e.g., 5000"
                  value={newFee.amount}
                  onChange={(e) => setNewFee({ ...newFee, amount: e.target.value })}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateFee} className="flex-1">
                  Create Fee Structure
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

      {/* Only show Fee Structures card, remove Average Fee and Total Monthly cards */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-4 text-center">
            <GraduationCap className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{fees.length}</p>
            <p className="text-sm text-muted-foreground">Fee Structures</p>
          </CardContent>
        </Card>
      </div>

      {/* Fee Structures List */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Current Fee Structures</CardTitle>
          <CardDescription>
            Manage fee amounts for different classes
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {fees.map((fee) => (
              <div key={fee.id} className="flex items-center justify-between p-4 border-b border-border last:border-b-0">
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-6 h-6 text-primary" />
                  <div>
                    <div className="font-semibold text-foreground">{fee.className}</div>
                    <div className="text-xs text-muted-foreground">Created on {fee.createdAt ? new Date(fee.createdAt).toISOString().slice(0, 10) : ''}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="font-bold text-lg text-foreground">₹{fee.amount}</div>
                  <span className="text-xs text-muted-foreground">per month</span>
                  <Button size="icon" variant="ghost" onClick={() => openEditDialog(fee)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDeleteFee(fee.id, fee.className)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Fee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Fee Structure</DialogTitle>
            <DialogDescription>
              Update fee amount for {selectedFee?.className}
            </DialogDescription>
          </DialogHeader>
          {selectedFee && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-className">Class Name</Label>
                <Input
                  id="edit-className"
                  value={selectedFee.className}
                  onChange={e => setSelectedFee({ ...selectedFee, className: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-amount">Fee Amount (₹)</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  value={selectedFee.amount}
                  onChange={e => setSelectedFee({ ...selectedFee, amount: Number(e.target.value) })}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleEditFee} className="flex-1">Update</Button>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {fees.length === 0 && !loading && (
        <Card className="shadow-card">
          <CardContent className="p-8 text-center">
            <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Fee Structures</h3>
            <p className="text-muted-foreground mb-4">
              Create your first fee structure to get started with billing management.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Fee Structure
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}