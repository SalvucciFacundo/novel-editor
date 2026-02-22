import { Timestamp } from 'firebase/firestore';

export interface Note {
  id: string;
  novelId: string;
  title: string;
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type NoteCreate = Omit<Note, 'id' | 'createdAt' | 'updatedAt'>;
