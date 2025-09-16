import CryptoJS from 'crypto-js';
import { saveAs } from 'file-saver';
import { FileMetadata, EncryptedFile } from '../types';

// Generate a random encryption key for the user
export const generateEncryptionKey = (): string => {
  return CryptoJS.lib.WordArray.random(256/8).toString(CryptoJS.enc.Hex);
};

// Encrypt a file using AES
export const encryptFile = async (
  file: File, 
  key: string
): Promise<EncryptedFile> => {
  console.log('[cryptoUtils] Starting file encryption...', { 
    fileName: file.name, 
    fileSize: file.size,
    fileType: file.type,
    keyLength: key?.length 
  });

  return new Promise((resolve, reject) => {
    if (!file) {
      const error = new Error('No file provided');
      console.error('[cryptoUtils]', error.message);
      return reject(error);
    }

    if (!key) {
      const error = new Error('No encryption key provided');
      console.error('[cryptoUtils]', error.message);
      return reject(error);
    }

    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        console.log('[cryptoUtils] File read successfully');
        
        if (!event.target?.result) {
          const error = new Error('Failed to read file: No result from FileReader');
          console.error('[cryptoUtils]', error.message);
          return reject(error);
        }
        
        console.log('[cryptoUtils] Converting file to WordArray...');
        const fileData = event.target.result as ArrayBuffer;
        const wordArray = CryptoJS.lib.WordArray.create(fileData as any);
        
        console.log('[cryptoUtils] Encrypting file data...');
        const encrypted = CryptoJS.AES.encrypt(
          wordArray.toString(CryptoJS.enc.Base64),
          key
        );

        console.log('[cryptoUtils] File encrypted, creating metadata...');
        const metadata: FileMetadata = {
          name: file.name,
          originalName: file.name,
          type: file.type,
          mimeType: file.type,
          size: file.size,
          lastModified: file.lastModified
        };

        const result = {
          encryptedData: encrypted.toString(),
          metadata
        };

        console.log('[cryptoUtils] Encryption completed successfully');
        resolve(result);
      } catch (error) {
        console.error('[cryptoUtils] Error during encryption:', error);
        reject(error);
      }
    };

    reader.onerror = (error) => {
      console.error('[cryptoUtils] FileReader error:', error);
      reject(new Error(`Failed to read file: ${error}`));
    };

    reader.onabort = () => {
      const error = new Error('File reading was aborted');
      console.error('[cryptoUtils]', error.message);
      reject(error);
    };

    console.log('[cryptoUtils] Starting file read...');
    reader.readAsArrayBuffer(file);
  });
};

// Decrypt a file
export const decryptFile = async (
  encryptedFile: EncryptedFile, 
  key: string
): Promise<Blob> => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedFile.encryptedData, key);
    const decryptedBase64 = decrypted.toString(CryptoJS.enc.Utf8);
    
    // Convert base64 to ArrayBuffer
    const binaryString = window.atob(decryptedBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return new Blob([bytes], { type: encryptedFile.metadata.type });
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt file. Please check your encryption key.');
  }
};

// Save decrypted file to user's device
export const saveDecryptedFile = (
  decryptedBlob: Blob, 
  originalName: string
): void => {
  saveAs(decryptedBlob, originalName);
};

// IndexedDB helper for storing encrypted payloads non-volatilely
const DB_NAME = 'bsciam_db';
const DB_STORE = 'files';

export const idbOpen = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const idbPutEncrypted = async (id: string, encryptedData: string): Promise<void> => {
  const db = await idbOpen();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    const store = tx.objectStore(DB_STORE);
    store.put({ id, encryptedData });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
};

export const idbGetEncrypted = async (id: string): Promise<string | null> => {
  const db = await idbOpen();
  const result = await new Promise<any>((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readonly');
    const store = tx.objectStore(DB_STORE);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return result?.encryptedData || null;
};

// Generate a deterministic key from user's wallet address and a passphrase
export const generateDeterministicKey = (
  walletAddress: string, 
  passphrase: string
): string => {
  const salt = CryptoJS.SHA256(walletAddress).toString();
  const key = CryptoJS.PBKDF2(passphrase, salt, {
    keySize: 256/32,
    iterations: 1000
  });
  return key.toString();
};
