const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { createAuditLog } = require('../middleware/auditLog');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'Phone and password are required' });
    }

    const user = await db('users').where({ phone, is_active: true }).first();
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    await createAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'LOGIN',
      entityType: 'users',
      entityId: user.id,
      ipAddress: req.ip,
    });

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          address: user.address,
          first_login: user.first_login,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await db('users').where({ id: userId }).first();
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ success: false, message: 'New password must be different from current password' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db('users').where({ id: userId }).update({
      password_hash: hashedPassword,
      first_login: false,
      updated_at: new Date(),
    });

    await createAuditLog({
      userId,
      userName: req.user.name,
      action: 'CHANGE_PASSWORD',
      entityType: 'users',
      entityId: userId,
      ipAddress: req.ip,
    });

    // Generate new token with first_login=false
    const updatedUser = await db('users').where({ id: userId }).first();
    const token = generateToken(updatedUser);

    res.json({
      success: true,
      message: 'Password changed successfully',
      data: { token },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await db('users').where({ id: req.user.id }).first();
    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        address: user.address,
        group_name: user.group_name,
        first_login: user.first_login,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, changePassword, getMe };
