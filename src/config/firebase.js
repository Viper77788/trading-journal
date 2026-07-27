import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyC7Gxzw0tM5rQWYknq7zzRxlgGn_5iRkaw',
  authDomain: 'viper-38910.firebaseapp.com',
  projectId: 'viper-38910',
  storageBucket: 'viper-38910.firebasestorage.app',
  messagingSenderId: '490608082230',
  appId: '1:490608082230:web:72d6c0bcc27c4311870797',
  measurementId: 'G-4RWQ77TFLQ',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
