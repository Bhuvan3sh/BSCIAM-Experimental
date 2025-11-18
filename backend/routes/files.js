const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/init');
const { validateWalletAddress, verifyFileOwnership, normalizeWalletAddress } = require('../middleware/walletValidation');

/**
 * POST /api/files/upload
 * Upload an encrypted file
 */
router.post('/upload', validateWalletAddress, async (req, res, next) => {
  const { fileId, encryptedData, metadata } = req.body;
  const walletAddress = req.walletAddress; // Normalized from middleware

  // Validation
  if (!fileId || !encryptedData || !metadata) {
    return res.status(400).json({
      error: 'Missing required fields: fileId, encryptedData, metadata'
    });
  }

  if (!metadata.name || !metadata.type || metadata.size === undefined) {
    return res.status(400).json({
      error: 'Invalid metadata: name, type, and size are required'
    });
  }

  const db = getDatabase();

  try {
    const file = {
      id: fileId,
      wallet_address: walletAddress, // Use normalized address
      encrypted_data: encryptedData,
      name: metadata.name,
      type: metadata.type,
      size: metadata.size,
      uploaded_at: new Date().toISOString(),
      metadata: JSON.stringify(metadata),
      updated_at: new Date().toISOString()
    };

    const sql = `
      INSERT INTO files (id, wallet_address, encrypted_data, name, type, size, uploaded_at, metadata, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [
      file.id,
      file.wallet_address,
      file.encrypted_data,
      file.name,
      file.type,
      file.size,
      file.uploaded_at,
      file.metadata,
      file.updated_at
    ], function(err) {
      db.close();

      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ error: 'File with this ID already exists' });
        }
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to save file' });
      }

      res.status(201).json({
        fileId: file.id,
        success: true,
        message: 'File uploaded successfully'
      });
    });
  } catch (error) {
    db.close();
    console.error('Upload error:', error);
    next(error);
  }
});

/**
 * GET /api/files
 * Get all files for a wallet address (metadata only, no encrypted data)
 */
router.get('/', validateWalletAddress, async (req, res, next) => {
  const walletAddress = req.walletAddress; // Normalized from middleware

  const db = getDatabase();

  try {
    const sql = `
      SELECT 
        id,
        name,
        type,
        size,
        uploaded_at,
        metadata,
        created_at,
        updated_at
      FROM files
      WHERE wallet_address = ?
      ORDER BY uploaded_at DESC
    `;

    db.all(sql, [walletAddress], (err, rows) => {
      db.close();

      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch files' });
      }

      const files = rows.map(row => ({
        id: row.id,
        name: row.name,
        type: row.type,
        size: row.size,
        uploadedAt: row.uploaded_at,
        encryptedData: '', // Empty - actual data fetched separately
        metadata: JSON.parse(row.metadata || '{}')
      }));

      res.json(files);
    });
  } catch (error) {
    db.close();
    console.error('Fetch error:', error);
    next(error);
  }
});

/**
 * GET /api/files/:fileId/encrypted
 * Get encrypted file content by ID
 */
router.get('/:fileId/encrypted', validateWalletAddress, verifyFileOwnership, async (req, res, next) => {
  const { fileId } = req.params;
  const walletAddress = req.walletAddress; // Normalized from middleware

  const db = getDatabase();

  try {
    const sql = `
      SELECT encrypted_data, wallet_address
      FROM files
      WHERE id = ? AND wallet_address = ?
    `;

    db.get(sql, [fileId, walletAddress], (err, row) => {
      db.close();

      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch file' });
      }

      if (!row) {
        return res.status(404).json({ error: 'File not found or access denied' });
      }

      res.json({
        encryptedData: row.encrypted_data
      });
    });
  } catch (error) {
    db.close();
    console.error('Fetch error:', error);
    next(error);
  }
});

/**
 * PUT /api/files/:fileId
 * Update/modify an existing file
 */
router.put('/:fileId', validateWalletAddress, verifyFileOwnership, async (req, res, next) => {
  const { fileId } = req.params;
  const { encryptedData, metadata } = req.body;
  const walletAddress = req.walletAddress; // Normalized from middleware

  if (!encryptedData || !metadata) {
    return res.status(400).json({
      error: 'Missing required fields: encryptedData, metadata'
    });
  }

  const db = getDatabase();

  try {
    // Update the file (ownership already verified by middleware)
    const updateSql = `
      UPDATE files
      SET encrypted_data = ?,
          name = ?,
          type = ?,
          size = ?,
          metadata = ?,
          uploaded_at = ?,
          updated_at = ?
      WHERE id = ? AND wallet_address = ?
    `;

    db.run(updateSql, [
      encryptedData,
      metadata.name,
      metadata.type,
      metadata.size,
      JSON.stringify(metadata),
      new Date().toISOString(),
      new Date().toISOString(),
      fileId,
      walletAddress
    ], function(updateErr) {
        db.close();

        if (updateErr) {
          console.error('Database error:', updateErr);
          return res.status(500).json({ error: 'Failed to update file' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'File not found or no changes made' });
        }

        res.json({
          success: true,
          message: 'File updated successfully'
        });
      });
  } catch (error) {
    db.close();
    console.error('Update error:', error);
    next(error);
  }
});

/**
 * DELETE /api/files/:fileId
 * Delete a file
 */
router.delete('/:fileId', validateWalletAddress, verifyFileOwnership, async (req, res, next) => {
  const { fileId } = req.params;
  const walletAddress = req.walletAddress; // Normalized from middleware

  const db = getDatabase();

  try {
    const sql = `DELETE FROM files WHERE id = ? AND wallet_address = ?`;

    db.run(sql, [fileId, walletAddress], function(err) {
      db.close();

      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to delete file' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'File not found or access denied' });
      }

      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    });
  } catch (error) {
    db.close();
    console.error('Delete error:', error);
    next(error);
  }
});

module.exports = router;

