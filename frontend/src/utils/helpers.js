import { format, formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

export const formatDate = (date, fmt = 'dd MMM yyyy') => {
  if (!date) return '-';
  return format(new Date(date), fmt, { locale: id });
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  return format(new Date(date), 'dd MMM yyyy, HH:mm', { locale: id });
};

export const formatRelative = (date) => {
  if (!date) return '-';
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: id });
};

export const formatPhone = (phone) => {
  if (!phone) return '-';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) return cleaned;
  if (cleaned.startsWith('62')) return '0' + cleaned.slice(2);
  return phone;
};

export const ANIMAL_STATUS_CONFIG = {
  registered: { label: 'Terdaftar', color: 'badge-gray', dot: 'bg-stone-400' },
  ready: { label: 'Siap Sembelih', color: 'badge-blue', dot: 'bg-blue-400' },
  slaughtered: { label: 'Disembelih', color: 'badge-yellow', dot: 'bg-yellow-400' },
  processed: { label: 'Diproses', color: 'badge-gold', dot: 'bg-amber-400' },
  distributed: { label: 'Didistribusi', color: 'badge-green', dot: 'bg-emerald-400' },
};

export const DISTRIBUTION_STATUS_CONFIG = {
  not_ready: { label: 'Belum Siap', color: 'badge-gray', dot: 'bg-stone-400' },
  ready_pickup: { label: 'Siap Diambil', color: 'badge-blue', dot: 'bg-blue-400' },
  picked_up: { label: 'Sudah Diambil', color: 'badge-green', dot: 'bg-emerald-400' },
  waiting_delivery: { label: 'Menunggu Kirim', color: 'badge-yellow', dot: 'bg-yellow-400' },
  on_delivery: { label: 'Dalam Pengiriman', color: 'badge-gold', dot: 'bg-amber-400' },
  delivered: { label: 'Terkirim', color: 'badge-green', dot: 'bg-emerald-500' },
};

export const ANIMAL_TYPE_LABELS = {
  sapi: '🐄 Sapi',
  kambing: '🐐 Kambing',
  domba: '🐑 Domba',
  unta: '🐪 Unta',
};

export const ROLE_LABELS = {
  admin: 'Administrator',
  panitia: 'Panitia',
  mudhohi: 'Mudhohi',
};

export const ROLE_COLORS = {
  admin: 'badge-red',
  panitia: 'badge-blue',
  mudhohi: 'badge-green',
};

export const getStatusProgress = (status) => {
  const order = ['registered', 'ready', 'slaughtered', 'processed', 'distributed'];
  return ((order.indexOf(status) + 1) / order.length) * 100;
};

export const downloadJSON = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportToExcel = async (data, filename) => {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, `${filename}.xlsx`);
};
