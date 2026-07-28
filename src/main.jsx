import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { AccountProvider } from './context/AccountContext';
import { TimezoneProvider } from './context/TimezoneContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AccountProvider>
        <TimezoneProvider>
          <App />
        </TimezoneProvider>
      </AccountProvider>
    </AuthProvider>
  </StrictMode>
);
