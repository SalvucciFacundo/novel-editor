import { Timestamp } from 'firebase/firestore';

export interface Character {
  id: string;
  novelId: string;
  name: string;
  role?: string; // protagonista, antagonista, secundario, etc.
  description?: string;
  traits?: string[];
  createdAt: Timestamp;
}

export type CharacterCreate = Omit<Character, 'id' | 'createdAt'>;
