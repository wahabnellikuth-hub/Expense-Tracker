import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDgCeY8snoQicEUII6SblD5lCTqklzW0cE",
  authDomain: "expense-tracker-c375a.firebaseapp.com",
  databaseURL: "https://expense-tracker-c375a-default-rtdb.firebaseio.com",
  projectId: "expense-tracker-c375a",
  storageBucket: "expense-tracker-c375a.firebasestorage.app",
  messagingSenderId: "901618346383",
  appId: "1:901618346383:web:5f63801e7ada292ef403fa",
  measurementId: "G-ZEWMW8WH7N"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };
