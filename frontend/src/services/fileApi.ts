const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export interface UploadFileRequest {
  fileId: string;
  encryptedData: string;
  metadata: {
    name: string;
    type: string;
    size: number;
    lastModified: number;
    originalName?: string;
    mimeType?: string;
  };
  walletAddress: string;
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
  };
}

export interface EncryptedFileResponse {
  encryptedData: string;
}

class FileApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'FileApiError';
  }
}

/**
 * File API service for communicating with the backend server
 */
export const fileApi = {
  /**
   * Upload an encrypted file to the server
   */
  async uploadFile(data: UploadFileRequest): Promise<{ fileId: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/files/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new FileApiError(
          errorData.error || 'Failed to upload file',
          response.status,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof FileApiError) {
        throw error;
      }
      throw new FileApiError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  /**
   * Get all files for a wallet address (metadata only)
   */
  async getFiles(walletAddress: string): Promise<StoredFile[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/files?walletAddress=${encodeURIComponent(walletAddress)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new FileApiError(
          errorData.error || 'Failed to fetch files',
          response.status,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof FileApiError) {
        throw error;
      }
      throw new FileApiError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  /**
   * Get encrypted file content by file ID
   */
  async getEncryptedFile(
    fileId: string,
    walletAddress: string
  ): Promise<EncryptedFileResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/files/${fileId}/encrypted?walletAddress=${encodeURIComponent(walletAddress)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new FileApiError(
          errorData.error || 'Failed to fetch encrypted file',
          response.status,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof FileApiError) {
        throw error;
      }
      throw new FileApiError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  /**
   * Update/modify an existing file
   */
  async updateFile(
    fileId: string,
    encryptedData: string,
    metadata: any,
    walletAddress: string
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          encryptedData,
          metadata,
          walletAddress,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new FileApiError(
          errorData.error || 'Failed to update file',
          response.status,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof FileApiError) {
        throw error;
      }
      throw new FileApiError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  /**
   * Delete a file
   */
  async deleteFile(fileId: string, walletAddress: string): Promise<void> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/files/${fileId}?walletAddress=${encodeURIComponent(walletAddress)}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new FileApiError(
          errorData.error || 'Failed to delete file',
          response.status,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof FileApiError) {
        throw error;
      }
      throw new FileApiError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
};

