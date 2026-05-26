const axios = require('axios');
const db = require('../config/db');

/**
 * WhatsApp Notification Service
 * Uses Fonnte API as the default provider.
 * Set WA_ENABLED=false to use console-log mock mode.
 */

const WA_ENABLED = process.env.WA_ENABLED === 'true';
const WA_API_URL = process.env.WA_API_URL || 'https://api.fonnte.com/send';
const WA_API_TOKEN = process.env.WA_API_TOKEN || '';

/**
 * Send a WhatsApp message via Fonnte API
 * @param {string} phone - Target phone number
 * @param {string} message - Message body
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
const sendWhatsApp = async (phone, message) => {
  // Log to console in dev / when disabled
  if (!WA_ENABLED) {
    console.log(`[WA Mock] To: ${phone}\nMessage: ${message}\n`);
    return { success: true, mock: true };
  }

  try {
    const response = await axios.post(
      WA_API_URL,
      { target: phone, message },
      { headers: { Authorization: WA_API_TOKEN } }
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[WA Error]', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Save notification to DB and send WhatsApp
 */
const notify = async (userId, phone, type, message) => {
  const [notification] = await db('notifications')
    .insert({ user_id: userId, phone, type, message, status: 'pending' })
    .returning('*');

  const result = await sendWhatsApp(phone, message);

  await db('notifications').where({ id: notification.id }).update({
    status: result.success ? 'sent' : 'failed',
    sent_at: result.success ? new Date() : null,
    error_message: result.error || null,
    updated_at: new Date(),
  });

  return result;
};

/**
 * Send notification when animal is slaughtered
 */
const sendSlaughterComplete = async (phone, mudhohiname) => {
  const message = `Assalamu'alaikum ${mudhohiname},\n\nAlhamdulillah, hewan qurban Anda telah selesai disembelih. Semoga ibadah qurban Anda diterima oleh Allah SWT.\n\nJazakallahu khairan 🌙`;
  return sendWhatsApp(phone, message);
};

/**
 * Send notification when meat is ready
 */
const sendMeatReady = async (phone, mudhohiname) => {
  const message = `Assalamu'alaikum ${mudhohiname},\n\nJatah daging qurban Anda telah siap untuk diambil/dikirim. Silakan pantau status melalui aplikasi.\n\nJazakallahu khairan 🌙`;
  return sendWhatsApp(phone, message);
};

/**
 * Send notification when delivery has started
 */
const sendDeliveryStarted = async (phone, mudhohiname) => {
  const message = `Assalamu'alaikum ${mudhohiname},\n\nPaket daging qurban Anda sedang dalam perjalanan menuju alamat Anda. Harap bersiap untuk menerima.\n\nJazakallahu khairan 🌙`;
  return sendWhatsApp(phone, message);
};

/**
 * Trigger appropriate notification based on animal status change
 */
const sendStatusNotification = async (animalId, status) => {
  try {
    // Get all mudhohi linked to this animal
    const mudhohi = await db('mudhohi_animals as ma')
      .join('users as u', 'ma.user_id', 'u.id')
      .where('ma.animal_id', animalId)
      .select('u.id as user_id', 'u.phone', 'u.name');

    for (const m of mudhohi) {
      let type, msgFn;
      if (status === 'slaughtered') {
        type = 'slaughter_complete';
        msgFn = () => sendSlaughterComplete(m.phone, m.name);
      } else if (status === 'processed') {
        type = 'meat_ready';
        msgFn = () => sendMeatReady(m.phone, m.name);
      } else {
        continue;
      }

      const message = status === 'slaughtered'
        ? `Assalamu'alaikum ${m.name}, hewan qurban Anda telah selesai disembelih. 🌙`
        : `Assalamu'alaikum ${m.name}, jatah daging qurban Anda telah siap. 🌙`;

      await notify(m.user_id, m.phone, type, message);
    }
  } catch (error) {
    console.error('[NotificationService] Error:', error.message);
  }
};

module.exports = {
  sendWhatsApp,
  notify,
  sendSlaughterComplete,
  sendMeatReady,
  sendDeliveryStarted,
  sendStatusNotification,
};
