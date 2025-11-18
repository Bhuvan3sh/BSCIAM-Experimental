import React, { useState, useEffect } from 'react';
import FileUpload from './FileUpload';
import FileModify from './FileModify';
import FileList from './FileList';
import { StoredFile } from '../../types';
import { PlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useWallet } from '../../context/WalletContext';

interface FileManagerProps {
  walletAddress: string;
}

const FileManager: React.FC<FileManagerProps> = ({ walletAddress }) => {
  const { getStoredFiles, storeFile, deleteStoredFile, modifyFile } = useWallet();
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [modifyingFileId, setModifyingFileId] = useState<string | null>(null);
  const [isModifying, setIsModifying] = useState(false);

  // Load user's files on component mount and when wallet address changes
  useEffect(() => {
    const loadFiles = async () => {
      try {
        if (walletAddress) {
          const userFiles = await getStoredFiles();
          console.log('Loaded user files:', userFiles);
          setFiles(userFiles);
        } else {
          setFiles([]);
        }
      } catch (error) {
        console.error('Error loading files:', error);
        setFiles([]);
      }
    };

    loadFiles();
  }, [walletAddress, getStoredFiles]);

  const handleFileUpload = async (file: File, encryptedData: any, key: string): Promise<StoredFile | void> => {
    console.log('[FileManager] handleFileUpload called with:', { 
      fileName: file?.name, 
      hasEncryptedData: !!encryptedData,
      keyLength: key?.length
    });

    if (!walletAddress) {
      const errorMsg = 'No wallet connected';
      console.error('[FileManager]', errorMsg);
      throw new Error(errorMsg);
    }
    
    if (!encryptedData || !encryptedData.encryptedData) {
      const errorMsg = 'No encrypted data received';
      console.error('[FileManager]', errorMsg, { encryptedData });
      throw new Error(errorMsg);
    }
    
    setIsUploading(true);
    
    try {
      console.log('[FileManager] Creating file object...');
      // Create the file object
      const newFile: StoredFile = {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        encryptedData: encryptedData.encryptedData,
        metadata: {
          name: file.name,
          originalName: file.name,
          type: file.type,
          mimeType: file.type,
          size: file.size,
          lastModified: file.lastModified
        }
      };
      
      console.log('[FileManager] New file object created:', { 
        id: newFile.id,
        name: newFile.name,
        size: newFile.size,
        hasEncryptedData: !!newFile.encryptedData
      });
      
      // Store the file using the wallet context (uploads to server)
      console.log('[FileManager] Storing file...');
      const updatedFiles = await storeFile(newFile);
      console.log('[FileManager] File stored. Updated files count:', updatedFiles.length);
      
      // Update local state
      setFiles(updatedFiles);
      
      // Close the upload modal
      setShowUploadModal(false);
      
      toast.success('File uploaded successfully!');
      console.log('[FileManager] Upload completed successfully');
      return newFile;
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!walletAddress) return;
    
    if (!window.confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return;
    }
    
    try {
      // Delete the file using the wallet context (from server)
      await deleteStoredFile(fileId);
      
      // Refresh files from server
      const updatedFiles = await getStoredFiles();
      setFiles(updatedFiles);
      
    } catch (error) {
      console.error('Failed to delete file:', error);
      toast.error('Failed to delete file. Please try again.');
    }
  };

  const handleModifyFile = async (file: File, encryptedData: any, key: string): Promise<StoredFile | void> => {
    console.log('[FileManager] handleModifyFile called with:', { 
      fileName: file?.name, 
      hasEncryptedData: !!encryptedData,
      keyLength: key?.length,
      fileId: modifyingFileId
    });

    if (!walletAddress) {
      const errorMsg = 'No wallet connected';
      console.error('[FileManager]', errorMsg);
      throw new Error(errorMsg);
    }
    
    if (!modifyingFileId) {
      const errorMsg = 'No file selected for modification';
      console.error('[FileManager]', errorMsg);
      throw new Error(errorMsg);
    }
    
    if (!encryptedData || !encryptedData.encryptedData) {
      const errorMsg = 'No encrypted data received';
      console.error('[FileManager]', errorMsg, { encryptedData });
      throw new Error(errorMsg);
    }
    
    setIsModifying(true);
    
    try {
      console.log('[FileManager] Modifying file...');
      // Modify the file using the wallet context (updates on server)
      const updatedFile = await modifyFile(modifyingFileId, file, encryptedData, key);
      console.log('[FileManager] File modified. Updated file:', updatedFile);
      
      // Refresh files from server
      const updatedFiles = await getStoredFiles();
      setFiles(updatedFiles);
      
      // Close the modify modal
      setModifyingFileId(null);
      
      toast.success('File modified successfully!');
      console.log('[FileManager] Modification completed successfully');
      return updatedFile;
    } catch (error) {
      console.error('File modification failed:', error);
      throw error;
    } finally {
      setIsModifying(false);
    }
  };

  const handleModifyClick = (fileId: string) => {
    setModifyingFileId(fileId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center fade-in">
        <h2 className="text-2xl font-bold text-white">My Files</h2>
        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="btn-primary glow"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Upload File
        </button>
      </div>

      <div className="card glass card-hover">
        <FileList 
          files={files} 
          onDelete={handleDeleteFile} 
          onModify={handleModifyClick}
        />
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-black opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-dark-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-dark-700 glass">
              <div className="bg-dark-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-white mb-4">
                      Upload File
                    </h3>
                    <div className="mt-2">
                      <FileUpload 
                        onUpload={handleFileUpload} 
                        isUploading={isUploading} 
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-dark-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="btn-secondary"
                  disabled={isUploading}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modify Modal */}
      {modifyingFileId && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-black opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-dark-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-dark-700 glass">
              <div className="bg-dark-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="mt-2">
                      <FileModify 
                        file={files.find(f => f.id === modifyingFileId)!}
                        onModify={handleModifyFile} 
                        onCancel={() => setModifyingFileId(null)}
                        isModifying={isModifying} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManager;
