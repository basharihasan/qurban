const db = require('../config/db');
const QRCode = require('qrcode');
const { createAuditLog } = require('../middleware/auditLog');

const ANIMAL_STATUSES = ['registered', 'ready', 'slaughtered', 'processed', 'distributed'];

/**
 * GET /api/animals
 */
const getAnimals = async (req, res, next) => {
  try {
    const { status, animal_type, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = db('animals').select('*');

    if (status) query = query.where({ status });
    if (animal_type) query = query.where({ animal_type });
    if (search) {
      query = query.where((b) =>
        b.whereILike('animal_code', `%${search}%`).orWhereILike('notes', `%${search}%`)
      );
    }

    const [total, animals] = await Promise.all([
      query.clone().count('* as count').first(),
      query.orderBy('created_at', 'desc').limit(limit).offset(offset),
    ]);

    res.json({
      success: true,
      data: animals,
      pagination: { page: Number(page), limit: Number(limit), total: Number(total.count) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/animals/:id
 */
const getAnimal = async (req, res, next) => {
  try {
    const animal = await db('animals').where({ id: req.params.id }).first();
    if (!animal) return res.status(404).json({ success: false, message: 'Animal not found' });

    const mudhohi = await db('mudhohi_animals as ma')
      .join('users as u', 'ma.user_id', 'u.id')
      .where('ma.animal_id', req.params.id)
      .select('u.id', 'u.name', 'u.phone', 'u.address', 'ma.group_name');

    res.json({ success: true, data: { ...animal, mudhohi } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/animals
 */
const createAnimal = async (req, res, next) => {
  try {
    const { animal_code, animal_type, weight, color, age_estimate, notes } = req.body;

    if (!animal_code || !animal_type) {
      return res.status(400).json({ success: false, message: 'Animal code and type are required' });
    }

    const existing = await db('animals').where({ animal_code }).first();
    if (existing) return res.status(409).json({ success: false, message: 'Animal code already exists' });

    const photo_url = req.file ? `/uploads/animals/${req.file.filename}` : null;

    const [animal] = await db('animals')
      .insert({ animal_code, animal_type, weight, color, age_estimate, notes, photo_url })
      .returning('*');

    await createAuditLog({
      userId: req.user.id, userName: req.user.name,
      action: 'CREATE_ANIMAL', entityType: 'animals', entityId: animal.id,
      details: { animal_code, animal_type }, ipAddress: req.ip,
    });

    res.status(201).json({ success: true, message: 'Animal created successfully', data: animal });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/animals/:id
 */
const updateAnimal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { animal_code, animal_type, weight, color, age_estimate, notes } = req.body;

    const animal = await db('animals').where({ id }).first();
    if (!animal) return res.status(404).json({ success: false, message: 'Animal not found' });

    const photo_url = req.file ? `/uploads/animals/${req.file.filename}` : animal.photo_url;

    const [updated] = await db('animals')
      .where({ id })
      .update({ animal_code, animal_type, weight, color, age_estimate, notes, photo_url, updated_at: new Date() })
      .returning('*');

    res.json({ success: true, message: 'Animal updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/animals/:id
 */
const deleteAnimal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const animal = await db('animals').where({ id }).first();
    if (!animal) return res.status(404).json({ success: false, message: 'Animal not found' });

    await db('animals').where({ id }).del();
    res.json({ success: true, message: 'Animal deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/animals/:id/status
 */
const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!ANIMAL_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${ANIMAL_STATUSES.join(', ')}` });
    }

    const animal = await db('animals').where({ id }).first();
    if (!animal) return res.status(404).json({ success: false, message: 'Animal not found' });

    const updateData = { status, updated_at: new Date() };
    if (status === 'slaughtered') updateData.slaughter_time = new Date();
    if (notes) updateData.notes = notes;

    const [updated] = await db('animals').where({ id }).update(updateData).returning('*');

    // Emit socket event
    if (req.io) {
      req.io.emit('animal:statusUpdate', { animal: updated });
    }

    // Trigger WhatsApp notifications for key status changes
    if (['slaughtered', 'processed', 'distributed'].includes(status)) {
      const notificationService = require('../services/notificationService');
      await notificationService.sendStatusNotification(id, status);
    }

    await createAuditLog({
      userId: req.user.id, userName: req.user.name,
      action: 'UPDATE_ANIMAL_STATUS', entityType: 'animals', entityId: id,
      details: { oldStatus: animal.status, newStatus: status }, ipAddress: req.ip,
    });

    res.json({ success: true, message: `Status updated to ${status}`, data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/animals/:id/qr
 */
const getQRCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const animal = await db('animals').where({ id }).first();
    if (!animal) return res.status(404).json({ success: false, message: 'Animal not found' });

    const qrData = JSON.stringify({ id: animal.id, code: animal.animal_code, type: animal.animal_type });
    const qrImage = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });

    res.json({ success: true, data: { qr_data: qrData, qr_image: qrImage, animal_code: animal.animal_code } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/animals/assign
 * Assign mudhohi to animal
 */
const assignMudhohi = async (req, res, next) => {
  try {
    const { user_id, animal_id, group_name } = req.body;

    const [user, animal] = await Promise.all([
      db('users').where({ id: user_id, role: 'mudhohi' }).first(),
      db('animals').where({ id: animal_id }).first(),
    ]);

    if (!user) return res.status(404).json({ success: false, message: 'Mudhohi not found' });
    if (!animal) return res.status(404).json({ success: false, message: 'Animal not found' });

    const existing = await db('mudhohi_animals').where({ user_id, animal_id }).first();
    if (existing) return res.status(409).json({ success: false, message: 'Already assigned' });

    await db('mudhohi_animals').insert({ user_id, animal_id, group_name });
    res.json({ success: true, message: 'Mudhohi assigned to animal successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAnimals, getAnimal, createAnimal, updateAnimal, deleteAnimal, updateStatus, getQRCode, assignMudhohi };
