// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

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
const auth = getAuth();

// Eksportuj app i auth oddzielnie
export { app, auth };
