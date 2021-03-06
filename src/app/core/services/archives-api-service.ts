import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Rightist } from '../types/adminpage.types';

@Injectable({
  providedIn: 'root',
})
export class ArchieveApiService {
  user: any;
  cache: any = {};
  constructor(private db: AngularFireDatabase) {}

  /** New API */
  getAllArchieve() {
    return this.db.object('/persons/requestArchieve/persons').valueChanges();
  }

  getArchiveList() {
    return this.db.list('/persons/requestArchieve/persons').valueChanges();
  }

  getPersonById(id: string) {
    return this.db
      .object(`/persons/requestArchieve/persons/${id}`)
      .valueChanges();
  }

  // Admin Update arch
  editArchieveById(obj: any, id: string) {
    const arch = this.db.database
      .ref(`/persons/requestArchieve/persons`)
      .once('value', (v) => {
        const o = v.val();
        if (!o?.[id]) {
          throw new Error(`${id} is not found`);
        } else {
          v.ref.update({ [id]: obj });
        }
      });
    return arch;
  }

  removeArchieveById(id: string) {
    const arch = this.db.database
      .ref(`/persons/requestArchieve/persons`)
      .once('value', (v) => {
        const o = v.val();
        if (!o?.[id]) {
          throw new Error(`${id} is not found`);
        } else {
          delete o[id];
          v.ref.set(o);
        }
      });
    // return arch.update({ A001: obj})
    return arch;
  }

  addNewArchieve(obj: Rightist) {
    // update function with type and required value
    return this.db
      .object(`/persons/requestArchieve/persons`)
      .update({ [obj.rightistId]: obj });
  }

  /**
   * There follow api is for the old schema.
   */
  getArchieveByAlphabet(alphabet: string) {
    return this.db.list(`/persons/publics/${alphabet}`).valueChanges();
  }

  getArchieveEventsByAlphabet(alphabet: string) {
    return this.db.list(`/persons/publics/${alphabet}/events`).valueChanges();
  }

  getArchievePersonByAlphabet(alphabet: string) {
    const path = alphabet ? `${alphabet}/persons` : alphabet;
    return this.db.list(`/persons/publics/${path}`).valueChanges();
  }

  getEventByAlphabetAndEventId(alphabet: string, id: string) {
    return this.db
      .list(`/persons/publics/${alphabet}/events`, (ref) =>
        ref.orderByChild('event_id').equalTo(id)
      )
      .valueChanges();
  }

  getEventByAlphabetAndPersonId(alphabet: string, id: string) {
    return this.db
      .list(`/persons/publics/${alphabet}/events`, (ref) =>
        ref.orderByChild('person_id').equalTo(id)
      )
      .valueChanges();
  }

  getPersonByAlphabetAndPersonId(alphabet: string, id: string) {
    return this.db
      .list(`/persons/publics/${alphabet}/persons`, (ref) =>
        ref.orderByChild('person_id').equalTo(id)
      )
      .valueChanges();
  }

  // Admin Functions
  adminAddPersonByAlphabet(alphabet: string, data: any) {
    return this.db.list(`/persons/publics/${alphabet}/persons`).push(data);
  }

  adminAddEventByAlphabet(alphabet: string, data: any) {
    return this.db.list(`/persons/publics/${alphabet}/events`).push(data);
  }
  // if we use array format, we can use push() to add new item
  // Ex: [{}, {}, {}]
  adminUpdatePersonByAlphabetAndPersonId(alphabet: string, data: any) {
    var ref = this.db.database.ref(`/persons/publics/${alphabet}/persons`);
    return ref
      .orderByChild('person_id')
      .equalTo(data.person_id)
      .once('value', function (snapshot) {
        snapshot.forEach(function (e) {
          e.ref.update(data);
        });
      });
  }

  // key value pair is person_id: data. Scenario: update person_id--1 to data--{name: "new name"}
  // if we use object. key is person_id, we can use update() to update person_id: 1 to data: {name: "new name"}
  // Ex : {A1: {}, A2: {}, A3: {}}
  adminUpdateEventByAlphabetAndEventId(alphabet: string, data: any) {
    this.db
      .object(`/persons/publics/${alphabet}/events/${data.event_id}`)
      .update(data);
  }
  adminUpdateEventByAlphabetAndPersonId(alphabet: string, data: any) {
    this.db
      .object(`/persons/publics/${alphabet}/persons/${data.person_id}`)
      .update(data);
  }

  getPersonsByLetter(letter: string, limit: number) {
    return this.db
      .list(`/persons/publics/${letter}/persons`, (ref) =>
        ref.limitToFirst(limit)
      )
      .valueChanges();
  }

  // new APIs: for sample data and need fix if the db data changes.
  getTestDataPersonByIntial(letter: string) {
    return this.db
      .list(`/persons/requestArchieve/persons`, (ref) =>
        ref.orderByChild('initial').equalTo(letter)
      )
      .valueChanges();
  }

  getTestDataPersonByPersons() {
    return this.db.list(`/persons/requestArchieve/persons`).valueChanges();
  }

  getTestDataPersonByEvent(word: string) {
    return this.db
      .list(`/persons/requestArchieve/persons`, (ref) =>
        ref.orderByChild('event').equalTo(word)
      )
      .valueChanges();
  }
}
