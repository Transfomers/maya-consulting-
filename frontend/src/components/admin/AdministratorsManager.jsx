import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, Plus, MoreHorizontal, Edit, Trash2, Key, Shield, ShieldOff, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';

export default function AdministratorsManager() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [changingRoleUser, setChangingRoleUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  
  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', phone: '', role_id: '' });
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/users/roles')
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to load administrators");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    if (roleFilter !== 'All' && u.role_name !== roleFilter) return false;
    if (statusFilter !== 'All' && u.status !== statusFilter) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/users', formData);
      toast.success("Administrator created and invitation sent.");
      setShowAddModal(false);
      setFormData({ first_name: '', last_name: '', email: '', phone: '', role_id: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create administrator");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/admin/users/${editingUser.id}`, formData);
      toast.success("Administrator updated.");
      setEditingUser(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update administrator");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (user, newStatus) => {
    try {
      await api.patch(`/admin/users/${user.id}/status`, { status: newStatus });
      toast.success(`Administrator ${newStatus === 'Active' ? 'activated' : 'deactivated'}.`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to change status");
    }
  };

  const handleRoleChange = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`/admin/users/${changingRoleUser.id}/role`, { role_id: formData.role_id });
      toast.success("Role updated successfully.");
      setChangingRoleUser(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to change role");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await api.delete(`/admin/users/${deletingUser.id}`);
      toast.success("Administrator deleted.");
      setDeletingUser(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to delete administrator");
    } finally {
      setSubmitting(false);
    }
  };

  const openAdd = () => {
    setFormData({ first_name: '', last_name: '', email: '', phone: '', role_id: roles[0]?.id || '' });
    setShowAddModal(true);
  };

  const openEdit = (user) => {
    const parts = user.name.split(' ');
    setFormData({ 
      first_name: parts[0] || '', 
      last_name: parts.slice(1).join(' ') || '', 
      email: user.email, 
      phone: user.phone || '' 
    });
    setEditingUser(user);
  };

  const openRoleChange = (user) => {
    setFormData({ ...formData, role_id: user.role_id });
    setChangingRoleUser(user);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-forest/10 pb-3 gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-forest">Administrators</h2>
          <p className="text-sm text-sage mt-1">Manage users who have access to the CAP Entrepreneurs administration panel.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-forest text-bone px-4 py-2 font-bold uppercase tracking-wider text-xs hover:bg-maple transition-colors">
          <Plus className="h-4 w-4" /> Add Administrator
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input 
          type="text" 
          placeholder="Search administrators..." 
          className="flex-1 rounded-none border border-forest/20 px-4 py-2 text-sm focus:border-forest focus:outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select 
          className="rounded-none border border-forest/20 px-4 py-2 text-sm focus:border-forest focus:outline-none"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="All">All Roles</option>
          {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
        </select>
        <select 
          className="rounded-none border border-forest/20 px-4 py-2 text-sm focus:border-forest focus:outline-none"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-forest/5 text-xs uppercase tracking-wider font-bold text-forest border-b border-forest/10">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-forest/5">
            {filteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-forest/5 transition-colors group">
                <td className="px-4 py-3 font-semibold text-forest">{user.name}</td>
                <td className="px-4 py-3 text-sage">{user.email}</td>
                <td className="px-4 py-3">
                  <span className="bg-forest/10 text-forest px-2 py-1 text-[10px] uppercase font-bold tracking-wider">{user.role_name}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-[10px] uppercase font-bold tracking-wider ${
                    user.status === 'Active' ? 'bg-green-100 text-green-800' :
                    user.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status === 'Active' && <CheckCircle2 className="h-3 w-3" />}
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sage">{new Date(user.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => openEdit(user)} className="text-sage hover:text-maple p-1"><Edit className="h-4 w-4" /></button>
                  <button onClick={() => openRoleChange(user)} className="text-sage hover:text-forest p-1"><Shield className="h-4 w-4" /></button>
                  {user.status === 'Active' ? (
                    <button onClick={() => handleStatusChange(user, 'Inactive')} className="text-sage hover:text-amber-600 p-1"><ShieldOff className="h-4 w-4" /></button>
                  ) : user.status === 'Inactive' ? (
                    <button onClick={() => handleStatusChange(user, 'Active')} className="text-sage hover:text-green-600 p-1"><CheckCircle2 className="h-4 w-4" /></button>
                  ) : null}
                  <button onClick={() => setDeletingUser(user)} className="text-sage hover:text-red-600 p-1"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sage">No administrators found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {(showAddModal || editingUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest/80 backdrop-blur-sm p-4">
          <div className="bg-white max-w-lg w-full shadow-2xl p-6">
            <h3 className="text-xl font-bold font-heading text-forest mb-4 border-b border-forest/10 pb-2">
              {editingUser ? 'Edit Administrator' : 'Add Administrator'}
            </h3>
            <form onSubmit={editingUser ? handleUpdate : handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-1">First Name</label>
                  <input required type="text" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} className="w-full border border-forest/20 px-3 py-2 outline-none focus:border-forest" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-1">Last Name</label>
                  <input required type="text" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} className="w-full border border-forest/20 px-3 py-2 outline-none focus:border-forest" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-1">Email</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-forest/20 px-3 py-2 outline-none focus:border-forest" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-1">Phone (Optional)</label>
                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border border-forest/20 px-3 py-2 outline-none focus:border-forest" />
              </div>
              
              {!editingUser && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-1">Role</label>
                  <select required value={formData.role_id} onChange={e => setFormData({...formData, role_id: e.target.value})} className="w-full border border-forest/20 px-3 py-2 outline-none focus:border-forest bg-white">
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              )}

              {!editingUser && (
                <div className="bg-forest/5 p-4 mt-4 text-sm text-sage border border-forest/10">
                  <p>An invitation email containing a secure, one-time link will be sent to the administrator to set their password.</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-forest/10">
                <button type="button" onClick={() => {setShowAddModal(false); setEditingUser(null);}} className="px-4 py-2 text-sm font-bold uppercase tracking-wider text-sage hover:bg-forest/5">Cancel</button>
                <button type="submit" disabled={submitting} className="flex items-center gap-2 bg-forest text-bone px-6 py-2 font-bold uppercase tracking-wider text-sm hover:bg-maple disabled:opacity-50">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingUser ? 'Update' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {changingRoleUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest/80 backdrop-blur-sm p-4">
          <div className="bg-white max-w-md w-full shadow-2xl p-6">
            <h3 className="text-xl font-bold font-heading text-forest mb-4 border-b border-forest/10 pb-2">
              Change Administrator Role?
            </h3>
            <p className="text-sm text-sage mb-6">
              You are changing <strong>{changingRoleUser.name}</strong>'s role from <strong>{changingRoleUser.role_name}</strong>.
            </p>
            <form onSubmit={handleRoleChange}>
              <div className="mb-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-1">New Role</label>
                <select required value={formData.role_id} onChange={e => setFormData({...formData, role_id: e.target.value})} className="w-full border border-forest/20 px-3 py-2 outline-none focus:border-forest bg-white">
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 border-t border-forest/10 pt-4">
                <button type="button" onClick={() => setChangingRoleUser(null)} className="px-4 py-2 text-sm font-bold uppercase tracking-wider text-sage hover:bg-forest/5">Cancel</button>
                <button type="submit" disabled={submitting} className="flex items-center gap-2 bg-maple text-bone px-6 py-2 font-bold uppercase tracking-wider text-sm hover:bg-forest disabled:opacity-50">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Confirm Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest/80 backdrop-blur-sm p-4">
          <div className="bg-white max-w-md w-full shadow-2xl p-6">
            <h3 className="text-xl font-bold font-heading text-red-600 mb-4 border-b border-forest/10 pb-2">
              Delete Administrator?
            </h3>
            <p className="text-sm text-sage mb-6">
              Are you sure you want to delete <strong>{deletingUser.name}</strong>? Their existing content will not automatically be deleted.
            </p>
            <div className="flex justify-end gap-3 border-t border-forest/10 pt-4">
              <button onClick={() => setDeletingUser(null)} className="px-4 py-2 text-sm font-bold uppercase tracking-wider text-sage hover:bg-forest/5">Cancel</button>
              <button onClick={handleDelete} disabled={submitting} className="flex items-center gap-2 bg-red-600 text-white px-6 py-2 font-bold uppercase tracking-wider text-sm hover:bg-red-700 disabled:opacity-50">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Delete Administrator
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
