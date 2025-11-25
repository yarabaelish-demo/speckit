import type { DocumentData } from 'firebase/firestore';

export interface User extends DocumentData {
  uid: string;
  email: string;
  createdAt: Date;
}