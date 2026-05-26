import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Sidebar } from '../../components/layout/Sidebar';
import { MobileNav } from '../../components/layout/MobileNav';
import { TopBar } from '../../components/layout/Sidebar';
import { Button, EmptyState } from '../../components/ui';
import api from '../../services/api';
import { exportToExcel, formatDateTime } from '../../utils/helpers';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function AdminReports() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const res = await api.get('/reports/audit-logs', { params: { limit: 50 } });
      return res.data;
    },
  });

  const handleExport = async () => {
    try {
      const res = await api.get('/reports/export/mudhohi');
      await exportToExcel(res.data.data, `laporan-qurban-${new Date().toISOString().slice(0, 10)}`);
      toast.success('Laporan berhasil diekspor ke Excel');
    } catch {
      toast.error('Gagal mengekspor laporan');
    }
  };

  const auditLogs = logs?.data || [];

  const ACTION_LABELS = {
    LOGIN: '🔐 Login',
    CHANGE_PASSWORD: '🔑 Ganti Password',
    CREATE_USER: '👤 Tambah Pengguna',
    UPDATE_USER: '✏️ Edit Pengguna',
    DELETE_USER: '🗑️ Hapus Pengguna',
    CREATE_ANIMAL: '🐄 Tambah Hewan',
    UPDATE_ANIMAL_STATUS: '🔄 Update Status Hewan',
    UPDATE_DISTRIBUTION_STATUS: '🚚 Update Distribusi',
    IMPORT_USERS: '📥 Import Data',
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <Sidebar />
      <div className="lg:ml-64 pb-20 lg:pb-0">
        <TopBar title="Laporan & Audit" />

        <main className="p-4 lg:p-6 space-y-6 animate-fade-in">
          {/* Export section */}
          <div className="card p-5">
            <h2 className="font-semibold text-stone-900 dark:text-white mb-4">📊 Ekspor Data</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800 flex items-center justify-between">
                <div>
                  <p className="font-medium text-stone-800 dark:text-white">Data Distribusi Mudhohi</p>
                  <p className="text-xs text-stone-400 mt-1">Lengkap dengan status hewan dan pengiriman</p>
                </div>
                <Button variant="primary" size="sm" onClick={handleExport}>
                  <ArrowDownTrayIcon className="w-4 h-4" /> Excel
                </Button>
              </div>
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800 flex items-center justify-between">
                <div>
                  <p className="font-medium text-stone-800 dark:text-white">Log Aktivitas</p>
                  <p className="text-xs text-stone-400 mt-1">Semua aktivitas di sistem</p>
                </div>
                <Button variant="outline" size="sm" onClick={async () => {
                  await exportToExcel(auditLogs, 'audit-log');
                  toast.success('Log aktivitas diekspor');
                }}>
                  <ArrowDownTrayIcon className="w-4 h-4" /> Excel
                </Button>
              </div>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="card p-5">
            <h2 className="font-semibold text-stone-900 dark:text-white mb-4">📝 Log Aktivitas Terbaru</h2>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="skeleton h-4 w-1/2" />
                      <div className="skeleton h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : auditLogs.length === 0 ? (
              <EmptyState icon="📋" title="Belum ada log aktivitas" />
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-sm flex-shrink-0">
                      {ACTION_LABELS[log.action]?.split(' ')[0] || '📋'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">
                          {ACTION_LABELS[log.action] || log.action}
                        </p>
                        <span className="text-xs text-stone-400 flex-shrink-0">{formatDateTime(log.created_at)}</span>
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        Oleh: <strong className="text-stone-600 dark:text-stone-300">{log.user_name || 'System'}</strong>
                        {log.entity_type && ` · ${log.entity_type} #${log.entity_id}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
