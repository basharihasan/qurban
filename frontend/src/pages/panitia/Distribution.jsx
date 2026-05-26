import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Sidebar } from '../../components/layout/Sidebar';
import { MobileNav } from '../../components/layout/MobileNav';
import { TopBar } from '../../components/layout/Sidebar';
import { Button, Select, EmptyState, Modal, Input, Textarea } from '../../components/ui';
import { DistributionStatusBadge } from '../../components/ui/StatusBadges';
import api from '../../services/api';
import { formatDateTime } from '../../utils/helpers';
import { PhotoIcon, PhoneIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const QuickUpdateModal = ({ isOpen, onClose, dist }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    status: dist?.status || '',
    courier_name: dist?.courier_name || '',
    courier_phone: dist?.courier_phone || '',
    notes: '',
  });
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
      toast.success('Status diperbarui!');
      queryClient.invalidateQueries({ queryKey: ['dist-panitia'] });
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal'),
  });

  const nextStatus = {
    not_ready: 'ready_pickup',
    ready_pickup: dist?.method === 'pickup' ? 'picked_up' : 'on_delivery',
    waiting_delivery: 'on_delivery',
    on_delivery: 'delivered',
  }[dist?.status];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Distribusi" size="md">
      <div className="mb-4 p-4 rounded-xl bg-stone-50 dark:bg-stone-800">
        <p className="font-bold text-stone-900 dark:text-white">{dist?.mudhohi_name}</p>
        <p className="text-sm text-stone-500">{dist?.mudhohi_phone}</p>
        {dist?.delivery_address && (
          <p className="text-xs text-stone-400 mt-1">📍 {dist.delivery_address}</p>
        )}
        {dist?.recipient_phone && (
          <a href={`tel:${dist.recipient_phone}`} className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 mt-1">
            <PhoneIcon className="w-3 h-3" /> {dist.recipient_phone}
          </a>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <div className="form-group">
          <label className="label">Status Baru</label>
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="">Pilih Status</option>
            <option value="not_ready">Belum Siap</option>
            <option value="ready_pickup">Siap Diambil</option>
            <option value="picked_up">Sudah Diambil</option>
            <option value="waiting_delivery">Menunggu Pengiriman</option>
            <option value="on_delivery">Dalam Pengiriman</option>
            <option value="delivered">Terkirim</option>
          </Select>
          {nextStatus && (
            <button type="button" onClick={() => setForm({ ...form, status: nextStatus })}
              className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
              ⚡ Cepat: set ke status berikutnya ({nextStatus})
            </button>
          )}
        </div>

        {['on_delivery', 'delivered'].includes(form.status) && (
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="label">Nama Kurir</label>
              <Input placeholder="Nama kurir" value={form.courier_name} onChange={(e) => setForm({ ...form, courier_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">HP Kurir</label>
              <Input type="tel" placeholder="08xxx" value={form.courier_phone} onChange={(e) => setForm({ ...form, courier_phone: e.target.value })} />
            </div>
          </div>
        )}

        {form.status === 'delivered' && (
          <div className="form-group">
            <label className="label">Foto Bukti</label>
            <div className="border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-xl p-4 text-center cursor-pointer hover:border-emerald-400 transition-colors"
              onClick={() => document.getElementById('proof-panitia').click()}>
              <input id="proof-panitia" type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => setProofFile(e.target.files[0])} />
              {proofFile ? (
                <p className="text-emerald-600 text-sm font-medium">{proofFile.name}</p>
              ) : (
                <>
                  <PhotoIcon className="w-8 h-8 mx-auto text-stone-300 mb-1" />
                  <p className="text-sm text-stone-500">Foto bukti pengiriman</p>
                  <p className="text-xs text-stone-400">Kamera atau galeri</p>
                </>
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

export default function PanitiaDistribution() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [updateDist, setUpdateDist] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['dist-panitia', { search, statusFilter, methodFilter }],
    queryFn: async () => {
      const res = await api.get('/distributions', {
        params: { search: search || undefined, status: statusFilter || undefined, method: methodFilter || undefined, limit: 500 },
      });
      return res.data.data;
    },
    refetchInterval: 15000,
  });

  const dists = data || [];

  // Custom operational sorting:
  // 1. Move completed items (picked_up, delivered) to the bottom
  // 2. Sort active items by animal type (Sapi first, then Kambing) and then by code number ascending (or descending if toggled)
  const sortedDists = [...dists].sort((a, b) => {
    const isACompleted = ['picked_up', 'delivered'].includes(a.status);
    const isBCompleted = ['picked_up', 'delivered'].includes(b.status);

    if (isACompleted && !isBCompleted) return 1;
    if (!isACompleted && isBCompleted) return -1;

    const codeA = a.animal_code || '';
    const codeB = b.animal_code || '';

    if (codeA && codeB) {
      const typeA = a.animal_type || '';
      const typeB = b.animal_type || '';

      const typeOrder = { sapi: 1, kambing: 2, domba: 3, unta: 4 };
      const orderA = typeOrder[typeA] || 5;
      const orderB = typeOrder[typeB] || 5;

      if (orderA !== orderB) {
        return sortAsc ? orderA - orderB : orderB - orderA;
      }

      const numA = parseInt(codeA.replace(/[^0-9]/g, '')) || 0;
      const numB = parseInt(codeB.replace(/[^0-9]/g, '')) || 0;
      return sortAsc ? numA - numB : numB - numA;
    }

    if (codeA && !codeB) return sortAsc ? -1 : 1;
    if (!codeA && codeB) return sortAsc ? 1 : -1;

    return 0;
  });

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <Sidebar />
      <div className="lg:ml-64 pb-20 lg:pb-0">
        <TopBar title="Manajemen Distribusi" />

        <main className="p-4 lg:p-6 space-y-5 animate-fade-in">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between flex-wrap">
            <div className="flex gap-2 flex-wrap flex-1 w-full sm:w-auto">
              <div className="relative w-full sm:w-60">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input 
                  placeholder="Cari nama atau nomor HP..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)} 
                  className="input pl-9 w-full" 
                />
              </div>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="flex-1 sm:flex-none sm:w-44">
                <option value="">Semua Status</option>
                <option value="not_ready">Belum Siap</option>
                <option value="ready_pickup">Siap Ambil</option>
                <option value="picked_up">Sudah Ambil</option>
                <option value="waiting_delivery">Menunggu</option>
                <option value="on_delivery">Dalam Kirim</option>
                <option value="delivered">Terkirim</option>
              </Select>
              <Select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="flex-1 sm:flex-none sm:w-36">
                <option value="">Semua Metode</option>
                <option value="pickup">Ambil Sendiri</option>
                <option value="delivery">Dikirim</option>
              </Select>
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400 text-right font-medium">
              💡 Klik kolom <strong className="text-emerald-600 dark:text-emerald-400">Hewan</strong> untuk mengurutkan.
            </div>
          </div>

          {/* Distribution list - Table layout */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
          ) : dists.length === 0 ? (
            <EmptyState icon="🚚" title="Tidak ada distribusi" description="Coba ubah filter" />
          ) : (
            <div className="table-container bg-white dark:bg-stone-900 shadow-sm rounded-2xl border border-stone-200 dark:border-stone-800">
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr className="bg-stone-50 dark:bg-stone-800/40 text-stone-600 dark:text-stone-300">
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Mudhohi</th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors select-none group"
                        onClick={() => setSortAsc(!sortAsc)}
                        title="Klik untuk mengurutkan antrean"
                      >
                        <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                          Hewan {sortAsc ? '▲' : '▼'}
                        </span>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Metode</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Alamat & Permintaan</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                    {sortedDists.map((d) => {
                      const isCompleted = ['picked_up', 'delivered'].includes(d.status);
                      return (
                        <tr 
                          key={d.id} 
                          className={`hover:bg-stone-50 dark:hover:bg-stone-800/20 transition-all duration-200 ${
                            isCompleted ? 'opacity-50 bg-stone-50/50 dark:bg-stone-900/10' : ''
                          }`}
                        >
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div>
                              <p className="font-semibold text-stone-900 dark:text-white text-sm">{d.mudhohi_name}</p>
                              <p className="text-xs text-stone-500 font-mono mt-0.5">{d.mudhohi_phone}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {d.animal_code ? (
                              <span className="px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                                {d.animal_code}
                              </span>
                            ) : (
                              <span className="text-stone-300 dark:text-stone-700">-</span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {d.method === 'delivery' ? (
                              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 flex items-center gap-1 w-max">
                                🛵 KIRIM (GOJEK)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 flex items-center gap-1 w-max">
                                🏠 AMBIL SENDIRI
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 max-w-xs">
                            <div className="space-y-1">
                              {d.delivery_address && (
                                <p className="text-xs text-stone-600 dark:text-stone-400 truncate" title={d.delivery_address}>
                                  📍 {d.delivery_address}
                                </p>
                              )}
                              {d.notes && (
                                <p className="text-xs text-stone-500 bg-stone-50 dark:bg-stone-800/50 px-2 py-0.5 rounded border border-stone-200 dark:border-stone-700 inline-block max-w-full truncate" title={d.notes}>
                                  💬 {d.notes}
                                </p>
                              )}
                              {!d.delivery_address && !d.notes && <span className="text-stone-300 dark:text-stone-700">-</span>}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <DistributionStatusBadge status={d.status} />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              {d.recipient_phone && (
                                <a 
                                  href={`https://wa.me/${d.recipient_phone?.replace(/^0/, '62')}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="btn btn-secondary text-xs px-2.5 py-1.5 flex items-center gap-1 hover:text-emerald-600 transition-colors"
                                >
                                  💬 WA
                                </a>
                              )}
                              <Button variant="primary" size="sm" onClick={() => setUpdateDist(d)}>
                                Update
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {updateDist && <QuickUpdateModal isOpen={!!updateDist} onClose={() => setUpdateDist(null)} dist={updateDist} />}
      <MobileNav />
    </div>
  );
}
