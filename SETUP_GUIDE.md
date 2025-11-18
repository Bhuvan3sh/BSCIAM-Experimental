# BSCIAM Client-Server Architecture Setup Guide

Complete setup guide for running BSCIAM with client-server architecture and Cloudflare Tunnel.

## Architecture Overview

```
┌─────────────────────────────────────┐
│ Computer A (Server)                │
│                                    │
│  ┌──────────┐    ┌──────────┐    │
│  │ Frontend │───▶│ Backend  │    │
│  │ (Port    │    │ (Port    │    │
│  │  3000)   │    │  3001)   │    │
│  └──────────┘    └────┬─────┘    │
│                      │            │
│                      ▼            │
│                 ┌─────────┐      │
│                 │Database │      │
│                 │(SQLite) │      │
│                 └─────────┘      │
│                      │            │
└───────────────────────┼────────────┘
                        │
                 [Cloudflare Tunnel]
                        │
┌───────────────────────┼────────────┐
│ Computer B (Client)    │            │
│                       │            │
│  ┌──────────────┐    │            │
│  │   Browser    │◀───┘            │
│  │              │                 │
│  │ - Encrypts   │                 │
│  │ - Decrypts   │                 │
│  │ - Sends to   │                 │
│  │   server    │                 │
│  └──────────────┘                 │
└────────────────────────────────────┘
```

## Quick Start

### 1. Install Dependencies

**On Server Computer (Computer A):**

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=3001
NODE_ENV=development
DB_PATH=./data/bsciam.db
CORS_ORIGIN=http://localhost:3000
```

### 3. Configure Frontend

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:
```env
# For local development
REACT_APP_API_URL=http://localhost:3001/api

# For Cloudflare Tunnel (update after tunnel setup)
# REACT_APP_API_URL=https://your-tunnel-url.trycloudflare.com/api
```

### 4. Initialize Database

The database is automatically created on first server start. No manual setup needed.

### 5. Start Backend Server

```bash
cd backend
npm start
```

You should see:
```
🚀 BSCIAM Backend Server running on port 3001
📡 API available at http://localhost:3001/api
```

### 6. Start Frontend

In a new terminal:
```bash
cd frontend
npm start
```

Frontend will open at `http://localhost:3000`

### 7. Set Up Cloudflare Tunnel

See `CLOUDFLARE_TUNNEL_SETUP.md` for detailed instructions.

Quick start:
```bash
# Install cloudflared (see CLOUDFLARE_TUNNEL_SETUP.md)

# Start tunnel
cloudflared tunnel --url http://localhost:3001
```

Copy the tunnel URL and update `frontend/.env`:
```env
REACT_APP_API_URL=https://your-tunnel-url.trycloudflare.com/api
```

Rebuild frontend:
```bash
cd frontend
npm run build
```

## Testing the Setup

### Local Testing (Same Computer)

1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm start`
3. Open browser: `http://localhost:3000`
4. Connect wallet and upload a file
5. Check `backend/data/bsciam.db` - file should be stored

### Remote Testing (Different Computer)

1. On Server (Computer A):
   - Start backend: `cd backend && npm start`
   - Start Cloudflare Tunnel: `cloudflared tunnel --url http://localhost:3001`
   - Copy the tunnel URL

2. On Client (Computer B):
   - Access the web app via tunnel URL
   - Connect wallet
   - Upload a file
   - File should be stored on Server (Computer A)

## File Flow

### Upload Flow:
1. User selects file in browser (Client)
2. File encrypted on client using AES
3. Encrypted data sent to server via API
4. Server stores encrypted data in database
5. Server returns success

### Download Flow:
1. User requests file download (Client)
2. Client requests encrypted data from server
3. Server returns encrypted data
4. Client decrypts file using encryption key
5. Decrypted file saved to user's device

## Important Notes

1. **Encryption Keys**: Stored in browser localStorage. User must save their key!
2. **File Encryption**: Happens on client side - server never sees plaintext
3. **Database**: SQLite database stored in `backend/data/bsciam.db`
4. **CORS**: Backend allows requests from frontend origin
5. **Rate Limiting**: 100 requests per 15 minutes per IP

## Troubleshooting

### Backend won't start
- Check if port 3001 is available
- Verify Node.js version (v14+)
- Check database directory permissions

### Frontend can't connect to API
- Verify `REACT_APP_API_URL` in `.env`
- Check backend is running
- Check CORS settings in backend
- Check browser console for errors

### Files not appearing
- Check browser console for API errors
- Verify wallet address matches
- Check database: `sqlite3 backend/data/bsciam.db "SELECT * FROM files;"`

### Cloudflare Tunnel issues
- Verify tunnel is running
- Check tunnel URL is correct in frontend `.env`
- Restart tunnel if URL changed
- Check backend is accessible on localhost:3001

## Production Deployment

For production use:

1. Use a custom domain with Cloudflare Tunnel
2. Set `NODE_ENV=production`
3. Use a process manager (PM2) for backend
4. Set up proper logging
5. Configure backups for database
6. Add API authentication
7. Use HTTPS everywhere

## Support

For issues or questions, check:
- `CLOUDFLARE_ZERO_TRUST_SETUP.md` - Zero Trust tunnel setup details
- `README.md` - Main project documentation
- `backend/README.md` - Backend API documentation
- Browser console for frontend errors
- Backend logs for server errors

