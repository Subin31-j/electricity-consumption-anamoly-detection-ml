import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './auth/AuthContext';
import { applyReduceMotionSetting } from './components/ui/motion';
import './styles/global.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/analysis.css';
import './styles/landing.css';
import './styles/home.css';
import './styles/about.css';
import './styles/docs.css';
import './styles/pages.css';
import './auth/auth.css';

// Apply the persisted in-app reduced-motion preference before first paint.
applyReduceMotionSetting();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
