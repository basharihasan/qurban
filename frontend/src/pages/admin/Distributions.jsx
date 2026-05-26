import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Sidebar } from '../../components/layout/Sidebar';
import { MobileNav } from '../../components/layout/MobileNav';
import { TopBar } from '../../components/layout/Sidebar';
import { Button, Select, EmptyState, Modal, Input, Textarea } from '../../components/ui';
import { DistributionStatusBadge } from '../../components/ui/StatusBadges';
import api from '../../services/api';
import { formatDateTime, exportToExcel } from '../../utils/helpers';
import { MagnifyingGlassIcon, ArrowDownTrayIcon, PhotoIcon } from '@heroicons/react/24/outline';

const UpdateStatusModal = ({ isOpen, onClose, dist }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ status: dist?.status || '', courier_name: dist?.courier_name || '', courier_phone: dist?.courier_phone || '', notes: '' });
  const [proofFile, setProofFile] = useState(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('status', form.status);
      if (form.courier_name) fd.append('courier_name', form.courier_name);
      if (form.courier_phone) fd.append('courier_phone', form.courier_phone);
      if (form.notes) fd.append('notes', form.notes);
      if (proofFile) fd.append('proof', proofFile);
      await api.put(`/distributions/${dist.id}/status`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      toast.success('Status distribusi diperbarui');
      queryClient.invalidateQueries({ queryKey: ['distributions'] });
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal update'),
  });

  const statuses = [
    { value: 'not_ready', label: 'Belum Siap' },
    { value: 'ready_pickup', label: 'Siap Diambil' },
    { value: 'picked_up', label: 'Sudah Diambil' },
    { value: 'waiting_delivery', label: 'Menunggu Pengiriman' },
    { value: 'on_delivery', label: 'Dalam Pengiriman' },
    { value: 'delivered', label: 'Terkirim' },
  ];

  const needsCourier = ['on_delivery', 'delivered'].includes(form.status);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Status Distribusi" size="md">
      <div className="mb-4 p-3 rounded-xl bg-stone-50 dark:bg-stone-800">
        <p className="font-medium text-stone-800 dark:text-white">{dist?.mudhohi_name}</p>
        <p className="text-sm text-stone-500">{dist?.animal_code} · {dist?.method === 'delivery' ? '🚚 Dikirim' : '🏠 Diambil'}</p>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <div className="form-group">
          <label className="label">Status Baru *</label>
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} required>
            <option value="">Pilih Status</option>
            {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
        </div>
        {needsCourier && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Nama Kurir</label>
                <Input placeholder="Nama kurir" value={form.courier_name} onChange={(e) => setForm({ ...form, courier_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="label">HP Kurir</label>
                <Input type="tel" placeholder="08xxxxxx" value={form.courier_phone} onChange={(e) => setForm({ ...form, courier_phone: e.target.value })} />
              </div>
            </div>
          </>
        )}
        {form.status === 'delivered' && (
          <div className="form-group">
            <label className="label">Foto Bukti Pengiriman</label>
            <div className="mt-1 border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-xl p-4 text-center hover:border-emerald-400 transition-colors cursor-pointer"
              onClick={() => document.getElementById('proof-upload').click()}>
              <input id="proof-upload" type="file" accept="image/*" className="hidden" onChange={(e) => setProofFile(e.target.files[0])} />
              {proofFile ? (
                <p className="text-emerald-600 font-medium text-sm">{proofFile.name}</p>
              ) : (
                <div>
                  <PhotoIcon className="w-8 h-8 mx-auto text-stone-400 mb-2" />
                  <p className="text-sm text-stone-500">Klik untuk upload foto bukti</p>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="form-group">
          <label className="label">Catatan</label>
          <Textarea placeholder="Catatan..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose} type="button">Batal</Button>
          <Button variant="primary" type="submit" loading={mutation.isPending}>Perbarui</Button>
        </div>
      </form>
    </Modal>
  );
};

export default function AdminDistributions() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [page, setPage] = useState(1);
  const [updateDist, setUpdateDist] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['distributions', { search, statusFilter, methodFilter, page }],
    queryFn: async () => {
      const res = await api.get('/distributions', {
        params: { search, status: statusFilter || undefined, method: methodFilter || undefined, page, limit: 20 },
      });
      return res.data;
    },
    refetchInterval: 15000,
  });

  const handleExport = async () => {
    const res = await api.get('/reports/export/mudhohi');
    await exportToExcel(res.data.data, 'distribusi-qurban');
    toast.success('Data berhasil diekspor');
  };

  const dists = data?.data || [];
  const pagination = data?.pagination || {};

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <Sidebar />
      <div className="lg:ml-64 pb-20 lg:pb-0">
        <TopBar title="Manajemen Distribusi" />

        <main className="p-4 lg:p-6 space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between flex-wrap">
            <div className="flex gap-2 flex-wrap flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input placeholder="Cari nama..." value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input pl-9 w-52" />
              </div>
              <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-40">
                <option value="">Semua Status</option>
                <option value="not_ready">Belum Siap</option>
                <option value="ready_pickup">Siap Ambil</option>
                <option value="picked_up">Sudah Ambil</option>
                <option value="waiting_delivery">Menunggu</option>
                <option value="on_delivery">Dalam Kirim</option>
                <option value="delivered">Terkirim</option>
              </Select>
              <Select value={methodFilter} onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }} className="w-36">
                <option value="">Semua Metode</option>
                <option value="pickup">Ambil Sendiri</option>
                <option value="delivery">Dikirim</option>
              </Select>
            </div>
            <Button variant="outline" onClick={handleExport}>
              <ArrowDownTrayIcon className="w-4 h-4" /> Ekspor Excel
            </Button>
          </div>

          <div className="table-container bg-white dark:bg-stone-900">
            <table className="table">
              <thead>
                <tr>
                  <th>Mudhohi</th>
                  <th>Hewan</th>
                  <th>Metode</th>
                  <th>Kurir</th>
                  <th>Alamat</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                    <td key={j}><div className="skeleton h-4" /></td>
                  ))}</tr>
                )) : dists.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10">
                    <EmptyState icon="🚚" title="Tidak ada data distribusi" />
                  </td></tr>
                ) : dists.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div>
                        <p className="font-medium text-stone-900 dark:text-white">{d.mudhohi_name}</p>
                        <p className="text-xs text-stone-400 font-mono">{d.mudhohi_phone}</p>
                      </div>
                    </td>
                    <td><span className="font-mono text-emerald-700 dark:text-emerald-400 text-sm">{d.animal_code || '-'}</span></td>
                    <td>
                      {d.method === 'delivery' ? (
                        <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 flex items-center gap-1 w-max">
                          🛵 Kirim (Gojek)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 flex items-center gap-1 w-max">
                          🏠 Ambil Sendiri
                        </span>
                      )}
                    </td>
                    <td>
                      {d.courier_name ? (
                        <div>
                          <p className="text-sm text-stone-700 dark:text-stone-300">{d.courier_name}</p>
                          <p className="text-xs text-stone-400">{d.courier_phone}</p>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="max-w-xs">
                      <p className="text-sm text-stone-600 dark:text-stone-400 truncate">{d.delivery_address || '-'}</p>
                    </td>
                    <td><DistributionStatusBadge status={d.status} /></td>
                    <td>
                      <Button variant="ghost" size="sm" onClick={() => setUpdateDist(d)}>Update</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.total > pagination.limit && (
            <div className="flex justify-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Prev</Button>
              <span className="flex items-center px-3 text-sm">{page} / {Math.ceil(pagination.total / pagination.limit)}</span>
              <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(pagination.total / pagination.limit)}>Next →</Button>
            </div>
          )}
        </main>
      </div>

      {updateDist && <UpdateStatusModal isOpen={!!updateDist} onClose={() => setUpdateDist(null)} dist={updateDist} />}
      <MobileNav />
    </div>
  );
}
