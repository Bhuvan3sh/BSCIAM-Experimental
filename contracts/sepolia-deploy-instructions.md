# Sepolia Testnet Deployment Instructions

## Prerequisites
1. Get Sepolia ETH from a faucet (https://sepoliafaucet.com/)
2. Get an Infura API key (https://infura.io/)
3. Get an Etherscan API key (https://etherscan.io/apis)

## Configuration Steps

1. **Create a .env file in the contracts directory:**
```bash
SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
```

2. **Update hardhat.config.js to use environment variables:**
```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_URL,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
```

3. **Deploy to Sepolia:**
```bash
npm run deploy:sepolia
```

4. **Verify contracts on Etherscan:**
```bash
npx hardhat verify --network sepolia CONTRACT_ADDRESS
```

## Current Local Deployment
- **BSCIAM Token:** 0x5FbDB2315678afecb367f032d93F642f64180aa3
- **BSCIAM Auth:** 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
- **Network:** Hardhat (Local)
- **Deployer:** 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

## Frontend Configuration
The deployment info is automatically saved to `deployments/hardhat.json` and will be copied to the frontend when it's created.
