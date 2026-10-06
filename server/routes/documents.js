const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { db } = require('../db');
const { requireAuth } = require('../auth');
const { logActivity } = require('../activity');
const { upload, uploadsBase } = require('../upload');

const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const { PDFDocument } = require('pdf-lib');

// Helper: Scan placeholders in DOCX / PPTX / PDF files
function scanPlaceholdersFromFile(filePath, ext) {
  const placeholders = new Set();
  try {
    const fileBuffer = fs.readFileSync(filePath);
    if (ext === 'docx' || ext === 'pptx') {
      const zip = new PizZip(fileBuffer);
      Object.keys(zip.files).forEach(fileName => {
        if (fileName.endsWith('.xml') || fileName.endsWith('.rels')) {
          const content = zip.files[fileName].asText();
          const cleanText = content.replace(/<[^>]+>/g, '');
          const matches = [...cleanText.matchAll(/\{\{\s*([A-Za-z0-9_\-\.]+)\s*\}\}/g)];
          matches.forEach(m => {
            if (m[1]) placeholders.add(m[1].trim());
          });
        }
      });
    } else if (ext === 'pdf') {
      const rawText = fileBuffer.toString('binary');
      const matches = [...rawText.matchAll(/\{\{\s*([A-Za-z0-9_\-\.]+)\s*\}\}/g)];
      matches.forEach(m => {
        if (m[1]) placeholders.add(m[1].trim());
      });
    }
  } catch (err) {
    console.error('[PLACEHOLDER SCAN ERROR]', err);
  }

  const list = Array.from(placeholders);
  if (list.length === 0) {
    return ['EVENT_NAME', 'DATE', 'VENUE', 'ORGANIZER', 'DESCRIPTION'];
  }
  return list;
}

// Helper: Resolve full disk path for uploaded custom template (checking templates, documents, or uploads base)
function resolveTemplateDiskPath(template) {
  if (!template || !template.file_path) return null;
  const rel = template.file_path.replace('/uploads/', '');
  const primaryPath = path.join(uploadsBase, rel);
  if (fs.existsSync(primaryPath)) return primaryPath;

  const filename = path.basename(rel);
  const altTemplates = path.join(uploadsBase, 'templates', filename);
  if (fs.existsSync(altTemplates)) return altTemplates;

  const altDocs = path.join(uploadsBase, 'documents', filename);
  if (fs.existsSync(altDocs)) return altDocs;

  const altRoot = path.join(uploadsBase, filename);
  if (fs.existsSync(altRoot)) return altRoot;

  return null;
}

