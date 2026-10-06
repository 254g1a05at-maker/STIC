const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'stic_sustainable_tech_club_super_secret_jwt_key_2026';

// EXACT 8 OFFICIAL ROLES AS SPECIFIED
// 7 Club Representative Positions + 1 Dedicated STIC Website Handler (Technical Account)
const OFFICIAL_ROLES = [
  {
    role: 'HOD',
    username: 'HOD',
    full_name: 'Head of Department (HOD)',
    email: 'hod@srit.ac.in',
    defaultPassword: 'stic@1234',
    isRepresentative: true,
    description: 'Academic & Executive Head of CSE Department'
  },
  {
    role: 'Coordinator 1',
    username: 'Coordinator 1',
    full_name: 'Faculty Coordinator 1',
    email: 'coordinator1@stic-club.org',
    defaultPassword: 'stic@1234',
    isRepresentative: true,
    description: 'Faculty Coordinator – Technical & Innovation Affairs'
  },
  {
    role: 'Coordinator 2',
    username: 'Coordinator 2',
    full_name: 'Faculty Coordinator 2',
    email: 'coordinator2@stic-club.org',
    defaultPassword: 'stic@1234',
    isRepresentative: true,
    description: 'Faculty Coordinator – Student Operations & Outreach'
  },
  {
    role: 'President',
    username: 'President',
    full_name: 'STIC Club President',
    email: 'president@stic-club.org',
    defaultPassword: 'stic@1234',
    isRepresentative: true,
    description: 'Chief Student Executive & Club Representative'
  },
  {
    role: 'Vice President',
    username: 'Vice President',
    full_name: 'STIC Vice President',
    email: 'vp@stic-club.org',
    defaultPassword: 'stic@1234',
    isRepresentative: true,
    description: 'Executive Council – Operations & Strategy'
  },
  {
    role: 'Co-Vice President',
    username: 'Co-Vice President',
    full_name: 'STIC Co-Vice President',
    email: 'covp@stic-club.org',
    defaultPassword: 'stic@1234',
    isRepresentative: true,
    description: 'Executive Council – Media, Content & Editorial Head'
  },
  {
    role: 'Secretary',
    username: 'Secretary',
    full_name: 'STIC General Secretary',
    email: 'secretary@stic-club.org',
    defaultPassword: 'stic@1234',
    isRepresentative: true,
    description: 'Executive Council – Documentation, Records & Logistics'
  },
  {
    role: 'STIC Website Handler',
    username: 'STIC Website Handler',
    full_name: 'STIC Website Handler',
    email: 'webhandler@stic-club.org',
    defaultPassword: 'stic@1234',
    isRepresentative: false, // Dedicated technical account
    description: 'Dedicated Technical & Website Content Management Account'
  },
  {
    role: 'Content and Documentation Lead',
    username: 'Content and Documentation Lead',
    full_name: 'Content & Documentation Lead',
    email: 'content.lead@stic-club.org',
    defaultPassword: 'stic@1234',
    isRepresentative: false,
    isLead: true,
    description: 'Working Committee Lead – Reports, Documentation, Templates & Archives'
  },
  {
    role: 'Social Media Lead',
    username: 'Social Media Lead',
    full_name: 'Social Media & Outreach Lead',
    email: 'social.lead@stic-club.org',
    defaultPassword: 'stic@1234',
    isRepresentative: false,
    isLead: true,
    description: 'Working Committee Lead – Digital Branding, Publicity, Photos & Video Archives'
  },
  {
    role: 'Technical Lead',
    username: 'Technical Lead',
    full_name: 'Technical & Infrastructure Lead',
    email: 'tech.lead@stic-club.org',
    defaultPassword: 'stic@1234',
    isRepresentative: false,
    isLead: true,
    description: 'Working Committee Lead – Tech Infrastructure, Systems & Digital Solutions'
  },
  {
    role: 'Finance Lead',
    username: 'Finance Lead',
    full_name: 'Finance & Accounts Lead',
    email: 'finance.lead@stic-club.org',
    defaultPassword: 'stic@1234',
    isRepresentative: false,
    isLead: true,
    description: 'Working Committee Lead – Exclusive Management of Accounts, Incomes & Expenditures'
  }
];

// Default configurable permissions for STIC Website Handler
const DEFAULT_HANDLER_PERMISSIONS = {
  // Website management functions (Allowed by default)
  edit_website_content: true,
  manage_announcements: true,
  manage_photos: true,
  manage_videos: true,
  manage_documents: true,
  manage_social_media: true,
  manage_programs_content: true,
  manage_website_settings: true,

  // Unrelated club management functions (Restricted by default, configurable by Leadership)
  manage_finance: false,
  manage_members: false,
  manage_sponsors: false,
  manage_departments: false,
  manage_system_security: false
};

