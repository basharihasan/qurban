const db = require('../config/db');

/**
 * GET /api/mudhohi/dashboard
 * Mudhohi personal dashboard data
 */
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user's animals via mudhohi_animals
    const animals = await db('mudhohi_animals as ma')
      .join('animals as a', 'ma.animal_id', 'a.id')
      .where('ma.user_id', userId)
      .select('a.*', 'ma.group_name');

    // Get delivery confirmation
    const confirmation = await db('delivery_confirmations')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .first();

    // Get distribution status
    const distribution = await db('distributions')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .first();

    // Get notifications
    const notifications = await db('notifications')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(10);

    res.json({
      success: true,
      data: {
        animals,
        confirmation,
        distribution,
        notifications,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/mudhohi/delivery-confirmation
 */
const saveDeliveryConfirmation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { method, recipient_name, recipient_phone, delivery_address, maps_link, notes, pickup_location } = req.body;

    if (!method || !['pickup', 'delivery'].includes(method)) {
      return res.status(400).json({ success: false, message: 'Valid method (pickup/delivery) is required' });
    }

    if (method === 'delivery' && !delivery_address) {
      return res.status(400).json({ success: false, message: 'Delivery address is required for delivery method' });
    }

    // Upsert: delete existing and insert new
    await db('delivery_confirmations').where({ user_id: userId }).del();

    const [confirmation] = await db('delivery_confirmations')
      .insert({
        user_id: userId,
        method,
        recipient_name: method === 'delivery' ? recipient_name : null,
        recipient_phone: method === 'delivery' ? recipient_phone : null,
        delivery_address: method === 'delivery' ? delivery_address : null,
        maps_link: method === 'delivery' ? maps_link : null,
        notes,
        pickup_location: method === 'pickup' ? pickup_location : null,
        confirmed_at: new Date(),
      })
      .returning('*');

    // Also update or create a distribution record
    const existingDist = await db('distributions').where({ user_id: userId }).first();
    if (existingDist) {
      await db('distributions').where({ user_id: userId }).update({
        method,
        recipient_name: method === 'delivery' ? recipient_name : null,
        recipient_phone: method === 'delivery' ? recipient_phone : null,
        delivery_address: method === 'delivery' ? delivery_address : null,
        updated_at: new Date(),
      });
    } else {
      // Get first animal linked to this mudhohi
      const animalLink = await db('mudhohi_animals').where({ user_id: userId }).first();
      await db('distributions').insert({
        user_id: userId,
        animal_id: animalLink?.animal_id || null,
        method,
        status: 'not_ready',
        recipient_name: method === 'delivery' ? recipient_name : null,
        recipient_phone: method === 'delivery' ? recipient_phone : null,
        delivery_address: method === 'delivery' ? delivery_address : null,
      });
    }

    res.json({ success: true, message: 'Delivery confirmation saved', data: confirmation });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/mudhohi/certificate/:animalId
 * Get certificate data for mudhohi
 */
const getCertificate = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { animalId } = req.params;

    const link = await db('mudhohi_animals as ma')
      .join('animals as a', 'ma.animal_id', 'a.id')
      .join('users as u', 'ma.user_id', 'u.id')
      .where({ 'ma.user_id': userId, 'ma.animal_id': animalId })
      .select('u.name as mudhohi_name', 'u.phone', 'a.*', 'ma.group_name')
      .first();

    if (!link) return res.status(404).json({ success: false, message: 'Record not found' });

    res.json({
      success: true,
      data: {
        mudhohi_name: link.mudhohi_name,
        phone: link.phone,
        animal_code: link.animal_code,
        animal_type: link.animal_type,
        weight: link.weight,
        slaughter_time: link.slaughter_time,
        group_name: link.group_name,
        status: link.status,
        certificate_date: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard, saveDeliveryConfirmation, getCertificate };
