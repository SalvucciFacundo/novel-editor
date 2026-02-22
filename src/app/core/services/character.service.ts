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
import { Character, CharacterCreate } from '../../models/character.model';

@Injectable({ providedIn: 'root' })
export class CharacterService {
  private firestore = inject(Firestore);

  async getCharacters(novelId: string): Promise<Character[]> {
    const q = query(collection(this.firestore, 'characters'), where('novelId', '==', novelId));
    const snapshot = await getDocs(q);
    const characters = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Character);
    return characters.sort((a, b) => a.name.localeCompare(b.name));
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
