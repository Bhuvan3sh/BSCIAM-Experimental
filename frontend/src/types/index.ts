export interface ContractConfig {
  network: string;
  token: {
    address: string;
    name: string;
    symbol: string;
    totalSupply: string;
    decimals: number;
  };
  auth: {
    address: string;
    registrationFee: string;
    reputationReward: string;
  };
  deployer: string;
  timestamp: string;
}

export interface UserProfile {
  walletAddress: string;
  username: string;
  email: string;
  registrationTime: string;
  isActive: boolean;
  reputationScore: number;
  accessRoles: string[];
}

export interface AccessRequest {
  requester: string;
  resource: string;
  action: string;
  timestamp: string;
  isApproved: boolean;
  isProcessed: boolean;
}

export interface WalletState {
  isConnected: boolean;
  account: string | null;
  chainId: string | null;
  balance: string | null;
}

export interface AppState {
  wallet: WalletState;
  userProfile: UserProfile | null;
  isRegistered: boolean;
  isLoading: boolean;
  error: string | null;
  encryptionKey: string | null;
}
