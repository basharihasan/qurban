import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { MobileNav } from '../../components/layout/MobileNav';
import { TopBar } from '../../components/layout/Sidebar';
import { Skeleton } from '../../components/ui';
import { AnimalStatusBadge, DistributionStatusBadge } from '../../components/ui/StatusBadges';
import api from '../../services/api';
import { QrCodeIcon, ClipboardDocumentListIcon, TruckIcon } from '@heroicons/react/24/outline';

export default function PanitiaDashboard() {
  const { data: animals, isLoading: loadingAnimals } = useQuery({
    queryKey: ['animals-panitia'],
    queryFn: async () => {
      const res = await api.get('/animals', { params: { limit: 10, page: 1 } });
      return res.data.data;
    },
    refetchInterval: 15000,
  });

  const { data: distributions, isLoading: loadingDist } = useQuery({
    queryKey: ['distributions-panitia'],
    queryFn: async () => {
      const res = await api.get('/distributions', { params: { limit: 10 } });
      return res.data.data;
    },
    refetchInterval: 15000,
  });

  const pending = animals?.filter(a => ['registered', 'ready'].includes(a.status)) || [];
  const processing = animals?.filter(a => a.status === 'slaughtered') || [];
  const activeDeliveries = distributions?.filter(d => ['on_delivery', 'waiting_delivery'].includes(d.status)) || [];

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <Sidebar />
      <div className="lg:ml-64 pb-20 lg:pb-0">
        <TopBar title="Dashboard Panitia" />

        <main className="p-4 lg:p-6 space-y-5 animate-fade-in">
          {/* Quick action cards */}
          <div className="grid grid-cols-3 gap-4">
            <Link to="/panitia/qr-scanner" className="card p-5 text-center hover:border-emerald-300 hover:shadow-card-hover transition-all cursor-pointer group">
              <QrCodeIcon className="w-10 h-10 mx-auto text-emerald-600 group-hover:scale-110 transition-transform mb-2" />
              <p className="font-semibold text-stone-800 dark:text-white text-sm">Scan QR</p>
              <p className="text-xs text-stone-400 mt-1">Scan & update status</p>
            </Link>
            <Link to="/panitia/slaughter" className="card p-5 text-center hover:border-emerald-300 hover:shadow-card-hover transition-all cursor-pointer group">
              <ClipboardDocumentListIcon className="w-10 h-10 mx-auto text-amber-500 group-hover:scale-110 transition-transform mb-2" />
              <p className="font-semibold text-stone-800 dark:text-white text-sm">Penyembelihan</p>
              <p className="text-xs text-stone-400 mt-1">{pending.length} menunggu</p>
            </Link>
            <Link to="/panitia/distribution" className="card p-5 text-center hover:border-emerald-300 hover:shadow-card-hover transition-all cursor-pointer group">
              <TruckIcon className="w-10 h-10 mx-auto text-blue-500 group-hover:scale-110 transition-transform mb-2" />
              <p className="font-semibold text-stone-800 dark:text-white text-sm">Distribusi</p>
              <p className="text-xs text-stone-400 mt-1">{activeDeliveries.length} aktif</p>
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Antrian Sembelih', value: pending.length, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
              { label: 'Diproses', value: processing.length, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
              { label: 'Kirim Aktif', value: activeDeliveries.length, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
              { label: 'Total Hewan', value: animals?.length || 0, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
            ].map((stat) => (
              <div key={stat.label} className={`card p-4 ${stat.bg} border-0`}>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Recent animals queue */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-stone-800 dark:text-white">🐄 Antrian Hewan</h3>
              <Link to="/panitia/slaughter" className="text-xs text-emerald-600 hover:underline">Lihat Semua →</Link>
            </div>
            {loadingAnimals ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {animals?.slice(0, 5).map((animal) => (
                  <div key={animal.id} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-800">
                    <div>
                      <p className="font-mono font-medium text-emerald-700 dark:text-emerald-400 text-sm">{animal.animal_code}</p>
                      <p className="text-xs text-stone-500">{animal.animal_type} · {animal.weight ? `${animal.weight} kg` : ''}</p>
                    </div>
                    <AnimalStatusBadge status={animal.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active distributions */}
          {activeDeliveries.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-stone-800 dark:text-white">🚚 Pengiriman Aktif</h3>
                <Link to="/panitia/distribution" className="text-xs text-emerald-600 hover:underline">Kelola →</Link>
              </div>
              <div className="space-y-2">
                {activeDeliveries.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-800">
                    <div>
                      <p className="font-medium text-stone-800 dark:text-white text-sm">{d.mudhohi_name}</p>
                      <p className="text-xs text-stone-500 truncate max-w-xs">{d.delivery_address || d.recipient_name}</p>
                    </div>
                    <DistributionStatusBadge status={d.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
