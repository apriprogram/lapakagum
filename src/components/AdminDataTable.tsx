'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, ListFilter, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import AppSelect from '@/components/AppSelect';
import { bulkDeleteRecords } from '@/app/actions/business';
import { useToast } from '@/components/ToastProvider';

interface BulkDeleteOutcome {
  requested: number;
  deleted: number;
  archived: number;
  skipped: number;
}
interface AdminDataTableProps {
  title: string;
  children: React.ReactNode;
  initialPageSize?: number;
  bulkDeleteAction?: (formData: FormData) => void | BulkDeleteOutcome | Promise<void | BulkDeleteOutcome>;
}
type BulkDeleteResource = 'orders' | 'products' | 'purchases' | 'stock-batches' | 'daily-closings';

const bulkDeleteResourceByTitle: Record<string, BulkDeleteResource> = {
  'Pesanan terbaru': 'orders',
  'Daftar pesanan': 'orders',
  'Daftar produk': 'products',
  'Daftar stok barang': 'products',
  'Riwayat pembelian': 'purchases',
  'Riwayat pembelian pemasok': 'purchases',
  'Kelompok stok tersedia': 'stock-batches',
  'Riwayat ringkasan harian': 'daily-closings',
};

interface TableStats {
  total: number;
  filtered: number;
  selected: number;
  from: number;
  to: number;
  pageCount: number;
}

type SortDirection = 'ascending' | 'descending';

interface SortState {
  column: number;
  direction: SortDirection;
}

interface SortableValue {
  kind: 'number' | 'text';
  value: number | string;
}

const nonSortableColumns = new Set(['nota', 'pilihan', 'aksi']);

function sortableValue(cell: HTMLTableCellElement | undefined): SortableValue {
  const text = cell?.innerText.replace(/\s+/g, ' ').trim() ?? '';
  const compact = text.toLowerCase().replace(/\s+/g, '');
  const numericPattern = /^(?:rp)?-?[\d.]+(?:,\d+)?(?:kg|g|pcs|ekor|liter|l)?$/i;

  if (numericPattern.test(compact)) {
    const numeric = compact
      .replace(/^rp/i, '')
      .replace(/(?:kg|g|pcs|ekor|liter|l)$/i, '')
      .replace(/\./g, '')
      .replace(',', '.');
    return { kind: 'number', value: Number(numeric) };
  }

  if (/\b(?:jan|feb|mar|apr|mei|may|jun|jul|agu|aug|sep|okt|oct|nov|des|dec)\b|^\d{4}-\d{2}-\d{2}/i.test(text)) {
    const normalizedDate = text
      .replace(/\bMei\b/gi, 'May')
      .replace(/\bAgu\b/gi, 'Aug')
      .replace(/\bOkt\b/gi, 'Oct')
      .replace(/\bDes\b/gi, 'Dec');
    const timestamp = Date.parse(normalizedDate);
    if (!Number.isNaN(timestamp)) return { kind: 'number', value: timestamp };
  }

  return { kind: 'text', value: text.toLocaleLowerCase('id-ID') };
}
const emptyStats: TableStats = { total: 0, filtered: 0, selected: 0, from: 0, to: 0, pageCount: 1 };

function BulkDeleteSubmit({ count }: { count: number }) {
  const { pending } = useFormStatus();
  return <button type="submit" className="admin-table-delete-confirm" disabled={pending}><Trash2 /><span>{pending ? 'Menghapus...' : `Ya, hapus (${count})`}</span></button>;
}

