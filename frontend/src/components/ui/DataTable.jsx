import { useEffect, useMemo, useState } from 'react';
import { Icon } from './Icon';

/**
 * Generic data table (client-side search / sort / pagination).
 *
 * columns: [{ key, header, render?(row), sortValue?(row), sortable?, align?: 'num', searchValue?(row) }]
 * Backwards compatible: `columns`, `rows`, `emptyText` work exactly as before.
 *
 * Options:
 *  - searchable: show a search box (matches rendered primitive values / searchValue)
 *  - pageSize: paginate client-side (0 = off)
 *  - sortable: enable click-to-sort headers (per column opt-out with sortable:false)
 *  - rowClassName(row): extra class for a row (e.g. anomaly marker)
 *  - toolbar: extra controls rendered next to the search box
 *  - maxHeight: CSS max-height for scroll area (sticky header)
 *  - caption: accessible table caption (visually hidden)
 *  - onRowClick(row): make rows clickable
 */
export function DataTable({
  columns,
  rows,
  emptyText = 'No records found.',
  searchable = false,
  searchPlaceholder = 'Search…',
  pageSize = 0,
  sortable = false,
  rowClassName,
  toolbar,
  maxHeight,
  caption,
  onRowClick,
}) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState({ key: null, dir: 'asc' });
  const [page, setPage] = useState(1);

  const safeRows = useMemo(() => rows || [], [rows]);

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return safeRows;
    const q = query.trim().toLowerCase();
    return safeRows.filter((row) =>
      columns.some((c) => {
        const v = c.searchValue ? c.searchValue(row) : row[c.key];
        return v !== null && v !== undefined && typeof v !== 'object' && String(v).toLowerCase().includes(q);
      })
    );
  }, [safeRows, query, searchable, columns]);

  const sorted = useMemo(() => {
    if (!sort.key) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return filtered;
    const get = col.sortValue || ((r) => r[col.key]);
    const out = [...filtered].sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      if (va === vb) return 0;
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      if (typeof va === 'number' && typeof vb === 'number') return va - vb;
      return String(va).localeCompare(String(vb), undefined, { numeric: true });
    });
    return sort.dir === 'desc' ? out.reverse() : out;
  }, [filtered, sort, columns]);

  const totalPages = pageSize ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;

  useEffect(() => {
    setPage(1);
  }, [query, sort.key, sort.dir, safeRows.length]);

  const visible = pageSize ? sorted.slice((page - 1) * pageSize, page * pageSize) : sorted;

  const toggleSort = (key) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  };

  const showToolbar = searchable || toolbar;

  if (safeRows.length === 0 && !showToolbar) {
    return <div className="ui-empty">{emptyText}</div>;
  }

  return (
    <div className="ui-datatable">
      {showToolbar && (
        <div className="ui-table-toolbar">
          {searchable ? (
            <label className="input-with-icon">
              <span className="sr-only">Search table</span>
              <Icon name="search" size={16} />
              <input
                className="input input-sm"
                type="search"
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          ) : (
            <span />
          )}
          {toolbar && <div className="ui-table-toolbar-extra">{toolbar}</div>}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="ui-empty">{safeRows.length ? 'No records match your search.' : emptyText}</div>
      ) : (
        <div className="ui-table-wrap" style={maxHeight ? { '--table-max-h': maxHeight } : undefined}>
          <table className="ui-table">
            {caption && <caption className="sr-only">{caption}</caption>}
            <thead>
              <tr>
                {columns.map((c) => {
                  const canSort = sortable && c.sortable !== false && c.header;
                  const isSorted = sort.key === c.key;
                  return (
                    <th
                      key={c.key}
                      scope="col"
                      className={`${c.align === 'num' ? 'num' : ''} ${canSort ? 'sortable' : ''}`}
                      aria-sort={isSorted ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                    >
                      {canSort ? (
                        <button
                          type="button"
                          className={`th-sort ${isSorted ? 'is-sorted' : ''}`}
                          onClick={() => toggleSort(c.key)}
                          style={c.align === 'num' ? { justifyContent: 'flex-end' } : undefined}
                        >
                          {c.header}
                          <Icon name={isSorted ? (sort.dir === 'asc' ? 'sortAsc' : 'sortDesc') : 'sort'} size={12} />
                        </button>
                      ) : (
                        c.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {visible.map((row, i) => (
                <tr
                  key={row.id ?? `${page}-${i}`}
                  className={rowClassName ? rowClassName(row) || '' : ''}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  style={onRowClick ? { cursor: 'pointer' } : undefined}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={c.align === 'num' ? 'num' : ''}>
                      {c.render ? c.render(row) : row[c.key] ?? '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(pageSize > 0 || searchable) && visible.length > 0 && (
        <div className="ui-table-footer">
          <span>
            {pageSize
              ? `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, sorted.length)} of ${sorted.length}`
              : `${sorted.length} record${sorted.length === 1 ? '' : 's'}`}
            {searchable && query && sorted.length !== safeRows.length ? ` (filtered from ${safeRows.length})` : ''}
          </span>
          {pageSize > 0 && totalPages > 1 && (
            <nav className="pager" aria-label="Table pagination">
              <button
                type="button"
                className="btn-ghost btn-sm btn-icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="Previous page"
              >
                <Icon name="chevronLeft" size={14} />
              </button>
              <span className="tabular">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                className="btn-ghost btn-sm btn-icon"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                aria-label="Next page"
              >
                <Icon name="chevronRight" size={14} />
              </button>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}

export default DataTable;
