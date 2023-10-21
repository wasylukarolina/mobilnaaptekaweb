// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCTal6tQAGn1LLhlynyZPORmCmB_H7PQdU",
    authDomain: "mobilnaapteka2.firebaseapp.com",
    projectId: "mobilnaapteka2",
    storageBucket: "mobilnaapteka2.appspot.com",
    messagingSenderId: "712369556572",
    appId: "1:712369556572:web:e67a8cc685709d94f0ea99"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();

// Eksportuj app i auth oddzielnie
export { app, auth };
