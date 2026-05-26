import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import { Sidebar } from '../../components/layout/Sidebar';
import { MobileNav } from '../../components/layout/MobileNav';
import { TopBar } from '../../components/layout/Sidebar';
import { Button, Modal, Input, Select, Textarea, ConfirmDialog, EmptyState } from '../../components/ui';
import { AnimalStatusBadge } from '../../components/ui/StatusBadges';
import api from '../../services/api';
import { ANIMAL_TYPE_LABELS, formatDate } from '../../utils/helpers';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, QrCodeIcon } from '@heroicons/react/24/outline';

const AnimalModal = ({ isOpen, onClose, animal }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(animal || {
    animal_code: '', animal_type: 'kambing', weight: '', color: '', age_estimate: '', notes: '',
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (animal) return (await api.put(`/animals/${animal.id}`, data)).data;
      return (await api.post('/animals', data)).data;
    },
    onSuccess: () => {
      toast.success(animal ? 'Hewan diperbarui' : 'Hewan ditambahkan');
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menyimpan'),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={animal ? 'Edit Hewan Qurban' : 'Tambah Hewan Qurban'} size="md">
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label">Kode Hewan *</label>
            <Input placeholder="SPI-001" value={form.animal_code} onChange={(e) => setForm({ ...form, animal_code: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="label">Jenis Hewan *</label>
            <Select value={form.animal_type} onChange={(e) => setForm({ ...form, animal_type: e.target.value })}>
              <option value="kambing">🐐 Kambing</option>
              <option value="sapi">🐄 Sapi</option>
              <option value="domba">🐑 Domba</option>
              <option value="unta">🐪 Unta</option>
            </Select>
          </div>
          <div className="form-group">
            <label className="label">Berat (kg)</label>
            <Input type="number" step="0.1" placeholder="35.5" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">Warna</label>
            <Input placeholder="Hitam, putih..." value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">Estimasi Usia</label>
            <Input placeholder="2 tahun" value={form.age_estimate} onChange={(e) => setForm({ ...form, age_estimate: e.target.value })} />
          </div>
          <div className="form-group col-span-2">
            <label className="label">Catatan</label>
            <Textarea placeholder="Catatan tambahan..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="secondary" onClick={onClose} type="button">Batal</Button>
          <Button variant="primary" type="submit" loading={mutation.isPending}>
            {animal ? 'Perbarui' : 'Tambahkan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const QRModal = ({ isOpen, onClose, animal }) => {
  const [qrImage, setQrImage] = useState(null);

  const { isLoading } = useQuery({
    queryKey: ['animal-qr', animal?.id],
    queryFn: async () => {
      const res = await api.get(`/animals/${animal.id}/qr`);
      setQrImage(res.data.data.qr_image);
      return res.data.data;
    },
    enabled: isOpen && !!animal,
  });

  const handlePrint = () => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html><body style="text-align:center;padding:20px;font-family:sans-serif">
        <h2>Qurban Monitor</h2>
        <h3>${animal?.animal_code} — ${ANIMAL_TYPE_LABELS[animal?.animal_type]}</h3>
        <img src="${qrImage}" style="width:250px;height:250px" />
        <p>Scan untuk info hewan qurban</p>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`QR Code — ${animal?.animal_code}`} size="sm">
      <div className="flex flex-col items-center gap-4">
        {isLoading ? (
          <div className="w-48 h-48 skeleton rounded-2xl" />
        ) : (
          <img src={qrImage} alt="QR Code" className="w-52 h-52 rounded-2xl border-4 border-emerald-100 dark:border-emerald-900 shadow-lg" />
        )}
        <div className="text-center">
          <p className="font-bold text-stone-900 dark:text-white">{animal?.animal_code}</p>
          <p className="text-sm text-stone-500">{ANIMAL_TYPE_LABELS[animal?.animal_type]}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handlePrint} size="sm">🖨️ Print Label</Button>
          <Button variant="primary" size="sm" onClick={() => {
            const a = document.createElement('a');
            a.href = qrImage;
            a.download = `${animal?.animal_code}-qr.png`;
            a.click();
          }}>⬇️ Unduh</Button>
        </div>
      </div>
    </Modal>
  );
};

export default function AdminAnimals() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editAnimal, setEditAnimal] = useState(null);
  const [qrAnimal, setQrAnimal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['animals', { search, statusFilter, page }],
    queryFn: async () => {
      const res = await api.get('/animals', { params: { search, status: statusFilter || undefined, page, limit: 20 } });
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/animals/${id}`),
    onSuccess: () => {
      toast.success('Hewan dihapus');
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      setDeleteId(null);
    },
    onError: () => toast.error('Gagal menghapus'),
  });

  const animals = data?.data || [];
  const pagination = data?.pagination || {};

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <Sidebar />
      <div className="lg:ml-64 pb-20 lg:pb-0">
        <TopBar title="Manajemen Hewan Qurban" />

        <main className="p-4 lg:p-6 space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-3 flex-1">
              <div className="relative flex-1 max-w-xs">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input placeholder="Cari kode hewan..." value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input pl-9 w-full" />
              </div>
              <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-40">
                <option value="">Semua Status</option>
                <option value="registered">Terdaftar</option>
                <option value="ready">Siap</option>
                <option value="slaughtered">Disembelih</option>
                <option value="processed">Diproses</option>
                <option value="distributed">Distribusi</option>
              </Select>
            </div>
            <Button variant="primary" onClick={() => { setEditAnimal(null); setShowModal(true); }}>
              <PlusIcon className="w-4 h-4" /> Tambah
            </Button>
          </div>

          <div className="table-container bg-white dark:bg-stone-900">
            <table className="table">
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Jenis</th>
                  <th>Berat</th>
                  <th>Warna</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                    <td key={j}><div className="skeleton h-4" /></td>
                  ))}</tr>
                )) : animals.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10">
                    <EmptyState icon="🐄" title="Belum ada hewan terdaftar" />
                  </td></tr>
                ) : animals.map((animal) => (
                  <tr key={animal.id}>
                    <td>
                      <span className="font-mono font-medium text-emerald-700 dark:text-emerald-400">{animal.animal_code}</span>
                    </td>
                    <td>{ANIMAL_TYPE_LABELS[animal.animal_type] || animal.animal_type}</td>
                    <td>{animal.weight ? `${animal.weight} kg` : '-'}</td>
                    <td>{animal.color || '-'}</td>
                    <td><AnimalStatusBadge status={animal.status} /></td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setQrAnimal(animal)}
                          className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-emerald-600 transition-colors" title="QR Code">
                          <QrCodeIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setEditAnimal(animal); setShowModal(true); }}
                          className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-emerald-600 transition-colors">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(animal.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-stone-500 hover:text-red-600 transition-colors">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
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

      <AnimalModal isOpen={showModal} onClose={() => setShowModal(false)} animal={editAnimal} />
      <QRModal isOpen={!!qrAnimal} onClose={() => setQrAnimal(null)} animal={qrAnimal} />
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)} loading={deleteMutation.isPending}
        title="Hapus Hewan" message="Hewan ini akan dihapus permanen. Lanjutkan?" />
      <MobileNav />
    </div>
  );
}
