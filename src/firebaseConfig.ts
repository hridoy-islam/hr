import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDyw-pWBCnYnmmsjyDOl_6O2GGnw1EadVU',
  authDomain: 'task-planner-e833d.firebaseapp.com',
  projectId: 'task-planner-e833d',
  storageBucket: 'task-planner-e833d.firebasestorage.app',
  messagingSenderId: '678302069362',
  appId: '1:678302069362:web:7fa59ee292aa0c73c508eb'
};

const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
