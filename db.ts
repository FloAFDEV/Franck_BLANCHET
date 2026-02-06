import { Dexie, Table } from 'dexie';
import { Patient, Session, Practitioner } from './types';

// OsteoDB extends the Dexie class to manage our local IndexedDB instance.
export class OsteoDB extends Dexie {
  patients!: Table<Patient, number>;
  sessions!: Table<Session, number>;
  profile!: Table<Practitioner, number>;

  constructor() {
    super('OsteoSuiviDB');
    // Define the database schema. The versioning allows for future schema migrations.
    // We use the .version() method inherited from the Dexie base class.
    // Fix: Using the named import for Dexie ensures the 'version' method is properly inherited and recognized.
    this.version(2).stores({
      patients: '++id, lastName, firstName, gender',
      sessions: '++id, patientId, date',
      profile: 'id' // Single profile (id: 1)
    });
  }

  async resetDatabase() {
    await this.patients.clear();
    await this.sessions.clear();
    await this.profile.clear();
  }
}

export const db = new OsteoDB();