// Detailed schema definitions for permissions UI and verification
const PERMISSION_DEFINITIONS = [
  {
    key: 'edit_website_content',
    label: 'Manage Website Content',
    category: 'Website Management',
    description: 'Edit homepage hero banner, about text, mission statements, and website headlines.',
    default: true
  },
  {
    key: 'manage_announcements',
    label: 'Manage Website Announcements',
    category: 'Website Management',
    description: 'Create, update, publish, and toggle announcements and notices displayed on the website.',
    default: true
  },
  {
    key: 'manage_photos',
    label: 'Manage Photo Galleries',
    category: 'Website Management',
    description: 'Upload, categorize, caption, and showcase event photo albums on the website.',
    default: true
  },
  {
    key: 'manage_videos',
    label: 'Manage Video Archive',
    category: 'Website Management',
    description: 'Add YouTube embeds, event teasers, and video highlights displayed on the website.',
    default: true
  },
  {
    key: 'manage_documents',
    label: 'Manage Documents & Templates',
    category: 'Website Management',
    description: 'Manage downloadable document templates, official circulars, and notices.',
    default: true
  },
  {
    key: 'manage_social_media',
    label: 'Manage Social Media Feeds',
    category: 'Website Management',
    description: 'Update official social links, Instagram/LinkedIn posts, and public outreach channels.',
    default: true
  },
  {
    key: 'manage_programs_content',
    label: 'Manage Events Website Content',
    category: 'Website Management',
    description: 'Update event descriptions, posters, and agenda listings shown on the website.',
    default: true
  },
  {
    key: 'manage_website_settings',
    label: 'Manage Website Settings',
    category: 'Website Management',
    description: 'Configure website branding, official contact email/phone, and public visibility options.',
    default: true
  },
  {
    key: 'manage_finance',
    label: 'Access Finance & Budget',
    category: 'Unrelated Club Management (Restricted)',
    description: 'View or modify club accounts, budget allocations, receipts, and expenditures.',
    default: false
  },
  {
    key: 'manage_members',
    label: 'Manage Club Membership Roster',
    category: 'Unrelated Club Management (Restricted)',
    description: 'Enroll, edit, or delete official club members and council leadership positions.',
    default: false
  },
  {
    key: 'manage_sponsors',
    label: 'Manage Sponsorship Contracts',
    category: 'Unrelated Club Management (Restricted)',
    description: 'Manage corporate funding amounts, sponsor contracts, and financial tie-ups.',
    default: false
  },
  {
    key: 'manage_system_security',
    label: 'Manage System Security & Audit',
    category: 'Unrelated Club Management (Restricted)',
    description: 'Modify credentials of other accounts, reset database records, or view audit trails.',
    default: false
  }
];

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      avatar_url: user.avatar_url || null
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function hashPassword(plainPassword) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(plainPassword, salt);
}

function comparePassword(plainPassword, hash) {
  return bcrypt.compareSync(plainPassword, hash);
}

// Fetch active permissions for a given role from the database
function getRolePermissions(role, db) {
  // 1. Roles restricted from Finance section:
  // Content and Documentation Lead, Social Media Lead, Technical Lead
  const isFinanceRestrictedLead =
    role === 'Content and Documentation Lead' ||
    role === 'Social Media Lead' ||
    role === 'Technical Lead';

  if (isFinanceRestrictedLead) {
    const perms = {};
    PERMISSION_DEFINITIONS.forEach(p => {
      // manage_finance is strictly forbidden
      if (p.key === 'manage_finance') {
        perms[p.key] = false;
      } else {
        perms[p.key] = true;
      }
    });
    return {
      ...perms,
      can_access_finance: false,
      is_representative: false,
      is_lead: true,
      is_website_handler: false
    };
  }

  // 2. Finance Lead: Open finance access
  if (role === 'Finance Lead') {
    const perms = {};
    PERMISSION_DEFINITIONS.forEach(p => {
      perms[p.key] = true;
    });
    return {
      ...perms,
      can_access_finance: true,
      is_representative: false,
      is_finance_lead: true,
      is_lead: true,
      is_website_handler: false
    };
  }

  // 3. Leadership / Club Representatives or superadmin: Full access
  if (role !== 'STIC Website Handler') {
    const fullPermissions = {};
    PERMISSION_DEFINITIONS.forEach(p => {
      fullPermissions[p.key] = true;
    });
    return {
      ...fullPermissions,
      can_access_finance: true,
      is_representative: true,
      is_website_handler: false
    };
  }

  // STIC Website Handler permissions from database
  if (db) {
    try {
      const row = db.prepare('SELECT permissions_json FROM role_permissions WHERE role = ?').get('STIC Website Handler');
      if (row && row.permissions_json) {
        const customPermissions = JSON.parse(row.permissions_json);
        return {
          ...DEFAULT_HANDLER_PERMISSIONS,
          ...customPermissions,
          is_representative: false,
          is_website_handler: true
        };
      }
    } catch (err) {
      console.error('Error fetching role permissions from DB:', err);
    }
  }

  return {
    ...DEFAULT_HANDLER_PERMISSIONS,
    is_representative: false,
    is_website_handler: true
  };
}

// Authentication Middleware
function requireAuth(req, res, next) {
  let token = null;

  // Check Authorization Header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Session expired or invalid token. Please log in again.' });
  }

  req.user = decoded;
  next();
}

// Permission checking middleware for STIC Website Handler
function checkPermission(permissionKey) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    // Representatives & superadmin bypass permission checks
    if (req.user.role !== 'STIC Website Handler') {
      return next();
    }

    const { db } = require('./db');
    const permissions = getRolePermissions(req.user.role, db);

    if (permissions[permissionKey]) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. The STIC Website Handler account does not currently have permission for "${permissionKey}". This can be configured by Club Leadership in Settings.`
    });
  };
}

module.exports = {
  OFFICIAL_ROLES,
  DEFAULT_HANDLER_PERMISSIONS,
  PERMISSION_DEFINITIONS,
  getRolePermissions,
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  requireAuth,
  checkPermission
};