// Helper: Generate document by replacing placeholders while preserving design, layout, fonts & tables
function generateDocumentFromTemplate(filePath, ext, inputs = {}, freeformMatter = '') {
  const fileBuffer = fs.readFileSync(filePath);
  const matterText = freeformMatter || inputs.matter || inputs.MATTER || inputs.DESCRIPTION || '';

  if (ext === 'docx') {
    try {
      const zip = new PizZip(fileBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true
      });

      const templateData = { ...inputs };
      if (matterText) {
        templateData.MATTER = matterText;
        templateData.CONTENT = matterText;
        templateData.BODY = matterText;
        templateData.DESCRIPTION = matterText;
        templateData.TEXT = matterText;
      }

      doc.render(templateData);
      return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
    } catch (err) {
      console.warn('[DOCXTEMPLATER FALLBACK TO PIZZIP XML REPLACEMENT]', err.message);
      const zip = new PizZip(fileBuffer);
      const xmlMatter = matterText
        ? matterText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\r?\n/g, '<w:br/>')
        : '';

      Object.keys(zip.files).forEach(fileName => {
        if (fileName.startsWith('word/') && fileName.endsWith('.xml')) {
          let content = zip.files[fileName].asText();
          Object.keys(inputs).forEach(key => {
            const val = String(inputs[key] || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\r?\n/g, '<w:br/>');
            const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
            content = content.replace(regex, val);
          });

          if (xmlMatter) {
            content = content.replace(/\{\{\s*MATTER\s*\}\}/gi, xmlMatter);
            content = content.replace(/\{\{\s*CONTENT\s*\}\}/gi, xmlMatter);
            content = content.replace(/\{\{\s*BODY\s*\}\}/gi, xmlMatter);
            content = content.replace(/\{\{\s*DESCRIPTION\s*\}\}/gi, xmlMatter);
            content = content.replace(/\{\{\s*TEXT\s*\}\}/gi, xmlMatter);
          }
          zip.file(fileName, content);
        }
      });
      return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
    }
  } else if (ext === 'pptx') {
    const zip = new PizZip(fileBuffer);
    const xmlMatter = matterText
      ? matterText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\r?\n/g, '<a:br/>')
      : '';
    Object.keys(zip.files).forEach(fileName => {
      if (fileName.startsWith('ppt/') && (fileName.endsWith('.xml') || fileName.endsWith('.rels'))) {
        let content = zip.files[fileName].asText();
        Object.keys(inputs).forEach(key => {
          const val = String(inputs[key] || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
          content = content.replace(regex, val);
        });
        if (xmlMatter) {
          content = content.replace(/\{\{\s*MATTER\s*\}\}/gi, xmlMatter);
          content = content.replace(/\{\{\s*CONTENT\s*\}\}/gi, xmlMatter);
          content = content.replace(/\{\{\s*BODY\s*\}\}/gi, xmlMatter);
          content = content.replace(/\{\{\s*DESCRIPTION\s*\}\}/gi, xmlMatter);
        }
        zip.file(fileName, content);
      }
    });
    return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  } else if (ext === 'pdf') {
    return fileBuffer;
  }
  return fileBuffer;
}

// ==========================================
// CUSTOM UPLOADED TEMPLATES ENDPOINTS
// ==========================================

// GET /api/documents/custom-templates
router.get('/custom-templates', requireAuth, (req, res) => {
  try {
    const list = db.prepare('SELECT * FROM custom_templates ORDER BY id DESC').all();
    const formatted = list.map(t => ({
      ...t,
      detected_placeholders: JSON.parse(t.detected_placeholders || '[]')
    }));
    return res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    console.error('[CUSTOM TEMPLATES GET ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve custom templates.' });
  }
});

// GET /api/documents/custom-templates/:id
router.get('/custom-templates/:id', requireAuth, (req, res) => {
  try {
    const template = db.prepare('SELECT * FROM custom_templates WHERE id = ?').get(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Custom template not found.' });
    }
    template.detected_placeholders = JSON.parse(template.detected_placeholders || '[]');
    return res.json({ success: true, data: template });
  } catch (err) {
    console.error('[CUSTOM TEMPLATE SINGLE GET ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve custom template.' });
  }
});

// POST /api/documents/custom-templates/upload
router.post('/custom-templates/upload', requireAuth, upload.single('file'), (req, res) => {
  try {
    const { name, description, category } = req.body;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a template file (.docx, .pptx, .pdf).' });
    }

    const ext = path.extname(req.file.originalname).replace('.', '').toLowerCase();
    const allowed = ['docx', 'pptx', 'pdf'];
    if (!allowed.includes(ext)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
      return res.status(400).json({ success: false, message: `Unsupported template format (.${ext}). Only DOCX, PPTX, and PDF templates are supported.` });
    }

    const templateName = name && name.trim() ? name.trim() : path.basename(req.file.originalname, `.${ext}`).replace(/_/g, ' ');
    const fullDiskPath = req.file.path;
    const relativePath = fullDiskPath.replace(uploadsBase, '').replace(/\\/g, '/');
    const filePath = `/uploads${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
    const fileSize = req.file.size;

    const detectedPlaceholders = scanPlaceholdersFromFile(fullDiskPath, ext);

    const insert = db.prepare(`
      INSERT INTO custom_templates (
        name, file_type, original_filename, file_path, file_size,
        detected_placeholders, category, description, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      templateName,
      ext,
      req.file.originalname,
      filePath,
      fileSize,
      JSON.stringify(detectedPlaceholders),
      category || 'Custom Template',
      description ? description.trim() : '',
      req.user.username || 'admin'
    );

    const created = db.prepare('SELECT * FROM custom_templates WHERE id = ?').get(result.lastInsertRowid);
    created.detected_placeholders = JSON.parse(created.detected_placeholders || '[]');

    logActivity(req, {
      department: 'Content & Documentation',
      action: 'Created',
      change: `Uploaded template "${templateName}" (${ext.toUpperCase()})`,
      new_value: created
    });

    return res.status(201).json({
      success: true,
      message: `Template "${templateName}" uploaded successfully. ${created.detected_placeholders.length} placeholders detected.`,
      data: created
    });
  } catch (err) {
    console.error('[CUSTOM TEMPLATE UPLOAD ERROR]', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to upload template file.' });
  }
});

