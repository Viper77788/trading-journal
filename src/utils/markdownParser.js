/**
 * Parses Viper Markdown outputs (tables, headers, bold, bullet points, status badges, and zone hex tags) into clean HTML
 */
export function parseMarkdownToHtml(markdown = '') {
  if (!markdown) return '';

  let html = markdown;

  // 1. Status Badges & Zone Color Chips
  html = html
    .replace(/\[VIPER EDGE\]/g, '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">VIPER EDGE</span>')
    .replace(/\[VIPER LEAK\]/g, '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">VIPER LEAK</span>')
    .replace(/\[GUARDRAIL BREACHED\]/g, '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white animate-pulse">GUARDRAIL BREACHED</span>')
    .replace(/\[TILT WARNING\]/g, '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">TILT WARNING</span>')
    .replace(/#386641/gi, '<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold text-white" style="background-color:#386641">#386641 Support</span>')
    .replace(/#BC4749/gi, '<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold text-white" style="background-color:#BC4749">#BC4749 Resistance</span>');

  // 2. Markdown Tables
  const lines = html.split('\n');
  const processedLines = [];
  let inTable = false;
  let tableRows = [];

  const flushTable = () => {
    if (tableRows.length === 0) return '';
    let tableStr = '<div class="overflow-x-auto my-3"><table class="w-full text-xs text-left border-collapse border border-white/10 rounded-xl overflow-hidden bg-black/20">';

    tableRows.forEach((rowCells, idx) => {
      if (idx === 0) {
        tableStr += '<thead><tr class="bg-white/10 text-white font-semibold border-b border-white/10">';
        rowCells.forEach((cell) => {
          tableStr += `<th class="p-2.5 border-r border-white/10 last:border-r-0">${cell.replace(/\*\*(.*?)\*\*/g, '$1')}</th>`;
        });
        tableStr += '</tr></thead><tbody>';
      } else {
        tableStr += '<tr class="border-b border-white/5 hover:bg-white/5 transition-colors">';
        rowCells.forEach((cell) => {
          const cellContent = cell
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
            .replace(/\+\$([0-9.,]+)/g, '<span class="text-emerald-400 font-mono">+$1</span>')
            .replace(/-\$([0-9.,]+)/g, '<span class="text-red-400 font-mono">-$1</span>');
          tableStr += `<td class="p-2.5 border-r border-white/5 last:border-r-0 text-slate-300">${cellContent}</td>`;
        });
        tableStr += '</tr>';
      }
    });

    tableStr += '</tbody></table></div>';
    tableRows = [];
    return tableStr;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      if (/^\|[\s\-:]+\|/.test(line)) continue;
      const cells = line.split('|').slice(1, -1).map((c) => c.trim());
      inTable = true;
      tableRows.push(cells);
    } else {
      if (inTable) {
        inTable = false;
        processedLines.push(flushTable());
      }
      processedLines.push(line);
    }
  }

  if (inTable) {
    processedLines.push(flushTable());
  }

  let text = processedLines.join('\n');

  // 3. Headers
  text = text.replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold text-white mt-3 mb-1.5">$1</h3>');
  text = text.replace(/^## (.*$)/gim, '<h2 class="text-base font-bold text-white mt-4 mb-2">$1</h2>');
  text = text.replace(/^# (.*$)/gim, '<h1 class="text-lg font-bold text-white mt-4 mb-2">$1</h1>');

  // 4. Bold & Italic
  text = text.replace(/\*\*\*(.*?)\*\*\*/g, '<strong class="font-bold text-emerald-400">$1</strong>');
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');
  text = text.replace(/\*(.*?)\*/g, '<em class="italic text-slate-300">$1</em>');

  // 5. Bullet Lists
  text = text.replace(/^- (.*$)/gim, '<div class="flex items-start gap-2 my-1"><span class="text-emerald-400 font-bold">•</span><span class="text-slate-300 text-xs">$1</span></div>');

  // 6. Currency Formatting
  text = text.replace(/\+\$([0-9.,]+)/g, '<span class="text-emerald-400 font-mono font-semibold">+$1</span>');
  text = text.replace(/-\$([0-9.,]+)/g, '<span class="text-red-400 font-mono font-semibold">-$1</span>');

  // 7. Newlines
  text = text.replace(/\n\n+/g, '<div class="h-2"></div>');
  text = text.replace(/\n/g, '<br/>');

  return text;
}
