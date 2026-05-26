import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { MobileNav } from '../../components/layout/MobileNav';
import { TopBar } from '../../components/layout/Sidebar';
import { Card, Skeleton, EmptyState } from '../../components/ui';
import { AnimalStatusBadge, DistributionStatusBadge } from '../../components/ui/StatusBadges';
import api from '../../services/api';
import { ANIMAL_TYPE_LABELS, formatDateTime } from '../../utils/helpers';
import { TruckIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function MudhohiDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['mudhohi-dashboard'],
    queryFn: async () => {
      const res = await api.get('/mudhohi/dashboard');
      return res.data.data;
    },
    refetchInterval: 30000,
  });

  const animal = data?.animals?.[0];
  const confirmation = data?.confirmation;
  const distribution = data?.distribution;
  const notifications = data?.notifications || [];

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <Sidebar />
      <div className="lg:ml-64 pb-20 lg:pb-0">
        <TopBar title="Dashboard Mudhohi" />

        <main className="p-4 lg:p-6 max-w-2xl mx-auto space-y-5 animate-fade-in">
          {/* Greeting */}
          <div className="card p-6 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white border-0">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-emerald-200 text-sm">Assalamu'alaikum 👋</p>
                <h2 className="text-xl font-bold mt-1">Semoga Ibadah Qurban Anda Diterima</h2>
                <p className="text-emerald-300 text-sm mt-1">بارك الله فيكم</p>
              </div>
              <span className="text-4xl">🌙</span>
            </div>
          </div>

          {/* Animal Status Card */}
          <div className="card p-5">
            <h3 className="font-semibold text-stone-800 dark:text-white mb-4 flex items-center gap-2">
              <span>🐄</span> Status Hewan Qurban
            </h3>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : !animal ? (
              <EmptyState icon="🐄" title="Belum ada hewan terdaftar" description="Hubungi panitia untuk informasi lebih lanjut" />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50 dark:bg-stone-800">
                  <div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">Kode Hewan</p>
                    <p className="font-bold text-stone-900 dark:text-white text-lg">{animal.animal_code}</p>
                  </div>
                  <AnimalStatusBadge status={animal.status} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Jenis Hewan</p>
                    <p className="font-semibold text-emerald-900 dark:text-emerald-100 text-sm">
                      {ANIMAL_TYPE_LABELS[animal.animal_type] || animal.animal_type}
                    </p>
                  </div>
                  {animal.weight && (
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30">
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Berat</p>
                      <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm">{animal.weight} kg</p>
                    </div>
                  )}
                  {animal.slaughter_time && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 col-span-2">
                      <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">Waktu Penyembelihan</p>
                      <p className="font-semibold text-amber-900 dark:text-amber-100 text-sm">{formatDateTime(animal.slaughter_time)}</p>
                    </div>
                  )}
                </div>

                {/* Status pipeline */}
                <div className="p-4 rounded-xl border border-stone-100 dark:border-stone-800">
                  <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">Progress Status</p>
                  <div className="flex items-center">
                    {['registered', 'ready', 'slaughtered', 'processed', 'distributed'].map((s, i, arr) => {
                      const labels = { registered: 'Daftar', ready: 'Siap', slaughtered: 'Sembelih', processed: 'Proses', distributed: 'Distribusi' };
                      const statuses = arr;
                      const currentIdx = statuses.indexOf(animal.status);
                      const isCompleted = i < currentIdx;
                      const isCurrent = i === currentIdx;
                      return (
                        <div key={s} className="flex-1 flex flex-col items-center">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1
                            ${isCurrent ? 'bg-emerald-600 text-white ring-4 ring-emerald-200 dark:ring-emerald-900' : ''}
                            ${isCompleted ? 'bg-emerald-500 text-white' : ''}
                            ${!isCurrent && !isCompleted ? 'bg-stone-200 dark:bg-stone-700 text-stone-400' : ''}
                          `}>
                            {isCompleted ? '✓' : i + 1}
                          </div>
                          <p className={`text-[9px] font-medium text-center ${isCurrent ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400 dark:text-stone-500'}`}>
                            {labels[s]}
                          </p>
                          {i < arr.length - 1 && (
                            <div className={`absolute h-0.5 hidden`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Delivery Status */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-stone-800 dark:text-white flex items-center gap-2">
                <TruckIcon className="w-5 h-5 text-emerald-600" /> Status Distribusi
              </h3>
              <Link to="/mudhohi/delivery" className="text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
                {confirmation ? 'Ubah →' : 'Konfirmasi →'}
              </Link>
            </div>

            {!confirmation ? (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50">
                <div className="flex items-start gap-3">
                  <ClockIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200 text-sm">Konfirmasi diperlukan</p>
                    <p className="text-amber-600 dark:text-amber-400 text-xs mt-1">Pilih metode pengambilan atau pengiriman daging qurban Anda.</p>
                    <Link to="/mudhohi/delivery" className="btn-primary btn text-xs mt-3 inline-flex">Konfirmasi Sekarang</Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-800">
                  <span className="text-stone-600 dark:text-stone-400 text-sm">Metode</span>
                  <span className="font-medium text-stone-900 dark:text-white text-sm">
                    {confirmation.method === 'delivery' ? '🚚 Dikirim' : '🏠 Dijemput'}
                  </span>
                </div>
                {distribution && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-800">
                    <span className="text-stone-600 dark:text-stone-400 text-sm">Status Distribusi</span>
                    <DistributionStatusBadge status={distribution.status} />
                  </div>
                )}
                {distribution?.courier_name && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Kurir</p>
                    <p className="font-medium text-emerald-900 dark:text-emerald-100 text-sm">{distribution.courier_name}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">{distribution.courier_phone}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notifications */}
          {notifications.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-stone-800 dark:text-white mb-4 flex items-center gap-2">
                🔔 Notifikasi Terbaru
              </h3>
              <div className="space-y-3">
                {notifications.slice(0, 5).map((notif) => (
                  <div key={notif.id} className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border-l-3 border-emerald-500">
                    <p className="text-stone-700 dark:text-stone-300 text-sm">{notif.message}</p>
                    <p className="text-stone-400 dark:text-stone-500 text-xs mt-1">{formatDateTime(notif.created_at)}</p>
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
