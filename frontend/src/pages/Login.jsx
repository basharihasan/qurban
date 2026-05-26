import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Button, Input } from '../components/ui';
import { EyeIcon, EyeSlashIcon, PhoneIcon, LockClosedIcon } from '@heroicons/react/24/outline';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/auth/login', data);
      return res.data;
    },
    onSuccess: (data) => {
      const { user, token } = data.data;
      login(user, token);

      if (user.first_login) {
        toast.success('Login berhasil! Silakan ganti password Anda.');
        navigate('/change-password');
        return;
      }

      toast.success(`Selamat datang, ${user.name}!`);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'panitia') navigate('/panitia');
      else navigate('/mudhohi');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Login gagal. Periksa kembali kredensial Anda.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.phone || !form.password) {
      toast.error('Nomor HP dan password wajib diisi');
      return;
    }
    loginMutation.mutate(form);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 via-emerald-900 to-stone-900 p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-600/5 blur-3xl" />
        {/* Islamic geometric pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10S0 25.523 0 20s4.477-10 10-10zm10 8c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm40 40c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-700 shadow-2xl shadow-emerald-900/50 mb-4">
            <span className="text-4xl">🌙</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Qurban Monitor</h1>
          <p className="text-emerald-300 text-sm">Sistem Monitoring Qurban Digital</p>
          <div className="flex items-center gap-2 justify-center mt-3">
            <div className="h-px w-12 bg-emerald-700" />
            <span className="text-emerald-500 text-xs">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم</span>
            <div className="h-px w-12 bg-emerald-700" />
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl">
          <h2 className="text-white font-semibold text-xl mb-6">Masuk ke Akun Anda</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Phone */}
            <div>
              <label className="block text-emerald-200 text-sm font-medium mb-2">Nomor HP</label>
              <div className="relative">
                <PhoneIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                <input
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all text-sm"
                  autoComplete="tel"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-emerald-200 text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-11 pr-12 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all text-sm"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-200 transition-colors"
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50 shadow-lg shadow-emerald-900/40 hover:shadow-emerald-900/60 flex items-center justify-center gap-2"
            >
              {loginMutation.isPending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          {/* Help text */}
          <div className="mt-6 p-4 rounded-xl bg-emerald-900/30 border border-emerald-700/30">
            <p className="text-emerald-300 text-xs text-center">
              💡 <strong>Mudhohi:</strong> Login dengan nomor HP. Password default = nomor HP Anda.
            </p>
          </div>
        </div>

        <p className="text-center text-emerald-600 text-xs mt-6">
          Qurban Monitoring System © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