// DELETE /api/documents/custom-templates/:id
router.delete('/custom-templates/:id', requireAuth, (req, res) => {
  try {
    const templateId = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM custom_templates WHERE id = ?').get(templateId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Custom template not found.' });
    }

    if (existing.file_path && existing.file_path.startsWith('/uploads/')) {
      const localFilePath = path.join(uploadsBase, existing.file_path.replace('/uploads/', ''));
      if (fs.existsSync(localFilePath)) {
        try { fs.unlinkSync(localFilePath); } catch (e) {}
      }
    }

    db.prepare('DELETE FROM custom_templates WHERE id = ?').run(templateId);

    logActivity(req, {
      department: 'Content & Documentation',
      action: 'Deleted',
      change: `Deleted custom template "${existing.name}"`,
      previous_value: existing
    });

    return res.json({ success: true, message: 'Custom template deleted successfully.' });
  } catch (err) {
    console.error('[CUSTOM TEMPLATE DELETE ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to delete custom template.' });
  }
});

// POST /api/documents/custom-templates/:id/detect-placeholders
router.post('/custom-templates/:id/detect-placeholders', requireAuth, (req, res) => {
  try {
    const templateId = Number(req.params.id);
    const template = db.prepare('SELECT * FROM custom_templates WHERE id = ?').get(templateId);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }

    const fullDiskPath = resolveTemplateDiskPath(template);
    if (!fullDiskPath) {
      return res.status(404).json({ success: false, message: 'Template file not found on disk.' });
    }

    const detected = scanPlaceholdersFromFile(fullDiskPath, template.file_type);
    db.prepare('UPDATE custom_templates SET detected_placeholders = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(JSON.stringify(detected), templateId);

    return res.json({
      success: true,
      message: `Detected ${detected.length} placeholders in template.`,
      detected_placeholders: detected
    });
  } catch (err) {
    console.error('[DETECT PLACEHOLDERS ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to detect placeholders.' });
  }
});

