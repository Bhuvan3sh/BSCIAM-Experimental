export interface WalletState {
  isConnected: boolean;
  account: string | null;
  chainId: string | null;
  balance: string | null;
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

export interface AppState {
  wallet: WalletState;
  userProfile: UserProfile | null;
  isRegistered: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  encryptedData: string;
  metadata: {
    name: string;
    originalName: string;
    type: string;
    mimeType: string;
    size: number;
    lastModified: number;
    key?: string; // Optional encryption key reference
  };
}

export interface FileMetadata {
  name: string;
  originalName: string;
  type: string;
  mimeType: string;
  size: number;
  lastModified: number;
  key?: string; // Optional encryption key reference
}

export interface EncryptedFile {
  encryptedData: string;
  metadata: FileMetadata;
}
