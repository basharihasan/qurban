import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Sidebar } from '../../components/layout/Sidebar';
import { MobileNav } from '../../components/layout/MobileNav';
import { TopBar } from '../../components/layout/Sidebar';
import { Button, Input, Textarea } from '../../components/ui';
import api from '../../services/api';
import { MapPinIcon, TruckIcon, HomeIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function DeliveryConfirmation() {
  const queryClient = useQueryClient();

  const { data: dashboard } = useQuery({
    queryKey: ['mudhohi-dashboard'],
    queryFn: async () => {
      const res = await api.get('/mudhohi/dashboard');
      return res.data.data;
    },
  });

  const existingConf = dashboard?.confirmation;

  const [method, setMethod] = useState(existingConf?.method || '');
  const [form, setForm] = useState({
    recipient_name: existingConf?.recipient_name || '',
    recipient_phone: existingConf?.recipient_phone || '',
    delivery_address: existingConf?.delivery_address || '',
    maps_link: existingConf?.maps_link || '',
    notes: existingConf?.notes || '',
    pickup_location: existingConf?.pickup_location || "Mah'had Al-Hijrah \nJl. Kp. Sukamaju Desa, RT.02/RW.10, Cimekar, Cileunyi, Kabupaten Bandung, Jawa Barat 40623 https://maps.app.goo.gl/Xr4QQLyVq1Ry7JMZA",
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/mudhohi/delivery-confirmation', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Konfirmasi berhasil disimpan!');
      queryClient.invalidateQueries({ queryKey: ['mudhohi-dashboard'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menyimpan konfirmasi'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!method) { toast.error('Pilih metode pengiriman terlebih dahulu'); return; }
    mutation.mutate({ method, ...form });
  };

  const renderPickupLocation = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold underline block mt-2 inline-flex items-center gap-1"
          >
            📍 Buka Google Maps
          </a>
        );
      }
      return <span key={i} className="font-semibold">{part}</span>;
    });
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <Sidebar />
      <div className="lg:ml-64 pb-20 lg:pb-0">
        <TopBar title="Konfirmasi Pengiriman" />

        <main className="p-4 lg:p-6 max-w-2xl mx-auto animate-fade-in">
          {existingConf && (
            <div className="alert-success mb-5 flex items-center gap-3">
              <CheckCircleIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-emerald-800 dark:text-emerald-200">Konfirmasi tersimpan</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Metode: {existingConf.method === 'delivery' ? 'Pengiriman' : 'Jemput Sendiri'}. Anda dapat mengubahnya kapan saja.
                </p>
              </div>
            </div>
          )}

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-white mb-6">
              Pilih Metode Pengambilan Daging Qurban
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Method selection */}
              <div className="grid grid-cols-2 gap-4">
                {/* Pickup option */}
                <button
                  type="button"
                  onClick={() => setMethod('pickup')}
                  className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                    method === 'pickup'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                      : 'border-stone-200 dark:border-stone-700 hover:border-emerald-300'
                  }`}
                >
                  <HomeIcon className={`w-8 h-8 mb-3 ${method === 'pickup' ? 'text-emerald-600' : 'text-stone-400'}`} />
                  <p className={`font-semibold text-sm ${method === 'pickup' ? 'text-emerald-700 dark:text-emerald-300' : 'text-stone-700 dark:text-stone-300'}`}>
                    Jemput Sendiri
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Ambil di lokasi penyembelihan</p>
                  {method === 'pickup' && (
                    <div className="mt-2 flex items-center gap-1 text-emerald-600">
                      <CheckCircleIcon className="w-4 h-4" />
                      <span className="text-xs font-medium">Dipilih</span>
                    </div>
                  )}
                </button>

                {/* Delivery option */}
                <button
                  type="button"
                  onClick={() => setMethod('delivery')}
                  className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                    method === 'delivery'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                      : 'border-stone-200 dark:border-stone-700 hover:border-emerald-300'
                  }`}
                >
                  <TruckIcon className={`w-8 h-8 mb-3 ${method === 'delivery' ? 'text-emerald-600' : 'text-stone-400'}`} />
                  <p className={`font-semibold text-sm ${method === 'delivery' ? 'text-emerald-700 dark:text-emerald-300' : 'text-stone-700 dark:text-stone-300'}`}>
                    Dikirim
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Antar ke alamat Anda</p>
                  {method === 'delivery' && (
                    <div className="mt-2 flex items-center gap-1 text-emerald-600">
                      <CheckCircleIcon className="w-4 h-4" />
                      <span className="text-xs font-medium">Dipilih</span>
                    </div>
                  )}
                </button>
              </div>

              {/* Pickup info */}
              {method === 'pickup' && (
                <div className="alert-info animate-slide-up">
                  <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">📍 Informasi Pengambilan</h4>
                  <div className="text-sm leading-relaxed" style={{ whiteSpace: 'pre-line' }}>
                    Lokasi: {renderPickupLocation(form.pickup_location)}
                  </div>
                  <p className="text-sm mt-2 text-blue-700 dark:text-blue-300">Jadwal: Hubungi panitia untuk konfirmasi waktu pengambilan</p>
                </div>
              )}

              {/* Delivery form */}
              {method === 'delivery' && (
                <div className="space-y-4 animate-slide-up">
                  <div className="divider" />
                  <h3 className="font-medium text-stone-800 dark:text-white">Detail Pengiriman</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="label">Nama Penerima *</label>
                      <Input placeholder="Nama lengkap penerima" value={form.recipient_name}
                        onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="label">No. HP Penerima</label>
                      <Input type="tel" placeholder="08xxxxxxxxxx" value={form.recipient_phone}
                        onChange={(e) => setForm({ ...form, recipient_phone: e.target.value })} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="label">Alamat Pengiriman *</label>
                    <Textarea placeholder="Masukkan alamat lengkap beserta kota/kabupaten..." value={form.delivery_address}
                      onChange={(e) => setForm({ ...form, delivery_address: e.target.value })} rows={3} required />
                  </div>

                  <div className="form-group">
                    <label className="label">
                      <MapPinIcon className="w-4 h-4 inline mr-1" />
                      Link Google Maps (opsional)
                    </label>
                    <Input type="url" placeholder="https://maps.google.com/..." value={form.maps_link}
                      onChange={(e) => setForm({ ...form, maps_link: e.target.value })} />
                    <p className="text-xs text-stone-400 mt-1">Share lokasi dari Google Maps untuk memudahkan pengiriman</p>
                  </div>

                  <div className="form-group">
                    <label className="label">Catatan</label>
                    <Textarea placeholder="Patokan rumah, jam bisa diterima, dll..." value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
                  </div>
                </div>
              )}

              {method && (
                <Button type="submit" variant="primary" loading={mutation.isPending} className="w-full" size="lg">
                  {mutation.isPending ? 'Menyimpan...' : 'Simpan Konfirmasi'}
                </Button>
              )}
            </form>
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
