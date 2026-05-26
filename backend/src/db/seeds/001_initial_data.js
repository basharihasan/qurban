const bcrypt = require('bcryptjs');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Delete existing in reverse dependency order
  await knex('audit_logs').del();
  await knex('notifications').del();
  await knex('distributions').del();
  await knex('delivery_confirmations').del();
  await knex('mudhohi_animals').del();
  await knex('animals').del();
  await knex('users').del();

  const salt = await bcrypt.genSalt(10);

  // Admin user
  const adminHash = await bcrypt.hash('admin123', salt);
  // Panitia user
  const panitiaHash = await bcrypt.hash('panitia123', salt);

  // Mudhohi sample passwords (phone = password)
  const phones = ['08111111111', '08222222222', '08333333333', '08444444444', '08555555555', '08666666666', '08777777777'];
  const mudhohiHashes = await Promise.all(phones.map((p) => bcrypt.hash(p, salt)));

  // Insert users
  const [admin] = await knex('users')
    .insert({
      name: 'Administrator',
      phone: '08100000000',
      password_hash: adminHash,
      role: 'admin',
      address: 'Kantor Panitia Qurban',
      first_login: false,
    })
    .returning('id');

  const [panitia] = await knex('users')
    .insert({
      name: 'Panitia Qurban',
      phone: '08100000001',
      password_hash: panitiaHash,
      role: 'panitia',
      address: 'Lokasi Penyembelihan',
      first_login: false,
    })
    .returning('id');

  const mudhohiData = [
    { name: 'Ahmad Fauzi', phone: phones[0], address: 'Jl. Merdeka No. 1, Jakarta', group_name: 'Kelompok A' },
    { name: 'Siti Aminah', phone: phones[1], address: 'Jl. Sudirman No. 5, Bandung', group_name: 'Kelompok A' },
    { name: 'Budi Santoso', phone: phones[2], address: 'Jl. Gatot Subroto No. 10, Surabaya', group_name: 'Kelompok B' },
    { name: 'Fatimah Zahra', phone: phones[3], address: 'Jl. Diponegoro No. 15, Yogyakarta', group_name: 'Kelompok B' },
    { name: 'Rizki Ramadhan', phone: phones[4], address: 'Jl. Ahmad Yani No. 20, Semarang', group_name: 'Kelompok C' },
    { name: 'Nur Hidayah', phone: phones[5], address: 'Jl. Imam Bonjol No. 25, Medan', group_name: 'Kelompok C' },
    { name: 'Hasan Basri', phone: phones[6], address: 'Jl. Veteran No. 30, Makassar', group_name: 'Kelompok D' },
  ];

  const mudhohiInserted = await knex('users')
    .insert(
      mudhohiData.map((m, i) => ({
        name: m.name,
        phone: m.phone,
        password_hash: mudhohiHashes[i],
        role: 'mudhohi',
        address: m.address,
        group_name: m.group_name,
        first_login: true,
      }))
    )
    .returning('id');

  // Insert animals
  const animalsData = [
    { animal_code: 'SPI-001', animal_type: 'sapi', weight: 250.5, status: 'distributed', color: 'Hitam', age_estimate: '2 tahun' },
    { animal_code: 'SPI-002', animal_type: 'sapi', weight: 275.0, status: 'processed', color: 'Cokelat', age_estimate: '3 tahun' },
    { animal_code: 'KMB-001', animal_type: 'kambing', weight: 35.0, status: 'slaughtered', color: 'Putih', age_estimate: '1 tahun' },
    { animal_code: 'KMB-002', animal_type: 'kambing', weight: 40.5, status: 'ready', color: 'Hitam putih', age_estimate: '1.5 tahun' },
    { animal_code: 'DMB-001', animal_type: 'domba', weight: 45.0, status: 'registered', color: 'Putih', age_estimate: '2 tahun' },
    { animal_code: 'SPI-003', animal_type: 'sapi', weight: 300.0, status: 'registered', color: 'Putih', age_estimate: '3 tahun' },
    { animal_code: 'KMB-003', animal_type: 'kambing', weight: 38.0, status: 'slaughtered', color: 'Cokelat', age_estimate: '1 tahun' },
  ];

  const animalsInserted = await knex('animals').insert(animalsData).returning('id');

  // Link mudhohi to animals (1-1 for kambing, multiple for sapi)
  const links = [
    { user_id: mudhohiInserted[0].id, animal_id: animalsInserted[0].id, group_name: 'Kelompok A' }, // sapi 1 - distributed
    { user_id: mudhohiInserted[1].id, animal_id: animalsInserted[0].id, group_name: 'Kelompok A' },
    { user_id: mudhohiInserted[2].id, animal_id: animalsInserted[1].id, group_name: 'Kelompok B' }, // sapi 2 - processed
    { user_id: mudhohiInserted[3].id, animal_id: animalsInserted[2].id, group_name: 'Kelompok B' }, // kambing 1 - slaughtered
    { user_id: mudhohiInserted[4].id, animal_id: animalsInserted[3].id, group_name: 'Kelompok C' }, // kambing 2 - ready
    { user_id: mudhohiInserted[5].id, animal_id: animalsInserted[4].id, group_name: 'Kelompok C' }, // domba - registered
    { user_id: mudhohiInserted[6].id, animal_id: animalsInserted[6].id, group_name: 'Kelompok D' }, // kambing 3 - slaughtered
  ];
  await knex('mudhohi_animals').insert(links);

  // Sample delivery confirmations
  await knex('delivery_confirmations').insert([
    {
      user_id: mudhohiInserted[0].id,
      method: 'delivery',
      recipient_name: 'Ahmad Fauzi',
      recipient_phone: phones[0],
      delivery_address: 'Jl. Merdeka No. 1, Jakarta',
      notes: 'Tolong hubungi sebelum kirim',
      confirmed_at: new Date(),
    },
    {
      user_id: mudhohiInserted[3].id,
      method: 'pickup',
      pickup_location: 'Masjid Al-Falah, Jl. Utama No. 1',
      confirmed_at: new Date(),
    },
  ]);

  // Sample distributions
  await knex('distributions').insert([
    {
      user_id: mudhohiInserted[0].id,
      animal_id: animalsInserted[0].id,
      status: 'delivered',
      method: 'delivery',
      courier_name: 'Joko Widodo',
      courier_phone: '08199999999',
      delivery_time: new Date(),
      recipient_name: 'Ahmad Fauzi',
      recipient_phone: phones[0],
      delivery_address: 'Jl. Merdeka No. 1, Jakarta',
    },
    {
      user_id: mudhohiInserted[3].id,
      animal_id: animalsInserted[2].id,
      status: 'ready_pickup',
      method: 'pickup',
      recipient_name: 'Fatimah Zahra',
      recipient_phone: phones[3],
    },
    {
      user_id: mudhohiInserted[4].id,
      animal_id: animalsInserted[3].id,
      status: 'waiting_delivery',
      method: 'delivery',
      recipient_name: 'Rizki Ramadhan',
      recipient_phone: phones[4],
      delivery_address: 'Jl. Ahmad Yani No. 20, Semarang',
    },
  ]);

  console.log('✅ Seed completed successfully!');
  console.log('');
  console.log('📋 Login Credentials:');
  console.log('  Admin:   phone=08100000000  password=admin123');
  console.log('  Panitia: phone=08100000001  password=panitia123');
  console.log('  Mudhohi: phone=08111111111  password=08111111111 (first_login=true)');
};
