const db = require('../config/db');

/**
 * Create an audit log entry
 */
const createAuditLog = async ({ userId, userName, action, entityType, entityId, details, ipAddress }) => {
  try {
    await db('audit_logs').insert({
      user_id: userId || null,
      user_name: userName || null,
      action,
      entity_type: entityType || null,
      entity_id: entityId || null,
      details: details ? JSON.stringify(details) : null,
      ip_address: ipAddress || null,
    });
  } catch (err) {
    console.error('Failed to create audit log:', err.message);
  }
};

/**
 * Audit log middleware factory
 */
const auditLog = (action, entityType) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = async (body) => {
      if (body && body.success && req.user) {
        await createAuditLog({
          userId: req.user.id,
          userName: req.user.name,
          action,
          entityType,
          entityId: body.data?.id || req.params.id || null,
          details: { method: req.method, path: req.path },
          ipAddress: req.ip,
        });
      }
      originalJson(body);
    };
    next();
  };
};

module.exports = { createAuditLog, auditLog };
