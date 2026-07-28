import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { AccountProvider } from './context/AccountContext';
import { UserPreferencesProvider } from './context/UserPreferencesContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <UserPreferencesProvider>
        <AccountProvider>
          <App />
        </AccountProvider>
      </UserPreferencesProvider>
    </AuthProvider>
  </StrictMode>
);
