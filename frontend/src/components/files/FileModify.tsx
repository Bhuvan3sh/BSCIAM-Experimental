import React, { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { Edit, X, FileText, Image as ImageIcon, File, Copy, Check } from 'lucide-react';
import { encryptFile } from '../../utils/cryptoUtils';
import { useWallet } from '../../context/WalletContext';
import { toast } from 'react-hot-toast';
import { StoredFile } from '../../types';

interface FileModifyProps {
  file: StoredFile;
  onModify: (file: File, encryptedData: any, key: string) => Promise<StoredFile | void>;
  onCancel: () => void;
  isModifying: boolean;
}

const FileModify: React.FC<FileModifyProps> = ({ file, onModify, onCancel, isModifying }) => {
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
  
  // Helper function to convert MIME type to user-friendly name
  const getFileTypeName = (mimeType: string): string => {
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType.startsWith('image/')) {
      const ext = mimeType.split('/')[1].toUpperCase();
      return ext === 'JPEG' ? 'JPG' : ext;
    }
    if (mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return 'PPTX';
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'DOCX';
    if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'XLSX';
    if (mimeType === 'application/vnd.ms-excel') return 'XLS';
    if (mimeType === 'text/plain') return 'TXT';
    // Extract extension from MIME type or return a simplified version
    return mimeType.split('/').pop()?.toUpperCase() || 'File';
  };
  
  // Local encryption key validation function
  const validateEncryptionKey = (key: string): boolean => {
    if (!key) return false;
    // Require exact match to stored key; keys are 32-byte hex (64 chars)
    return (validateKey ? validateKey(key) : false);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newFile = e.target.files?.[0];
    if (!newFile) return;

    // Validate file name matches the existing file
    if (newFile.name !== file.name) {
      setError(`File name must match the existing file. Expected: ${file.name}, Got: ${newFile.name}`);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validate file type matches the existing file
    if (newFile.type !== file.type) {
      setError(`File type must match the existing file. Expected: ${file.type}, Got: ${newFile.type}`);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Allow PDF, images, Office documents, and text files
    const validTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
      'application/vnd.ms-excel', // XLS
      'text/plain' // TXT
    ];
    if (!validTypes.includes(newFile.type)) {
      setError('Only PDF, images, Office documents (PPTX, DOCX, XLSX), and text files are allowed');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setSelectedFile(newFile);
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
    console.log('Modify submit button clicked');
    
    if (!selectedFile) {
      const errorMsg = 'Please select a file to replace the existing one';
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

    // Validate file name matches
    if (selectedFile.name !== file.name) {
      const errorMsg = `File name must match the existing file. Expected: ${file.name}, Got: ${selectedFile.name}`;
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    // Validate file type matches
    if (selectedFile.type !== file.type) {
      const errorMsg = `File type must match the existing file. Expected: ${file.type}, Got: ${selectedFile.type}`;
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }
    
    try {
      console.log('Starting file encryption for modification...');
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
      
      // Call the parent's modify handler
      console.log('Calling onModify handler...');
      await onModify(selectedFile, encryptedData, key);
      
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
      
      console.log('File modification completed successfully');
      toast.success('File modified successfully!');
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
    
    if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      return <FileText className="w-6 h-6 text-orange-500" />; // PPTX
    }
    
    if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return <FileText className="w-6 h-6 text-blue-600" />; // DOCX
    }
    
    if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        selectedFile.type === 'application/vnd.ms-excel') {
      return <FileText className="w-6 h-6 text-green-500" />; // XLSX/XLS
    }
    
    if (selectedFile.type === 'text/plain') {
      return <FileText className="w-6 h-6 text-gray-500" />; // TXT
    }
    
    return <File className="w-6 h-6" />;
  };

  return (
    <form onSubmit={handleSubmit}>
    <div className="bg-dark-800 p-6 rounded-lg shadow-md border border-dark-700 glass fade-in">
      <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
        <Edit className="w-5 h-5 mr-2" />
        Modify File: {file.name}
      </h3>
      
      <div className="mb-4 p-3 bg-dark-700 rounded border border-dark-600">
        <p className="text-sm text-dark-300 mb-1">Current File:</p>
        <p className="text-sm font-medium text-white">{file.name}</p>
        <p className="text-xs text-dark-400">Type: {getFileTypeName(file.type)} • Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
        <p className="text-xs text-yellow-400 mt-2">⚠️ The new file must have the same name and type</p>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-white mb-2">
          Select Replacement File
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
                  <Edit className="mx-auto h-12 w-12 text-dark-400" />
                </div>
                <div className="flex text-sm text-dark-300">
                  <label
                    htmlFor="file-modify"
                    className="relative cursor-pointer bg-dark-700 rounded-md font-medium text-primary-400 hover:text-primary-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                  >
                    <span>Select replacement file</span>
                    <input
                      id="file-modify"
                      name="file-modify"
                      type="file"
                      className="sr-only"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      accept={file.type === 'application/pdf' ? '.pdf' : 
                              file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ? '.pptx' :
                              file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? '.docx' :
                              file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ? '.xlsx' :
                              file.type === 'application/vnd.ms-excel' ? '.xls' :
                              file.type === 'text/plain' ? '.txt' :
                              '.jpg,.jpeg,.png,.gif'}
                    />
                  </label>
                </div>
                <p className="text-xs text-dark-400">
                  Must be a {getFileTypeName(file.type)} file with the same name: "{file.name}"
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
            This key will be used to encrypt the replacement file. Keep it safe as it's required for decryption.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isEncrypting || isModifying}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!selectedFile || !encryptionKey || isEncrypting || isModifying}
          className={`btn-primary ${
            !selectedFile || !encryptionKey || isEncrypting || isModifying
              ? 'opacity-50 cursor-not-allowed'
              : ''
          }`}
        >
          {isEncrypting ? 'Encrypting...' : isModifying ? 'Modifying...' : 'Encrypt & Modify'}
        </button>
      </div>
    </div>
    </form>
  );
};

export default FileModify;

