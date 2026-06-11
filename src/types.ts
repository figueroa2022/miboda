export interface PhotoComment {
  id: string;
  username: string;
  text: string;
  createdAt: string;
}

export interface Photo {
  id: string;
  url: string;
  category: 'engagement' | 'civil' | 'ceremony' | 'reception';
  uploadedBy: string;
  uploadedAt: string;
  likes: number;
  comments: PhotoComment[];
  title?: string;
  caption?: string;
}

export type CategoryKey = 'engagement' | 'civil' | 'ceremony' | 'reception';

export interface CategoryInfo {
  key: CategoryKey;
  label: string;
  description: string;
  bgClass: string;
  borderColor: string;
}
