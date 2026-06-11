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

export const DEFAULT_PHOTOS_FALLBACK: Photo[] = [
  {
    id: "init-1",
    url: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=1200",
    category: "engagement",
    uploadedBy: "Inspiración",
    uploadedAt: "2024-06-14T10:00:00.000Z",
    likes: 12,
    comments: []
  },
  {
    id: "init-2",
    url: "https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=1200",
    category: "civil",
    uploadedBy: "Inspiración",
    uploadedAt: "2024-06-14T11:00:00.000Z",
    likes: 8,
    comments: []
  },
  {
    id: "init-3",
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200",
    category: "ceremony",
    uploadedBy: "Inspiración",
    uploadedAt: "2024-06-14T14:30:00.000Z",
    likes: 24,
    comments: []
  },
  {
    id: "init-4",
    url: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&q=80&w=1200",
    category: "reception",
    uploadedBy: "Inspiración",
    uploadedAt: "2024-06-14T19:00:00.000Z",
    likes: 35,
    comments: []
  }
];
