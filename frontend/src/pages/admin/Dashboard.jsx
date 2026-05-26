import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { MobileNav } from '../../components/layout/MobileNav';
import { TopBar } from '../../components/layout/Sidebar';
import { Skeleton } from '../../components/ui';
import { AnimalStatusBadge, DistributionStatusBadge } from '../../components/ui/StatusBadges';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../services/api';
import { formatDate } from '../../utils/helpers';
import {
  UsersIcon, CubeIcon, CheckCircleIcon, ClockIcon, TruckIcon, HomeIcon,
} from '@heroicons/react/24/outline';

const KPICard = ({ title, value, icon: Icon, color, subtitle, loading }) => (
  <div className="kpi-card">
    <div className={`kpi-icon ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div className="min-w-0">
      {loading ? (
        <><Skeleton className="h-7 w-16 mb-1" /><Skeleton className="h-3 w-24" /></>
      ) : (
        <>
          <p className="text-2xl font-bold text-stone-900 dark:text-white">{value?.toLocaleString() || 0}</p>
          <p className="text-sm font-medium text-stone-600 dark:text-stone-400 truncate">{title}</p>
          {subtitle && <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{subtitle}</p>}
        </>
      )}
    </div>
  </div>
);

const COLORS = ['#6b7280', '#3b82f6', '#f59e0b', '#f97316', '#10b981'];
const DIST_COLORS = ['#6b7280', '#3b82f6', '#10b981', '#f59e0b', '#f97316', '#059669'];

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const res = await api.get('/reports/dashboard');
      return res.data.data;
    },
    refetchInterval: 30000,
  });

  const summary = data?.summary || {};
  const animalStats = data?.animal_stats || {};
  const distStats = data?.distribution_stats || {};

  const animalChartData = [
    { name: 'Terdaftar', value: animalStats.registered || 0 },
    { name: 'Siap', value: animalStats.ready || 0 },
    { name: 'Disembelih', value: animalStats.slaughtered || 0 },
    { name: 'Diproses', value: animalStats.processed || 0 },
    { name: 'Distribusi', value: animalStats.distributed || 0 },
  ];

  const distChartData = [
    { name: 'Belum Siap', value: distStats.not_ready || 0 },
    { name: 'Siap Ambil', value: distStats.ready_pickup || 0 },
    { name: 'Sudah Ambil', value: distStats.picked_up || 0 },
    { name: 'Menunggu', value: distStats.waiting_delivery || 0 },
    { name: 'Dalam Kirim', value: distStats.on_delivery || 0 },
    { name: 'Terkirim', value: distStats.delivered || 0 },
  ];

  const slaughterProgress = (data?.slaughter_progress || []).map((d) => ({
    date: formatDate(d.date, 'dd/MM'),
    jumlah: Number(d.count),
  }));

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <Sidebar />
      <div className="lg:ml-64 pb-20 lg:pb-0">
        <TopBar title="Dashboard Admin" />

        <main className="p-4 lg:p-6 space-y-6 animate-fade-in">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <KPICard title="Total Mudhohi" value={summary.total_mudhohi} icon={UsersIcon}
              color="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600" loading={isLoading} />
            <KPICard title="Total Hewan" value={summary.total_animals} icon={CubeIcon}
              color="bg-blue-100 dark:bg-blue-900/40 text-blue-600" loading={isLoading} />
            <KPICard title="Selesai Disembelih" value={summary.slaughter_completed} icon={CheckCircleIcon}
              color="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600" loading={isLoading} />
            <KPICard title="Belum Disembelih" value={summary.pending_slaughter} icon={ClockIcon}
              color="bg-amber-100 dark:bg-amber-900/40 text-amber-600" loading={isLoading} />
            <KPICard title="Terkirim" value={summary.delivery_completed} icon={TruckIcon}
              color="bg-purple-100 dark:bg-purple-900/40 text-purple-600" loading={isLoading} />
            <KPICard title="Sudah Diambil" value={summary.pickup_completed} icon={HomeIcon}
              color="bg-teal-100 dark:bg-teal-900/40 text-teal-600" loading={isLoading} />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Slaughter Progress Chart */}
            <div className="card p-5">
              <h3 className="font-semibold text-stone-800 dark:text-white mb-4">📈 Progress Penyembelihan (7 Hari)</h3>
              {slaughterProgress.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-stone-400 dark:text-stone-500 text-sm">
                  Belum ada data penyembelihan
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={slaughterProgress}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-stone-100 dark:stroke-stone-800" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="jumlah" fill="#059669" radius={[6, 6, 0, 0]} name="Disembelih" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Animal Status Distribution */}
            <div className="card p-5">
              <h3 className="font-semibold text-stone-800 dark:text-white mb-4">🐄 Status Hewan Qurban</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={animalChartData.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    paddingAngle={3} dataKey="value">
                    {animalChartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Distribution chart */}
          <div className="card p-5">
            <h3 className="font-semibold text-stone-800 dark:text-white mb-4">🚚 Status Distribusi</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={distChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-stone-100 dark:stroke-stone-800" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={85} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="#059669" name="Jumlah">
                  {distChartData.map((_, i) => (
                    <Cell key={i} fill={DIST_COLORS[i % DIST_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tables Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active deliveries */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-stone-800 dark:text-white">🚚 Pengiriman Aktif</h3>
                <Link to="/admin/distributions" className="text-xs text-emerald-600 hover:underline">Lihat Semua →</Link>
              </div>
              {isLoading ? <Skeleton count={3} className="mb-3 h-12" /> : (
                data?.active_deliveries?.length === 0 ? (
                  <p className="text-stone-400 text-sm text-center py-6">Tidak ada pengiriman aktif</p>
                ) : (
                  <div className="space-y-2">
                    {data?.active_deliveries?.map((d) => (
                      <div key={d.id} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-800">
                        <div>
                          <p className="font-medium text-stone-800 dark:text-white text-sm">{d.mudhohi_name}</p>
                          <p className="text-xs text-stone-500 dark:text-stone-400">{d.animal_code}</p>
                        </div>
                        <DistributionStatusBadge status={d.status} />
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            {/* Pending pickups */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-stone-800 dark:text-white">🏠 Menunggu Diambil</h3>
                <Link to="/admin/distributions" className="text-xs text-emerald-600 hover:underline">Lihat Semua →</Link>
              </div>
              {isLoading ? <Skeleton count={3} className="mb-3 h-12" /> : (
                data?.pending_pickups?.length === 0 ? (
                  <p className="text-stone-400 text-sm text-center py-6">Tidak ada yang menunggu</p>
                ) : (
                  <div className="space-y-2">
                    {data?.pending_pickups?.map((d) => (
                      <div key={d.id} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-800">
                        <div>
                          <p className="font-medium text-stone-800 dark:text-white text-sm">{d.mudhohi_name}</p>
                          <p className="text-xs text-stone-500 dark:text-stone-400">{d.animal_code}</p>
                        </div>
                        <DistributionStatusBadge status={d.status} />
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
