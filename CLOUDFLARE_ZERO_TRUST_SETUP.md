# Cloudflare Zero Trust Tunnel Setup for BSCIAM

## Important: Using Zero Trust Dashboard

Since you're using Cloudflare Zero Trust dashboard (not config.yml file), the routing is configured through the web interface, not the local config file.

## Problem: Backend Not Accessible

The tunnel at `user.bsciam.me` is not routing `/api/*` requests to the backend (port 3001).

## Solution: Configure Routes in Zero Trust Dashboard

### Step 1: Access Zero Trust Dashboard

1. Go to: https://one.dash.cloudflare.com/
2. Log in to your Cloudflare account
3. Navigate to: **Networks** → **Tunnels**
4. Find your tunnel (should show tunnel ID: `8a0aea3a-d0de-4a36-8974-280c140c4453`)
5. Click on the tunnel to configure it

### Step 2: Configure Public Hostname Routes

In the tunnel configuration, you need to set up **Public Hostnames** with routes:

#### Route 1: Backend API (Port 3001)

**Configuration**:
- **Public Hostname**: `user.bsciam.me`
- **Path**: `/api/*`
- **Service**: `http://localhost:3001`
- **Type**: HTTP

**Steps**:
1. Click **"Add a public hostname"** or **"Configure"**
2. Set **Public Hostname**: `user.bsciam.me`
3. Set **Path**: `/api/*` (this routes API requests)
4. Set **Service**: `http://localhost:3001`
5. Click **Save**

#### Route 2: Frontend (Port 3000)

**Configuration**:
- **Public Hostname**: `user.bsciam.me`
- **Path**: Leave empty or set to `/` (default route)
- **Service**: `http://localhost:3000`
- **Type**: HTTP

**Steps**:
1. Click **"Add another public hostname"** or add another route
2. Set **Public Hostname**: `user.bsciam.me` (same domain)
3. Set **Path**: Leave empty (this catches everything else)
4. Set **Service**: `http://localhost:3000`
5. Click **Save**

### Step 3: Route Order (IMPORTANT!)

**The route with `/api/*` path MUST be checked/evaluated BEFORE the default route!**

In Zero Trust dashboard:
- Route `/api/*` should be **higher in priority** (evaluated first)
- Default route (empty path) should be **lower in priority** (evaluated last)

If you can reorder routes, make sure `/api/*` comes first.

### Step 4: Verify Backend is Running

Before testing, make sure backend is running locally:

```powershell
cd "F:\Final Year Project\Project Implementation\BSCIAM-Experimental\backend"
npm start
```

Should see: `🚀 BSCIAM Backend Server running on port 3001`

### Step 5: Test Locally First

Test that backend works locally:

```powershell
curl http://localhost:3001/health
```

Should return: `{"status":"ok","timestamp":"..."}`

### Step 6: Test Through Tunnel

After configuring routes in Zero Trust dashboard:

```powershell
curl https://user.bsciam.me/api/health
```

Should return: `{"status":"ok","timestamp":"..."}`

## Configuration Checklist

### Zero Trust Dashboard Routes:
- [ ] Route 1: `user.bsciam.me` + `/api/*` → `http://localhost:3001`
- [ ] Route 2: `user.bsciam.me` + (empty path) → `http://localhost:3000`
- [ ] Route with `/api/*` is evaluated FIRST

### Backend Configuration:
- [ ] Backend running on port 3001
- [ ] Backend `.env` has: `CORS_ORIGIN=https://user.bsciam.me`

### Frontend Configuration:
- [ ] Frontend `.env` has: `REACT_APP_API_URL=https://user.bsciam.me/api`
- [ ] Frontend running (if serving locally) or built

## Troubleshooting

### Issue: 404 Not Found on `/api/*`

**Check**:
1. ✅ Backend is running on localhost:3001?
2. ✅ Route `/api/*` is configured in Zero Trust dashboard?
3. ✅ Route `/api/*` is evaluated BEFORE default route?
4. ✅ Service URL is `http://localhost:3001` (not `https://`)?
5. ✅ Tunnel connector is running on your machine?

### Issue: Backend not accessible

**Check**:
1. Test locally: `curl http://localhost:3001/health`
2. If local works but tunnel doesn't → Check Zero Trust route configuration
3. Verify tunnel connector is running

### Issue: How to check if tunnel connector is running?

The tunnel connector should be running as a service or process. Check:
- Windows Services (search "services" in Start menu)
- Look for Cloudflare tunnel service
- Or run: `cloudflared tunnel run <tunnel-name>` manually

## Current Configuration Files

### Backend `.env` (Already Fixed):
```env
CORS_ORIGIN=https://user.bsciam.me
PORT=3001
```

### Frontend `.env` (Already Fixed):
```env
REACT_APP_API_URL=https://user.bsciam.me/api
```

### Zero Trust Dashboard:
- **Need to configure**: Routes in Zero Trust dashboard
- Route `/api/*` → Backend (port 3001)
- Default route → Frontend (port 3000)

## Summary

**What's Fixed**:
- ✅ Backend `.env` - CORS configured
- ✅ Frontend `.env` - API URL configured

**What Needs to be Done in Zero Trust Dashboard**:
- ⬜ Add route: `user.bsciam.me` + `/api/*` → `http://localhost:3001`
- ⬜ Add route: `user.bsciam.me` + (empty) → `http://localhost:3000`
- ⬜ Ensure `/api/*` route is evaluated first

After configuring routes in Zero Trust dashboard, the backend should be accessible!