export default function AdminDataTable({ title, children, initialPageSize = 8, bulkDeleteAction }: AdminDataTableProps) {
  const inferredResource = bulkDeleteResourceByTitle[title];
  const resolvedBulkDeleteAction = bulkDeleteAction
    ?? (inferredResource ? bulkDeleteRecords.bind(null, inferredResource) : undefined);
  const router = useRouter();
  const { showToast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(String(initialPageSize));
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState | null>(null);
  const originalOrderRef = useRef(new WeakMap<HTMLTableRowElement, number>());
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [stats, setStats] = useState<TableStats>(emptyStats);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState('');

  const getRows = useCallback(() => Array.from(containerRef.current?.querySelectorAll<HTMLTableRowElement>('tbody tr[data-table-row]') ?? []), []);

  const rowMatches = useCallback((row: HTMLTableRowElement) => {
    const matchesSearch = row.textContent?.toLowerCase().includes(search.trim().toLowerCase()) ?? false;
    const checked = row.querySelector<HTMLInputElement>('[data-row-select]')?.checked ?? false;
    return matchesSearch && (!selectedOnly || checked);
  }, [search, selectedOnly]);

  const prepareHeaders = useCallback(() => {
    const headers = Array.from(containerRef.current?.querySelectorAll<HTMLTableCellElement>('thead th') ?? []);
    headers.forEach((header, column) => {
      const label = header.innerText.replace(/\s+/g, ' ').trim();
      const isSortable = !header.hasAttribute('data-table-control') && !nonSortableColumns.has(label.toLocaleLowerCase('id-ID'));

      if (!isSortable) {
        header.removeAttribute('data-sortable');
        header.removeAttribute('data-sort-direction');
        header.removeAttribute('aria-sort');
        header.removeAttribute('tabindex');
        return;
      }

      const direction = sort?.column === column ? sort.direction : 'none';
      header.setAttribute('data-sortable', '');
      header.setAttribute('data-sort-direction', direction);
      header.setAttribute('aria-sort', direction);
      header.setAttribute('tabindex', '0');
      header.setAttribute('title', 'Urutkan berdasarkan ' + label);
    });
  }, [sort]);

  const toggleSort = useCallback((header: HTMLTableCellElement) => {
    const column = header.cellIndex;
    setSort((current) => {
      if (!current || current.column !== column) return { column, direction: 'ascending' };
      if (current.direction === 'ascending') return { column, direction: 'descending' };
      return null;
    });
    setPage(1);
  }, []);
  const applyRows = useCallback(() => {
    const rows = getRows();
    prepareHeaders();
    rows.forEach((row, index) => {
      if (!originalOrderRef.current.has(row)) originalOrderRef.current.set(row, index);
    });

    rows.sort((left, right) => {
      if (!sort) return (originalOrderRef.current.get(left) ?? 0) - (originalOrderRef.current.get(right) ?? 0);
      const leftValue = sortableValue(left.cells[sort.column]);
      const rightValue = sortableValue(right.cells[sort.column]);
      const direction = sort.direction === 'ascending' ? 1 : -1;
      let result = 0;

      if (leftValue.kind === 'number' && rightValue.kind === 'number') {
        result = Number(leftValue.value) - Number(rightValue.value);
      } else {
        result = String(leftValue.value).localeCompare(String(rightValue.value), 'id-ID', { numeric: true, sensitivity: 'base' });
      }
      return result === 0
        ? (originalOrderRef.current.get(left) ?? 0) - (originalOrderRef.current.get(right) ?? 0)
        : result * direction;
    });

    const tableBody = rows[0]?.parentElement;
    if (tableBody) rows.forEach((row) => tableBody.appendChild(row));
    const matchingRows = rows.filter(rowMatches);
    const size = Number(pageSize);
    const pageCount = Math.max(1, Math.ceil(matchingRows.length / size));
    const safePage = Math.min(page, pageCount);
    const start = (safePage - 1) * size;
    const end = Math.min(start + size, matchingRows.length);

    rows.forEach((row) => { row.hidden = true; });
    matchingRows.forEach((row, index) => {
      row.hidden = index < start || index >= end;
      const numberCell = row.querySelector<HTMLElement>('[data-row-number]');
      if (numberCell) numberCell.textContent = String(index + 1).padStart(2, '0');
    });

    const visibleRows = matchingRows.slice(start, end);
    const visibleChecks = visibleRows.map((row) => row.querySelector<HTMLInputElement>('[data-row-select]')).filter(Boolean) as HTMLInputElement[];
    const selectedInputs = rows
      .map((row) => row.querySelector<HTMLInputElement>('[data-row-select]'))
      .filter((input): input is HTMLInputElement => Boolean(input?.checked));
    const selected = selectedInputs.length;
    setSelectedIds([...new Set(selectedInputs.map((input) => input.value).filter(Boolean))]);
    const selectAll = containerRef.current?.querySelector<HTMLInputElement>('[data-select-all]');
    if (selectAll) {
      const checkedCount = visibleChecks.filter((input) => input.checked).length;
      selectAll.checked = visibleChecks.length > 0 && checkedCount === visibleChecks.length;
      selectAll.indeterminate = checkedCount > 0 && checkedCount < visibleChecks.length;
    }

    setStats({
      total: rows.length,
      filtered: matchingRows.length,
      selected,
      from: matchingRows.length ? start + 1 : 0,
      to: end,
      pageCount,
    });
  }, [getRows, page, pageSize, prepareHeaders, rowMatches, sort]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(applyRows);
    return () => window.cancelAnimationFrame(frame);
  }, [applyRows, children]);

  const handleSelection = (event: React.ChangeEvent<HTMLDivElement>) => {
    const input = event.target as HTMLInputElement;
    if (!input.matches('[data-row-select], [data-select-all]')) return;
    
    if (input.matches('[data-select-all]')) {
      const visibleRows = getRows().filter((row) => !row.hidden);
      visibleRows.forEach((row) => {
        const checkbox = row.querySelector<HTMLInputElement>('[data-row-select]');
        if (checkbox) checkbox.checked = input.checked;
      });
    }
    setPage(1);
    setDeleteFeedback('');
    setDeleteConfirmOpen(false);
    window.requestAnimationFrame(applyRows);
  };
  const runBulkDelete = async (formData: FormData) => {
    if (!resolvedBulkDeleteAction) return;
    setDeleteFeedback('');
    try {
      const result = await resolvedBulkDeleteAction(formData);
      const outcome = result ?? { requested: selectedIds.length, deleted: selectedIds.length, archived: 0, skipped: 0 };
      const messages = [];
      if (outcome.deleted) messages.push(`${outcome.deleted} data berhasil dihapus`);
      if (outcome.archived) messages.push(`${outcome.archived} data diarsipkan karena memiliki riwayat transaksi`);
      if (outcome.skipped) messages.push(`${outcome.skipped} data tidak dihapus karena stok sudah dipakai atau memiliki pembayaran`);
      if (!messages.length) messages.push('Tidak ada data yang dapat dihapus');

      getRows().forEach((row) => {
        const checkbox = row.querySelector<HTMLInputElement>('[data-row-select]');
        if (checkbox) checkbox.checked = false;
      });
      setSelectedIds([]);
      setDeleteConfirmOpen(false);
      const feedback = messages.join('. ');
      setDeleteFeedback(feedback);
      showToast(feedback, outcome.deleted || outcome.archived ? 'success' : 'info', outcome.deleted || outcome.archived ? 'Penghapusan selesai' : 'Tidak ada perubahan');
      setPage(1);
      router.refresh();
      window.requestAnimationFrame(applyRows);
    } catch {
      setDeleteConfirmOpen(false);
      setDeleteFeedback('Penghapusan gagal. Muat ulang halaman lalu coba kembali.');
    }
  };
  const handleTableClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('input, button, a, select')) return;
    const header = target.closest<HTMLTableCellElement>('th[data-sortable]');
    if (header) toggleSort(header);
  };

  const handleTableKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const header = target.closest<HTMLTableCellElement>('th[data-sortable]');
    if (!header || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    toggleSort(header);
  };

  const exportCsv = () => {
    const root = containerRef.current;
    if (!root) return;
    const headers = Array.from(root.querySelectorAll<HTMLTableCellElement>('thead th:not([data-table-control])')).map((cell) => cell.innerText.trim());
    const rows = getRows().filter(rowMatches).map((row) =>
      Array.from(row.querySelectorAll<HTMLTableCellElement>('td:not([data-table-control])')).map((cell) => cell.innerText.replace(/\s+/g, ' ').trim()),
    );
    const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const pages = Array.from({ length: stats.pageCount }, (_, index) => index + 1).filter((item) =>
    stats.pageCount <= 5 || item === 1 || item === stats.pageCount || Math.abs(item - page) <= 1,
  );

  return (
    <div className="admin-data-table-frame">
      <div className="admin-table-toolbar">
        <div className="admin-table-summary">
          <p>{title}</p>
          <span role="status">{deleteFeedback || (stats.selected ? `${stats.selected} data dipilih` : `${stats.total} total data`)}</span>
        </div>
        <div className="admin-table-tools">
          <label className="admin-table-search">
            <Search />
            <span className="sr-only">Cari data</span>
            <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Cari data..." />
          </label>
          {resolvedBulkDeleteAction && selectedIds.length > 0 && (
            <form action={runBulkDelete} className="admin-table-delete-form">
              {selectedIds.map((id) => <input key={id} type="hidden" name="ids" value={id} />)}
              {!deleteConfirmOpen ? (
                <button type="button" className="admin-table-bulk-delete" onClick={() => setDeleteConfirmOpen(true)}>
                  <Trash2 /><span>Hapus terpilih ({selectedIds.length})</span>
                </button>
              ) : (
                <div className="admin-table-delete-dialog" role="alertdialog" aria-label="Konfirmasi hapus data">
                  <p>Hapus {selectedIds.length} data terpilih?</p>
                  <div>
                    <button type="button" className="admin-table-delete-cancel" onClick={() => setDeleteConfirmOpen(false)}>Batal</button>
                    <BulkDeleteSubmit count={selectedIds.length} />
                  </div>
                </div>
              )}
            </form>
          )}
          <div className="admin-table-filter-wrap">
            <button type="button" className={`admin-table-tool-button ${selectedOnly ? 'is-active' : ''}`} onClick={() => setFilterOpen((value) => !value)} aria-expanded={filterOpen}>
              <ListFilter /><span>Filter</span>
            </button>
            {filterOpen && (
              <div className="admin-table-filter-menu">
                <p>Tampilkan</p>
                <button type="button" className={!selectedOnly ? 'is-active' : ''} onClick={() => { setSelectedOnly(false); setPage(1); setFilterOpen(false); }}>Semua data</button>
                <button type="button" className={selectedOnly ? 'is-active' : ''} onClick={() => { setSelectedOnly(true); setPage(1); setFilterOpen(false); }}>Data terpilih</button>
              </div>
            )}
          </div>
          <button type="button" className="admin-table-export" onClick={exportCsv}><Download /><span>Export</span></button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="admin-table-scroll"
        onChange={handleSelection}
        onClick={handleTableClick}
        onKeyDown={handleTableKeyDown}
      >
        {children}
      </div>

      <div className="admin-table-footer">
        <div className="admin-table-show">
          <span>Tampilkan</span>
          <AppSelect
            ariaLabel="Jumlah data per halaman"
            value={pageSize}
            onValueChange={(next) => { setPageSize(next); setPage(1); }}
            options={[8, 10, 20, 50].map((item) => ({ value: String(item), label: String(item) }))}
            className="h-9 min-w-16 rounded-lg border px-2 text-xs"
          />
          <span>{stats.from}-{stats.to} dari {stats.filtered} data</span>
        </div>
        <div className="admin-table-pagination" aria-label="Pagination tabel">
          <button type="button" onClick={() => setPage(1)} disabled={page <= 1} aria-label="Halaman pertama"><ChevronsLeft /></button>
          <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1} aria-label="Halaman sebelumnya"><ChevronLeft /></button>
          {pages.map((item, index) => {
            const previous = pages[index - 1];
            return (
              <span key={item} className="contents">
                {previous && item - previous > 1 && <span className="admin-table-ellipsis">â€¦</span>}
                <button type="button" className={page === item ? 'is-active' : ''} onClick={() => setPage(item)}>{item}</button>
              </span>
            );
          })}
          <button type="button" onClick={() => setPage((current) => Math.min(stats.pageCount, current + 1))} disabled={page >= stats.pageCount} aria-label="Halaman berikutnya"><ChevronRight /></button>
          <button type="button" onClick={() => setPage(stats.pageCount)} disabled={page >= stats.pageCount} aria-label="Halaman terakhir"><ChevronsRight /></button>
        </div>
      </div>
    </div>
  );
}

