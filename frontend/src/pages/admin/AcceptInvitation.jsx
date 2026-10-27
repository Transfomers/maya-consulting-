import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function AcceptInvitation() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/admin/users/accept-invitation', { token, password });
      toast.success("Account activated successfully! Please log in.");
      navigate('/admin/login');
    } catch (error) {
      toast.error(error.response?.data?.detail || "Invalid or expired token.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bone p-4">
      <div className="bg-white p-8 max-w-md w-full shadow-2xl border border-forest/10">
        <div className="text-center mb-8">
          <img src="/assets/logo-mark.png" alt="3M SERVICES" className="h-12 w-auto mx-auto mb-6" />
          <h1 className="text-2xl font-black font-heading text-forest">Activate Account</h1>
          <p className="text-sage text-sm mt-2">Create a secure password to access your 3M SERVICES administrator account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-1">New Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-forest/20 px-4 py-3 outline-none focus:border-forest text-forest"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-1">Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full border border-forest/20 px-4 py-3 outline-none focus:border-forest text-forest"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 bg-forest text-bone py-4 font-bold uppercase tracking-widest text-sm hover:bg-maple transition-colors mt-6 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Activate Account
          </button>
        </form>
      </div>
    </div>
  );
}
