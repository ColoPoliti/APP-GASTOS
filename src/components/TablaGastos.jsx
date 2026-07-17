import React, { useMemo } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    flexRender,
} from '@tanstack/react-table';

export default function TablaGastos({ gastos }) {
    const [sorting, setSorting] = React.useState([]);
    const [globalFilter, setGlobalFilter] = React.useState('');

    const columns = useMemo(() => [

        {
            accessorKey: 'perfiles.nombre',
            header: 'Usuario',
            size: 300,
            // Usamos 'accessorFn' en lugar de 'accessorKey' para mayor control
            accessorFn: (row) => row.perfiles?.nombre || 'Invitado',
            cell: (info) => info.getValue(), // info.getValue ahora es seguro
        },
        // --- ESTA ES LA COLUMNA DE CATEGORÍA QUE FALTABA ---
        {
            header: 'Categoría',
            accessorKey: 'categorias.nombre',
            cell: (info) => {
                const cat = info.row.original.categorias;
                if (!cat) return <span className="text-slate-600 text-xs italic">Sin cat.</span>;
                return (
                    <span
                        className="px-2 py-1 rounded-full text-[10px] font-bold uppercase"
                        style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                    >
                        {cat.nombre}
                    </span>
                );
            }
        },
        { accessorKey: 'descripcion', header: 'Descripción' },
        // ----------------------------------------------------
        {
            accessorKey: 'monto',
            header: 'Monto',
            size: 300,
            cell: info => `$${Number(info.getValue()).toLocaleString('es-AR')}`
        },
        {
            accessorKey: 'created_at',
            header: 'Fecha',
            size: 300,
            cell: info => new Date(info.getValue()).toLocaleDateString()
        },
    ], []);

    const table = useReactTable({
        data: gastos ?? [],
        columns,
        enableColumnResizing: true,
        columnResizeMode: 'onChange',
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <div className="bg-white text-dark dark:bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg block max-w-full overflow-x-scroll overflow-y-hidden">
            <div className="flex justify-end mb-4">
                <input
                    className="px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                    placeholder="Buscar gastos..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-slate-300 table-fixed">
                    <thead className="text-xs uppercase text-slate-500 border-b border-slate-700">
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <th key={header.id} className="p-4 cursor-pointer hover:text-indigo-400" onClick={header.column.getToggleSortingHandler()}>
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                        {{ asc: ' 🔼', desc: ' 🔽' }[header.column.getIsSorted() ?? null]}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {table.getRowModel().rows.map(row => (
                            <tr key={row.id} className="hover:bg-slate-800/50 transition-colors">
                                {row.getVisibleCells().map(cell => (
                                    <td key={cell.id} className="p-4 text-sm">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between mt-6 border-t border-slate-800 pt-4">
                <span className="text-xs text-slate-500">
                    Pág {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                </span>
                <div className="flex gap-2">
                    <button
                        className="px-3 py-1 bg-slate-800 rounded text-xs hover:bg-slate-700 disabled:opacity-50"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >Anterior</button>
                    <button
                        className="px-3 py-1 bg-slate-800 rounded text-xs hover:bg-slate-700 disabled:opacity-50"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >Siguiente</button>
                </div>
            </div>
        </div>
    );
}