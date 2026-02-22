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
import { Character, CharacterCreate } from '../../models/character.model';

@Injectable({ providedIn: 'root' })
export class CharacterService {
  private firestore = inject(Firestore);

  getCharacters(novelId: string): Observable<Character[]> {
    const q = query(
      collection(this.firestore, 'characters'),
      where('novelId', '==', novelId),
      orderBy('name', 'asc'),
    );
    return collectionData(q, { idField: 'id' }) as Observable<Character[]>;
  }

  async create(data: CharacterCreate): Promise<string> {
    const ref = await addDoc(collection(this.firestore, 'characters'), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  }

  async update(
    id: string,
    data: Partial<Pick<Character, 'name' | 'role' | 'description' | 'traits'>>,
  ): Promise<void> {
    await updateDoc(doc(this.firestore, 'characters', id), data);
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'characters', id));
  }
}
