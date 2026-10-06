const express = require('express');
const router = express.Router();
const { db } = require('../db');
const {
  OFFICIAL_ROLES,
  generateToken,
  hashPassword,
  comparePassword,
  requireAuth,
  getRolePermissions
} = require('../auth');
const { upload } = require('../upload');
const { logActivity, logAudit } = require('../activity');

// GET /api/auth/roles (Return the exact 8 official roles and their metadata)
router.get('/roles', (req, res) => {
  const roles = OFFICIAL_ROLES.map(r => ({
    role: r.role,
    title: r.full_name,
    email: r.email,
    description: r.description,
    is_representative: r.isRepresentative,
    defaultPassword: r.defaultPassword
  }));
  return res.json({ success: true, roles });
});

// POST /api/auth/login
// MEMBER LOGIN — 8 AVAILABLE ROLES
// The member selects their role from dropdown and enters their personal password.
// The selected role and password are checked together.
// Selecting one role with another role's password will fail.
router.post('/login', (req, res) => {
  const { role, username, password } = req.body;
  const targetRole = (role || username || '').trim();

  if (!targetRole) {
    return res.status(400).json({
      success: false,
      message: 'Please select your role from the 8 available roles.'
    });
  }

  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Please enter your personal password.'
    });
  }

  // Look up user specifically by role or username
  const user = db.prepare('SELECT * FROM users WHERE role = ? OR username = ?').get(targetRole, targetRole);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: `Account for role "${targetRole}" is not recognized or not initialized.`
    });
  }

  // Check the selected role and password TOGETHER
  const isValid = comparePassword(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({
      success: false,
      message: `Invalid password for role "${user.role}". Each role has its own independent password.`
    });
  }

  const permissions = getRolePermissions(user.role, db);
  const token = generateToken(user);
  logAudit(user.id, 'LOGIN', 'user', user.id, `Role [${user.role}] logged in successfully.`);

  const isWebsiteHandler = user.role === 'STIC Website Handler';

  return res.json({
    success: true,
    message: 'Login successful.',
    token,
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url || (user.role === 'HOD' ? '/hod_salute.png' : null),
      is_website_handler: isWebsiteHandler,
      is_representative: !isWebsiteHandler,
      permissions
    }
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, username, full_name, email, role, avatar_url, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  const permissions = getRolePermissions(user.role, db);
  const isWebsiteHandler = user.role === 'STIC Website Handler';

  return res.json({
    success: true,
    user: {
      ...user,
      avatar_url: user.avatar_url || (user.role === 'HOD' ? '/hod_salute.png' : null),
      is_website_handler: isWebsiteHandler,
      is_representative: !isWebsiteHandler,
      permissions
    }
  });
});

// POST /api/auth/change-credentials
router.post('/change-credentials', requireAuth, (req, res) => {
  const { currentPassword, newUsername, newPassword, newEmail, newFullName } = req.body;

  if (!currentPassword) {
    return res.status(400).json({ success: false, message: 'Current password is required to make security changes.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  if (!comparePassword(currentPassword, user.password_hash)) {
    return res.status(400).json({ success: false, message: 'Current password does not match.' });
  }

  let updatedUsername = user.username;
  let updatedPasswordHash = user.password_hash;
  let updatedFullName = newFullName && newFullName.trim() ? newFullName.trim() : user.full_name;
  let updatedEmail = newEmail && newEmail.trim() ? newEmail.trim() : user.email;

  if (newUsername && newUsername.trim() !== user.username) {
    const existing = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(newUsername.trim(), user.id);
    if (existing) {
      return res.status(400).json({ success: false, message: 'That username is already taken by another account.' });
    }
    updatedUsername = newUsername.trim();
  }

  if (newPassword && newPassword.trim()) {
    if (newPassword.trim().length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }
    updatedPasswordHash = hashPassword(newPassword.trim());
  }

  let updatedAvatarUrl = req.body.avatar_url !== undefined ? req.body.avatar_url : user.avatar_url;

  db.prepare(`
    UPDATE users 
    SET username = ?, full_name = ?, email = ?, password_hash = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(updatedUsername, updatedFullName, updatedEmail, updatedPasswordHash, updatedAvatarUrl, user.id);

  logActivity(req, {
    department: 'Authentication & Security',
    action: 'Updated',
    change: `Updated credentials for role "${user.role}" (${updatedUsername})`,
    previous_value: { username: user.username, full_name: user.full_name, email: user.email },
    new_value: { username: updatedUsername, full_name: updatedFullName, email: updatedEmail }
  });

  const permissions = getRolePermissions(user.role, db);
  const isWebsiteHandler = user.role === 'STIC Website Handler';

  const updatedUser = {
    id: user.id,
    username: updatedUsername,
    full_name: updatedFullName,
    email: updatedEmail,
    role: user.role,
    avatar_url: updatedAvatarUrl || (user.role === 'HOD' ? '/hod_salute.png' : null),
    is_website_handler: isWebsiteHandler,
    is_representative: !isWebsiteHandler,
    permissions
  };
  const newToken = generateToken(updatedUser);

  return res.json({
    success: true,
    message: 'Personal credentials updated successfully for your role.',
    token: newToken,
    user: updatedUser
  });
});

// POST /api/auth/profile-photo
// Allows ANY logged-in user / role to upload and set their personal Display Picture (DP)
router.post('/profile-photo', requireAuth, upload.single('avatar'), (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    let newAvatarUrl = user.avatar_url;

    if (req.file) {
      newAvatarUrl = `/uploads/avatars/${req.file.filename}`;
    } else if (req.body.avatar_url !== undefined) {
      newAvatarUrl = req.body.avatar_url.trim() || null;
    } else if (req.body.remove === 'true' || req.body.remove === true) {
      newAvatarUrl = null;
    }

    db.prepare('UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newAvatarUrl, user.id);

    // If there is a matching leadership position in club_members, also synchronize their member DP
    if (user.role) {
      try {
        db.prepare('UPDATE club_members SET profile_photo = ?, updated_at = CURRENT_TIMESTAMP WHERE position = ?')
          .run(newAvatarUrl, user.role);
      } catch (err) {}
    }

    logActivity(req, {
      department: 'Authentication & Profile',
      action: 'Updated',
      change: `Updated profile display picture (DP) for role "${user.role}"`,
      previous_value: { avatar_url: user.avatar_url },
      new_value: { avatar_url: newAvatarUrl }
    });

    logAudit(user.id, 'UPDATE_DP', 'user', user.id, `Updated display picture (DP) for role ${user.role}`);

    const permissions = getRolePermissions(user.role, db);
    const isWebsiteHandler = user.role === 'STIC Website Handler';

    const updatedUser = {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      avatar_url: newAvatarUrl || (user.role === 'HOD' ? '/hod_salute.png' : null),
      is_website_handler: isWebsiteHandler,
      is_representative: !isWebsiteHandler,
      permissions
    };

    const newToken = generateToken(updatedUser);

    return res.json({
      success: true,
      message: 'Display picture (DP) updated successfully!',
      avatar_url: newAvatarUrl,
      token: newToken,
      user: updatedUser
    });
  } catch (err) {
    console.error('Error updating profile photo:', err);
    return res.status(500).json({ success: false, message: 'Failed to update display picture: ' + err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', requireAuth, (req, res) => {
  return res.json({ success: true, message: 'Logged out successfully.' });
});

module.exports = router;
