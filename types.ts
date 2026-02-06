
export type Gender = 'M' | 'F';

export interface Patient {
  id?: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: Gender;
  phone: string;
  email: string;
  profession: string;
  medicalHistory: string;
  photo?: string; // Base64
  createdAt: number;
}

export interface Session {
  id?: number;
  patientId: number;
  date: string;
  hdlm: string; // Histoire de la maladie / Motif
  tests: string;
  treatment: string;
  advice: string;
  createdAt: number;
}

export interface Practitioner {
  id: number;
  firstName: string;
  lastName: string;
  photo?: string;
  themeColor: string; // Hex ou nom de couleur
  password?: string; // Mot de passe de hachage local ou texte simple pour protection locale
}

export type View = 'DASHBOARD' | 'ADD_PATIENT' | 'EDIT_PATIENT' | 'PATIENT_DETAIL' | 'PRACTITIONER_PROFILE' | 'LOGIN';
