import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  getAllAccounts,
  getDeletedAccounts,
  createAccount,
  updateAccountById,
  softDeleteAccountById,
  restoreAccountById,
  permanentlyDeleteAccountById,
  autoPurgeExpiredTrash,
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
      // Auto purge items in trash > 30 days (fire-and-forget)
      autoPurgeExpiredTrash(user.uid);

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

  const softDeleteAccount = async (id) => {
    if (!user) return;
    await softDeleteAccountById(user.uid, id);
    const updated = accounts.filter(a => a.id !== id);
    setAccounts(updated);
    if (activeAccountId === id) {
      switchAccount('all');
    }
    await fetchAccounts();
  };

  const restoreAccount = async (id) => {
    if (!user) return;
    await restoreAccountById(user.uid, id);
    await fetchAccounts();
    switchAccount(id);
  };

  const permanentlyDeleteAccount = async (id) => {
    if (!user) return;
    await permanentlyDeleteAccountById(user.uid, id);
    await fetchAccounts();
  };

  const fetchTrash = async () => {
    if (!user) return [];
    return await getDeletedAccounts(user.uid);
  };

  const activeAccount = activeAccountId === 'all'
    ? null
    : accounts.find(a => a.id === activeAccountId) || null;

  const filterTradesByAccount = (trades = []) => {
    if (!trades) return [];
    const activeTrades = trades.filter(t => t.isDeleted !== true);
    if (activeAccountId === 'all') return activeTrades;
    return activeTrades.filter(t => t.accountId === activeAccountId);
  };

  const value = {
    accounts,
    activeAccountId,
    activeAccount,
    loading,
    switchAccount,
    addAccount,
    editAccount,
    softDeleteAccount,
    restoreAccount,
    permanentlyDeleteAccount,
    fetchTrash,
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
