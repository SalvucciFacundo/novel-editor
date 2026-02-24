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
import { AuthService } from './auth.service';
import { GuestStoreService } from './guest-store.service';

@Injectable({ providedIn: 'root' })
export class NoteService {
  private firestore = inject(FIREBASE_FIRESTORE);
  private authService = inject(AuthService);
  private guestStore = inject(GuestStoreService);

  private clean<T extends object>(obj: T): Partial<T> {
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
  }

  async getNotes(novelId: string): Promise<Note[]> {
    if (this.authService.isGuest()) return this.guestStore.getNotes(novelId);
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
    if (this.authService.isGuest()) return this.guestStore.createNote(data);
    const ref = await addDoc(collection(this.firestore, 'notes'), {
      ...this.clean(data),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  }

  async update(id: string, data: Partial<Pick<Note, 'title' | 'content'>>): Promise<void> {
    if (this.authService.isGuest()) {
      this.guestStore.updateNote(id, data);
      return;
    }
    await updateDoc(doc(this.firestore, 'notes', id), {
      ...this.clean(data),
      updatedAt: serverTimestamp(),
    });
  }

  async delete(id: string): Promise<void> {
    if (this.authService.isGuest()) {
      this.guestStore.deleteNote(id);
      return;
    }
    await deleteDoc(doc(this.firestore, 'notes', id));
  }
}
