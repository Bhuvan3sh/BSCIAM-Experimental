import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ethers } from 'ethers';
import { BSCIAMAuthABI } from '../config/abi';
import contracts from '../config/contracts.json';
import { StoredFile } from '../types';
import { UserProfile } from '../types';
import { idbPutEncrypted, idbGetEncrypted } from '../utils/cryptoUtils';

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletState {
  isConnected: boolean;
  account: string | null;
  chainId: string | null;
  balance: string | null;
}

interface WalletContextType {
  // Wallet state
  wallet: WalletState;
  isRegistered: boolean;
  userProfile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  encryptionKey: string | null;
  
  // Wallet methods
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  
  // User methods
  registerUser: (username: string, email?: string) => Promise<{ 
    success: boolean; 
    message: string; 
    encryptionKey?: string 
  }>;
  
  // Encryption methods
  getEncryptionKey: () => string | null;
  validateEncryptionKey: (key: string) => boolean;
  
  // File methods
  getStoredFiles: () => StoredFile[];
  storeFile: (file: StoredFile) => StoredFile[];
  uploadFile: (file: File, encryptedData: any, key: string) => Promise<StoredFile>;
  downloadFile: (fileId: string, key: string) => Promise<void>;
  deleteStoredFile: (fileId: string) => void;

