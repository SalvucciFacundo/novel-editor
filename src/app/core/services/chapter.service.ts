import { Injectable, inject } from '@angular/core';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
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

  /** Referencia a la subcolección novels/{novelId}/chapters */
  private chaptersCol(novelId: string) {
    return collection(this.firestore, 'novels', novelId, 'chapters');
  }

  /** Referencia a un documento de capítulo */
  private chapterDoc(novelId: string, chapterId: string) {
    return doc(this.firestore, 'novels', novelId, 'chapters', chapterId);
  }

  async getChapters(novelId: string): Promise<Chapter[]> {
    if (this.authService.isGuest()) return this.guestStore.getChapters(novelId);
    const snapshot = await getDocs(this.chaptersCol(novelId));
    const chapters = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Chapter);
    return chapters.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  async create(data: ChapterCreate): Promise<string> {
    if (this.authService.isGuest()) return this.guestStore.createChapter(data);
    const ref = await addDoc(this.chaptersCol(data.novelId), {
      ...data,
      content: '',
      wordCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  }

  async save(novelId: string, id: string, content: string): Promise<void> {
    if (this.authService.isGuest()) {
      this.guestStore.saveChapter(id, content);
      return;
    }
    const wordCount = content
      .replace(/<[^>]*>/g, '')
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    await updateDoc(this.chapterDoc(novelId, id), {
      content,
      wordCount,
      updatedAt: serverTimestamp(),
    });
  }

  async rename(novelId: string, id: string, title: string): Promise<void> {
    if (this.authService.isGuest()) {
      this.guestStore.renameChapter(id, title);
      return;
    }
    await updateDoc(this.chapterDoc(novelId, id), { title, updatedAt: serverTimestamp() });
  }

  async delete(novelId: string, id: string): Promise<void> {
    if (this.authService.isGuest()) {
      this.guestStore.deleteChapter(id);
      return;
    }
    await deleteDoc(this.chapterDoc(novelId, id));
  }

  async reorder(novelId: string, chapters: { id: string; order: number }[]): Promise<void> {
    if (this.authService.isGuest()) {
      this.guestStore.reorderChapters(chapters);
      return;
    }
    await Promise.all(
      chapters.map(({ id, order }) => updateDoc(this.chapterDoc(novelId, id), { order })),
    );
  }
}
