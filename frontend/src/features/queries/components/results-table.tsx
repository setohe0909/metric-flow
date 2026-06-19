import { useState } from 'react';
import { ChevronLeft, ChevronRight, Table2 } from 'lucide-react';

interface ResultsTableProps {
  columns: string[];
  rows: Record<string, any>[];
  pageSize?: number;
}

export function ResultsTable({ columns, rows, pageSize = 15 }: ResultsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  if (!columns || columns.length === 0 || !rows || rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-[#4d4f46] font-mono">
        <Table2 className="h-7 w-7 mb-2 opacity-40" />
        <span className="text-xs font-bold">Sin filas en el resultado</span>
      </div>
    );
  }

  // Paginación en memoria
  const totalPages = Math.ceil(rows.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRows = rows.slice(startIndex, startIndex + pageSize);

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    return String(value);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Table Container */}
      <div className="flex-1 w-full overflow-auto border-2 border-[#23251d] rounded-xl bg-white shadow-[3px_3px_0px_0px_#23251d]">
        <table className="min-w-full text-left text-xs font-mono">
          {/* Header */}
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#e4e5de] border-b-2 border-[#23251d]">
              {/* Row number column */}
              <th className="px-3 py-2.5 text-[10px] font-extrabold text-[#4d4f46] uppercase tracking-wider whitespace-nowrap border-r-2 border-[#23251d] bg-[#d8d9d2] w-10 text-center">
                #
              </th>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-2.5 text-[10px] font-extrabold text-[#23251d] uppercase tracking-wider whitespace-nowrap border-r border-[#23251d]/20 last:border-r-0"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {paginatedRows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={`border-b border-[#23251d]/10 transition-colors hover:bg-[#eeefe9] ${
                  rowIdx % 2 === 0 ? 'bg-white' : 'bg-[#f8f8f4]'
                }`}
              >
                {/* Row number */}
                <td className="px-3 py-2 text-[10px] text-[#4d4f46] border-r-2 border-[#23251d]/20 text-center font-bold bg-[#eeefe9] w-10">
                  {startIndex + rowIdx + 1}
                </td>
                {columns.map((col) => {
                  const val = row[col];
                  const formatted = formatValue(val);
                  const isNull = val === null || val === undefined;
                  const isNum = typeof val === 'number';
                  const isBool = typeof val === 'boolean';

                  return (
                    <td
                      key={col}
                      className={`px-4 py-2 font-mono text-[11px] max-w-[240px] truncate border-r border-[#23251d]/10 last:border-r-0 ${
                        isNull
                          ? 'text-[#4d4f46] italic opacity-50'
                          : isNum
                          ? 'text-[#0a5e2a] font-bold'
                          : isBool
                          ? 'text-[#7b3e00] font-bold'
                          : 'text-[#23251d]'
                      }`}
                      title={formatted}
                    >
                      {formatted}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 px-1 font-mono">
          <span className="text-[11px] text-[#4d4f46] font-bold">
            Filas {startIndex + 1}–{Math.min(startIndex + pageSize, rows.length)}{' '}
            <span className="text-[#23251d]">de {rows.length}</span>
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border-2 border-[#23251d] bg-white hover:bg-[#e4e5de] disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-[2px_2px_0px_0px_#23251d] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
            >
              <ChevronLeft className="h-3.5 w-3.5 text-[#23251d]" />
            </button>

            <span className="text-[11px] text-[#23251d] font-extrabold px-2 py-1 bg-[#eeefe9] border-2 border-[#23251d] rounded-lg min-w-[80px] text-center">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border-2 border-[#23251d] bg-white hover:bg-[#e4e5de] disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-[2px_2px_0px_0px_#23251d] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
            >
              <ChevronRight className="h-3.5 w-3.5 text-[#23251d]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
