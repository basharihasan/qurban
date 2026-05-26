import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { ROLE_LABELS } from '../../utils/helpers';
import { useThemeStore } from '../../store/themeStore';
import {
  HomeIcon, UsersIcon, CubeIcon, TruckIcon, ChartBarIcon,
  ArrowRightOnRectangleIcon, MoonIcon, SunIcon, QrCodeIcon,
  DocumentArrowDownIcon, ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';

const navItems = {
  admin: [
    { to: '/admin', label: 'Dashboard', icon: HomeIcon, end: true },
    { to: '/admin/users', label: 'Mudhohi', icon: UsersIcon },
    { to: '/admin/animals', label: 'Hewan Qurban', icon: CubeIcon },
    { to: '/admin/distributions', label: 'Distribusi', icon: TruckIcon },
    { to: '/admin/import', label: 'Import Data', icon: DocumentArrowDownIcon },
    { to: '/admin/reports', label: 'Laporan', icon: ChartBarIcon },
  ],
  panitia: [
    { to: '/panitia', label: 'Dashboard', icon: HomeIcon, end: true },
    { to: '/panitia/slaughter', label: 'Penyembelihan', icon: ClipboardDocumentListIcon },
    { to: '/panitia/distribution', label: 'Distribusi', icon: TruckIcon },
    { to: '/panitia/qr-scanner', label: 'Scan QR', icon: QrCodeIcon },
  ],
  mudhohi: [
    { to: '/mudhohi', label: 'Dashboard', icon: HomeIcon, end: true },
    { to: '/mudhohi/delivery', label: 'Konfirmasi Pengiriman', icon: TruckIcon },
  ],
};

export const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const { isDark, toggle } = useThemeStore();
  const navigate = useNavigate();
  const items = navItems[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-stone-900 border-r border-stone-100 dark:border-stone-800 flex flex-col z-40 hidden lg:flex">
      {/* Logo */}
      <div className="p-6 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg">
            <span className="text-white text-lg">🌙</span>
          </div>
          <div>
            <h1 className="font-bold text-stone-900 dark:text-white text-sm leading-tight">Qurban Monitor</h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">{ROLE_LABELS[user?.role]}</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 mx-4 mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
        <p className="font-semibold text-emerald-900 dark:text-emerald-100 text-sm truncate">{user?.name}</p>
        <p className="text-xs text-emerald-600 dark:text-emerald-400 truncate">{user?.phone}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => isActive ? 'sidebar-item-active' : 'sidebar-item'}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 border-t border-stone-100 dark:border-stone-800 space-y-1">
        <button onClick={toggle} className="sidebar-item w-full">
          {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          {isDark ? 'Mode Terang' : 'Mode Gelap'}
        </button>
        <button onClick={handleLogout} className="sidebar-item w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600">
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          Keluar
        </button>
      </div>
    </aside>
  );
};

export const TopBar = ({ title }) => {
  const { user } = useAuthStore();
  const { isDark, toggle } = useThemeStore();

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-100 dark:border-stone-800 px-4 lg:px-6 py-3 flex items-center justify-between">
      <h2 className="font-semibold text-stone-900 dark:text-white text-base lg:text-lg">{title}</h2>
      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 transition-colors lg:hidden"
        >
          {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
        </button>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-stone-600 dark:text-stone-300 font-medium">{user?.name}</span>
        </div>
      </div>
    </header>
  );
};
