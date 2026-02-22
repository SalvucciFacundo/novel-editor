import { Timestamp } from '@angular/fire/firestore';

export interface Chapter {
  id: string;
  novelId: string;
  title: string;
  content: string; // HTML generado por Tiptap
  order: number;
  wordCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ChapterCreate = Omit<Chapter, 'id' | 'createdAt' | 'updatedAt' | 'wordCount'>;
