import { Injectable, inject } from '@angular/core';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { FIREBASE_FIRESTORE } from '../firebase.tokens';
import { Note, NoteCreate } from '../../models/note.model';

@Injectable({ providedIn: 'root' })
export class NoteService {
  private firestore = inject(FIREBASE_FIRESTORE);

  async getNotes(novelId: string): Promise<Note[]> {
    const q = query(collection(this.firestore, 'notes'), where('novelId', '==', novelId));
    const snapshot = await getDocs(q);
    const notes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Note);
    return notes.sort((a, b) => {
      const aTime = (a.updatedAt as unknown as Timestamp)?.toMillis?.() ?? 0;
      const bTime = (b.updatedAt as unknown as Timestamp)?.toMillis?.() ?? 0;
      return bTime - aTime;
    });
  }

  async create(data: NoteCreate): Promise<string> {
    const ref = await addDoc(collection(this.firestore, 'notes'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  }

  async update(id: string, data: Partial<Pick<Note, 'title' | 'content'>>): Promise<void> {
    await updateDoc(doc(this.firestore, 'notes', id), { ...data, updatedAt: serverTimestamp() });
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'notes', id));
  }
}
