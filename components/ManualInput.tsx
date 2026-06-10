"use client";

import { useRef } from "react";

interface ManualInputProps {
  onSearch: (code: string) => void;
  loading: boolean;
}

export function ManualInput({ onSearch, loading }: ManualInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputRef.current?.value.trim();
    if (value && value.length >= 8) {
      onSearch(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubmit(e as unknown as React.FormEvent);
  };

  return (
    <form onSubmit={handleSubmit} className="input-group">
      <input
        ref={inputRef}
        id="barcode-input"
        type="text"
        className="input-barcode"
        placeholder="Ej: 7501055300595"
        maxLength={50}
        inputMode="numeric"
        pattern="[0-9A-Za-z\-]+"
        onKeyDown={handleKeyDown}
        autoComplete="off"
        spellCheck={false}
      />
      <button
        type="submit"
        className="btn btn-primary"
        disabled={loading}
        id="barcode-search-btn"
      >
        {loading ? "⏳" : "🔍"} Buscar
      </button>
    </form>
  );
}
