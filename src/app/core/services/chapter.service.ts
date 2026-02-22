import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Chapter, ChapterCreate } from '../../models/chapter.model';

@Injectable({ providedIn: 'root' })
export class ChapterService {
  private firestore = inject(Firestore);

  async getChapters(novelId: string): Promise<Chapter[]> {
    const q = query(collection(this.firestore, 'chapters'), where('novelId', '==', novelId));
    const snapshot = await getDocs(q);
    const chapters = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Chapter);
    return chapters.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
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
