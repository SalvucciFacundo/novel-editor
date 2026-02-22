import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Note, NoteCreate } from '../../models/note.model';

@Injectable({ providedIn: 'root' })
export class NoteService {
  private firestore = inject(Firestore);

  getNotes(novelId: string): Observable<Note[]> {
    const q = query(
      collection(this.firestore, 'notes'),
      where('novelId', '==', novelId),
      orderBy('updatedAt', 'desc'),
    );
    return collectionData(q, { idField: 'id' }) as Observable<Note[]>;
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
