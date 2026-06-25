import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCz7VLGjYt7A-4J8aSn5Pn8yBNnTcpaBxI',
  authDomain: 'proyectointegrador2-6612d.firebaseapp.com',
  projectId: 'proyectointegrador2-6612d',
  storageBucket: 'proyectointegrador2-6612d.firebasestorage.app',
  messagingSenderId: '43409007092',
  appId: '1:43409007092:web:a2996ec9c5bdc86cf159a1',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const collections = {
  users: 'users',
  categories: 'categories',
  businesses: 'businesses',
  products: 'products',
  promotions: 'promotions',
  gallery: 'gallery',
  banners: 'banners',
  statistics: 'statistics',
};