  // Activity & profile
  getRecentActivities: (limit?: number) => Array<{ id: string; type: string; details?: string; timestamp: string }>;
  getAllActivities: () => Array<{ id: string; type: string; details?: string; timestamp: string }>;
  recordActivity: (type: 'login' | 'upload' | 'download' | 'delete', details?: string) => void;
  updateUsername: (newUsername: string) => void;
  getAllUsers: () => Promise<UserProfile[]>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    account: null,
    chainId: null,
    balance: null,
  });
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);

  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  // Initialize encryption key for the current account
  const initializeEncryptionKey = useCallback((account: string): string | null => {
    const key = localStorage.getItem(`encryption_key_${account}`);
    if (!key) return null;
    setEncryptionKey(key);
    return key;
  }, []);

  // Get stored files for the current user
  const getStoredFiles = useCallback((): StoredFile[] => {
    if (!wallet.account) return [];
    const files = localStorage.getItem(`files_${wallet.account}`);
    return files ? JSON.parse(files) : [];
  }, [wallet.account]);

  // Activity helpers
  const getActivities = useCallback((): Array<{ id: string; type: string; details?: string; timestamp: string }> => {
    if (!wallet.account) return [];
    const raw = localStorage.getItem(`activities_${wallet.account}`);
    return raw ? JSON.parse(raw) : [];
  }, [wallet.account]);

  const saveActivities = useCallback((activities: Array<{ id: string; type: string; details?: string; timestamp: string }>) => {
    if (!wallet.account) return;
    localStorage.setItem(`activities_${wallet.account}`, JSON.stringify(activities));
  }, [wallet.account]);

  const bumpReputation = useCallback(() => {
    if (!wallet.account) return;
    const userRaw = localStorage.getItem(`user_${wallet.account}`);
    if (!userRaw) return;
    const updated: UserProfile = { ...JSON.parse(userRaw), reputationScore: (JSON.parse(userRaw).reputationScore || 0) + 10 };
    localStorage.setItem(`user_${wallet.account}`, JSON.stringify(updated));
    setUserProfile(updated);
  }, [wallet.account]);

  const recordActivity = useCallback((type: 'login' | 'upload' | 'download' | 'delete', details?: string) => {
    if (!wallet.account) return;
    const activities = getActivities();
    const entry = { id: crypto.randomUUID(), type, details, timestamp: new Date().toISOString() };
    const updated = [entry, ...activities].slice(0, 100);
    saveActivities(updated);
    bumpReputation();
  }, [wallet.account, getActivities, saveActivities, bumpReputation]);

  // Get the user's encryption key
  const getEncryptionKey = useCallback((): string | null => {
    if (!wallet.account) return null;
    return localStorage.getItem(`encryption_key_${wallet.account}`);
  }, [wallet.account]);

  // Store a new file
  const storeFile = useCallback((file: StoredFile) => {
    if (!wallet.account) {
      throw new Error('No wallet connected');
    }
    
    const files = getStoredFiles();
    // Check if file with same name already exists
    const existingFileIndex = files.findIndex(f => f.name === file.name && f.uploadedAt === file.uploadedAt);
    
    let updatedFiles;
    if (existingFileIndex >= 0) {
      // Update existing file
      updatedFiles = [...files];
      updatedFiles[existingFileIndex] = file;
    } else {
      // Add new file
      updatedFiles = [...files, file];
    }
    
    localStorage.setItem(
      `files_${wallet.account}`, 
      JSON.stringify(updatedFiles)
    );
    // Record upload activity
    try { recordActivity('upload', file.name); } catch {}
    return updatedFiles;
  }, [wallet.account, getStoredFiles, recordActivity]);

  // Delete a file
  const deleteStoredFile = useCallback((fileId: string) => {
    if (!wallet.account) {
      throw new Error('No wallet connected');
    }
    
    const files = getStoredFiles();
    const fileToDelete = files.find(f => f.id === fileId);
    
    if (!fileToDelete) {
      throw new Error('File not found');
    }
    
    const updatedFiles = files.filter(file => file.id !== fileId);
    
    localStorage.setItem(
      `files_${wallet.account}`, 
      JSON.stringify(updatedFiles)
    );
    try { recordActivity('delete', fileToDelete.name); } catch {}
    return updatedFiles;
  }, [wallet.account, getStoredFiles, recordActivity]);

  // Get the current encryption key
  const getEncryptionKeyFromState = useCallback((): string | null => {
    return encryptionKey;
  }, [encryptionKey]);

  // Upload a file with encryption
  const uploadFile = useCallback(async (file: File, encryptedData: any, key: string): Promise<StoredFile> => {
    if (!wallet.account) {
      throw new Error('No wallet connected');
    }
    
    if (!key) {
      throw new Error('Encryption key is required');
    }
    
    if (!encryptedData) {
      throw new Error('No encrypted data provided');
    }
    
    try {
      setIsLoading(true);
      const storedFiles = getStoredFiles();
      
      // Check if file with same name already exists
      const fileExists = storedFiles.some(f => 
        f.name === file.name && 
        f.metadata?.lastModified === file.lastModified
      );
      
      if (fileExists) {
        throw new Error('A file with this name already exists');
      }
      
      const newFile: StoredFile = {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        encryptedData: '',
        metadata: {
          name: file.name,
          originalName: file.name,
          type: file.type,
          mimeType: file.type,
          size: file.size,
          lastModified: file.lastModified
        }
      };
      // Persist the encrypted payload in IndexedDB (non-volatile)
      await idbPutEncrypted(newFile.id, encryptedData.encryptedData || encryptedData);
      const updatedFiles = [...storedFiles, newFile];
      localStorage.setItem(`files_${wallet.account}`, JSON.stringify(updatedFiles));
      
      return newFile;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [wallet.account, getStoredFiles]);

  // Check if user is already registered
  const checkRegistration = useCallback(async (account: string): Promise<boolean> => {
    try {
      if (!account) return false;
      
      const userData = localStorage.getItem(`user_${account}`);
      const encryptionKey = localStorage.getItem(`encryption_key_${account}`);
      
      if (userData && encryptionKey) {
        const userProfile = JSON.parse(userData) as UserProfile;
        setUserProfile(userProfile);
        setEncryptionKey(encryptionKey);
        setIsRegistered(true);
        return true;
      }
      
      // Clear any partial data if registration is not complete
      localStorage.removeItem(`user_${account}`);
      localStorage.removeItem(`encryption_key_${account}`);
      return false;
    } catch (error) {
      console.error('Error checking registration:', error);
      setError('Failed to check user registration.');
      return false;
    }
  }, [initializeEncryptionKey]);

  // Validate encryption key against the stored key
  const validateEncryptionKey = useCallback((key: string): boolean => {
    if (!wallet.account) return false;
    const storedKey = localStorage.getItem(`encryption_key_${wallet.account}`);
    return key === storedKey;
  }, [wallet.account]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    // Note: We don't clear localStorage here to preserve user data for future logins
    setWallet({
      isConnected: false,
      account: null,
      chainId: null,
      balance: null,
    });
    setUserProfile(null);
    setIsRegistered(false);
    setIsLoading(false);
    setError(null);
    setProvider(null);
    setSigner(null);
  }, []);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('Please install MetaMask!');
      return;
    }

    try {
      setIsLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      
      setProvider(provider);
      setSigner(signer);
      setWallet({
        isConnected: true,
        account: address,
        chainId: network.chainId.toString(),
        balance: null,
      });
      setError(null);

      // Check if user is registered
      const registered = await checkRegistration(address);
      if (registered) {
        try { recordActivity('login', 'Wallet connected'); } catch {}
      }
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError('Failed to connect wallet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [checkRegistration]);

  // Register a new user
  const registerUser = useCallback(async (username: string, email: string = '') => {
    if (!wallet.account) {
      return { success: false, message: 'No wallet connected' };
    }

    try {
      setIsLoading(true);
      
      // Generate a secure encryption key for the user
      const key = Array.from(window.crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      // Create user profile according to UserProfile interface
      const newUserProfile: UserProfile = {
        walletAddress: wallet.account,
        username,
        email,
        registrationTime: new Date().toISOString(),
        isActive: true,
        reputationScore: 0,
        accessRoles: ['user']
      };

      // Store user data and encryption key in localStorage
      localStorage.setItem(`user_${wallet.account}`, JSON.stringify(newUserProfile));
      localStorage.setItem(`encryption_key_${wallet.account}`, key);
      
      // Update state
      setUserProfile(newUserProfile);
      setIsRegistered(true);
      setEncryptionKey(key);

      // Seed activities with registration considered as login
      try {
        const initialActivities = [{ id: crypto.randomUUID(), type: 'login', details: 'Registered and logged in', timestamp: new Date().toISOString() }];
        localStorage.setItem(`activities_${wallet.account}`, JSON.stringify(initialActivities));
      } catch {}
      
      // Copy the encryption key to clipboard
      try {
        await navigator.clipboard.writeText(key);
        // Also alert the user with the generated key
        try {
          window.alert(`Registration successful!\n\nYour encryption key (copy kept in clipboard):\n${key}\n\nStore this key safely; it is required for all file operations.`);
        } catch (e) {
          // no-op if alert blocked
        }
        return { 
          success: true, 
          message: 'Registration successful! Your encryption key has been copied to clipboard. Please keep it safe!',
          encryptionKey: key
        };
      } catch (clipboardError) {
        console.error('Failed to copy encryption key:', clipboardError);
        try {
          window.alert(`Registration successful!\n\nPlease copy and save your encryption key:\n${key}`);
        } catch (e) {
          // no-op
        }
        return { 
          success: true, 
          message: `Registration successful! Please copy and save your encryption key: ${key}`,
          encryptionKey: key
        };
      }
    } catch (error) {
      console.error('Registration failed:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Registration failed. Please try again.'
      };
    } finally {
      setIsLoading(false);
    }
  }, [wallet.account]);

  const updateUsername = useCallback((newUsername: string) => {
    if (!wallet.account || !userProfile) return;
    const updated: UserProfile = { ...userProfile, username: newUsername };
    localStorage.setItem(`user_${wallet.account}`, JSON.stringify(updated));
    setUserProfile(updated);
  }, [wallet.account, userProfile]);

  const getRecentActivities = useCallback((limit: number = 3) => {
    return getActivities().slice(0, limit);
  }, [getActivities]);

  const getAllActivities = useCallback(() => {
    return getActivities();
  }, [getActivities]);

  const getAllUsers = useCallback(async (): Promise<UserProfile[]> => {
    const users: UserProfile[] = [];
    // Local users (same browser)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith('user_')) {
        try {
          const parsed = JSON.parse(localStorage.getItem(key) || 'null');
          if (parsed && parsed.walletAddress) users.push(parsed);
        } catch {}
      }
    }

    // Attempt to augment with on-chain users if connected and configured
    try {
      if (provider && contracts?.auth?.address) {
        // Heuristic: scan recent UserRegistered events for a small block window
        const ethProvider = provider as unknown as ethers.BrowserProvider;
        const signer = await ethProvider.getSigner();
        const contract = new ethers.Contract(contracts.auth.address, BSCIAMAuthABI, signer);
        const currentBlock = await ethProvider.getBlockNumber();
        const fromBlock = currentBlock - 5000 > 0 ? currentBlock - 5000 : 0; // last ~5000 blocks
        // v6 queryFilter across fragments requires passing event name
        const events = await contract.queryFilter('UserRegistered', fromBlock, currentBlock);
        for (const ev of events as any[]) {
          const args: any = (ev as any).args;
          const user: string = args?.user || args?.[0];
          if (!user) continue;
          try {
            const p: any = await contract.getUserProfile(user);
            const profile: UserProfile = {
              walletAddress: p.walletAddress,
              username: p.username,
              email: p.email,
              registrationTime: new Date(Number(p.registrationTime) * 1000).toISOString(),
              isActive: Boolean(p.isActive),
              reputationScore: Number(p.reputationScore),
              accessRoles: Array.from(p.accessRoles || [])
            };
            if (!users.find(u => u.walletAddress.toLowerCase() === profile.walletAddress.toLowerCase())) {
              users.push(profile);
            }
          } catch {}
        }
      }
    } catch (e) {
      console.warn('On-chain user fetch skipped or failed:', e);
    }

    return users;
  }, [provider]);

  const value: WalletContextType = {
    wallet,
    isRegistered,
    userProfile,
    isLoading,
    error,
    encryptionKey,
    connectWallet,
    disconnectWallet,
    registerUser,
    getEncryptionKey: getEncryptionKeyFromState,
    validateEncryptionKey,
    getStoredFiles,
    storeFile,
    uploadFile,
    downloadFile: async (fileId: string, key: string) => {
      console.log('Downloading file:', fileId, 'with key:', key);
      const files = getStoredFiles();
      const file = files.find(f => f.id === fileId);
      if (!file) throw new Error('File not found');
      const encryptedPayload = await idbGetEncrypted(fileId);
      if (!encryptedPayload) throw new Error('No encrypted data found.');
      // The UI path currently uses decryptFile directly; this method is a placeholder
      return;
    },
    deleteStoredFile,
    getRecentActivities,
    getAllActivities,
    recordActivity,
    updateUsername,
    getAllUsers,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}
