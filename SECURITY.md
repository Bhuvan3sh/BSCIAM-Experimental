 # Security Documentation

## Wallet Address Isolation

BSCIAM ensures complete file isolation between different wallet addresses. Files uploaded by one wallet account are **never** visible or accessible to another wallet account.

## Security Measures

### 1. Database-Level Isolation

- All database queries filter by `wallet_address`
- Case-insensitive comparison prevents address format bypass
- Index on `wallet_address` for efficient filtering

### 2. API-Level Validation

- **Wallet Address Validation**: All endpoints validate wallet address format
- **Ownership Verification**: File operations verify ownership before allowing access
- **Normalization**: All wallet addresses normalized to lowercase for consistent comparison

### 3. Endpoint Security

#### GET /api/files
- **Filter**: Only returns files where `wallet_address` matches request
- **Validation**: Wallet address validated and normalized
- **Result**: Empty array if no files found (never reveals other users' files)

#### GET /api/files/:fileId/encrypted
- **Ownership Check**: Verifies file belongs to requesting wallet
- **Access Control**: Returns 403 if ownership doesn't match
- **Security**: Never returns encrypted data for other wallets

#### PUT /api/files/:fileId
- **Ownership Verification**: Checks ownership before update
- **Access Denied**: Returns 403 if file doesn't belong to wallet
- **Update Protection**: Only updates files owned by requesting wallet

#### DELETE /api/files/:fileId
- **Ownership Check**: Verifies ownership before deletion
- **Access Control**: Cannot delete files from other wallets
- **Safe Deletion**: Only deletes files owned by requesting wallet

### 4. Frontend Security

- Frontend always sends the connected wallet address
- Wallet address comes from MetaMask (cannot be spoofed)
- All API calls include wallet address from authenticated source

## Security Flow

```
User Action → Frontend → API Request (with wallet address)
                              ↓
                    Validate Wallet Address
                              ↓
                    Normalize Address (lowercase)
                              ↓
                    Verify File Ownership
                              ↓
                    Execute Operation (if authorized)
                              ↓
                    Return Result (only user's data)
```

## Testing Isolation

To verify file isolation:

1. **Test with Wallet A**:
   - Connect Wallet A (e.g., `0x1234...`)
   - Upload a file
   - Note the file ID

2. **Test with Wallet B**:
   - Connect Wallet B (e.g., `0x5678...`)
   - Try to access Wallet A's file ID
   - Should receive 403 Forbidden or 404 Not Found

3. **Verify**:
   - Wallet B's file list should be empty
   - Wallet B cannot download Wallet A's files
   - Wallet B cannot modify Wallet A's files
   - Wallet B cannot delete Wallet A's files

## Security Best Practices

1. **Never trust client input**: Server always validates wallet address
2. **Always verify ownership**: Every file operation checks ownership
3. **Normalize addresses**: Case-insensitive comparison prevents bypass
4. **Log access attempts**: Failed ownership checks are logged
5. **Return generic errors**: Don't reveal if file exists for other wallets

## Error Responses

### 403 Forbidden
- File exists but doesn't belong to requesting wallet
- Access denied for security

### 404 Not Found
- File doesn't exist OR doesn't belong to wallet
- Generic response prevents information leakage

### 400 Bad Request
- Invalid wallet address format
- Missing required parameters

## Database Schema Security

```sql
-- Files are isolated by wallet_address
CREATE TABLE files (
  id TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL,  -- Owner's wallet
  encrypted_data TEXT NOT NULL,
  ...
  INDEX idx_wallet_address (LOWER(wallet_address))  -- Case-insensitive index
);
```

## Additional Security Recommendations

For production:
1. Add JWT authentication
2. Implement rate limiting per wallet
3. Add request signing with wallet signatures
4. Enable audit logging
5. Use prepared statements (already implemented)
6. Regular security audits

