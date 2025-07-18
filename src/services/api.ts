
import { AuthResponse, User, Comment, WeeklyMetrics, ImportResults } from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Request failed');
    }

    return response.json();
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Auth endpoints
  async signIn(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/user/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.token);
    return response;
  }

  // User management
  async getUserDetails(userEmail: string): Promise<{ message: string; user: User }> {
    return this.request(`/user/userDetails?userEmail=${encodeURIComponent(userEmail)}`);
  }

  async updateUser(email: string, fullname: string): Promise<{ message: string; user: User }> {
    return this.request('/user/user', {
      method: 'PUT',
      body: JSON.stringify({ email, fullname }),
    });
  }

  async documentViewed(userEmail: string, documentId: string): Promise<{ message: string; user: User }> {
    return this.request('/user/documentViewed', {
      method: 'POST',
      body: JSON.stringify({ userEmail, documentId }),
    });
  }

  async updateTime(userEmail: string, timeSpent: number): Promise<{ message: string; user: User }> {
    return this.request('/user/updateTime', {
      method: 'POST',
      body: JSON.stringify({ userEmail, timeSpent }),
    });
  }

  // Analytics
  async getBiweeklyMetrics(): Promise<{
    message: string;
    currentWeek: WeeklyMetrics;
    previousWeek: WeeklyMetrics;
  }> {
    return this.request('/user/getBiweeklyMetrics');
  }

  // Comments
  async addComment(email: string, documentId: string, comment: string): Promise<{ message: string; comment: Comment }> {
    return this.request('/user/comment', {
      method: 'POST',
      body: JSON.stringify({ email, documentId, comment }),
    });
  }

  async updateComment(documentId: string, comment: string): Promise<{ message: string; comment: Comment }> {
    return this.request('/user/comment', {
      method: 'PUT',
      body: JSON.stringify({ documentId, comment }),
    });
  }

  async deleteComment(documentId: string, comment: string): Promise<{ message: string }> {
    return this.request('/user/comment', {
      method: 'DELETE',
      body: JSON.stringify({ documentId, comment }),
    });
  }

  async getComments(documentId: string): Promise<{ message: string; comments: Comment[] }> {
    return this.request(`/user/comments?documentId=${encodeURIComponent(documentId)}`);
  }

  // Recent documents
  async getRecentDocuments(userEmail: string): Promise<{ message: string; recentDocuments: string[] }> {
    return this.request(`/user/recent-documents?userEmail=${encodeURIComponent(userEmail)}`);
  }

  async addRecentDocument(userEmail: string, document: string): Promise<{ message: string; recentDocuments: string[] }> {
    return this.request('/user/recent-documents', {
      method: 'POST',
      body: JSON.stringify({ userEmail, document }),
    });
  }

  // Admin functions
  async importUsers(file: File): Promise<{ message: string; results: ImportResults }> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request('/admin/users/import', {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });
  }

  // File operations
  async listFolders(prefix: string = ''): Promise<{ folders: string[]; files: string[] }> {
    return this.request('/api/folders', {
      method: 'POST',
      body: JSON.stringify({ prefix }),
    });
  }

  async createFolder(name: string, prefix?: string): Promise<{ message: string; key: string }> {
    return this.request('/api/folders/create', {
      method: 'POST',
      body: JSON.stringify({ prefix, name }),
    });
  }

  async uploadFolderIcon(file: File, folderPath: string): Promise<{ message: string; iconUrl: string }> {
    console.log('uploadFolderIcon called with:', { fileName: file.name, folderPath });
    
    // First, get the upload URL from the backend
    const uploadResponse = await this.request<{ uploadUrl: string }>('/api/icons/upload', {
      method: 'POST',
      body: JSON.stringify({ 
        itemPath: folderPath, 
        iconType: file.type.includes('png') ? 'png' : 'jpeg' 
      }),
    });
    
    console.log('Upload URL response:', uploadResponse);
    
    if (!uploadResponse.uploadUrl) {
      throw new Error('No upload URL received from server');
    }
    
    // Now upload the file to the received URL
    const uploadResult = await fetch(uploadResponse.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });
    
    if (!uploadResult.ok) {
      const error = await uploadResult.text();
      console.error('File upload failed:', error);
      throw new Error('File upload failed');
    }
    
    console.log('File uploaded successfully');
    
    // Return success - the icon URL will be retrieved separately by getFolderIcon
    return { 
      message: 'Icon uploaded successfully', 
      iconUrl: '' // Will be populated when getFolderIcon is called
    };
  }

  async getFolderIcon(folderPath: string): Promise<{ iconUrl?: string }> {
    try {
      console.log('getFolderIcon called with path:', folderPath);
      const encodedPath = encodeURIComponent(folderPath);
      const url = `/api/icons/${encodedPath}`;
      console.log('Fetching from URL:', `${API_BASE}${url}`);
      
      const result = await this.request(url);
      console.log('getFolderIcon result:', result);
      return result;
    } catch (error) {
      console.log('getFolderIcon error:', error);
      // If it's a 404, that's expected for folders without icons
      if (error instanceof Error && error.message.includes('404')) {
        return { iconUrl: undefined };
      }
      return { iconUrl: undefined };
    }
  }

  async getFileUrl(key: string): Promise<{ url: string }> {
    return this.request('/api/files/fetch', {
      method: 'POST',
      body: JSON.stringify({ key }),
    });
  }

  async getUploadUrl(key: string): Promise<{ url: string }> {
    return this.request('/api/files/upload', {
      method: 'POST',
      body: JSON.stringify({ key }),
    });
  }

  async deleteDocument(key: string): Promise<{ message: string }> {
    return this.request('/api/files/delete', {
      method: 'DELETE',
      body: JSON.stringify({ filePath: key }),
    });
  }

  // Bookmark endpoints
  async getBookmarks(): Promise<{ bookmarks: any[] }> {
    return this.request('/user/bookmarks');
  }

  async addBookmark(itemId: string, itemType: string, itemName: string): Promise<{ message: string }> {
    return this.request('/user/bookmarks', {
      method: 'POST',
      body: JSON.stringify({ itemId, itemType, itemName }),
    });
  }

  async removeBookmark(itemId: string): Promise<{ message: string }> {
    return this.request(`/user/bookmarks/${encodeURIComponent(itemId)}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();
