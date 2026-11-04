import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useViper } from '../context/ViperContext';
import {
  parseNinjaTraderOrdersCsv,
  SAMPLE_NINJATRADER_ORDERS_CSV,
  formatLiquidityWindowESTLabel,
} from '../utils/ninjaTraderCsvParser';
import { LIQUIDITY_WINDOWS } from '../constants/viperConstants';
import { formatUSD } from '../utils/viperAnalytics';

export default function NinjaTraderImportModal({ isOpen, onClose }) {
  const { trades, importNinjaTraderCsv, clearAllTrades } = useViper();
  const fileInputRef = useRef(null);

  const [csvText, setCsvText] = useState(SAMPLE_NINJATRADER_ORDERS_CSV);
  const [fileName, setFileName] = useState('Orders.csv');
  const [utcToCtOffsetHours, setUtcToCtOffsetHours] = useState(-11.5);
  const [replaceExisting, setReplaceExisting] = useState(true);

  const parsedPreview = useMemo(() => {
    if (!csvText.trim()) return null;
    return parseNinjaTraderOrdersCsv(csvText, {
      utcToCtOffsetHours,
      includeCommissions: false,
    });
  }, [csvText, utcToCtOffsetHours]);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result;
      if (typeof content === 'string') {
        setCsvText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result;
      if (typeof content === 'string') {
        setCsvText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!parsedPreview || parsedPreview.trades.length === 0) return;
    importNinjaTraderCsv(
      csvText,
      {
        utcToCtOffsetHours,
        includeCommissions: false,
      },
      replaceExisting
    );
    onClose();
  };

  const handleClearCsvData = () => {
    setCsvText('');
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    clearAllTrades();
  };

  const totalPreviewNetPnl = parsedPreview
    ? parsedPreview.trades.reduce((acc, t) => acc + t.netPnl, 0)
    : 0;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        backgroundColor: 'rgba(2, 6, 12, 0.75)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      className="p-0 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="viper-modal-animate w-screen h-screen max-h-screen rounded-none sm:w-[min(880px,94vw)] sm:h-auto sm:max-h-[90vh] sm:rounded-[20px]"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Sticky Header */}
        <div
          className="px-5 py-4 sm:px-8 sm:py-6"
          style={{
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div>
            <div className="eyebrow-green">CSV EXECUTION IMPORTER</div>
            <h2
              style={{
                marginTop: '4px',
                marginBottom: 0,
                fontSize: '22px',
                fontWeight: 700,
                color: 'var(--text)',
              }}
            >
              Import NinjaTrader Orders.csv or Journal CSV
            </h2>
            <p
              style={{
                marginTop: '4px',
                marginBottom: 0,
                fontSize: '13px',
                color: 'var(--text-muted)',
              }}
            >
              Converts timestamps to 12-hour EST (AM/PM), tags Liquidity
              Windows, and flags &lt; 15m Revenge trades
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '999px',
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div
          className="p-5 sm:p-8"
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="md:col-span-7"
              style={{
                padding: '20px',
                borderRadius: '12px',
                border: '1px dashed rgba(148, 163, 184, 0.3)',
                backgroundColor: 'var(--surface-2)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(16, 185, 129, 0.14)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: 'var(--green)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px',
                }}
              >
                <Upload size={20} />
              </div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text)',
                }}
              >
                Click to upload{' '}
                <span style={{ color: 'var(--green)' }}>Orders.csv</span> or
                drag &amp; drop
              </div>
              <div
                style={{
                  marginTop: '4px',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                }}
              >
                Active file:{' '}
                <strong style={{ color: 'var(--text)' }}>
                  {fileName || 'None loaded'}
                </strong>
              </div>

              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  marginTop: '14px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setFileName('Orders.csv');
                    setCsvText(SAMPLE_NINJATRADER_ORDERS_CSV);
                  }}
                  style={{
                    height: '36px',
                    padding: '0 14px',
                    borderRadius: 'var(--radius-control)',
                    backgroundColor: 'rgba(16, 185, 129, 0.14)',
                    border: '1px solid rgba(16, 185, 129, 0.38)',
                    color: 'var(--green)',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <Sparkles size={13} />
                  <span>Load Sample Orders.csv</span>
                </button>

                {(csvText.trim() !== '' || trades.length > 0) && (
                  <button
                    type="button"
                    onClick={handleClearCsvData}
                    style={{
                      height: '36px',
                      padding: '0 14px',
                      borderRadius: 'var(--radius-control)',
                      backgroundColor: 'rgba(239, 68, 68, 0.14)',
                      border: '1px solid rgba(239, 68, 68, 0.38)',
                      color: 'var(--red)',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Clear CSV</span>
                  </button>
                )}
              </div>
            </div>

            <div
              className="md:col-span-5"
              style={{
                padding: '20px',
                borderRadius: '12px',
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
              }}
            >
              <div>
                <label
                  className="eyebrow-label"
                  style={{ display: 'block', marginBottom: '8px' }}
                >
                  CSV SOURCE TIMEZONE → EST
                </label>
                <select
                  value={utcToCtOffsetHours}
                  onChange={(e) =>
                    setUtcToCtOffsetHours(Number(e.target.value))
                  }
                  className="viper-input"
                  style={{ height: '44px', fontSize: '13px' }}
                >
                  <option value={-11.5}>
                    IST (UTC+5:30) → EST (-10h 30m: 19:45 → 09:15 AM EST)
                  </option>
                  <option value={-6}>UTC (GMT+0) → EST (-5h)</option>
                  <option value={0}>
                    Already in Central Time (CT) → EST (+1h)
                  </option>
                </select>
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                />
                <span>Replace current trade log on import</span>
              </label>
            </div>
          </div>

          {parsedPreview && !parsedPreview.error && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div className="eyebrow-label">FILLED ORDERS</div>
                  <div
                    className="tabular-nums"
                    style={{
                      marginTop: '6px',
                      fontSize: '20px',
                      fontWeight: 700,
                      color: 'var(--text)',
                    }}
                  >
                    {parsedPreview.filledOrdersCount}
                  </div>
                </div>
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div className="eyebrow-label">PAIRED TRADES</div>
                  <div
                    className="tabular-nums"
                    style={{
                      marginTop: '6px',
                      fontSize: '20px',
                      fontWeight: 700,
                      color: 'var(--green)',
                    }}
                  >
                    {parsedPreview.trades.length}
                  </div>
                </div>
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div className="eyebrow-label">NET RESULT</div>
                  <div
                    className="tabular-nums"
                    style={{
                      marginTop: '6px',
                      fontSize: '20px',
                      fontWeight: 700,
                      color:
                        totalPreviewNetPnl >= 0
                          ? 'var(--green)'
                          : 'var(--red)',
                    }}
                  >
                    {formatUSD(totalPreviewNetPnl)}
                  </div>
                </div>
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div className="eyebrow-label">&lt;15M REVENGE FLAGS</div>
                  <div
                    className="tabular-nums"
                    style={{
                      marginTop: '6px',
                      fontSize: '20px',
                      fontWeight: 700,
                      color:
                        parsedPreview.revengeTradesCount > 0
                          ? 'var(--red)'
                          : 'var(--green)',
                    }}
                  >
                    {parsedPreview.revengeTradesCount > 0
                      ? `🚨 ${parsedPreview.revengeTradesCount} Flagged`
                      : '0 Clean'}
                  </div>
                </div>
              </div>

              <div
                style={{
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface-2)',
                  overflow: 'hidden',
                }}
              >
                <div style={{ overflowX: 'auto', maxHeight: '260px' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      textAlign: 'left',
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          borderBottom: '1px solid var(--border)',
                          backgroundColor: 'var(--surface)',
                        }}
                      >
                        <th
                          className="eyebrow-label"
                          style={{ padding: '12px 14px' }}
                        >
                          Date &amp; Time (EST)
                        </th>
                        <th
                          className="eyebrow-label"
                          style={{ padding: '12px 14px' }}
                        >
                          Liquidity Window
                        </th>
                        <th
                          className="eyebrow-label"
                          style={{ padding: '12px 14px' }}
                        >
                          Contract
                        </th>
                        <th
                          className="eyebrow-label"
                          style={{ padding: '12px 14px' }}
                        >
                          Direction &amp; Lots
                        </th>
                        <th
                          className="eyebrow-label"
                          style={{ padding: '12px 14px' }}
                        >
                          Entry → Exit
                        </th>
                        <th
                          className="eyebrow-label"
                          style={{ padding: '12px 14px', textAlign: 'right' }}
                        >
                          Net P&amp;L
                        </th>
                        <th
                          className="eyebrow-label"
                          style={{ padding: '12px 14px' }}
                        >
                          Revenge Guard
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedPreview.trades.map((t, idx) => (
                        <tr
                          key={t.id || idx}
                          style={{ borderBottom: '1px solid var(--border)' }}
                        >
                          <td
                            className="tabular-nums"
                            style={{
                              padding: '12px 14px',
                              fontSize: '13px',
                              color: 'var(--text)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <div>{t.formattedDateEST} EST</div>
                            <div
                              style={{
                                fontSize: '12px',
                                color: 'var(--text-muted)',
                              }}
                            >
                              Exit: {t.exitTimeEST}
                            </div>
                          </td>
                          <td
                            style={{
                              padding: '12px 14px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '3px 10px',
                                borderRadius: 'var(--radius-pill)',
                                fontSize: '12px',
                                fontWeight: 500,
                                backgroundColor:
                                  t.sessionWindow ===
                                  LIQUIDITY_WINDOWS.ASIAN_LONDON
                                    ? 'rgba(16, 185, 129, 0.15)'
                                    : t.sessionWindow ===
                                      LIQUIDITY_WINDOWS.NY_OPEN
                                    ? 'rgba(59, 130, 246, 0.15)'
                                    : 'rgba(148, 163, 184, 0.1)',
                                color:
                                  t.sessionWindow ===
                                  LIQUIDITY_WINDOWS.ASIAN_LONDON
                                    ? 'var(--green)'
                                    : t.sessionWindow ===
                                      LIQUIDITY_WINDOWS.NY_OPEN
                                    ? '#60A5FA'
                                    : 'var(--text-muted)',
                                border:
                                  t.sessionWindow ===
                                  LIQUIDITY_WINDOWS.ASIAN_LONDON
                                    ? '1px solid rgba(16, 185, 129, 0.38)'
                                    : t.sessionWindow ===
                                      LIQUIDITY_WINDOWS.NY_OPEN
                                    ? '1px solid rgba(59, 130, 246, 0.38)'
                                    : '1px solid var(--border)',
                              }}
                            >
                              <Clock size={12} />
                              <span>
                                {formatLiquidityWindowESTLabel(
                                  t.sessionWindow,
                                  t.time
                                )}
                              </span>
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span
                              className="tabular-nums"
                              style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 600,
                                backgroundColor: 'var(--surface)',
                                color: 'var(--text)',
                                border: '1px solid var(--border)',
                              }}
                            >
                              {t.contract}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 600,
                                backgroundColor:
                                  t.direction === 'Long'
                                    ? 'rgba(16, 185, 129, 0.15)'
                                    : 'rgba(239, 68, 68, 0.15)',
                                color:
                                  t.direction === 'Long'
                                    ? 'var(--green)'
                                    : 'var(--red)',
                              }}
                            >
                              {t.direction} {t.quantity}x
                            </span>
                          </td>
                          <td
                            className="tabular-nums"
                            style={{
                              padding: '12px 14px',
                              fontSize: '13px',
                              color: 'var(--text-muted)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {t.entryPrice.toFixed(2)} → {t.exitPrice.toFixed(2)}
                          </td>
                          <td
                            className="tabular-nums"
                            style={{
                              padding: '12px 14px',
                              textAlign: 'right',
                              fontSize: '13px',
                              fontWeight: 700,
                              color:
                                t.netPnl >= 0
                                  ? 'var(--green)'
                                  : 'var(--red)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formatUSD(t.netPnl)}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            {t.isRevengeTrade ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '3px 8px',
                                  borderRadius: 'var(--radius-pill)',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                  color: 'var(--red)',
                                  border: '1px solid rgba(239, 68, 68, 0.38)',
                                }}
                              >
                                <AlertTriangle size={12} />
                                <span>😤 Revenge (&lt;15m)</span>
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  color: 'var(--green)',
                                }}
                              >
                                <CheckCircle2 size={13} />
                                <span>Clean</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sticky Footer */}
        <div
          className="px-5 py-4 sm:px-8 sm:py-6"
          style={{
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              height: '52px',
              padding: '0 24px',
              borderRadius: 'var(--radius-control)',
              backgroundColor: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!parsedPreview || parsedPreview.trades.length === 0}
            onClick={handleConfirmImport}
            style={{
              flexGrow: 1,
              height: '52px',
              padding: '0 24px',
              borderRadius: 'var(--radius-control)',
              backgroundColor: 'var(--green)',
              border: 'none',
              color: '#0A0D12',
              fontSize: '15px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
          >
            <FileSpreadsheet size={16} />
            <span>Import {parsedPreview?.trades?.length || 0} Trades</span>
          </button>
        </div>
      </div>
    </div>
  );
}
