/**
 * Middleware to validate and normalize wallet addresses
 */

/**
 * Validates Ethereum wallet address format
 * @param {string} address - Wallet address to validate
 * @returns {boolean} - True if valid
 */
function isValidWalletAddress(address) {
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  // Ethereum addresses are 42 characters (0x + 40 hex chars)
  // Case-insensitive validation
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethAddressRegex.test(address);
}

/**
 * Normalizes wallet address to lowercase
 * @param {string} address - Wallet address to normalize
 * @returns {string} - Normalized address
 */
function normalizeWalletAddress(address) {
  if (!address) return address;
  return address.toLowerCase().trim();
}

/**
 * Middleware to validate wallet address in request
 */
function validateWalletAddress(req, res, next) {
  let walletAddress = null;
  
  // Check query parameters
  if (req.query.walletAddress) {
    walletAddress = req.query.walletAddress;
  }
  
  // Check request body
  if (req.body.walletAddress) {
    walletAddress = req.body.walletAddress;
  }
  
  if (!walletAddress) {
    return res.status(400).json({
      error: 'walletAddress is required'
    });
  }
  
  if (!isValidWalletAddress(walletAddress)) {
    return res.status(400).json({
      error: 'Invalid wallet address format'
    });
  }
  
  // Normalize and attach to request
  req.walletAddress = normalizeWalletAddress(walletAddress);
  
  // Replace in original location for consistency
  if (req.query.walletAddress) {
    req.query.walletAddress = req.walletAddress;
  }
  if (req.body.walletAddress) {
    req.body.walletAddress = req.walletAddress;
  }
  
  next();
}

/**
 * Middleware to verify file ownership
 * Checks if a file belongs to the requesting wallet address
 */
function verifyFileOwnership(req, res, next) {
  const { fileId } = req.params;
  const walletAddress = req.walletAddress || req.query.walletAddress || req.body.walletAddress;
  
  if (!fileId || !walletAddress) {
    return res.status(400).json({
      error: 'File ID and wallet address are required'
    });
  }
  
  const { getDatabase } = require('../database/init');
  const db = getDatabase();
  
  const normalizedWalletAddress = normalizeWalletAddress(walletAddress);
  const sql = `SELECT wallet_address FROM files WHERE id = ?`;
  
  db.get(sql, [fileId], (err, row) => {
    db.close();
    
    if (err) {
      console.error('Database error in ownership verification:', err);
      return res.status(500).json({ error: 'Failed to verify file ownership' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Normalize both addresses for comparison (addresses stored normalized)
    const fileOwner = normalizeWalletAddress(row.wallet_address);
    
    if (fileOwner !== normalizedWalletAddress) {
      console.warn(`Access denied: File ${fileId} owned by ${fileOwner}, requested by ${normalizedWalletAddress}`);
      return res.status(403).json({ 
        error: 'Access denied: File does not belong to this wallet address' 
      });
    }
    
    // Ownership verified, continue
    next();
  });
}

module.exports = {
  validateWalletAddress,
  verifyFileOwnership,
  isValidWalletAddress,
  normalizeWalletAddress
};

