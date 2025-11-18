# BSCIAM - Blockchain-based Secure Cloud Identity and Access Management

A comprehensive blockchain-based authentication and file storage system using MetaMask wallet integration, built with React, TypeScript, Solidity smart contracts, and a Node.js backend. This framework provides secure, decentralized file storage with client-side encryption and cross-device access via Cloudflare Tunnel.

## 📌 Table of Contents
- [Features](#-features)
- [Architecture](#-architecture)
- [File Storage System](#-file-storage-system)
- [Security](#-security)
- [Getting Started](#-getting-started)
- [Installation](#-installation)
- [Client-Server Setup](#-client-server-setup)
- [Smart Contracts](#-smart-contracts)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## 🚀 Features

### Core Features
- **Decentralized Identity Management**: Self-sovereign identity using blockchain
- **Role-Based Access Control (RBAC)**: Fine-grained permission system
- **Reputation System**: User reputation scoring for access control
- **MetaMask Integration**: Seamless wallet connection and authentication
- **Dark Theme UI**: Modern, responsive interface with dark mode

### File Storage Features
- **Client-Side Encryption**: Files encrypted on client before upload (AES-256)
- **Cross-Device Access**: Access files from any device via Cloudflare Tunnel
- **Secure File Operations**: Upload, Download, Modify, and Delete files
- **Multiple File Types**: Supports PDF, Images, Office documents (PPTX, DOCX, XLSX), and Text files
- **Wallet-Based Isolation**: Files are completely isolated per wallet address
- **Server-Side Storage**: Encrypted files stored on server database

### Security Features
- **End-to-End Encryption**: Server never sees plaintext files
- **Wallet Address Validation**: All operations verify wallet ownership
- **Access Control**: Files isolated per wallet - no cross-wallet access
- **Rate Limiting**: API protection against abuse
- **CORS Protection**: Secure cross-origin requests

## 🏗️ Architecture

### System Components

```
BSCIAM/
├── contracts/                 # Smart contracts (Solidity)
│   ├── contracts/            # Core contract implementations
│   │   ├── BSCIAMAuth.sol    # Authentication logic
│   │   └── BSCIAMToken.sol   # ERC20 token implementation
│   ├── scripts/              # Deployment and utility scripts
│   ├── test/                 # Smart contract tests
│   └── hardhat.config.js     # Hardhat configuration
│
├── backend/                   # Node.js/Express API server
│   ├── routes/               # API route handlers
│   ├── database/             # Database initialization
│   ├── middleware/           # Security middleware
│   ├── data/                 # SQLite database storage
│   └── server.js             # Express server entry point
│
├── frontend/                 # React frontend application
│   ├── public/               # Static assets
│   └── src/
│       ├── components/       # Reusable UI components
│       │   └── files/        # File management components
│       ├── context/          # React context providers
│       ├── services/         # API service layer
│       ├── types/            # TypeScript type definitions
│       ├── utils/            # Utility functions (encryption)
│       ├── config/           # Application configuration
│       ├── App.tsx           # Main application component
│       └── index.tsx         # Application entry point
│
├── .gitignore               # Git ignore rules
├── package.json             # Root project dependencies
├── README.md                # This file
├── SETUP_GUIDE.md           # Detailed setup instructions
├── CLOUDFLARE_TUNNEL_SETUP.md  # Cloudflare Tunnel guide
└── SECURITY.md              # Security documentation
```

### Client-Server Architecture

```
┌─────────────────────────────────────┐
│ Computer A (Server)                 │
│                                     │
│  ┌──────────┐    ┌──────────┐      │
│  │ Frontend │───▶│ Backend  │      │
│  │ (Port    │    │ (Port    │      │
│  │  3000)   │    │  3001)   │      │
│  └──────────┘    └────┬─────┘      │
│                      │              │
│                      ▼              │
│                 ┌─────────┐        │
│                 │Database │        │
│                 │(SQLite) │        │
│                 │Encrypted │        │
│                 │ Files   │        │
│                 └─────────┘        │
│                      │              │
└───────────────────────┼──────────────┘
                        │
                 [Cloudflare Tunnel]
                        │
┌───────────────────────┼──────────────┐
│ Computer B (Client)    │              │
│                       │              │
│  ┌──────────────┐    │              │
│  │   Browser    │◀───┘              │
│  │              │                   │
│  │ - Encrypts   │                   │
│  │ - Decrypts   │                   │
│  │ - Sends to   │                   │
│  │   server    │                   │
│  └──────────────┘                   │
└─────────────────────────────────────┘
```

## 📁 File Storage System

### How It Works

1. **Upload Flow**:
   - User selects file in browser (Client)
   - File encrypted on client using AES-256 encryption
   - Encrypted data sent to server via API
   - Server stores encrypted data in SQLite database
   - Server never sees plaintext files

2. **Download Flow**:
   - User requests file download (Client)
   - Client requests encrypted data from server
   - Server returns encrypted data (only if wallet owns file)
   - Client decrypts file using encryption key
   - Decrypted file saved to user's device

3. **File Operations**:
   - **Upload**: Encrypt → Send to Server → Store
   - **Download**: Fetch from Server → Decrypt → Save
   - **Modify**: Replace encrypted file (same name/type required)
   - **Delete**: Remove file from server database

### Supported File Types
- PDF files (`.pdf`)
- Images (`.jpg`, `.jpeg`, `.png`, `.gif`)
- PowerPoint (`.pptx`)
- Word documents (`.docx`)
- Excel files (`.xlsx`, `.xls`)
- Text files (`.txt`)

## 🔐 Security

### Wallet-Based File Isolation
- **Complete Isolation**: Files uploaded by one wallet are never visible to another wallet
- **Ownership Verification**: All file operations verify wallet ownership
- **Access Control**: Server validates wallet address before any operation
- **Case-Insensitive Matching**: Wallet addresses normalized for consistent comparison

### Encryption Security
- **Client-Side Encryption**: Files encrypted before leaving the browser
- **AES-256 Encryption**: Industry-standard encryption algorithm
- **Key Management**: Encryption keys stored in browser localStorage (user must save!)
- **Server Security**: Server only stores encrypted data, never plaintext

### API Security
- **Wallet Address Validation**: All requests validate wallet address format
- **Ownership Verification**: File operations verify ownership before execution
- **Rate Limiting**: Protection against API abuse
- **CORS Protection**: Secure cross-origin requests
- **Error Handling**: Generic error messages prevent information leakage

For detailed security information, see [SECURITY.md](SECURITY.md).

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher) or yarn
- MetaMask browser extension
- Git
- Cloudflare account (for tunnel setup - optional)

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/bsciam.git
cd bsciam
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install contract dependencies
cd ../contracts
npm install
```

### 3. Configure Environment

#### Backend Configuration
Create `backend/.env`:
```env
PORT=3001
NODE_ENV=development
DB_PATH=./data/bsciam.db
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend Configuration
Create `frontend/.env`:
```env
# For local development
REACT_APP_API_URL=http://localhost:3001/api

# For Cloudflare Tunnel (update after tunnel setup)
# REACT_APP_API_URL=https://your-tunnel-url.trycloudflare.com/api
```

#### Contracts Configuration
Create `contracts/.env`:
```env
PRIVATE_KEY=your_private_key_here
SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## 🌐 Client-Server Setup

### Local Development (Same Computer)

1. **Start Backend Server**:
```bash
cd backend
npm start
```

2. **Start Frontend**:
```bash
cd frontend
npm start
```

3. **Access Application**:
   - Open `http://localhost:3000` in browser
   - Connect MetaMask wallet
   - Start uploading files!

### Remote Access (Different Computers)

For accessing the server from a different computer, see:
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Complete setup instructions
- **[CLOUDFLARE_TUNNEL_SETUP.md](CLOUDFLARE_TUNNEL_SETUP.md)** - Cloudflare Tunnel configuration

**Quick Setup**:
1. Start backend on server computer
2. Set up Cloudflare Tunnel
3. Update frontend `.env` with tunnel URL
4. Access from any computer via tunnel URL

## 🔧 Smart Contracts

### BSCIAM Token (ERC20)
- **Symbol**: BSCIAM
- **Total Supply**: 1,000,000 tokens
- **Features**:
  - ERC20 compliant
  - Minting and burning capabilities
  - Pausable functionality
  - Role-based access control

### BSCIAM Authentication
- **Features**:
  - User registration and management
  - Reputation system
  - Access control lists
  - Event logging
- **Registration Fee**: 10 BSCIAM tokens

## 🚀 Development

### Start Local Blockchain
```bash
cd contracts
npx hardhat node
```

### Deploy Contracts
```bash
npx hardhat run scripts/deploy.js --network localhost
```

### Start Development Servers

**Option 1: Run All Services**
```bash
npm run dev
```

**Option 2: Run Individually**

Backend:
```bash
cd backend
npm run dev  # Uses nodemon for auto-reload
```

Frontend:
```bash
cd frontend
npm start
```

## 🧪 Testing

### Run Smart Contract Tests
```bash
cd contracts
npx hardhat test
```

### Run Frontend Tests
```bash
cd frontend
npm test
```

### Test File Isolation
1. Connect Wallet A → Upload file
2. Connect Wallet B → Verify file list is empty
3. Try to access Wallet A's file → Should get 403 Forbidden

## 🌐 Deployment

### Backend Deployment

1. **Production Configuration**:
```env
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-frontend-domain.com
```

2. **Start Server**:
```bash
cd backend
npm start
```

3. **Set Up Cloudflare Tunnel** (see [CLOUDFLARE_TUNNEL_SETUP.md](CLOUDFLARE_TUNNEL_SETUP.md))

### Frontend Deployment

1. **Update API URL**:
```env
REACT_APP_API_URL=https://your-tunnel-url.trycloudflare.com/api
```

2. **Build for Production**:
```bash
cd frontend
npm run build
```

3. **Deploy**:
   - Deploy `build/` folder to Vercel, Netlify, or any static hosting
   - Or serve locally with `npx serve -s build -l 3000`

### Smart Contracts Deployment

#### Deploy to Sepolia Testnet
```bash
cd contracts
npx hardhat run scripts/deploy.js --network sepolia
```

See `contracts/sepolia-deploy-instructions.md` for detailed instructions.

## 📖 Usage Guide

### 1. Connect Wallet
- Open the application
- Click "Connect MetaMask"
- Approve connection in MetaMask

### 2. Register User
- If not registered, complete registration form
- Pay registration fee (if using smart contracts)
- Save your encryption key (required for file operations!)

### 3. Upload Files
- Click "Upload File" button
- Select file (PDF, Images, Office docs, or TXT)
- Enter encryption key
- File is encrypted and uploaded to server

### 4. Manage Files
- **Download**: Click download → Enter encryption key → File decrypted and saved
- **Modify**: Click modify → Select replacement file (same name/type) → Enter key
- **Delete**: Click delete → Confirm with encryption key

### 5. Cross-Device Access
- Set up Cloudflare Tunnel on server
- Access from any device via tunnel URL
- All files accessible from any location

## 🔐 Security Best Practices

1. **Save Your Encryption Key**: Store it securely - required for all file operations
2. **Use Strong Passwords**: For wallet security
3. **Verify URLs**: Always check Cloudflare Tunnel URL is correct
4. **Keep Backend Secure**: Use strong authentication in production
5. **Regular Backups**: Backup database regularly
6. **Monitor Access**: Check server logs for suspicious activity

## 🎨 UI/UX Features

- **Dark Theme**: Modern dark-themed interface
- **Responsive Design**: Works on desktop and mobile devices
- **Smooth Animations**: Transitions and loading states
- **File Type Icons**: Visual indicators for different file types
- **User-Friendly**: Simple, intuitive file management interface

## 📱 MetaMask Integration

The application integrates with MetaMask for:
- Wallet connection and disconnection
- Account switching
- Network switching
- Transaction signing (for smart contract interactions)

## 🐛 Troubleshooting

### Backend Issues
- **Port already in use**: Change `PORT` in `backend/.env`
- **Database errors**: Check `backend/data/` directory permissions
- **CORS errors**: Update `CORS_ORIGIN` in `backend/.env`

### Frontend Issues
- **API connection failed**: Check `REACT_APP_API_URL` in `frontend/.env`
- **Files not loading**: Verify backend is running and accessible
- **Encryption errors**: Ensure encryption key is correct

### Cloudflare Tunnel Issues
- **Tunnel not connecting**: Verify backend is running on correct port
- **URL changed**: Update `REACT_APP_API_URL` in frontend `.env`
- **Connection timeout**: Check firewall settings

## 📚 Additional Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Complete setup instructions
- **[CLOUDFLARE_TUNNEL_SETUP.md](CLOUDFLARE_TUNNEL_SETUP.md)** - Tunnel configuration
- **[SECURITY.md](SECURITY.md)** - Security documentation
- **[backend/README.md](backend/README.md)** - Backend API documentation

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Open an issue in the repository
- Check documentation in `SETUP_GUIDE.md` and `SECURITY.md`
- Review troubleshooting section above

---

**Built with ❤️ using React, TypeScript, Node.js, Express, SQLite, Solidity, and Tailwind CSS**

## 🎯 Key Highlights

- ✅ **Client-Side Encryption**: Files encrypted before upload
- ✅ **Cross-Device Access**: Access files from anywhere via Cloudflare Tunnel
- ✅ **Wallet Isolation**: Complete file isolation per wallet address
- ✅ **Multiple File Types**: Support for PDF, Images, Office docs, and Text files
- ✅ **Secure Storage**: Encrypted files stored on server database
- ✅ **Modern UI**: Beautiful dark-themed interface
- ✅ **Blockchain Integration**: MetaMask wallet authentication
