export const downloadBlob = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportJSON = (trades) => {
  const json = JSON.stringify(trades, null, 2);
  downloadBlob(json, 'trades.json', 'application/json');
};

export const exportCSV = (trades) => {
  if (!trades || !trades.length) return;
  
  const allKeys = new Set();
  trades.forEach(t => Object.keys(t).forEach(k => allKeys.add(k)));
  const headers = Array.from(allKeys);
  
  const csvRows = [];
  csvRows.push(headers.join(','));
  
  trades.forEach(trade => {
    const row = headers.map(header => {
      let val = trade[header];
      if (val === undefined || val === null) val = '';
      if (typeof val === 'object') val = JSON.stringify(val);
      val = String(val);
      // Escape quotes and wrap in quotes if contains comma, quote or newline
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        val = `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    csvRows.push(row.join(','));
  });
  
  downloadBlob(csvRows.join('\n'), 'trades.csv', 'text/csv;charset=utf-8;');
};

export const exportXLSX = async (trades) => {
  if (!trades || !trades.length) return;
  try {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(trades);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Trades");
    XLSX.writeFile(wb, 'trades.xlsx');
  } catch (err) {
    console.error("Failed to export to XLSX", err);
  }
};
