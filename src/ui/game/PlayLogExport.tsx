import { useState } from 'react';
import { MAX_RUNS, storedPlayLog } from '../playlog.ts';

/**
 * Hands the stored play log to the player: the share sheet where the browser
 * supports sharing files (phones), a download otherwise, or the clipboard.
 */
export function PlayLogExport() {
  const [status, setStatus] = useState('');

  const exportLog = async () => {
    const { text, runs } = storedPlayLog();
    if (!runs) return setStatus('Nothing to export yet. Play a run first.');
    const name = `playlog-${new Date().toISOString().slice(0, 10)}.jsonl`;
    const file = new File([text], name, { type: 'text/plain' });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Party Auto-Battler play log' });
        return setStatus(`Shared ${runs} run${runs === 1 ? '' : 's'}.`);
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return setStatus('');
      // Sharing failed: fall back to a download.
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus(`Downloaded ${runs} run${runs === 1 ? '' : 's'} as ${name}.`);
  };

  const copyLog = async () => {
    const { text, runs } = storedPlayLog();
    if (!runs) return setStatus('Nothing to copy yet. Play a run first.');
    try {
      await navigator.clipboard.writeText(text);
      setStatus(`Copied ${runs} run${runs === 1 ? '' : 's'} to the clipboard.`);
    } catch {
      setStatus('Copying is blocked here. Use Export instead.');
    }
  };

  return (
    <div className="playlog-export">
      <button type="button" className="link" onClick={() => void exportLog()} title={`Your last ${MAX_RUNS} runs, step by step`}>
        Export play log
      </button>
      <button type="button" className="link" onClick={() => void copyLog()}>
        Copy play log
      </button>
      {status && (
        <span className="muted small" role="status">
          {status}
        </span>
      )}
    </div>
  );
}
