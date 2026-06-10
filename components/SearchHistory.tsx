"use client";

interface HistoryEntry {
  barcode: string;
  name: string;
  timestamp: number;
}

interface SearchHistoryProps {
  entries: HistoryEntry[];
  onSelect: (barcode: string) => void;
  onClear: () => void;
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function SearchHistory({ entries, onSelect, onClear }: SearchHistoryProps) {
  if (entries.length === 0) return null;

  return (
    <div className="history-section">
      <div className="section-header">
        <span className="section-title">⏱ Historial reciente</span>
        <button
          className="btn btn-sm btn-danger"
          onClick={onClear}
          id="clear-history-btn"
        >
          Limpiar
        </button>
      </div>
      <div className="history-list">
        {entries.map((entry) => (
          <button
            key={`${entry.barcode}-${entry.timestamp}`}
            className="history-item"
            onClick={() => onSelect(entry.barcode)}
          >
            <span className="history-barcode">{entry.barcode}</span>
            <span className="history-name">{entry.name}</span>
            <span className="history-time">{timeAgo(entry.timestamp)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export type { HistoryEntry };
