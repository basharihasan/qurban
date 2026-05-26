import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui';
import { LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { user, logout, setToken, updateUser } = useAuthStore();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });

  const changeMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/auth/change-password', data);
      return res.data;
    },
    onSuccess: (data) => {
      setToken(data.data.token);
      updateUser({ first_login: false });
      toast.success('Password berhasil diubah!');
      const role = user?.role;
      if (role === 'admin') navigate('/admin');
      else if (role === 'panitia') navigate('/panitia');
      else navigate('/mudhohi');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal mengubah password'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }
    if (form.newPassword.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }
    changeMutation.mutate({ currentPassword: form.currentPassword, newPassword: form.newPassword });
  };

  const PasswordInput = ({ field, label, placeholder }) => (
    <div>
      <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">{label}</label>
      <div className="relative">
        <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          type={show[field] ? 'text' : 'password'}
          placeholder={placeholder}
          value={form[field === 'current' ? 'currentPassword' : field === 'new' ? 'newPassword' : 'confirmPassword']}
          onChange={(e) => setForm({ ...form, [field === 'current' ? 'currentPassword' : field === 'new' ? 'newPassword' : 'confirmPassword']: e.target.value })}
          className="input pl-10 pr-10"
        />
        <button type="button" onClick={() => setShow({ ...show, [field]: !show[field] })}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400">
          {show[field] ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 via-emerald-900 to-stone-900 p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 items-center justify-center shadow-lg mb-3">
            <LockClosedIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Ganti Password</h1>
          <p className="text-emerald-300 text-sm mt-1">Wajib dilakukan saat login pertama kali</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl">
          <div className="alert-warning mb-6 bg-amber-900/30 border-amber-700/30 text-amber-200">
            ⚠️ Untuk keamanan akun, mohon segera ganti password default Anda. Password default adalah nomor HP Anda.
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-emerald-200 text-sm font-medium mb-2">Password Saat Ini</label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                <input type={show.current ? 'text' : 'password'} placeholder="Masukkan password saat ini"
                  value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm" />
                <button type="button" onClick={() => setShow({ ...show, current: !show.current })}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400">
                  {show.current ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-emerald-200 text-sm font-medium mb-2">Password Baru</label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                <input type={show.new ? 'text' : 'password'} placeholder="Minimal 6 karakter"
                  value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm" />
                <button type="button" onClick={() => setShow({ ...show, new: !show.new })}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400">
                  {show.new ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-emerald-200 text-sm font-medium mb-2">Konfirmasi Password Baru</label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                <input type={show.confirm ? 'text' : 'password'} placeholder="Ulangi password baru"
                  value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm" />
                <button type="button" onClick={() => setShow({ ...show, confirm: !show.confirm })}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400">
                  {show.confirm ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={changeMutation.isPending}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold text-sm transition-all disabled:opacity-50 shadow-lg mt-2 flex items-center justify-center gap-2">
              {changeMutation.isPending ? 'Menyimpan...' : 'Simpan Password Baru'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
