const bcrypt = require('bcryptjs');
const db = require('../config/db');
const xlsx = require('xlsx');
const { createAuditLog } = require('../middleware/auditLog');

/**
 * GET /api/users
 */
const getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = db('users').select(
      'id', 'name', 'phone', 'role', 'address', 'group_name', 'is_active', 'first_login', 'created_at'
    );

    if (role) query = query.where({ role });
    if (search) {
      query = query.where((builder) => {
        builder.whereILike('name', `%${search}%`).orWhereILike('phone', `%${search}%`);
      });
    }

    const totalQuery = query.clone().count('* as count').first();
    const [total, users] = await Promise.all([
      totalQuery,
      query.orderBy('created_at', 'desc').limit(limit).offset(offset),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: { page: Number(page), limit: Number(limit), total: Number(total.count) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:id
 */
const getUser = async (req, res, next) => {
  try {
    const user = await db('users')
      .select('id', 'name', 'phone', 'role', 'address', 'group_name', 'is_active', 'first_login', 'created_at')
      .where({ id: req.params.id })
      .first();

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Get associated animals
    const animals = await db('mudhohi_animals as ma')
      .join('animals as a', 'ma.animal_id', 'a.id')
      .where('ma.user_id', req.params.id)
      .select('a.*', 'ma.group_name');

    res.json({ success: true, data: { ...user, animals } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users
 */
const createUser = async (req, res, next) => {
  try {
    const { name, phone, role, address, group_name, animal_id } = req.body;

    if (!name || !phone || !role) {
      return res.status(400).json({ success: false, message: 'Name, phone, and role are required' });
    }

    const existing = await db('users').where({ phone }).first();
    if (existing) {
      return res.status(409).json({ success: false, message: 'Phone number already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(phone, salt); // default password = phone

    const [user] = await db('users')
      .insert({ name, phone, password_hash, role, address, group_name, first_login: true })
      .returning(['id', 'name', 'phone', 'role', 'address', 'group_name', 'first_login', 'created_at']);

    // Link to animal if provided
    if (animal_id) {
      await db('mudhohi_animals').insert({ user_id: user.id, animal_id, group_name });
    }

    await createAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      action: 'CREATE_USER',
      entityType: 'users',
      entityId: user.id,
      details: { name, phone, role },
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, message: 'User created successfully', data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/:id
 */
const updateUser = async (req, res, next) => {
  try {
    const { name, phone, role, address, group_name, is_active } = req.body;
    const { id } = req.params;

    const user = await db('users').where({ id }).first();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Check phone uniqueness if changing
    if (phone && phone !== user.phone) {
      const existing = await db('users').where({ phone }).whereNot({ id }).first();
      if (existing) return res.status(409).json({ success: false, message: 'Phone already in use' });
    }

    const [updated] = await db('users')
      .where({ id })
      .update({ name, phone, role, address, group_name, is_active, updated_at: new Date() })
      .returning(['id', 'name', 'phone', 'role', 'address', 'group_name', 'is_active']);

    await createAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      action: 'UPDATE_USER',
      entityType: 'users',
      entityId: id,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'User updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/:id
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await db('users').where({ id }).first();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Soft delete
    await db('users').where({ id }).update({ is_active: false, updated_at: new Date() });

    await createAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      action: 'DELETE_USER',
      entityType: 'users',
      entityId: id,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/:id/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await db('users').where({ id }).first();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(user.phone, salt);
    await db('users').where({ id }).update({ password_hash, first_login: true, updated_at: new Date() });

    res.json({ success: true, message: `Password reset to phone number for ${user.name}` });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/import
 * Import mudhohi from Excel/CSV
 */
const importUsers = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File is required' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet);

    if (!rows.length) {
      return res.status(400).json({ success: false, message: 'File is empty or invalid format' });
    }

    const results = { success: 0, skipped: 0, errors: [] };
    const salt = await bcrypt.genSalt(10);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel row number (1-indexed + header)

      const name = row['Nama'] || row['name'] || row['NAME'];
      const phone = String(row['No HP'] || row['phone'] || row['PHONE'] || '').trim();
      const address = row['Alamat'] || row['address'] || '';
      const animal_type = row['Jenis Hewan'] || row['animal_type'] || 'kambing';
      const group_name = row['Kelompok'] || row['group'] || '';
      const delivery_method = row['Preferensi'] || row['delivery'] || 'pickup';

      if (!name || !phone) {
        results.errors.push({ row: rowNum, message: 'Name and phone are required' });
        continue;
      }

      try {
        const existing = await db('users').where({ phone }).first();
        if (existing) {
          results.skipped++;
          continue;
        }

        const password_hash = await bcrypt.hash(phone, salt);
        await db('users').insert({
          name: String(name),
          phone,
          password_hash,
          role: 'mudhohi',
          address: String(address),
          group_name: String(group_name),
          first_login: true,
        });
        results.success++;
      } catch (err) {
        results.errors.push({ row: rowNum, message: err.message });
      }
    }

    await createAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      action: 'IMPORT_USERS',
      entityType: 'users',
      details: results,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Import completed: ${results.success} added, ${results.skipped} skipped`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser, resetPassword, importUsers };
