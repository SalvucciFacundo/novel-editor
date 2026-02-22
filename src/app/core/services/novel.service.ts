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
  serverTimestamp,
} from '@angular/fire/firestore';
import { Observable, EMPTY, switchMap, map, catchError } from 'rxjs';
import { Novel, NovelCreate } from '../../models/novel.model';
import { Auth, user } from '@angular/fire/auth';
import { Timestamp } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class NovelService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  /** Stream del usuario autenticado — inicializado en contexto de inyección */
  private readonly user$ = user(this.auth);

  /**
   * Retorna las novelas del usuario autenticado de forma reactiva.
   * Usa switchMap sobre el stream de Auth para re-emitir cuando cambia el usuario.
   */
  getNovels(): Observable<Novel[]> {
    return this.user$.pipe(
      switchMap((currentUser) => {
        // EMPTY no emite nada mientras no hay usuario → el componente
        // mantiene el skeleton hasta que Firestore responda con datos reales
        if (!currentUser) return EMPTY;
        const q = query(
          collection(this.firestore, 'novels'),
          where('ownerId', '==', currentUser.uid),
        );
        return (collectionData(q, { idField: 'id' }) as Observable<Novel[]>).pipe(
          map((novels) =>
            novels.sort((a, b) => {
              const aTime = (a.updatedAt as unknown as Timestamp)?.toMillis?.() ?? 0;
              const bTime = (b.updatedAt as unknown as Timestamp)?.toMillis?.() ?? 0;
              return bTime - aTime;
            }),
          ),
          catchError(() => EMPTY),
        );
      }),
    );
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
