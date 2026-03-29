import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDS78wQg68UEHEfS61c9xTS0ywc3E1WfMU",
  authDomain: "anime-compass-e2990.firebaseapp.com",
  projectId: "anime-compass-e2990",
  storageBucket: "anime-compass-e2990.firebasestorage.app",
  messagingSenderId: "392745264566",
  appId: "1:392745264566:web:c95258279acb5143940d17",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
