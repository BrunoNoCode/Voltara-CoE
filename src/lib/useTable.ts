import { useMemo, useState } from 'react';

export type SortDir = 'asc' | 'desc';

// Client-side sort + pagination for a pre-filtered row list. Resets to page 1
// whenever the row set changes (e.g. a filter was applied).
export function useTable<T>(rows: T[], getters: Record<string, (r: T) => string | number>, initialSort: string, pageSize = 10, initialDir: SortDir = 'asc') {
  const [sortKey, setSortKey] = useState(initialSort);
  const [sortDir, setSortDir] = useState<SortDir>(initialDir);
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    const get = getters[sortKey];
    if (!get) return rows;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      return (typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb))) * dir;
    });
    // getters is a static object literal per call site
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sortKey, sortDir]);

  // Back to page 1 when the row set changes (adjusting state during render, not in an effect).
  const [pageRows0, setPageRows0] = useState(rows);
  if (pageRows0 !== rows) {
    setPageRows0(rows);
    setPage(1);
  }

  const toggleSort = (key: string) => {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const pageRows = sorted.slice((page - 1) * pageSize, page * pageSize);
  return { sorted, pageRows, total: rows.length, page, setPage, pageSize, sortKey, sortDir, toggleSort };
}
