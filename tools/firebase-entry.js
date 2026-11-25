import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { initializeFirestore, doc, collection, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, limit, serverTimestamp } from "firebase/firestore";
import { getMessaging, getToken, deleteToken, isSupported } from "firebase/messaging";
window.FB = { initializeApp, getAuth, signInAnonymously, onAuthStateChanged, initializeFirestore, doc, collection, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, limit, serverTimestamp,
  getMessaging, getToken, deleteToken, msgSupported: isSupported };
