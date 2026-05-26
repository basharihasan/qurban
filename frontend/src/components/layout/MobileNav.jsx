import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  HomeIcon, TruckIcon, QrCodeIcon, ClipboardDocumentListIcon,
  UsersIcon, CubeIcon, ChartBarIcon,
} from '@heroicons/react/24/outline';

const mobileNavItems = {
  admin: [
    { to: '/admin', label: 'Home', icon: HomeIcon, end: true },
    { to: '/admin/users', label: 'Mudhohi', icon: UsersIcon },
    { to: '/admin/animals', label: 'Hewan', icon: CubeIcon },
    { to: '/admin/distributions', label: 'Distribusi', icon: TruckIcon },
    { to: '/admin/reports', label: 'Laporan', icon: ChartBarIcon },
  ],
  panitia: [
    { to: '/panitia', label: 'Home', icon: HomeIcon, end: true },
    { to: '/panitia/slaughter', label: 'Sembelih', icon: ClipboardDocumentListIcon },
    { to: '/panitia/distribution', label: 'Distribusi', icon: TruckIcon },
    { to: '/panitia/qr-scanner', label: 'Scan QR', icon: QrCodeIcon },
  ],
  mudhohi: [
    { to: '/mudhohi', label: 'Home', icon: HomeIcon, end: true },
    { to: '/mudhohi/delivery', label: 'Pengiriman', icon: TruckIcon },
  ],
};

export const MobileNav = () => {
  const { user } = useAuthStore();
  const items = mobileNavItems[user?.role] || [];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-100 dark:border-stone-800 lg:hidden safe-area-inset-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => isActive ? 'mobile-nav-item-active' : 'mobile-nav-item'}
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
