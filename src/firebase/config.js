import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {

    apiKey: "AIzaSyCCrRNGsQOGm9qU4OA5KkpFofJSkyRhxoA",

    authDomain: "betaforge-4fc15.firebaseapp.com",

    projectId: "betaforge-4fc15",

    storageBucket: "betaforge-4fc15.firebasestorage.app",

    messagingSenderId: "42551773632",

    appId: "1:42551773632:web:da9b3aef11eee606262025"

};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);