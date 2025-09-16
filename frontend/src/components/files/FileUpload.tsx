import React, { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { Upload, X, FileText, Image as ImageIcon, File, Copy, Check } from 'lucide-react';
import { encryptFile } from '../../utils/cryptoUtils';
import { useWallet } from '../../context/WalletContext';
import { toast } from 'react-hot-toast';
import { StoredFile } from '../../types';

interface FileUploadProps {
  onUpload: (file: File, encryptedData: any, key: string) => Promise<StoredFile | void>;
  isUploading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUpload, isUploading }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [encryptionKey, setEncryptionKey] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKeyWarning, setShowKeyWarning] = useState(false);
  const [isKeyValid, setIsKeyValid] = useState<boolean | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const keyInputRef = useRef<HTMLInputElement>(null);
  const { getEncryptionKey, validateEncryptionKey: validateKey } = useWallet();
  
  // Local encryption key validation function
  const validateEncryptionKey = (key: string): boolean => {
    if (!key) return false;
    // Require exact match to stored key; keys are 32-byte hex (64 chars)
    return (validateKey ? validateKey(key) : false);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Only allow PDF and image files
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Only PDF and image files are allowed');
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleEncryptionKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = e.target.value;
    setEncryptionKey(key);
    setShowKeyWarning(key.length > 0);
    
    // Validate key format (if needed)
    if (key.length > 0) {
      const isValid = validateEncryptionKey ? validateEncryptionKey(key) : false;
      setIsKeyValid(isValid);
    } else {
      setIsKeyValid(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      toast.success('Encryption key copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
      toast.error('Failed to copy key');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log('Submit button clicked');
    
    if (!selectedFile) {
      const errorMsg = 'Please select a file to upload';
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }
    
    if (!encryptionKey) {
      const errorMsg = 'Please enter your encryption key';
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }
    
    // Validate encryption key before proceeding
    if (!validateEncryptionKey(encryptionKey)) {
      const errorMsg = 'Invalid encryption key. It must match your registered key.';
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }
    
    try {
      console.log('Starting file encryption...');
      setIsEncrypting(true);
      setError(null);
      
      // Get or use the provided encryption key
      const key = (keyInputRef.current?.value || encryptionKey).trim();
      console.log('Using encryption key:', key ? '*** (key present)' : 'No key provided');
      
      // Encrypt the file
      console.log('Encrypting file:', selectedFile.name);
      const encryptedData = await encryptFile(selectedFile, key);
      
      if (!encryptedData || !encryptedData.encryptedData) {
        throw new Error('Failed to encrypt file: No encrypted data returned');
      }
      console.log('File encrypted successfully');
      
      // Call the parent's upload handler
      console.log('Calling onUpload handler...');
      await onUpload(selectedFile, encryptedData, key);
      
      // Reset form
      console.log('Resetting form...');
      setSelectedFile(null);
      setEncryptionKey('');
      setIsKeyValid(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (keyInputRef.current) {
        keyInputRef.current.value = '';
      }
      
      console.log('File upload completed successfully');
      toast.success('File encrypted and uploaded successfully!');
    } catch (err) {
      console.error('Error encrypting file:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to encrypt file. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsEncrypting(false);
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return <File className="w-6 h-6" />;
    
    if (selectedFile.type === 'application/pdf') {
      return <FileText className="w-6 h-6 text-red-500" />;
    }
    
    if (selectedFile.type.startsWith('image/')) {
      return <ImageIcon className="w-6 h-6 text-blue-500" />;
    }
    
    return <File className="w-6 h-6" />;
  };

  return (
    <form onSubmit={handleSubmit}>
    <div className="bg-dark-800 p-6 rounded-lg shadow-md border border-dark-700 glass fade-in">
      <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
        <Upload className="w-5 h-5 mr-2" />
        Upload File
      </h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-white mb-2">
          Select File (PDF or Image)
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dark-600 border-dashed rounded-md card-hover">
          <div className="space-y-1 text-center">
            {selectedFile ? (
              <div className="flex items-center justify-between p-2 bg-dark-700 rounded border border-dark-600">
                <div className="flex items-center">
                  {getFileIcon()}
                  <span className="ml-2 text-sm text-white truncate max-w-xs">
                    {selectedFile.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-dark-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-center">
                  <Upload className="mx-auto h-12 w-12 text-dark-400" />
                </div>
                <div className="flex text-sm text-dark-300">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-dark-700 rounded-md font-medium text-primary-400 hover:text-primary-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      accept=".pdf,.jpg,.jpeg,.png,.gif"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-dark-400">
                  PDF, JPG, PNG, GIF up to 10MB
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="encryptionKey" className="block text-sm font-medium text-white">
            Encryption Key
          </label>
          {getEncryptionKey && (
            <button
              type="button"
              onClick={() => {
                const key = getEncryptionKey();
                if (key) {
                  setEncryptionKey(key);
                  setIsKeyValid(true);
                  copyToClipboard(key);
                }
              }}
              className="text-xs text-primary-400 hover:text-primary-300 flex items-center"
              title="Copy your encryption key"
            >
              {isCopied ? (
                <Check className="w-3.5 h-3.5 mr-1" />
              ) : (
                <Copy className="w-3.5 h-3.5 mr-1" />
              )}
              {isCopied ? 'Copied!' : 'Copy Key'}
            </button>
          )}
        </div>
        <div className="relative">
          <input
            type="password"
            id="encryptionKey"
            ref={keyInputRef}
            value={undefined as any}
            onChange={handleEncryptionKeyChange}
            className={`input ${
              isKeyValid === false ? 'border-red-500' : ''
            }`}
            placeholder="Enter your encryption key"
            required
          />
          {isKeyValid === false && (
            <p className="mt-1 text-sm text-red-400">Invalid encryption key. Key must be at least 16 characters long.</p>
          )}
          <p className="mt-1 text-xs text-dark-400">
            This key will be used to encrypt your file. Keep it safe as it's required for decryption.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!selectedFile || !encryptionKey || isEncrypting}
          className={`btn-primary ${
            !selectedFile || !encryptionKey || isEncrypting
              ? 'opacity-50 cursor-not-allowed'
              : ''
          }`}
        >
          {isEncrypting ? 'Encrypting...' : 'Encrypt & Upload'}
        </button>
      </div>
    </div>
    </form>
  );
};

export default FileUpload;
