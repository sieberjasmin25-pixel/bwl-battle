import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { initializeFirestore, doc, collection, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, limit, serverTimestamp } from "firebase/firestore";
window.FB = { initializeApp, getAuth, signInAnonymously, onAuthStateChanged, initializeFirestore, doc, collection, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, limit, serverTimestamp };
