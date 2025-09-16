// Minimal ABI for BSCIAMAuth used by the frontend
export const BSCIAMAuthABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "username", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "email", "type": "string" }
    ],
    "name": "UserRegistered",
    "type": "event"
  },
  {
    "inputs": [ { "internalType": "address", "name": "_user", "type": "address" } ],
    "name": "getUserProfile",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "walletAddress", "type": "address" },
          { "internalType": "string", "name": "username", "type": "string" },
          { "internalType": "string", "name": "email", "type": "string" },
          { "internalType": "uint256", "name": "registrationTime", "type": "uint256" },
          { "internalType": "bool", "name": "isActive", "type": "bool" },
          { "internalType": "uint256", "name": "reputationScore", "type": "uint256" },
          { "internalType": "string[]", "name": "accessRoles", "type": "string[]" }
        ],
        "internalType": "struct BSCIAMAuth.UserProfile",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];


