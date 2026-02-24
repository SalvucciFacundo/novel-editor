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
import { Novel, NovelCreate } from '../../models/novel.model';
import { AuthService } from './auth.service';
import { GuestStoreService } from './guest-store.service';

@Injectable({ providedIn: 'root' })
export class NovelService {
  private firestore = inject(FIREBASE_FIRESTORE);
  private authService = inject(AuthService);
  private guestStore = inject(GuestStoreService);

  private clean<T extends object>(obj: T): Partial<T> {
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
  }

  /**
   * Obtiene las novelas del usuario dado su UID.
   * Usa getDocs (una sola consulta) para máxima compatibilidad.
   */
  async getNovels(uid: string): Promise<Novel[]> {
    if (this.authService.isGuest()) return this.guestStore.getNovels();
    const q = query(collection(this.firestore, 'novels'), where('ownerId', '==', uid));
    const snapshot = await getDocs(q);
    const novels = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Novel);
    return novels.sort((a, b) => {
      const aTime = (a.updatedAt as unknown as Timestamp)?.toMillis?.() ?? 0;
      const bTime = (b.updatedAt as unknown as Timestamp)?.toMillis?.() ?? 0;
      return bTime - aTime;
    });
  }

  /** Crea una nueva novela y retorna su ID */
  async create(data: NovelCreate): Promise<string> {
    if (this.authService.isGuest()) return this.guestStore.createNovel(data);
    const ref = collection(this.firestore, 'novels');
    const docRef = await addDoc(ref, {
      ...this.clean(data),
      chapterCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  /** Actualiza campos de una novela */
  async update(
    id: string,
    data: Partial<Pick<Novel, 'title' | 'description' | 'tags'>>,
  ): Promise<void> {
    if (this.authService.isGuest()) {
      this.guestStore.updateNovel(id, data);
      return;
    }
    const ref = doc(this.firestore, 'novels', id);
    await updateDoc(ref, { ...this.clean(data), updatedAt: serverTimestamp() });
  }

  /** Elimina una novela */
  async delete(id: string): Promise<void> {
    if (this.authService.isGuest()) {
      this.guestStore.deleteNovel(id);
      return;
    }
    await deleteDoc(doc(this.firestore, 'novels', id));
  }
}
