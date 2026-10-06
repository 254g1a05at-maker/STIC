const { db } = require('./db');
const { logActivity } = require('./activity');

/**
 * Returns formatted Indian Standard Time (Asia/Kolkata, UTC+05:30)
 */
function getISTTimestamp(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  const parts = formatter.formatToParts(d);
  const p = {};
  for (const item of parts) {
    p[item.type] = item.value;
  }
  const dateStr = `${p.day}/${p.month}/${p.year}`;
  const period = (p.dayPeriod || '').toUpperCase();
  const timeStr = `${p.hour}:${p.minute}:${p.second} ${period} IST`.trim();
  const fullStr = `${dateStr}, ${timeStr}`;
  return { dateStr, timeStr, fullStr, isoStr: d.toISOString() };
}

/**
 * Helper to get a club setting value
 */
function getSetting(key, defaultValue = '') {
  try {
    const row = db.prepare('SELECT value FROM club_settings WHERE key = ?').get(key);
    return row ? row.value : defaultValue;
  } catch (err) {
    return defaultValue;
  }
}

/**
 * Helper to set a club setting value
 */
function setSetting(key, value) {
  try {
    db.prepare(`
      INSERT INTO club_settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `).run(key, String(value));
  } catch (err) {
    console.error(`[SETTING ERROR] Failed to set ${key}:`, err);
  }
}

/**
 * Retrieve public Instagram Connection status (Safe, no secret/token leakage)
 */
function getInstagramStatus() {
  const connected = getSetting('instagram_connected', '0') === '1';
  const username = getSetting('instagram_username', '');
  const accountName = getSetting('instagram_account_name', '');
  const lastSyncTime = getSetting('instagram_last_sync_time', '');
  const lastSyncStatus = getSetting('instagram_last_sync_status', connected ? 'connected' : 'disconnected');
  const lastError = getSetting('instagram_last_error', '');
  const tokenExpiresAt = getSetting('instagram_token_expires_at', '');

  // Check if token has expired based on stored expiry
  let isExpired = false;
  if (connected && tokenExpiresAt) {
    try {
      const expDate = new Date(tokenExpiresAt);
      if (expDate.getTime() < Date.now()) {
        isExpired = true;
      }
    } catch (e) {}
  }

  const appId = process.env.INSTAGRAM_CLIENT_ID || process.env.META_APP_ID || getSetting('instagram_client_id', '');

  return {
    connected: connected && !isExpired,
    is_expired: isExpired,
    username: username ? (username.startsWith('@') ? username : `@${username}`) : '',
    raw_username: username,
    account_name: accountName,
    last_sync_time: lastSyncTime,
    last_sync_status: isExpired ? 'expired' : lastSyncStatus,
    last_error: isExpired ? 'Instagram connection expired. Please reconnect.' : lastError,
    app_id_configured: Boolean(appId && appId.trim().length > 0)
  };
}

/**
 * Generate official Meta / Instagram OAuth Dialog URL
 */
function getOAuthUrl(redirectUri) {
  const appId = process.env.INSTAGRAM_CLIENT_ID || process.env.META_APP_ID || getSetting('instagram_client_id', '');
  if (!appId) {
    throw new Error('Meta App ID is not configured. Please provide your Meta App ID in environment variables or connection settings.');
  }

  const callback = redirectUri || getSetting('instagram_redirect_uri', 'http://localhost:5000/api/social/instagram/callback');
  const state = 'stic_ig_' + Math.random().toString(36).substring(2, 15);
  setSetting('instagram_oauth_state', state);

  // Official Meta OAuth URL for Instagram Graph API & Instagram Business Login
  return `https://www.facebook.com/v21.0/dialog/oauth?client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(callback)}&scope=instagram_basic,pages_show_list,pages_read_engagement&response_type=code&state=${state}`;
}

/**
 * Exchange OAuth authorization code for Access Token
 */
