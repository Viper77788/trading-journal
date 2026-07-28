import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  getAllAccounts,
  createAccount,
  updateAccountById,
  deleteAccountById,
  ensureDefaultAccount
} from '../services/accountService';

const AccountContext = createContext(null);

export const AccountProvider = ({ children }) => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [activeAccountId, setActiveAccountId] = useState(() => {
    return localStorage.getItem('tj-active-account') || 'all';
  });
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await ensureDefaultAccount(user.uid);
      setAccounts(data);

      // Validate saved activeAccountId
      if (activeAccountId !== 'all' && !data.some(a => a.id === activeAccountId)) {
        const defaultAcc = data.find(a => a.isDefault) || data[0];
        setActiveAccountId(defaultAcc ? defaultAcc.id : 'all');
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAccounts();
    } else {
      setAccounts([]);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const switchAccount = (id) => {
    setActiveAccountId(id);
    localStorage.setItem('tj-active-account', id);
  };

  const addAccount = async (accountData) => {
    if (!user) return;
    try {
      const newId = await createAccount(user.uid, accountData);
      await fetchAccounts();
      if (newId) switchAccount(newId);
      return newId;
    } catch (err) {
      console.error('Error in addAccount:', err);
      throw err;
    }
  };

  const editAccount = async (id, accountData) => {
    if (!user) return;
    await updateAccountById(user.uid, id, accountData);
    await fetchAccounts();
  };

  const removeAccount = async (id) => {
    if (!user) return;
    await deleteAccountById(user.uid, id);
    const updated = accounts.filter(a => a.id !== id);
    setAccounts(updated);
    if (activeAccountId === id) {
      switchAccount(updated.length > 0 ? updated[0].id : 'all');
    }
  };

  const activeAccount = activeAccountId === 'all'
    ? null
    : accounts.find(a => a.id === activeAccountId) || null;

  const filterTradesByAccount = (trades = []) => {
    if (!trades) return [];
    if (activeAccountId === 'all') return trades;
    return trades.filter(t => t.accountId === activeAccountId || !t.accountId);
  };

  const value = {
    accounts,
    activeAccountId,
    activeAccount,
    loading,
    switchAccount,
    addAccount,
    editAccount,
    removeAccount,
    filterTradesByAccount,
    refreshAccounts: fetchAccounts
  };

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = () => {
  return useContext(AccountContext);
};

export default AccountContext;
