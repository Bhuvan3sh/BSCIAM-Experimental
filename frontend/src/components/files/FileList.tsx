import React, { useState } from 'react';
import { Download, FileText, Image as ImageIcon, File, Key, Trash2, Edit } from 'lucide-react';
import { decryptFile, saveDecryptedFile, idbGetEncrypted } from '../../utils/cryptoUtils';
import { StoredFile } from '../../types';
import { useWallet } from '../../context/WalletContext';

interface FileListProps {
  files: StoredFile[];
  onDelete: (fileId: string) => Promise<void>;
  onModify: (fileId: string) => void;
}

const FileList: React.FC<FileListProps> = ({ files, onDelete, onModify }) => {
  const [decryptingFile, setDecryptingFile] = useState<string | null>(null);
  const [decryptionKey, setDecryptionKey] = useState('');
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { validateEncryptionKey, recordActivity } = useWallet();

  const getFileIcon = (fileType: string) => {
    if (fileType === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5 text-blue-500" />;
    }
    
    if (fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      return <FileText className="w-5 h-5 text-orange-500" />; // PPTX
    }
    
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return <FileText className="w-5 h-5 text-blue-600" />; // DOCX
    }
    
    if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        fileType === 'application/vnd.ms-excel') {
      return <FileText className="w-5 h-5 text-green-500" />; // XLSX/XLS
    }
    
    if (fileType === 'text/plain') {
      return <FileText className="w-5 h-5 text-gray-500" />; // TXT
    }
    
    return <File className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async (file: StoredFile) => {
    setActiveFile(file.id);
    setError(null);
  };

  const confirmDownload = async () => {
    if (!activeFile || !decryptionKey) {
      setError('Please enter an encryption key');
      return;
    }

    try {
      if (!validateEncryptionKey(decryptionKey)) {
        setError('Invalid encryption key.');
        return;
      }
      setDecryptingFile(activeFile);
      
      const file = files.find(f => f.id === activeFile);
      if (!file) throw new Error('File not found');

      // Decrypt the file
      const encryptedPayload = await idbGetEncrypted(file.id);
      const decryptedBlob = await decryptFile({ encryptedData: encryptedPayload || file.encryptedData, metadata: file.metadata }, decryptionKey);
      
      // Save the decrypted file
      saveDecryptedFile(decryptedBlob, file.name);

      try { recordActivity('download', file.name); } catch {}
      
      // Reset state
      setDecryptionKey('');
      setActiveFile(null);
      setError(null);
    } catch (err) {
      console.error('Download failed:', err);
      setError('Failed to decrypt file. Please check your encryption key.');
    } finally {
      setDecryptingFile(null);
    }
  };

  const cancelDownload = () => {
    setActiveFile(null);
    setDecryptionKey('');
    setError(null);
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-12 bg-dark-700 rounded-lg border border-dark-600">
        <File className="mx-auto h-12 w-12 text-dark-400" />
        <h3 className="mt-2 text-sm font-medium text-white">No files</h3>
        <p className="mt-1 text-sm text-dark-300">
          Get started by uploading a new file.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-dark-800 shadow overflow-hidden sm:rounded-md border border-dark-700 glass fade-in">
      <ul className="divide-y divide-dark-700">
        {files.map((file) => (
          <li key={file.id}>
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-primary-400 truncate">
                      {file.name}
                    </div>
                    <div className="flex items-center text-sm text-dark-300">
                      <span>{formatFileSize(file.size)}</span>
                      <span className="mx-1">•</span>
                      <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="ml-2 flex-shrink-0 flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleDownload(file)}
                    disabled={!!decryptingFile}
                    className={`btn-primary text-xs px-3 py-1.5 ${decryptingFile ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </button>
                  <button
                    type="button"
                    onClick={() => onModify(file.id)}
                    disabled={!!decryptingFile}
                    className="btn-primary text-xs px-3 py-1.5"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Modify
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      // Ask for key before deletion and validate
                      const key = window.prompt('Enter your encryption key to confirm deletion:') || '';
                      if (!key || !validateEncryptionKey(key)) {
                        setError('Deletion cancelled: invalid encryption key.');
                        return;
                      }
                      await onDelete(file.id);
                    }}
                    disabled={!!decryptingFile}
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </button>
                </div>
              </div>

              {activeFile === file.id && (
                <div className="mt-4 p-4 bg-dark-700 rounded-md border border-dark-600">
                  <div className="mb-2 text-sm font-medium text-white">
                    <Key className="inline w-4 h-4 mr-1" />
                    Enter encryption key for "{file.name}"
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="password"
                      className="input flex-1 min-w-0"
                      placeholder="Enter encryption key"
                      value={decryptionKey}
                      onChange={(e) => setDecryptionKey(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={confirmDownload}
                      disabled={!decryptionKey || decryptingFile === file.id}
                      className={`btn-primary ${(!decryptionKey || decryptingFile === file.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {decryptingFile === file.id ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Decrypting...
                        </>
                      ) : (
                        'Confirm'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={cancelDownload}
                      disabled={!!decryptingFile}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                  {error && activeFile === file.id && (
                    <p className="mt-2 text-sm text-red-400">{error}</p>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FileList;