async function exchangeCodeForToken(code, redirectUri, reqUser = null) {
  const appId = process.env.INSTAGRAM_CLIENT_ID || process.env.META_APP_ID || getSetting('instagram_client_id', '');
  const appSecret = process.env.INSTAGRAM_CLIENT_SECRET || process.env.META_APP_SECRET || getSetting('instagram_client_secret', '');
  const callback = redirectUri || getSetting('instagram_redirect_uri', 'http://localhost:5000/api/social/instagram/callback');

  if (!appId || !appSecret) {
    throw new Error('Meta App ID and Secret must be configured on the server to complete OAuth code exchange.');
  }

  // 1. Exchange code for short-lived access token
  const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${encodeURIComponent(appId)}&client_secret=${encodeURIComponent(appSecret)}&redirect_uri=${encodeURIComponent(callback)}&code=${encodeURIComponent(code)}`;
  const tokenRes = await fetch(tokenUrl);
  const tokenData = await tokenRes.json();

  if (tokenData.error) {
    throw new Error(tokenData.error.message || 'Failed to exchange authorization code for access token.');
  }

  const shortToken = tokenData.access_token;

  // 2. Exchange short-lived token for long-lived access token (60-day token)
  let longToken = shortToken;
  let expiresSeconds = 60 * 24 * 60 * 60; // 60 days default
  try {
    const longRes = await fetch(`https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent(appId)}&client_secret=${encodeURIComponent(appSecret)}&fb_exchange_token=${encodeURIComponent(shortToken)}`);
    const longData = await longRes.json();
    if (longData.access_token) {
      longToken = longData.access_token;
      if (longData.expires_in) {
        expiresSeconds = longData.expires_in;
      }
    }
  } catch (err) {
    console.warn('[INSTAGRAM LONG TOKEN WARNING] Using short-lived token fallback:', err.message);
  }

  const expiryDate = new Date(Date.now() + (expiresSeconds * 1000)).toISOString();

  // 3. Connect with this token
  return await connectWithToken(longToken, { expiryDate, reqUser });
}

/**
 * Validate token with official Instagram/Meta API and establish connection
 */
async function connectWithToken(accessToken, options = {}) {
  if (!accessToken || !accessToken.trim()) {
    throw new Error('Valid Instagram / Meta Access Token is required.');
  }

  const token = accessToken.trim();
  let igUserId = null;
  let igUsername = null;
  let igAccountName = 'STIC Club';

  // 1. Try Instagram Graph API endpoint: https://graph.instagram.com/me
  try {
    const igRes = await fetch(`https://graph.instagram.com/me?fields=id,username,name,account_type&access_token=${encodeURIComponent(token)}`);
    const igData = await igRes.json();
    if (igData && igData.id) {
      igUserId = igData.id;
      igUsername = igData.username || 'stic_club_official';
      igAccountName = igData.name || 'Sustainable Technology & Innovation Club';
    }
  } catch (e) {
    // Continue to next probe
  }

  // 2. Try Facebook Graph API with connected Instagram Business Account
  if (!igUserId) {
    try {
      const fbRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=name,instagram_business_account{id,username,name}&access_token=${encodeURIComponent(token)}`);
      const fbData = await fbRes.json();
      if (fbData && fbData.data && fbData.data.length > 0) {
        for (const page of fbData.data) {
          if (page.instagram_business_account) {
            igUserId = page.instagram_business_account.id;
            igUsername = page.instagram_business_account.username || 'stic_club_official';
            igAccountName = page.instagram_business_account.name || page.name || 'STIC Club';
            break;
          }
        }
      }
    } catch (e) {
      // Continue to next probe
    }
  }

  // 3. Try Direct User Graph API endpoint: https://graph.facebook.com/v21.0/me
  if (!igUserId) {
    try {
      const meRes = await fetch(`https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${encodeURIComponent(token)}`);
      const meData = await meRes.json();
      if (meData && meData.id) {
        igUserId = meData.id;
        igUsername = 'stic_club_official';
        igAccountName = meData.name || 'STIC Club';
      }
    } catch (e) {
      // Failed all probes
    }
  }

  // If token is invalid or rejected by Meta
  if (!igUserId) {
    throw new Error(
      'Unable to verify Instagram account using the provided access token. ' +
      'Please ensure the token is active, has the required "instagram_basic" or "pages_show_list" permissions, ' +
      'and belongs to an Instagram Professional (Business or Creator) account.'
    );
  }

  // Calculate token expiration date
  const expiryDate = options.expiryDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

  // Save connection credentials securely in database
  setSetting('instagram_connected', '1');
  setSetting('instagram_access_token', token);
  setSetting('instagram_user_id', igUserId);
  setSetting('instagram_username', igUsername);
  setSetting('instagram_account_name', igAccountName);
  setSetting('instagram_token_expires_at', expiryDate);
  setSetting('instagram_last_sync_status', 'connected');
  setSetting('instagram_last_error', '');

  if (options.app_id) setSetting('instagram_client_id', options.app_id.trim());
  if (options.app_secret) setSetting('instagram_client_secret', options.app_secret.trim());

  if (options.reqUser) {
    logActivity(options.reqUser, {
      department: 'Social Media & Links',
      action: 'Updated',
      change: `Connected official STIC Instagram account (@${igUsername})`
    });
  }

  console.log(`[INSTAGRAM CONNECTED] Account: @${igUsername} (ID: ${igUserId})`);

  // Run initial synchronization immediately
  let syncResult = null;
  try {
    syncResult = await syncInstagramMedia('initial', options.reqUser);
  } catch (syncErr) {
    console.error('[INSTAGRAM INITIAL SYNC ERROR]', syncErr.message);
  }

  return {
    success: true,
    connected: true,
    username: igUsername.startsWith('@') ? igUsername : `@${igUsername}`,
    account_name: igAccountName,
    user_id: igUserId,
    syncResult
  };
}

/**
 * Disconnect Instagram account
 */
function disconnectInstagram(reqUser = null) {
  const currentUsername = getSetting('instagram_username', 'STIC Instagram');
  setSetting('instagram_connected', '0');
  setSetting('instagram_access_token', '');
  setSetting('instagram_last_sync_status', 'disconnected');
  setSetting('instagram_last_error', '');

  if (reqUser) {
    logActivity(reqUser, {
      department: 'Social Media & Links',
      action: 'Updated',
      change: `Disconnected STIC Instagram account (${currentUsername}). Existing archive preserved.`
    });
  }

  return { success: true, message: 'Instagram account disconnected. Existing archive preserved.' };
}

/**
 * Synchronize Instagram Media via Official Meta / Instagram API
 * - Fetches media
 * - Deduplicates by instagram_media_id
 * - Updates existing or inserts new
 * - Determines New Post dynamically based on newest published_at
 * - Records real IST timestamps
 */
async function syncInstagramMedia(triggerType = 'automatic', reqUser = null) {
  const connected = getSetting('instagram_connected', '0') === '1';
  if (!connected) {
    throw new Error('STIC Instagram is not connected. Connect the account to enable synchronization.');
  }

  const token = getSetting('instagram_access_token', '');
  if (!token) {
    throw new Error('Access token missing. Please reconnect STIC Instagram.');
  }

  const userId = getSetting('instagram_user_id', '');

  setSetting('instagram_last_sync_status', 'syncing');

  let mediaItems = [];
  let apiEndpoint = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username&limit=100&access_token=${encodeURIComponent(token)}`;

  try {
    let res = await fetch(apiEndpoint);
    let json = await res.json();

    // If Instagram Graph endpoint failed, try Facebook Business Graph API
    if (json.error && userId) {
      const fbEndpoint = `https://graph.facebook.com/v21.0/${encodeURIComponent(userId)}/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username&limit=100&access_token=${encodeURIComponent(token)}`;
      res = await fetch(fbEndpoint);
      json = await res.json();
    }

    if (json.error) {
      // Check for OAuth / Token Expiry error (Code 190)
      if (json.error.code === 190 || json.error.type === 'OAuthException') {
        setSetting('instagram_last_sync_status', 'expired');
        setSetting('instagram_last_error', 'Instagram authorization expired or was revoked. Please reconnect.');
        throw new Error('Instagram authorization expired or was revoked. Please reconnect.');
      }
      setSetting('instagram_last_sync_status', 'failed');
      setSetting('instagram_last_error', json.error.message || 'Instagram API synchronization failed.');
      throw new Error(json.error.message || 'Failed to fetch media from Instagram API.');
    }

    mediaItems = json.data || [];
  } catch (err) {
    setSetting('instagram_last_sync_status', 'failed');
    setSetting('instagram_last_error', err.message);
    throw err;
  }

  let insertedCount = 0;
  let updatedCount = 0;

  const checkStmt = db.prepare('SELECT id, caption, poster_url, published_at FROM social_media_posts WHERE instagram_media_id = ?');
  const updateStmt = db.prepare(`
    UPDATE social_media_posts
    SET caption = ?,
        poster_url = ?,
        thumbnail_url = ?,
        post_url = ?,
        permalink = ?,
        post_type = ?,
        media_type = ?,
        publication_date = ?,
        published_at = ?,
        published_at_ist = ?,
        sync_status = 'synced',
        updated_at = CURRENT_TIMESTAMP
    WHERE instagram_media_id = ?
  `);

  const insertStmt = db.prepare(`
    INSERT INTO social_media_posts (
      platform, post_type, post_url, caption, poster_url,
      publication_date, posted_by, is_demo, instagram_media_id,
      media_type, thumbnail_url, permalink, published_at, published_at_ist, sync_status
    ) VALUES (
      'Instagram', ?, ?, ?, ?,
      ?, ?, 0, ?,
      ?, ?, ?, ?, ?, 'synced'
    )
  `);

  const syncTx = db.transaction((items) => {
    for (const item of items) {
      if (!item.id) continue;

      const igMediaId = String(item.id).trim();
      const caption = item.caption ? item.caption.trim() : null;
      const mediaType = item.media_type || 'IMAGE';
      const permalink = item.permalink || `https://www.instagram.com/p/${igMediaId}/`;
      const posterUrl = item.media_url || item.thumbnail_url || null;
      const thumbUrl = item.thumbnail_url || item.media_url || null;

      // Determine Post Type: Reel vs Post vs Carousel
      let postType = 'Post';
      if (mediaType === 'VIDEO') {
        if (permalink.includes('/reel/') || permalink.includes('/reels/')) {
          postType = 'Reel';
        } else {
          postType = 'Reel'; // Standard Instagram video is now classified as Reel
        }
      } else if (mediaType === 'CAROUSEL_ALBUM') {
        postType = 'Post';
      }

      // Parse Instagram API published timestamp
      let pubDate = new Date();
      let isoPublished = new Date().toISOString();
      let istFormatted = '';

      if (item.timestamp) {
        try {
          const parsedD = new Date(item.timestamp);
          if (!isNaN(parsedD.getTime())) {
            pubDate = parsedD;
            isoPublished = parsedD.toISOString();
            istFormatted = getISTTimestamp(parsedD).fullStr;
          }
        } catch (e) {}
      }

      if (!istFormatted) {
        istFormatted = getISTTimestamp(pubDate).fullStr;
      }

      const yyyy = pubDate.getFullYear();
      const mm = String(pubDate.getMonth() + 1).padStart(2, '0');
      const dd = String(pubDate.getDate()).padStart(2, '0');
      const dateOnlyStr = `${yyyy}-${mm}-${dd}`;

      const existing = checkStmt.get(igMediaId);
      if (existing) {
        updateStmt.run(
          caption,
          posterUrl,
          thumbUrl,
          permalink,
          permalink,
          postType,
          mediaType,
          dateOnlyStr,
          isoPublished,
          istFormatted,
          igMediaId
        );
        updatedCount++;
      } else {
        insertStmt.run(
          postType,
          permalink,
          caption,
          posterUrl,
          dateOnlyStr,
          'Instagram Sync',
          igMediaId,
          mediaType,
          thumbUrl,
          permalink,
          isoPublished,
          istFormatted
        );
        insertedCount++;
      }
    }
  });

  syncTx(mediaItems);

  // Update last sync time in Real IST
  const { fullStr: currentIST } = getISTTimestamp(new Date());
  setSetting('instagram_last_sync_time', currentIST);
  setSetting('instagram_last_sync_status', 'success');
  setSetting('instagram_last_error', '');

  // Retrieve current latest post
  const latestPost = getLatestPost();

  if (insertedCount > 0 || triggerType === 'manual') {
    const actor = reqUser || { username: 'System Cron', role: 'System' };
    logActivity(actor, {
      department: 'Social Media & Links',
      action: insertedCount > 0 ? 'Created' : 'Updated',
      change: `Synchronized Instagram: ${insertedCount} new media imported, ${updatedCount} updated. Latest post: "${latestPost?.caption ? latestPost.caption.substring(0, 50) + '...' : 'Instagram Broadcast'}"`
    });
  }

  console.log(`[INSTAGRAM SYNC] Completed: ${insertedCount} new, ${updatedCount} updated at ${currentIST}`);

  return {
    success: true,
    total_fetched: mediaItems.length,
    new_imported: insertedCount,
    updated: updatedCount,
    last_sync_time: currentIST,
    latest_post: latestPost
  };
}

/**
 * Get the single latest Instagram post dynamically
 * Always determined by newest published_at timestamp
 */
function getLatestPost() {
  try {
    // 1. First priority: Synced Instagram posts with actual published_at timestamp
    const latestIg = db.prepare(`
      SELECT * FROM social_media_posts
      WHERE instagram_media_id IS NOT NULL AND LOWER(platform) = 'instagram'
      ORDER BY published_at DESC, id DESC
      LIMIT 1
    `).get();

    if (latestIg) {
      return latestIg;
    }

    // 2. Fallback: Any Instagram post in the archive
    const anyIg = db.prepare(`
      SELECT * FROM social_media_posts
      WHERE LOWER(platform) = 'instagram'
      ORDER BY COALESCE(published_at, publication_date || 'T00:00:00Z') DESC, id DESC
      LIMIT 1
    `).get();

    return anyIg || null;
  } catch (err) {
    console.error('[GET LATEST POST ERROR]', err);
    return null;
  }
}

/**
 * Get the single latest WhatsApp broadcast message dynamically
 */
function getLatestWhatsAppMessage() {
  try {
    const latestWhatsApp = db.prepare(`
      SELECT * FROM social_media_posts
      WHERE LOWER(platform) = 'whatsapp'
      ORDER BY COALESCE(published_at, publication_date || 'T00:00:00Z') DESC, id DESC
      LIMIT 1
    `).get();
    return latestWhatsApp || null;
  } catch (err) {
    console.error('[GET LATEST WHATSAPP ERROR]', err);
    return null;
  }
}

/**
 * Get top WhatsApp messages: New Message (index 0) and Last Message (index 1)
 */
function getTopWhatsAppMessages(limit = 2) {
  try {
    const messages = db.prepare(`
      SELECT * FROM social_media_posts
      WHERE LOWER(platform) = 'whatsapp'
      ORDER BY COALESCE(published_at, publication_date || 'T00:00:00Z') DESC, id DESC
      LIMIT ?
    `).all(limit);
    return {
      new_message: messages[0] || null,
      last_message: messages[1] || null,
      all: messages
    };
  } catch (err) {
    console.error('[GET TOP WHATSAPP ERROR]', err);
    return { new_message: null, last_message: null, all: [] };
  }
}

/**
 * Background Scheduled Sync (Runs in Node.js backend independently of browser)
 */
let scheduledSyncInterval = null;

function startScheduledSync(intervalMinutes = 15) {
  if (scheduledSyncInterval) {
    clearInterval(scheduledSyncInterval);
  }

  const intervalMs = Math.max(intervalMinutes, 5) * 60 * 1000;
  console.log(`[INSTAGRAM SYNC] Background scheduler active (every ${intervalMinutes} mins).`);

  scheduledSyncInterval = setInterval(async () => {
    try {
      const connected = getSetting('instagram_connected', '0') === '1';
      if (connected) {
        console.log('[INSTAGRAM SYNC] Running scheduled background synchronization...');
        await syncInstagramMedia('scheduled');
      }
    } catch (err) {
      console.warn('[INSTAGRAM SCHEDULED SYNC WARNING]', err.message);
    }
  }, intervalMs);
}

module.exports = {
  getISTTimestamp,
  getInstagramStatus,
  getOAuthUrl,
  exchangeCodeForToken,
  connectWithToken,
  disconnectInstagram,
  syncInstagramMedia,
  getLatestPost,
  getLatestWhatsAppMessage,
  getTopWhatsAppMessages,
  startScheduledSync
};
