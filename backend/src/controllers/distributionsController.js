const db = require('../config/db');
const { createAuditLog } = require('../middleware/auditLog');

const DISTRIBUTION_STATUSES = ['not_ready', 'ready_pickup', 'picked_up', 'waiting_delivery', 'on_delivery', 'delivered'];

/**
 * GET /api/distributions
 */
const getDistributions = async (req, res, next) => {
  try {
    const { status, method, search, page, limit } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    let query = db('distributions as d')
      .join('users as u', 'd.user_id', 'u.id')
      .leftJoin('animals as a', 'd.animal_id', 'a.id')
      .select(
        'd.*',
        'u.name as mudhohi_name',
        'u.phone as mudhohi_phone',
        'a.animal_code',
        'a.animal_type',
        'a.status as animal_status'
      );

    if (status) query = query.where('d.status', status);
    if (method) query = query.where('d.method', method);
    if (search) {
      query = query.where((b) =>
        b.whereILike('u.name', `%${search}%`).orWhereILike('u.phone', `%${search}%`)
      );
    }

    const [total, distributions] = await Promise.all([
      query.clone().clearSelect().clearOrder().count('d.id as count').first(),
      query.orderBy('d.updated_at', 'desc').limit(limitNum).offset(offset),
    ]);

    res.json({
      success: true,
      data: distributions,
      pagination: { page: Number(page), limit: Number(limit), total: Number(total.count) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/distributions/:id
 */
const getDistribution = async (req, res, next) => {
  try {
    const dist = await db('distributions as d')
      .join('users as u', 'd.user_id', 'u.id')
      .leftJoin('animals as a', 'd.animal_id', 'a.id')
      .where('d.id', req.params.id)
      .select('d.*', 'u.name as mudhohi_name', 'u.phone as mudhohi_phone', 'a.animal_code', 'a.animal_type')
      .first();

    if (!dist) return res.status(404).json({ success: false, message: 'Distribution not found' });
    res.json({ success: true, data: dist });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/distributions/:id/status
 */
const updateDistributionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, courier_name, courier_phone, notes } = req.body;

    if (!DISTRIBUTION_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status` });
    }

    const dist = await db('distributions').where({ id }).first();
    if (!dist) return res.status(404).json({ success: false, message: 'Distribution not found' });

    const updateData = { status, updated_at: new Date() };
    if (courier_name) updateData.courier_name = courier_name;
    if (courier_phone) updateData.courier_phone = courier_phone;
    if (notes) updateData.notes = notes;
    if (status === 'delivered') updateData.delivery_time = new Date();

    // Handle proof photo upload
    if (req.file) {
      updateData.proof_photo_url = `/uploads/proofs/${req.file.filename}`;
    }

    const [updated] = await db('distributions').where({ id }).update(updateData).returning('*');

    // Emit socket event
    if (req.io) {
      req.io.emit('distribution:statusUpdate', { distribution: updated });
    }

    // WhatsApp notification for delivery started
    if (status === 'on_delivery') {
      const notificationService = require('../services/notificationService');
      const user = await db('users').where({ id: dist.user_id }).first();
      if (user) {
        await notificationService.sendDeliveryStarted(user.phone, user.name);
      }
    }

    await createAuditLog({
      userId: req.user.id, userName: req.user.name,
      action: 'UPDATE_DISTRIBUTION_STATUS', entityType: 'distributions', entityId: id,
      details: { oldStatus: dist.status, newStatus: status }, ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Distribution status updated', data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/distributions/:id/proof
 * Upload delivery proof photo
 */
const uploadProof = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ success: false, message: 'Proof photo is required' });

    const dist = await db('distributions').where({ id }).first();
    if (!dist) return res.status(404).json({ success: false, message: 'Distribution not found' });

    const [updated] = await db('distributions')
      .where({ id })
      .update({ proof_photo_url: `/uploads/proofs/${req.file.filename}`, updated_at: new Date() })
      .returning('*');

    res.json({ success: true, message: 'Proof photo uploaded', data: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDistributions, getDistribution, updateDistributionStatus, uploadProof };
