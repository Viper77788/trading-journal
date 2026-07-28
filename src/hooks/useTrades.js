import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  getAllTrades, 
  createTrade, 
  updateTradeById, 
  deleteTradeById, 
  bulkDeleteTrades,
  getTradeById,
  importMt5Trades,
  importJsonTrades
} from '../services/tradeService';
import { parseMt5ReportWorkbook } from '../utils/mt5Import';

export const useTrades = () => {
  const { user } = useAuth();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTrades = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getAllTrades(user.uid);
      setTrades(data);
    } catch (error) {
      console.error('Error fetching trades:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTrades();
    } else {
      setTrades([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const addTrade = async (data) => {
    if (!user) return;
    try {
      await createTrade(user.uid, data);
      await fetchTrades();
    } catch (error) {
      console.error('Error adding trade:', error);
      throw error;
    }
  };

  const editTrade = async (id, data) => {
    if (!user) return;
    try {
      await updateTradeById(user.uid, id, data);
      await fetchTrades();
    } catch (error) {
      console.error('Error editing trade:', error);
      throw error;
    }
  };

  const removeTrade = async (id) => {
    if (!user) return;
    try {
      await deleteTradeById(user.uid, id);
      await fetchTrades();
    } catch (error) {
      console.error('Error deleting trade:', error);
      throw error;
    }
  };

  const removeTradesBulk = async (tradeIds) => {
    if (!user || !tradeIds?.length) return;
    try {
      await bulkDeleteTrades(user.uid, tradeIds);
      await fetchTrades();
    } catch (error) {
      console.error('Error deleting trades in bulk:', error);
      throw error;
    }
  };

  const getTrade = async (id) => {
    if (!user) return null;
    try {
      return await getTradeById(user.uid, id);
    } catch (error) {
      console.error('Error getting trade:', error);
      throw error;
    }
  };

  const importMt5 = async (file, sourceUtcOffsetHours = 3) => {
    if (!user) return;
    const XLSX = await import('xlsx');
    const buffer = await file.arrayBuffer();
    const parsed = parseMt5ReportWorkbook(buffer, XLSX, sourceUtcOffsetHours);
    if (!parsed.length) {
      throw new Error('No closed trades were found in that file\'s Positions section.');
    }
    const result = await importMt5Trades(user.uid, parsed);
    await fetchTrades();
    return result;
  };

  const importJson = async (jsonData) => {
    if (!user) return;
    if (!Array.isArray(jsonData) || !jsonData.length) {
      throw new Error('Invalid JSON format: expected a non-empty array of trade objects.');
    }
    const result = await importJsonTrades(user.uid, jsonData);
    await fetchTrades();
    return result;
  };

  return {
    trades,
    loading,
    fetchTrades,
    addTrade,
    editTrade,
    removeTrade,
    removeTradesBulk,
    getTrade,
    importMt5,
    importJson
  };
};

export default useTrades;
