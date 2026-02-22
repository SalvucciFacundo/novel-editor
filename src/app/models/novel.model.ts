import { Timestamp } from 'firebase/firestore';

export interface Novel {
  id: string;
  title: string;
  description: string;
  coverUrl?: string;
  ownerId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  chapterCount: number;
  tags: string[];
}

export type NovelCreate = Omit<Novel, 'id' | 'createdAt' | 'updatedAt' | 'chapterCount'>;
