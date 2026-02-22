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
import { Chapter, ChapterCreate } from '../../models/chapter.model';

@Injectable({ providedIn: 'root' })
export class ChapterService {
  private firestore = inject(Firestore);

  getChapters(novelId: string): Observable<Chapter[]> {
    const q = query(
      collection(this.firestore, 'chapters'),
      where('novelId', '==', novelId),
      orderBy('order', 'asc'),
    );
    return collectionData(q, { idField: 'id' }) as Observable<Chapter[]>;
  }

  async create(data: ChapterCreate): Promise<string> {
    const ref = await addDoc(collection(this.firestore, 'chapters'), {
      ...data,
      content: '',
      wordCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  }

  async save(id: string, content: string): Promise<void> {
    const wordCount = content
      .replace(/<[^>]*>/g, '')
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    await updateDoc(doc(this.firestore, 'chapters', id), {
      content,
      wordCount,
      updatedAt: serverTimestamp(),
    });
  }

  async rename(id: string, title: string): Promise<void> {
    await updateDoc(doc(this.firestore, 'chapters', id), { title, updatedAt: serverTimestamp() });
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'chapters', id));
  }

  async reorder(chapters: { id: string; order: number }[]): Promise<void> {
    await Promise.all(
      chapters.map(({ id, order }) => updateDoc(doc(this.firestore, 'chapters', id), { order })),
    );
  }
}