// POST /api/documents/custom-templates/:id/generate
router.post('/custom-templates/:id/generate', requireAuth, (req, res) => {
  try {
    const templateId = Number(req.params.id);
    const template = db.prepare('SELECT * FROM custom_templates WHERE id = ?').get(templateId);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }

    const { inputs = {}, freeform_matter = '', title = '' } = req.body;
    const fullDiskPath = resolveTemplateDiskPath(template);

    if (!fullDiskPath) {
      return res.status(404).json({ success: false, message: 'Original template file missing from server storage.' });
    }

    const generatedBuffer = generateDocumentFromTemplate(fullDiskPath, template.file_type, inputs, freeform_matter);

    const outputFilename = `STIC_Generated_${templateId}_${Date.now()}.${template.file_type}`;
    const generatedDir = path.join(uploadsBase, 'generated');
    if (!fs.existsSync(generatedDir)) {
      fs.mkdirSync(generatedDir, { recursive: true });
    }

    const outputDiskPath = path.join(generatedDir, outputFilename);
    fs.writeFileSync(outputDiskPath, generatedBuffer);

    const generatedUrl = `/uploads/generated/${outputFilename}`;

    const docTitle = title && title.trim() ? title.trim() : `${template.name} - ${inputs.EVENT_NAME || inputs.TITLE || 'Generated Output'}`;
    const resultDoc = db.prepare(`
      INSERT INTO documents (
        title, description, file_url, file_name, file_size, file_type, category, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      docTitle,
      `Generated using template "${template.name}"`,
      generatedUrl,
      outputFilename,
      generatedBuffer.length,
      template.file_type,
      'Generated Document',
      req.user.username || 'admin'
    );

    logAudit(req.user.id, 'GENERATE_DOCUMENT', 'custom_templates', templateId, `Generated document from template "${template.name}"`);

    return res.json({
      success: true,
      message: 'Document generated successfully preserving template design and layout!',
      data: {
        document_id: resultDoc.lastInsertRowid,
        download_url: generatedUrl,
        file_name: outputFilename,
        file_size: generatedBuffer.length,
        file_type: template.file_type,
        template_name: template.name,
        inputs
      }
    });
  } catch (err) {
    console.error('[CUSTOM TEMPLATE GENERATE ERROR]', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to generate document from template.' });
  }
});

// ==========================================
// TEMPLATE GENERATOR ENDPOINTS
// ==========================================

// GET /api/documents/templates (list all templates)
router.get('/templates', requireAuth, (req, res) => {
  try {
    const templates = db.prepare('SELECT * FROM document_templates ORDER BY id ASC').all();
    return res.json({ success: true, count: templates.length, data: templates });
  } catch (err) {
    console.error('[TEMPLATES GET ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve templates.' });
  }
});

// GET /api/documents/templates/:id (get single template)
router.get('/templates/:id', requireAuth, (req, res) => {
  try {
    const template = db.prepare('SELECT * FROM document_templates WHERE id = ?').get(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }
    return res.json({ success: true, data: template });
  } catch (err) {
    console.error('[TEMPLATE GET SINGLE ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve template.' });
  }
});

// POST /api/documents/templates (create reusable template)
router.post('/templates', requireAuth, (req, res) => {
  try {
    const {
      name,
      type = 'Event Report',
      design_layout = 'centered_report',
      header_title = 'EVENT REPORT',
      header_subtitle = 'CSE – STIC · Innovate • Sustain • Impact',
      show_logo = 1,
      logo_align = 'center',
      show_date = 1,
      default_date_label = 'Date:',
      show_recipient = 1,
      default_recipient = '',
      show_subject = 1,
      default_subject = '',
      default_matter = '',
      show_signature = 1,
      signature_salutation = 'Regards,',
      signature_name = 'CSE – STIC',
      signature_title = 'Sustainable Technology & Innovation Club',
      footer_text = 'CSE – STIC · Department of Computer Science & Engineering · Innovate • Sustain • Impact'
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Template name is required.' });
    }

    const insert = db.prepare(`
      INSERT INTO document_templates (
        name, type, design_layout, header_title, header_subtitle,
        show_logo, logo_align, show_date, default_date_label,
        show_recipient, default_recipient, show_subject, default_subject,
        default_matter, show_signature, signature_salutation, signature_name, signature_title,
        footer_text, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      name.trim(),
      type,
      design_layout,
      header_title,
      header_subtitle,
      show_logo ? 1 : 0,
      logo_align,
      show_date ? 1 : 0,
      default_date_label,
      show_recipient ? 1 : 0,
      default_recipient,
      show_subject ? 1 : 0,
      default_subject,
      default_matter,
      show_signature ? 1 : 0,
      signature_salutation,
      signature_name,
      signature_title,
      footer_text,
      req.user.username || 'admin'
    );

    const created = db.prepare('SELECT * FROM document_templates WHERE id = ?').get(result.lastInsertRowid);
    logActivity(req, {
      department: 'Content & Documentation',
      action: 'Created',
      change: `Created document template "${name}" (${type})`,
      new_value: { name, type, design_layout, header_title }
    });

    return res.status(201).json({ success: true, message: 'Template created successfully.', data: created });
  } catch (err) {
    console.error('[TEMPLATE CREATE ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to create template.' });
  }
});

