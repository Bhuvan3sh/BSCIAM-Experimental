# BSCIAM Backend Server

Backend API server for BSCIAM file storage system. Handles encrypted file storage and retrieval.

## Features

- ✅ RESTful API for file operations
- ✅ SQLite database for encrypted file storage
- ✅ CORS enabled for cross-origin requests
- ✅ Rate limiting for API protection
- ✅ Security headers via Helmet
- ✅ Client-side encryption (server never sees plaintext)

## Installation

```bash
cd backend
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your settings:
```env
PORT=3001
NODE_ENV=development
DB_PATH=./data/bsciam.db
CORS_ORIGIN=http://localhost:3000
```

## Database Initialization

The database is automatically initialized on first server start. The database file will be created at the path specified in `DB_PATH`.

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3001` (or the port specified in `.env`).

## API Endpoints

### Health Check
- `GET /health` - Server health status

### File Operations
- `POST /api/files/upload` - Upload encrypted file
- `GET /api/files?walletAddress={address}` - Get all files for a wallet (metadata only)
- `GET /api/files/:fileId/encrypted?walletAddress={address}` - Get encrypted file content
- `PUT /api/files/:fileId` - Update/modify a file
- `DELETE /api/files/:fileId?walletAddress={address}` - Delete a file

## Security Notes

- Files are encrypted on the client side before being sent to the server
- The server only stores encrypted data
- Wallet address is used for file ownership verification
- Rate limiting prevents abuse
- CORS is configured for security

## Database Schema

### Files Table
- `id` (TEXT, PRIMARY KEY) - Unique file identifier
- `wallet_address` (TEXT) - Owner's wallet address
- `encrypted_data` (TEXT) - AES-encrypted file content
- `name` (TEXT) - Original file name
- `type` (TEXT) - MIME type
- `size` (INTEGER) - File size in bytes
- `uploaded_at` (TEXT) - ISO timestamp
- `metadata` (TEXT) - JSON metadata
- `created_at` (TEXT) - Creation timestamp
- `updated_at` (TEXT) - Last update timestamp

## Cloudflare Tunnel Setup

See `CLOUDFLARE_TUNNEL_SETUP.md` for detailed instructions.

