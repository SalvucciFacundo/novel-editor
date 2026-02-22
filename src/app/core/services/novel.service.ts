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
  Timestamp,
} from '@angular/fire/firestore';
import { Novel, NovelCreate } from '../../models/novel.model';

@Injectable({ providedIn: 'root' })
export class NovelService {
  private firestore = inject(Firestore);

  /**
   * Obtiene las novelas del usuario dado su UID.
   * Usa getDocs (una sola consulta) para máxima compatibilidad.
   */
  async getNovels(uid: string): Promise<Novel[]> {
    const q = query(
      collection(this.firestore, 'novels'),
      where('ownerId', '==', uid),
    );
    const snapshot = await getDocs(q);
    const novels = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Novel,
    );
    return novels.sort((a, b) => {
      const aTime = (a.updatedAt as unknown as Timestamp)?.toMillis?.() ?? 0;
      const bTime = (b.updatedAt as unknown as Timestamp)?.toMillis?.() ?? 0;
      return bTime - aTime;
    });
  }

  /** Crea una nueva novela y retorna su ID */
  async create(data: NovelCreate): Promise<string> {
    const ref = collection(this.firestore, 'novels');
    const docRef = await addDoc(ref, {
      ...data,
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
    const ref = doc(this.firestore, 'novels', id);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  }

  /** Elimina una novela */
  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'novels', id));
  }
}