// PUT /api/documents/templates/:id (edit template)
router.put('/templates/:id', requireAuth, (req, res) => {
  try {
    const templateId = req.params.id;
    const existing = db.prepare('SELECT * FROM document_templates WHERE id = ?').get(templateId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }

    const {
      name,
      type,
      design_layout,
      header_title,
      header_subtitle,
      show_logo,
      logo_align,
      show_date,
      default_date_label,
      show_recipient,
      default_recipient,
      show_subject,
      default_subject,
      default_matter,
      show_signature,
      signature_salutation,
      signature_name,
      signature_title,
      footer_text
    } = req.body;

    const update = db.prepare(`
      UPDATE document_templates SET
        name = COALESCE(?, name),
        type = COALESCE(?, type),
        design_layout = COALESCE(?, design_layout),
        header_title = COALESCE(?, header_title),
        header_subtitle = COALESCE(?, header_subtitle),
        show_logo = COALESCE(?, show_logo),
        logo_align = COALESCE(?, logo_align),
        show_date = COALESCE(?, show_date),
        default_date_label = COALESCE(?, default_date_label),
        show_recipient = COALESCE(?, show_recipient),
        default_recipient = COALESCE(?, default_recipient),
        show_subject = COALESCE(?, show_subject),
        default_subject = COALESCE(?, default_subject),
        default_matter = COALESCE(?, default_matter),
        show_signature = COALESCE(?, show_signature),
        signature_salutation = COALESCE(?, signature_salutation),
        signature_name = COALESCE(?, signature_name),
        signature_title = COALESCE(?, signature_title),
        footer_text = COALESCE(?, footer_text),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    update.run(
      name !== undefined ? name.trim() : null,
      type !== undefined ? type : null,
      design_layout !== undefined ? design_layout : null,
      header_title !== undefined ? header_title : null,
      header_subtitle !== undefined ? header_subtitle : null,
      show_logo !== undefined ? (show_logo ? 1 : 0) : null,
      logo_align !== undefined ? logo_align : null,
      show_date !== undefined ? (show_date ? 1 : 0) : null,
      default_date_label !== undefined ? default_date_label : null,
      show_recipient !== undefined ? (show_recipient ? 1 : 0) : null,
      default_recipient !== undefined ? default_recipient : null,
      show_subject !== undefined ? (show_subject ? 1 : 0) : null,
      default_subject !== undefined ? default_subject : null,
      default_matter !== undefined ? default_matter : null,
      show_signature !== undefined ? (show_signature ? 1 : 0) : null,
      signature_salutation !== undefined ? signature_salutation : null,
      signature_name !== undefined ? signature_name : null,
      signature_title !== undefined ? signature_title : null,
      footer_text !== undefined ? footer_text : null,
      templateId
    );

    const updated = db.prepare('SELECT * FROM document_templates WHERE id = ?').get(templateId);

    logActivity(req, {
      department: 'Content & Documentation',
      action: 'Updated',
      change: `Updated document template "${updated.name}"`,
      previous_value: existing,
      new_value: updated
    });

    return res.json({ success: true, message: 'Template updated successfully.', data: updated });
  } catch (err) {
    console.error('[TEMPLATE UPDATE ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to update template.' });
  }
});

// DELETE /api/documents/templates/:id (delete template)
router.delete('/templates/:id', requireAuth, (req, res) => {
  try {
    const templateId = req.params.id;
    const existing = db.prepare('SELECT * FROM document_templates WHERE id = ?').get(templateId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }

    db.prepare('DELETE FROM document_templates WHERE id = ?').run(templateId);

    logActivity(req, {
      department: 'Content & Documentation',
      action: 'Deleted',
      change: `Deleted document template "${existing.name}"`,
      previous_value: existing
    });

    return res.json({ success: true, message: 'Template deleted successfully.' });
  } catch (err) {
    console.error('[TEMPLATE DELETE ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to delete template.' });
  }
});

// GET /api/documents (list with filters)
router.get('/', requireAuth, (req, res) => {
  try {
    const { program_id, category, search, file_type } = req.query;

    let query = `
      SELECT d.*, p.name as program_name, p.program_code
      FROM documents d
      LEFT JOIN programs p ON d.program_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (program_id) {
      if (program_id === 'global') {
        query += ` AND d.program_id IS NULL`;
      } else {
        query += ` AND d.program_id = ?`;
        params.push(Number(program_id));
      }
    }

    if (category) {
      query += ` AND d.category = ?`;
      params.push(category);
    }

    if (file_type) {
      query += ` AND d.file_type = ?`;
      params.push(file_type);
    }

    if (search && search.trim()) {
      query += ` AND (d.title LIKE ? OR d.description LIKE ? OR d.file_name LIKE ? OR d.category LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY d.id DESC`;

    const docs = db.prepare(query).all(...params);
    return res.json({ success: true, count: docs.length, data: docs });
  } catch (err) {
    console.error('[DOCUMENTS GET ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve documents.' });
  }
});

// POST /api/documents (upload document file)
router.post('/', requireAuth, upload.single('file'), (req, res) => {
  try {
    const { title, description, category, program_id } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Document title is required.' });
    }

    let fileUrl = '';
    let fileName = '';
    let fileSize = 0;
    let fileType = 'unknown';

    if (req.file) {
      fileUrl = `/uploads/documents/${req.file.filename}`;
      fileName = req.file.originalname;
      fileSize = req.file.size;
      const ext = path.extname(req.file.originalname).replace('.', '').toLowerCase();
      fileType = ext;
    } else if (req.body.file_url) {
      fileUrl = req.body.file_url.trim();
      fileName = path.basename(fileUrl);
      fileType = path.extname(fileUrl).replace('.', '').toLowerCase() || 'link';
    } else {
      return res.status(400).json({ success: false, message: 'Please select a document file to upload.' });
    }

    const progId = program_id ? Number(program_id) : null;
    const cat = category || 'Report';

    const result = db.prepare(`
      INSERT INTO documents (
        program_id, title, description, file_url, file_name, 
        file_size, file_type, category, uploaded_by, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      progId,
      title.trim(),
      description ? description.trim() : null,
      fileUrl,
      fileName,
      fileSize,
      fileType,
      cat,
      req.user.username
    );

    const docId = result.lastInsertRowid;
    const created = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId);

    logActivity(req, {
      department: 'Content & Documentation',
      action: 'Created',
      change: `Uploaded document "${title}" (${fileName})`,
      new_value: { title, fileName, category: cat, program_id: progId }
    });

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully.',
      data: created
    });
  } catch (err) {
    console.error('[DOCUMENT CREATE ERROR]', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to upload document.' });
  }
});

// PUT /api/documents/:id (edit document metadata)
router.put('/:id', requireAuth, (req, res) => {
  try {
    const docId = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const { title, description, category, program_id } = req.body;

    db.prepare(`
      UPDATE documents SET
        title = COALESCE(?, title),
        description = ?,
        category = COALESCE(?, category),
        program_id = ?
      WHERE id = ?
    `).run(
      title ? title.trim() : null,
      description !== undefined ? description : existing.description,
      category || null,
      program_id !== undefined ? (program_id ? Number(program_id) : null) : existing.program_id,
      docId
    );

    const updated = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId);

    logActivity(req, {
      department: 'Content & Documentation',
      action: 'Updated',
      change: `Updated document #${docId} ("${updated.title}")`,
      previous_value: existing,
      new_value: updated
    });

    return res.json({ success: true, message: 'Document updated successfully.', data: updated });
  } catch (err) {
    console.error('[DOCUMENT UPDATE ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to update document.' });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const docId = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    if (existing.file_url && existing.file_url.startsWith('/uploads/')) {
      const localFilePath = path.join(uploadsBase, existing.file_url.replace('/uploads/', ''));
      if (fs.existsSync(localFilePath)) {
        try { fs.unlinkSync(localFilePath); } catch (e) { /* ignore */ }
      }
    }

    db.prepare('DELETE FROM documents WHERE id = ?').run(docId);

    logActivity(req, {
      department: 'Content & Documentation',
      action: 'Deleted',
      change: `Deleted document #${docId} ("${existing.title}")`,
      previous_value: existing
    });

    return res.json({ success: true, message: 'Document deleted successfully.' });
  } catch (err) {
    console.error('[DOCUMENT DELETE ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to delete document.' });
  }
});

module.exports = router;
