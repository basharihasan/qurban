const db = require('../config/db');

/**
 * GET /api/reports/dashboard
 * Admin dashboard statistics
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalMudhohi,
      totalAnimals,
      animalStatusCounts,
      distributionStatusCounts,
      recentAnimals,
      recentDistributions,
      pendingPickups,
    ] = await Promise.all([
      db('users').where({ role: 'mudhohi', is_active: true }).count('* as count').first(),
      db('animals').count('* as count').first(),
      db('animals').select('status').count('* as count').groupBy('status'),
      db('distributions').select('status').count('* as count').groupBy('status'),
      db('animals').orderBy('updated_at', 'desc').limit(5).select('*'),
      db('distributions as d')
        .join('users as u', 'd.user_id', 'u.id')
        .leftJoin('animals as a', 'd.animal_id', 'a.id')
        .select('d.*', 'u.name as mudhohi_name', 'a.animal_code')
        .whereIn('d.status', ['on_delivery', 'waiting_delivery'])
        .orderBy('d.updated_at', 'desc')
        .limit(5),
      db('distributions as d')
        .join('users as u', 'd.user_id', 'u.id')
        .leftJoin('animals as a', 'd.animal_id', 'a.id')
        .select('d.*', 'u.name as mudhohi_name', 'a.animal_code')
        .where({ 'd.status': 'ready_pickup', 'd.method': 'pickup' })
        .orderBy('d.updated_at', 'desc')
        .limit(10),
    ]);

    // Process animal status counts into a map
    const animalStats = {
      total: Number(totalAnimals.count),
      registered: 0, ready: 0, slaughtered: 0, processed: 0, distributed: 0,
    };
    animalStatusCounts.forEach((r) => { animalStats[r.status] = Number(r.count); });

    // Process distribution status counts
    const distStats = {
      not_ready: 0, ready_pickup: 0, picked_up: 0, waiting_delivery: 0, on_delivery: 0, delivered: 0,
    };
    distributionStatusCounts.forEach((r) => { distStats[r.status] = Number(r.count); });

    // Slaughter progress for chart (last 7 days)
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const slaughterProgress = await db('animals')
      .where('slaughter_time', '>=', sevenDaysAgo)
      .whereNotNull('slaughter_time')
      .select(db.raw('DATE(slaughter_time) as date'), db.raw('COUNT(*) as count'))
      .groupByRaw('DATE(slaughter_time)')
      .orderBy('date', 'asc');

    res.json({
      success: true,
      data: {
        summary: {
          total_mudhohi: Number(totalMudhohi.count),
          total_animals: animalStats.total,
          slaughter_completed: animalStats.slaughtered + animalStats.processed + animalStats.distributed,
          pending_slaughter: animalStats.registered + animalStats.ready,
          delivery_completed: distStats.delivered,
          pickup_completed: distStats.picked_up,
        },
        animal_stats: animalStats,
        distribution_stats: distStats,
        slaughter_progress: slaughterProgress,
        recent_animals: recentAnimals,
        active_deliveries: recentDistributions,
        pending_pickups: pendingPickups,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/audit-logs
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, user_id, action } = req.query;
    const offset = (page - 1) * limit;

    let query = db('audit_logs').select('*').orderBy('created_at', 'desc');
    if (user_id) query = query.where({ user_id });
    if (action) query = query.where({ action });

    const [total, logs] = await Promise.all([
      query.clone().count('* as count').first(),
      query.limit(limit).offset(offset),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: { page: Number(page), limit: Number(limit), total: Number(total.count) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/export/mudhohi
 * Export mudhohi data as JSON (frontend handles Excel conversion)
 */
const exportMudhohi = async (req, res, next) => {
  try {
    const mudhohi = await db('users as u')
      .leftJoin('mudhohi_animals as ma', 'u.id', 'ma.user_id')
      .leftJoin('animals as a', 'ma.animal_id', 'a.id')
      .leftJoin('delivery_confirmations as dc', 'u.id', 'dc.user_id')
      .leftJoin('distributions as d', 'u.id', 'd.user_id')
      .where({ 'u.role': 'mudhohi' })
      .select(
        'u.name', 'u.phone', 'u.address', 'u.group_name',
        'a.animal_code', 'a.animal_type', 'a.status as animal_status',
        'dc.method as delivery_method',
        'd.status as distribution_status',
        'd.courier_name', 'd.delivery_time'
      )
      .orderBy('u.name', 'asc');

    res.json({ success: true, data: mudhohi });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats, getAuditLogs, exportMudhohi };
