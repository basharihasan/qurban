import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Sidebar } from '../../components/layout/Sidebar';
import { MobileNav } from '../../components/layout/MobileNav';
import { TopBar } from '../../components/layout/Sidebar';
import { Button, Modal, Select, Textarea, EmptyState } from '../../components/ui';
import { AnimalStatusBadge, AnimalStatusPipeline } from '../../components/ui/StatusBadges';
import api from '../../services/api';
import { ANIMAL_TYPE_LABELS, formatDateTime } from '../../utils/helpers';

const UpdateAnimalModal = ({ isOpen, onClose, animal }) => {
  const queryClient = useQueryClient();
  const statuses = ['registered', 'ready', 'slaughtered', 'processed', 'distributed'];
  const [status, setStatus] = useState(animal?.status || '');
  const [notes, setNotes] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      await api.put(`/animals/${animal.id}/status`, { status, notes });
    },
    onSuccess: () => {
      toast.success(`Status diperbarui ke "${status}"`);
      queryClient.invalidateQueries({ queryKey: ['animals-slaughter'] });
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal update'),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Status Hewan" size="sm">
      <div className="mb-4 p-4 rounded-xl bg-stone-50 dark:bg-stone-800">
        <p className="font-bold text-emerald-700 dark:text-emerald-400 text-lg">{animal?.animal_code}</p>
        <p className="text-sm text-stone-500">{ANIMAL_TYPE_LABELS[animal?.animal_type]} · {animal?.weight ? `${animal.weight} kg` : ''}</p>
        <div className="mt-3">
          <AnimalStatusPipeline status={animal?.status} />
        </div>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <div className="form-group">
          <label className="label">Status Baru *</label>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} required>
            <option value="">Pilih Status</option>
            {statuses.map(s => {
              const labels = { registered: 'Terdaftar', ready: 'Siap Sembelih', slaughtered: 'Disembelih', processed: 'Diproses', distributed: 'Didistribusi' };
              return <option key={s} value={s}>{labels[s]}</option>;
            })}
          </Select>
        </div>
        <div className="form-group">
          <label className="label">Catatan</label>
          <Textarea placeholder="Catatan opsional..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose} type="button">Batal</Button>
          <Button variant="primary" type="submit" loading={mutation.isPending}>Perbarui Status</Button>
        </div>
      </form>
    </Modal>
  );
};

export default function PanitiaSlaughter() {
  const [statusFilter, setStatusFilter] = useState('');
  const [updateAnimal, setUpdateAnimal] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['animals-slaughter', { statusFilter }],
    queryFn: async () => {
      const res = await api.get('/animals', { params: { status: statusFilter || undefined, limit: 50 } });
      return res.data.data;
    },
    refetchInterval: 10000,
  });

  const animals = data || [];

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <Sidebar />
      <div className="lg:ml-64 pb-20 lg:pb-0">
        <TopBar title="Monitoring Penyembelihan" />

        <main className="p-4 lg:p-6 space-y-5 animate-fade-in">
          {/* Filter */}
          <div className="flex gap-3 flex-wrap">
            {[
              { label: 'Semua', value: '' },
              { label: '⏳ Antrian', value: 'registered' },
              { label: '✅ Siap', value: 'ready' },
              { label: '🔪 Disembelih', value: 'slaughtered' },
              { label: '⚙️ Diproses', value: 'processed' },
              { label: '📦 Distribusi', value: 'distributed' },
            ].map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  statusFilter === value
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-emerald-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Animal cards */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-44 rounded-2xl" />)}
            </div>
          ) : animals.length === 0 ? (
            <EmptyState icon="🐄" title="Tidak ada hewan dengan filter ini" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {animals.map((animal) => (
                <div key={animal.id} className="card p-5 hover:shadow-card-hover transition-all cursor-pointer"
                  onClick={() => setUpdateAnimal(animal)}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-emerald-700 dark:text-emerald-400 text-lg">{animal.animal_code}</p>
                      <p className="text-sm text-stone-500 dark:text-stone-400">{ANIMAL_TYPE_LABELS[animal.animal_type]}</p>
                    </div>
                    <AnimalStatusBadge status={animal.status} />
                  </div>

                  <div className="space-y-2 mb-4">
                    {animal.weight && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-stone-500 dark:text-stone-400">Berat</span>
                        <span className="font-medium text-stone-700 dark:text-stone-300">{animal.weight} kg</span>
                      </div>
                    )}
                    {animal.color && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-stone-500 dark:text-stone-400">Warna</span>
                        <span className="font-medium text-stone-700 dark:text-stone-300">{animal.color}</span>
                      </div>
                    )}
                    {animal.slaughter_time && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-stone-500 dark:text-stone-400">Sembelih</span>
                        <span className="font-medium text-stone-700 dark:text-stone-300 text-xs">{formatDateTime(animal.slaughter_time)}</span>
                      </div>
                    )}
                  </div>

                  <AnimalStatusPipeline status={animal.status} />

                  <Button variant="outline" size="sm" className="w-full mt-3" onClick={(e) => { e.stopPropagation(); setUpdateAnimal(animal); }}>
                    Update Status
                  </Button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {updateAnimal && <UpdateAnimalModal isOpen={!!updateAnimal} onClose={() => setUpdateAnimal(null)} animal={updateAnimal} />}
      <MobileNav />
    </div>
  );
}
