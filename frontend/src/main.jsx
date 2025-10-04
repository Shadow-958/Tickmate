// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/socketContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> 
      <AuthProvider>
        <SocketProvider> {/* ADD this wrapper */}
          <App />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter> 
  </React.StrictMode>
);