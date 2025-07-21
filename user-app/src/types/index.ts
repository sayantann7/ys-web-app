
export interface User {
  id: string;
  email: string;
  fullname: string;
  role: string;
  createdAt: string;
  lastSignIn: string;
  numberOfSignIns: number;
  timeSpent: number;
  documentsViewed: number;
  recentDocs: string[];
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  documentId: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface WeeklyMetrics {
  timeSpent: number;
  documentsViewed: number;
  signIns: number;
  startDate: string;
  endDate: string;
}


export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface DocumentItem {
  key: string;
  name: string;
  type: 'file' | 'folder';
  lastModified?: string;
  size?: number;
}
