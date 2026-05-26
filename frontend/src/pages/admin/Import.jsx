import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { Sidebar } from '../../components/layout/Sidebar';
import { MobileNav } from '../../components/layout/MobileNav';
import { TopBar } from '../../components/layout/Sidebar';
import { Button } from '../../components/ui';
import api from '../../services/api';
import { DocumentArrowUpIcon, CheckCircleIcon, XCircleIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const TEMPLATE_DATA = [
  {
    'No.': 1,
    'Nama': 'Abu Musa Pandu',
    'No. HP': '085624115115',
    'Jatah & Permintaan': 'Daging 5kg. Iga, paru, buntut, kaki',
    'Tambahan': '',
    'Pengambilan/Pengiriman': 'GSM B3',
    'Hewan': 'Sapi 1',
    'PJ': 'Ust. Abdurrahman & Abdullah',
    'Kirim': ''
  },
  {
    'No.': 2,
    'Nama': 'Cepi Iskandar',
    'No. HP': '081320072256',
    'Jatah & Permintaan': 'Daging 5kg. Buntut and Iga daging lembut',
    'Tambahan': '',
    'Pengambilan/Pengiriman': 'Jl. Margahayu Kencana Blok G7/3 Margahayu Bandung',
    'Hewan': 'Sapi 1',
    'PJ': 'Ust. Abdurrahman & Abdullah',
    'Kirim': ''
  },
  {
    'No.': 3,
    'Nama': 'Abu Khalid Atho',
    'No. HP': '081395183218',
    'Jatah & Permintaan': 'Daging 5kg. Iga, kaki, daging has',
    'Tambahan': '',
    'Pengambilan/Pengiriman': 'Diambil ke alhijrah',
    'Hewan': 'Sapi 1',
    'PJ': 'Ust. Abdurrahman & Abdullah',
    'Kirim': ''
  }
];

export default function AdminImport() {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResults(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/users/import/excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      setResults(data.data);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal import'),
  });

  const downloadTemplate = async () => {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(TEMPLATE_DATA);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Mudhohi');
    // Set column widths to perfectly fit the new template structure
    ws['!cols'] = [
      { wch: 5 },   // No.
      { wch: 25 },  // Nama
      { wch: 15 },  // No. HP
      { wch: 35 },  // Jatah & Permintaan
      { wch: 10 },  // Tambahan
      { wch: 45 },  // Pengambilan/Pengiriman
      { wch: 12 },  // Hewan
      { wch: 30 },  // PJ
      { wch: 10 }   // Kirim
    ];
    XLSX.writeFile(wb, 'template_mudhohi.xlsx');
    toast.success('Template berhasil diunduh');
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <Sidebar />
      <div className="lg:ml-64 pb-20 lg:pb-0">
        <TopBar title="Import Data Mudhohi" />

        <main className="p-4 lg:p-6 max-w-2xl mx-auto space-y-5 animate-fade-in">
          {/* Instructions */}
          <div className="card p-5">
            <h2 className="font-semibold text-stone-900 dark:text-white mb-3">📋 Panduan Import</h2>
            <ol className="space-y-2 text-sm text-stone-600 dark:text-stone-400 list-decimal list-inside">
              <li>Unduh template Excel di bawah ini</li>
              <li>Isi data mudhohi sesuai kolom yang tersedia</li>
              <li>Kolom wajib: <strong className="text-stone-800 dark:text-stone-200">Nama</strong> dan <strong className="text-stone-800 dark:text-stone-200">No. HP</strong></li>
              <li>Nomor HP akan digunakan sebagai username dan password default</li>
              <li>Upload file dan klik tombol Import</li>
            </ol>
            <div className="mt-4">
              <Button variant="outline" onClick={downloadTemplate}>
                <ArrowDownTrayIcon className="w-4 h-4" /> Unduh Template Excel
              </Button>
            </div>
          </div>

          {/* Column reference */}
          <div className="card p-5">
            <h3 className="font-semibold text-stone-800 dark:text-white mb-3">📊 Kolom yang Didukung</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {['No.', 'Nama *', 'No. HP *', 'Jatah & Permintaan', 'Tambahan', 'Pengambilan/Pengiriman', 'Hewan', 'PJ', 'Kirim'].map((col) => (
                <div key={col} className="px-3 py-2 rounded-lg bg-stone-50 dark:bg-stone-800 text-sm font-mono text-stone-700 dark:text-stone-300">
                  {col}
                </div>
              ))}
            </div>
            <p className="text-xs text-stone-400 mt-3">* Kolom wajib diisi | Pengambilan/Pengiriman: masukan alamat lengkap untuk Kirim, atau tulis "Diambil ke alhijrah" untuk Ambil Sendiri.</p>
          </div>

          {/* File Drop Zone */}
          <div
            {...getRootProps()}
            className={`card p-8 border-2 border-dashed text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                : 'border-stone-200 dark:border-stone-700 hover:border-emerald-400 hover:bg-stone-50 dark:hover:bg-stone-900'
            }`}
          >
            <input {...getInputProps()} />
            <DocumentArrowUpIcon className={`w-12 h-12 mx-auto mb-4 ${isDragActive ? 'text-emerald-500' : 'text-stone-300 dark:text-stone-600'}`} />
            {file ? (
              <div>
                <p className="font-semibold text-emerald-700 dark:text-emerald-300 text-lg">{file.name}</p>
                <p className="text-sm text-stone-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                <button className="text-xs text-red-400 hover:text-red-600 mt-2" onClick={(e) => { e.stopPropagation(); setFile(null); setResults(null); }}>
                  Hapus file
                </button>
              </div>
            ) : (
              <div>
                <p className="font-medium text-stone-600 dark:text-stone-400">
                  {isDragActive ? 'Lepaskan file di sini...' : 'Drag & drop file atau klik untuk pilih'}
                </p>
                <p className="text-sm text-stone-400 mt-1">Format: .xlsx, .xls, .csv (maks. 5MB)</p>
              </div>
            )}
          </div>

          {/* Import button */}
          {file && !results && (
            <Button variant="primary" size="lg" className="w-full" loading={importMutation.isPending}
              onClick={() => importMutation.mutate()}>
              {importMutation.isPending ? 'Sedang mengimport...' : `Import ${file.name}`}
            </Button>
          )}

          {/* Results */}
          {results && (
            <div className="card p-5 animate-slide-up">
              <h3 className="font-semibold text-stone-900 dark:text-white mb-4">📊 Hasil Import</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-center">
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{results.success}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Berhasil</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-center">
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{results.skipped}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">Dilewati</p>
                </div>
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 text-center">
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">{results.errors?.length || 0}</p>
                  <p className="text-xs text-red-600 dark:text-red-400">Error</p>
                </div>
              </div>
              {results.errors?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">Detail Error:</p>
                  {results.errors.map((err, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
                      <XCircleIcon className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700 dark:text-red-300">Baris {err.row}: {err.message}</p>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="secondary" className="mt-4 w-full" onClick={() => { setFile(null); setResults(null); }}>
                Import Lagi
              </Button>
            </div>
          )}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
