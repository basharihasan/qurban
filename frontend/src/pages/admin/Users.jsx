import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Sidebar } from '../../components/layout/Sidebar';
import { MobileNav } from '../../components/layout/MobileNav';
import { TopBar } from '../../components/layout/Sidebar';
import { Button, Modal, Input, Select, ConfirmDialog, EmptyState, Skeleton } from '../../components/ui';
import api from '../../services/api';
import { ROLE_LABELS, ROLE_COLORS, ANIMAL_TYPE_LABELS } from '../../utils/helpers';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, KeyIcon } from '@heroicons/react/24/outline';

const UserModal = ({ isOpen, onClose, user, onSave }) => {
  const [form, setForm] = useState(user || { name: '', phone: '', role: 'mudhohi', address: '', group_name: '' });
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (user) {
        const res = await api.put(`/users/${user.id}`, data);
        return res.data;
      }
      const res = await api.post('/users', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success(user ? 'Data berhasil diperbarui' : 'Pengguna berhasil ditambahkan');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menyimpan'),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={user ? 'Edit Pengguna' : 'Tambah Pengguna Baru'} size="md">
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label">Nama Lengkap *</label>
            <Input placeholder="Nama lengkap" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="label">No. HP *</label>
            <Input type="tel" placeholder="08xxxxxxxxxx" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="label">Role</label>
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="mudhohi">Mudhohi</option>
              <option value="panitia">Panitia</option>
              <option value="admin">Admin</option>
            </Select>
          </div>
          <div className="form-group">
            <label className="label">Kelompok</label>
            <Input placeholder="Kelompok A" value={form.group_name} onChange={(e) => setForm({ ...form, group_name: e.target.value })} />
          </div>
          <div className="form-group sm:col-span-2">
            <label className="label">Alamat</label>
            <Input placeholder="Alamat lengkap" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
        </div>
        {!user && (
          <div className="alert-info text-xs">
            Password default = nomor HP. Pengguna wajib ganti saat login pertama.
          </div>
        )}
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="secondary" onClick={onClose} type="button">Batal</Button>
          <Button variant="primary" type="submit" loading={mutation.isPending}>
            {user ? 'Perbarui' : 'Tambahkan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [resetId, setResetId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users', { search, roleFilter, page }],
    queryFn: async () => {
      const res = await api.get('/users', { params: { search, role: roleFilter || undefined, page, limit: 20 } });
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/users/${id}`),
    onSuccess: () => {
      toast.success('Pengguna dinonaktifkan');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteId(null);
    },
    onError: () => toast.error('Gagal menghapus'),
  });

  const resetMutation = useMutation({
    mutationFn: async (id) => api.post(`/users/${id}/reset-password`),
    onSuccess: () => {
      toast.success('Password direset ke nomor HP');
      setResetId(null);
    },
    onError: () => toast.error('Gagal reset password'),
  });

  const users = data?.data || [];
  const pagination = data?.pagination || {};

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <Sidebar />
      <div className="lg:ml-64 pb-20 lg:pb-0">
        <TopBar title="Manajemen Pengguna" />

        <main className="p-4 lg:p-6 space-y-5 animate-fade-in">
          {/* Filters and Actions */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-3 flex-1">
              <div className="relative flex-1 max-w-xs">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input placeholder="Cari nama atau HP..." value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="input pl-9 w-full" />
              </div>
              <Select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="w-36">
                <option value="">Semua Role</option>
                <option value="mudhohi">Mudhohi</option>
                <option value="panitia">Panitia</option>
                <option value="admin">Admin</option>
              </Select>
            </div>
            <Button variant="primary" onClick={() => { setEditUser(null); setShowModal(true); }}>
              <PlusIcon className="w-4 h-4" /> Tambah
            </Button>
          </div>

          {/* Stats summary */}
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Total: <strong className="text-stone-700 dark:text-stone-200">{pagination.total || 0}</strong> pengguna
          </p>

          {/* Table */}
          <div className="table-container bg-white dark:bg-stone-900">
            <table className="table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>No. HP</th>
                  <th>Role</th>
                  <th>Kelompok</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j}><div className="skeleton h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10">
                    <EmptyState icon="👤" title="Tidak ada pengguna ditemukan" />
                  </td></tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div>
                          <p className="font-medium text-stone-900 dark:text-white">{user.name}</p>
                          {user.first_login && <span className="text-xs text-amber-600">⚠ Belum ganti password</span>}
                        </div>
                      </td>
                      <td className="text-stone-600 dark:text-stone-400 font-mono">{user.phone}</td>
                      <td>
                        <span className={`badge ${ROLE_COLORS[user.role]}`}>{ROLE_LABELS[user.role]}</span>
                      </td>
                      <td className="text-stone-600 dark:text-stone-400">{user.group_name || '-'}</td>
                      <td>
                        <span className={`badge ${user.is_active ? 'badge-green' : 'badge-gray'}`}>
                          {user.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditUser(user); setShowModal(true); }}
                            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-emerald-600 transition-colors">
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => setResetId(user.id)}
                            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-amber-600 transition-colors" title="Reset Password">
                            <KeyIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteId(user.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-stone-500 hover:text-red-600 transition-colors">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <div className="flex justify-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Prev</Button>
              <span className="flex items-center px-3 text-sm text-stone-600 dark:text-stone-400">
                {page} / {Math.ceil(pagination.total / pagination.limit)}
              </span>
              <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(pagination.total / pagination.limit)}>Next →</Button>
            </div>
          )}
        </main>
      </div>

      <UserModal isOpen={showModal} onClose={() => setShowModal(false)} user={editUser} />
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)} loading={deleteMutation.isPending}
        title="Nonaktifkan Pengguna" message="Pengguna akan dinonaktifkan. Aksi ini dapat dibatalkan." />
      <ConfirmDialog isOpen={!!resetId} onClose={() => setResetId(null)}
        onConfirm={() => resetMutation.mutate(resetId)} loading={resetMutation.isPending}
        title="Reset Password" message="Password akan direset ke nomor HP pengguna. Lanjutkan?"
        variant="secondary" confirmLabel="Reset" />
      <MobileNav />
    </div>
  );
}
