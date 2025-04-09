// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCQf_QXzyZkyRxsbo91PJmdwjEn3lVfDTo",
  authDomain: "cosmicteams-bbf29.firebaseapp.com",
  projectId: "cosmicteams-bbf29",
  storageBucket: "cosmicteams-bbf29.firebasestorage.app",
  messagingSenderId: "807144888137",
  appId: "1:807144888137:web:13b6084bf5696273d6ec98"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Initialize Authentication
const auth = firebase.auth();

// Export the Firebase services
window.db = db;
window.auth = auth; 