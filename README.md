# BSCIAM - Blockchain-based Secure Cloud Identity and Access Management

A comprehensive blockchain-based authentication system using MetaMask wallet integration, built with React, TypeScript, and Solidity smart contracts. This framework provides a secure, decentralized approach to identity management and access control in cloud environments.

## 📌 Table of Contents
- [Features](#-features)
- [Architecture](#-architecture)
- [Algorithms & Workflow](#-algorithms--workflow)
- [Getting Started](#-getting-started)
- [Installation](#-installation)
- [Smart Contracts](#-smart-contracts)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## 🚀 Features

- **Decentralized Identity Management**: Self-sovereign identity using blockchain
- **Role-Based Access Control (RBAC)**: Fine-grained permission system
- **Reputation System**: User reputation scoring for access control
- **MetaMask Integration**: Seamless wallet connection and authentication
- **Dark Theme UI**: Modern, responsive interface with dark mode
- **Smart Contracts**: Secure, audited Solidity contracts
- **User Registration**: On-chain identity verification
- **Access Management**: Decentralized access request/approval workflow

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
├── frontend/                 # React frontend application
│   ├── public/               # Static assets
│   └── src/
│       ├── components/       # Reusable UI components
│       ├── context/          # React context providers
│       ├── types/            # TypeScript type definitions
│       ├── config/           # Application configuration
│       ├── App.tsx           # Main application component
│       └── index.tsx         # Application entry point
│
├── .gitignore               # Git ignore rules
├── package.json             # Root project dependencies
└── README.md                # This file
```

## ⚙️ Algorithms & Workflow

### 1. User Registration Flow
1. User connects MetaMask wallet
2. System checks if wallet is already registered
3. If not registered, user pays registration fee in BSCIAM tokens
4. Smart contract creates new user identity with initial reputation score
5. User receives confirmation and access to the dashboard

### 2. Access Request Workflow
1. User requests access to a resource
2. System verifies user's reputation score and permissions
3. If requirements met, access is granted temporarily
4. Resource usage is monitored and logged
5. After session ends, reputation is updated based on behavior

### 3. Reputation Algorithm
- **Base Score**: Initial score assigned on registration
- **Positive Actions**:
  - Successful access requests (+5)
  - Resource usage within limits (+2)
  - Timely session termination (+3)
- **Negative Actions**:
  - Failed login attempts (-1)
  - Resource overuse (-5)
  - Security violations (-10)

### 4. Encryption & Security

#### Client-Side Encryption
- **Algorithm**: AES-256 (CBC mode with PKCS7 padding) via CryptoJS
- **Key Management**:
  - 32-byte (256-bit) hex key generated during user registration
  - The same key is required for decryption
  - Private keys never leave the user's browser

#### File Encryption Process
1. Files are read and converted to Base64
2. Encrypted using AES with a random IV (automatically managed by CryptoJS)
3. Ciphertext is stored securely
4. Decryption reverses the process using the same encryption key

#### Security Features
- **Data Protection**: All sensitive data is encrypted at rest
- **Authentication**: Smart contracts implement reentrancy guards
- **Access Control**: Role-based access control at both smart contract and application levels

> **Note**: For stronger security guarantees including tamper detection, the system can be configured to use AES-GCM (Galois/Counter Mode) for authenticated encryption upon request.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher) or yarn
- MetaMask browser extension
- Git

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

# Install frontend dependencies
cd frontend
npm install

# Install contract dependencies
cd ../contracts
npm install
```

### 3. Configure Environment
Create a `.env` file in both `frontend` and `contracts` directories with the following variables:

```env
# Frontend .env
REACT_APP_NETWORK_ID=31337  # Local Hardhat network
REACT_APP_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# Contracts .env
PRIVATE_KEY=your_private_key_here
ALCHEMY_API_KEY=your_alchemy_api_key
```

## 🔧 Smart Contracts

### BSCIAM Token (ERC20)
- **Contract Address**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **Symbol**: BSCIAM
- **Total Supply**: 1,000,000 tokens
- **Features**:
  - ERC20 compliant
  - Minting and burning capabilities
  - Pausable functionality
  - Role-based access control

### BSCIAM Authentication
- **Contract Address**: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`
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

### Start Frontend Development Server
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

## 🌐 Deployment

### Deploy to Testnet
```bash
# Deploy contracts to Goerli
npx hardhat run scripts/deploy.js --network goerli

# Build frontend for production
cd frontend
npm run build
```

### Deploy Frontend
You can deploy the frontend to any static hosting service like Vercel, Netlify, or GitHub Pages.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start both the smart contract development server and the React frontend.

### Individual Services

#### Smart Contracts
```bash
cd contracts
npm install
npm run compile
npm run deploy:local
```

#### Frontend
```bash
cd frontend
npm install
npm start
```

## 🔧 Configuration

### Contract Deployment

1. **Local Development**: Contracts are deployed to Hardhat network
2. **Sepolia Testnet**: See `contracts/sepolia-deploy-instructions.md` for deployment to Sepolia

### Environment Variables

Create a `.env` file in the `contracts` directory for Sepolia deployment:
```env
SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
```

## 🎯 Usage

1. **Connect Wallet**: Open the application and click "Connect MetaMask"
2. **Register**: If not registered, complete the registration form
3. **Dashboard**: Access the main dashboard with user statistics
4. **Access Requests**: Create and manage access requests to different resources

## 🔐 Security Features

- **Private Key Security**: Private keys never leave the user's wallet
- **Decentralized Identity**: User identity stored on blockchain
- **Reputation System**: Blockchain-based reputation scoring
- **Access Control**: Granular access management for resources

## 🎨 UI/UX Features

- **Dark Theme**: Modern dark-themed interface
- **Responsive Design**: Works on desktop and mobile devices
- **Animations**: Smooth transitions and loading states
- **Icons**: Lucide React icons for consistent design

## 📱 MetaMask Integration

The application integrates with MetaMask for:
- Wallet connection and disconnection
- Account switching
- Network switching
- Transaction signing

## 🧪 Testing

### Smart Contracts
```bash
cd contracts
npm test
```

### Frontend
```bash
cd frontend
npm test
```

## 🚀 Deployment

### Smart Contracts to Sepolia
1. Configure environment variables
2. Run deployment script:
   ```bash
   npm run deploy:sepolia
   ```

### Frontend to Production
```bash
cd frontend
npm run build
```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For support and questions, please open an issue in the repository.

---

**Built with ❤️ using React, TypeScript, Solidity, and Tailwind CSS**
