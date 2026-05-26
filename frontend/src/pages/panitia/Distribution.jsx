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
import { PhotoIcon, PhoneIcon } from '@heroicons/react/24/outline';

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
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [updateDist, setUpdateDist] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['dist-panitia', { statusFilter, methodFilter }],
    queryFn: async () => {
      const res = await api.get('/distributions', {
        params: { status: statusFilter || undefined, method: methodFilter || undefined, limit: 50 },
      });
      return res.data.data;
    },
    refetchInterval: 15000,
  });

  const dists = data || [];

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <Sidebar />
      <div className="lg:ml-64 pb-20 lg:pb-0">
        <TopBar title="Manajemen Distribusi" />

        <main className="p-4 lg:p-6 space-y-5 animate-fade-in">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
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

          {/* Distribution list - mobile-first cards */}
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
            </div>
          ) : dists.length === 0 ? (
            <EmptyState icon="🚚" title="Tidak ada distribusi" description="Coba ubah filter" />
          ) : (
            <div className="space-y-3">
              {dists.map((d) => (
                <div key={d.id} className="card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-stone-900 dark:text-white truncate">{d.mudhohi_name}</p>
                        <span className={`badge flex-shrink-0 ${d.method === 'delivery' ? 'badge-blue' : 'badge-gray'}`}>
                          {d.method === 'delivery' ? '🚚' : '🏠'}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 font-mono">{d.mudhohi_phone}</p>
                      {d.delivery_address && (
                        <p className="text-xs text-stone-400 mt-1 truncate">📍 {d.delivery_address}</p>
                      )}
                      {d.courier_name && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Kurir: {d.courier_name} · {d.courier_phone}</p>
                      )}
                    </div>
                    <DistributionStatusBadge status={d.status} />
                  </div>
                  <div className="flex gap-2 mt-3">
                    {d.recipient_phone && (
                      <a href={`https://wa.me/${d.recipient_phone?.replace(/^0/, '62')}`} target="_blank" rel="noopener noreferrer"
                        className="btn btn-secondary flex-1 text-xs py-2">
                        💬 WhatsApp
                      </a>
                    )}
                    <Button variant="primary" size="sm" className="flex-1" onClick={() => setUpdateDist(d)}>
                      Update Status
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {updateDist && <QuickUpdateModal isOpen={!!updateDist} onClose={() => setUpdateDist(null)} dist={updateDist} />}
      <MobileNav />
    </div>
  );
}
