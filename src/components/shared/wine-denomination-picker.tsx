"use client";

import { useState, useRef, useEffect } from "react";

interface WineDenominationResult {
  id: string;
  name: string;
  type: string;
  region: string;
  grapes: string[];
  wineTypes: string[];
}

interface Props {
  onSelect: (d: WineDenominationResult) => void;
  value?: string;
}

const TYPE_COLORS: Record<string, string> = {
  DOCG: "bg-red-700 text-white",
  DOC: "bg-orange-600 text-white",
  IGT: "bg-gray-600 text-white",
};

export function WineDenominationPicker({ onSelect, value }: Props) {
  const [inputValue, setInputValue] = useState(value ?? "");
  const [results, setResults] = useState<WineDenominationResult[]>([]);
  const [open, setOpen] = useState(false);
  const [prevValue, setPrevValue] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  if (value !== prevValue) {
    setPrevValue(value);
    setInputValue(value ?? "");
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleChange(val: string) {
    setInputValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/wine-denominations/search?q=${encodeURIComponent(val)}`);
        const data = await res.json();
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
      }
    }, 200);
  }

  function handleSelect(d: WineDenominationResult) {
    setInputValue(d.name);
    setOpen(false);
    setResults([]);
    onSelect(d);
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Cerca denominazione (es. Barolo, Toscana...)"
        className="w-full h-9 px-3 rounded-md border border-[var(--wine-border)] bg-[var(--wine-card)] text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500"
      />
      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-md border border-[var(--wine-border)] bg-[var(--wine-card)] shadow-lg max-h-60 overflow-y-auto">
          {results.map((d) => (
            <li
              key={d.id}
              onMouseDown={() => handleSelect(d)}
              className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-[var(--wine-card-hover)]"
            >
              <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-semibold ${TYPE_COLORS[d.type] ?? "bg-gray-600 text-white"}`}>
                {d.type}
              </span>
              <span className="font-semibold text-white">{d.name}</span>
              <span className="text-white/40 text-xs ml-auto">{d.region}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
