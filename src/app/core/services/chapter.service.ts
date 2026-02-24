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
} from 'firebase/firestore';
import { FIREBASE_FIRESTORE } from '../firebase.tokens';
import { Chapter, ChapterCreate } from '../../models/chapter.model';
import { AuthService } from './auth.service';
import { GuestStoreService } from './guest-store.service';

@Injectable({ providedIn: 'root' })
export class ChapterService {
  private firestore = inject(FIREBASE_FIRESTORE);
  private authService = inject(AuthService);
  private guestStore = inject(GuestStoreService);

  async getChapters(novelId: string): Promise<Chapter[]> {
    if (this.authService.isGuest()) return this.guestStore.getChapters(novelId);
    const q = query(collection(this.firestore, 'chapters'), where('novelId', '==', novelId));
    const snapshot = await getDocs(q);
    const chapters = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Chapter);
    return chapters.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  async create(data: ChapterCreate): Promise<string> {
    if (this.authService.isGuest()) return this.guestStore.createChapter(data);
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
    if (this.authService.isGuest()) {
      this.guestStore.saveChapter(id, content);
      return;
    }
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
    if (this.authService.isGuest()) {
      this.guestStore.renameChapter(id, title);
      return;
    }
    await updateDoc(doc(this.firestore, 'chapters', id), { title, updatedAt: serverTimestamp() });
  }

  async delete(id: string): Promise<void> {
    if (this.authService.isGuest()) {
      this.guestStore.deleteChapter(id);
      return;
    }
    await deleteDoc(doc(this.firestore, 'chapters', id));
  }

  async reorder(chapters: { id: string; order: number }[]): Promise<void> {
    if (this.authService.isGuest()) {
      this.guestStore.reorderChapters(chapters);
      return;
    }
    await Promise.all(
      chapters.map(({ id, order }) => updateDoc(doc(this.firestore, 'chapters', id), { order })),
    );
  }
}
