// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDHtxvMluda1GvnhxJ0LuVu-2Yp-F69ULY",
    authDomain: "mobilnaapteka-8dca0.firebaseapp.com",
    projectId: "mobilnaapteka-8dca0",
    storageBucket: "mobilnaapteka-8dca0.appspot.com",
    messagingSenderId: "562080182785",
    appId: "1:562080182785:web:9ec21e12614710a1498600"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth();

// Eksportuj app, aby można go było zaimportować w innych plikach
export default app;