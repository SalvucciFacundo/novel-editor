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
import { Novel, NovelCreate } from '../../models/novel.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class NovelService {
  private firestore = inject(Firestore);
  private auth = inject(AuthService);

  /** Retorna las novelas del usuario autenticado, ordenadas por fecha de actualización */
  getNovels(): Observable<Novel[]> {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) return new Observable((s) => s.next([]));

    const ref = collection(this.firestore, 'novels');
    const q = query(ref, where('ownerId', '==', uid), orderBy('updatedAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Novel[]>;
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
