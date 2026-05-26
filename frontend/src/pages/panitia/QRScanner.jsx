import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Sidebar } from '../../components/layout/Sidebar';
import { MobileNav } from '../../components/layout/MobileNav';
import { TopBar } from '../../components/layout/Sidebar';
import { Button, Modal, Select } from '../../components/ui';
import { AnimalStatusBadge } from '../../components/ui/StatusBadges';
import api from '../../services/api';
import { ANIMAL_TYPE_LABELS } from '../../utils/helpers';
import { QrCodeIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function QRScanner() {
  const [scanning, setScanning] = useState(false);
  const [scannedAnimal, setScannedAnimal] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const queryClient = useQueryClient();

  const startScanner = async () => {
    setError(null);
    try {
      const { Html5QrcodeScanner } = await import('html5-qrcode');
      html5QrCodeRef.current = new Html5QrcodeScanner('qr-reader', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
      });

      html5QrCodeRef.current.render(
        async (decodedText) => {
          try {
            let data;
            try {
              data = JSON.parse(decodedText);
            } catch {
              // Try to find animal by code if not JSON
              data = { code: decodedText };
            }

            await html5QrCodeRef.current.clear();
            setScanning(false);

            // Fetch animal by ID or code
            const searchParam = data.id ? `/animals/${data.id}` : `/animals?search=${data.code}&limit=1`;
            let animal;
            if (data.id) {
              const res = await api.get(`/animals/${data.id}`);
              animal = res.data.data;
            } else {
              const res = await api.get('/animals', { params: { search: data.code } });
              animal = res.data.data?.[0];
            }

            if (animal) {
              setScannedAnimal(animal);
              setNewStatus(animal.status);
              toast.success(`Hewan ditemukan: ${animal.animal_code}`);
            } else {
              toast.error('Hewan tidak ditemukan di sistem');
              setError('QR tidak dikenali sistem. Coba scan ulang.');
            }
          } catch (err) {
            toast.error('Gagal membaca QR code');
            setError('Error memproses QR code.');
          }
        },
        (err) => {} // ignore scan errors
      );

      setScanning(true);
    } catch (err) {
      setError('Tidak dapat mengakses kamera. Pastikan izin kamera diaktifkan.');
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try { await html5QrCodeRef.current.clear(); } catch {}
    }
    setScanning(false);
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/animals/${scannedAnimal.id}/status`, { status: newStatus });
    },
    onSuccess: () => {
      toast.success(`Status berhasil diperbarui ke "${newStatus}"`);
      queryClient.invalidateQueries({ queryKey: ['animals-slaughter'] });
      setScannedAnimal(null);
      setNewStatus('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal update status'),
  });

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        try { html5QrCodeRef.current.clear(); } catch {}
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <Sidebar />
      <div className="lg:ml-64 pb-20 lg:pb-0">
        <TopBar title="Scan QR Code" />

        <main className="p-4 lg:p-6 max-w-lg mx-auto space-y-5 animate-fade-in">
          {/* Scanner area */}
          <div className="card p-5">
            <div className="text-center mb-4">
              <QrCodeIcon className="w-12 h-12 mx-auto text-emerald-600 mb-2" />
              <h2 className="font-semibold text-stone-900 dark:text-white">Scan QR Hewan Qurban</h2>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Arahkan kamera ke QR code pada label hewan</p>
            </div>

            {error && (
              <div className="alert-error mb-4">{error}</div>
            )}

            {!scanning && !scannedAnimal && (
              <Button variant="primary" size="lg" className="w-full" onClick={startScanner}>
                📷 Mulai Scan
              </Button>
            )}

            {scanning && (
              <div className="space-y-4">
                <div id="qr-reader" className="rounded-xl overflow-hidden" />
                <Button variant="secondary" className="w-full" onClick={stopScanner}>
                  ❌ Stop Scan
                </Button>
              </div>
            )}
          </div>

          {/* Manual input fallback */}
          {!scanning && !scannedAnimal && (
            <div className="card p-5">
              <h3 className="font-medium text-stone-800 dark:text-white mb-3">⌨️ Input Manual</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-3">Masukkan kode hewan secara manual jika QR rusak</p>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const code = e.target.code.value.trim().toUpperCase();
                try {
                  const res = await api.get('/animals', { params: { search: code } });
                  const animal = res.data.data?.[0];
                  if (animal) { setScannedAnimal(animal); setNewStatus(animal.status); }
                  else { toast.error('Kode hewan tidak ditemukan'); }
                } catch { toast.error('Gagal mencari hewan'); }
              }} className="flex gap-3">
                <input name="code" placeholder="Contoh: KMB-001" className="input flex-1" />
                <Button type="submit" variant="primary">Cari</Button>
              </form>
            </div>
          )}

          {/* Scan result */}
          {scannedAnimal && (
            <div className="card p-5 animate-slide-up border-2 border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircleIcon className="w-6 h-6 text-emerald-600" />
                <h3 className="font-semibold text-emerald-800 dark:text-emerald-200">Hewan Ditemukan</h3>
              </div>

              <div className="space-y-3 mb-5">
                <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-800">
                  <span className="text-stone-500 dark:text-stone-400 text-sm">Kode</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{scannedAnimal.animal_code}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-800">
                  <span className="text-stone-500 dark:text-stone-400 text-sm">Jenis</span>
                  <span className="font-medium text-stone-700 dark:text-stone-300">{ANIMAL_TYPE_LABELS[scannedAnimal.animal_type]}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-800">
                  <span className="text-stone-500 dark:text-stone-400 text-sm">Status Saat Ini</span>
                  <AnimalStatusBadge status={scannedAnimal.status} />
                </div>
              </div>

              <div className="form-group mb-4">
                <label className="label">Update Status ke:</label>
                <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  <option value="registered">Terdaftar</option>
                  <option value="ready">Siap Sembelih</option>
                  <option value="slaughtered">Disembelih</option>
                  <option value="processed">Diproses</option>
                  <option value="distributed">Didistribusi</option>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => { setScannedAnimal(null); setNewStatus(''); }}>
                  Scan Lagi
                </Button>
                <Button variant="primary" className="flex-1" loading={updateMutation.isPending}
                  onClick={() => updateMutation.mutate()}
                  disabled={newStatus === scannedAnimal.status}>
                  Perbarui Status
                </Button>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="card p-4 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200 mb-2">💡 Tips Scan QR</p>
            <ul className="text-xs text-emerald-700 dark:text-emerald-400 space-y-1">
              <li>• Pastikan pencahayaan cukup</li>
              <li>• Jarak kamera 15-30 cm dari QR code</li>
              <li>• QR code harus terlihat jelas, tidak blur atau rusak</li>
              <li>• Gunakan input manual jika QR tidak terbaca</li>
            </ul>
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
