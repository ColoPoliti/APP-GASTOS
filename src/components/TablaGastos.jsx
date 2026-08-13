import React, { useMemo } from 'react';
import { useTheme } from "../context/ThemeContext";
import { obtenerEstiloCategoriaComun } from "../utils/gastosUtils";
import { FaChevronUp, FaChevronDown, FaSort } from 'react-icons/fa';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    flexRender,
} from '@tanstack/react-table';

function obtenerColorTexto(hexColor) {
if (!hexColor) return '#000000';
function obtenerColorTexto(hexColor) {
    if (!hexColor) return '#000000';
    let limpio = hexColor.replace('#', '').toLowerCase();
    
    if (limpio.length === 3) {
        limpio = limpio.split('').map(c => c + c).join('');
    }

    const r = parseInt(limpio.substr(0, 2), 16) || 0;
    const g = parseInt(limpio.substr(2, 2), 16) || 0;
    const b = parseInt(limpio.substr(4, 2), 16) || 0;

    // Calculamos luminancia real pero exigente
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;

    // Únicamente si el color es OSCURO DE VERDAD (como tus servicios violeta/azul oscuro), usamos blanco.
    // Todo lo demás (verdes, amarillos, celestes, pasteles, grises claros) va con NEGRO SÍ O SÍ.
    if (yiq < 110) {
        return '#ffffff';
    }

    return '#000000';
}
}


export default function TablaGastos({ gastos }) {
    const [sorting, setSorting] = React.useState([]);
    const [globalFilter, setGlobalFilter] = React.useState('');
    const { theme } = useTheme();

    const columns = useMemo(() => [
        {
            accessorKey: 'perfiles.nombre',
            header: 'Usuario',
            accessorFn: (row) => row.perfiles?.nombre || 'Invitado',
            cell: (info) => info.getValue(),
        },
{
    header: 'Categoría',
    accessorKey: 'categorias.nombre',
    cell: (info) => {
        const cat = info.row.original.categorias;
        if (!cat) return <span className="text-slate-600 dark:text-slate-500 text-xs italic">Sin cat.</span>;

        // Agarramos el color directo de la base de datos (o un azul por defecto)
        const bgColor = cat.color || '#3b82f6';
        
        
        // Forzamos el color de texto según el fondo real
        // Si el color es amarillo (#ffff00 o similar) o brillante, texto negro; sino blanco
        const esClaro = bgColor.toLowerCase().includes('ffff') || bgColor.toLowerCase().includes('fde047') || bgColor.toLowerCase().includes('facc15') || bgColor.toLowerCase().includes('4ade80');
        const textColor = esClaro ? '#000000' : '#ffffff';

        return (
            <span
                className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase inline-block shadow-sm"
                style={{
                    backgroundColor: bgColor,
                    color: textColor, // <--- Lo forzamos acá inline para que ninguna otra función lo pise
                    borderColor: 'transparent'
                }}
            >
                {cat.nombre}
            </span>
        );
    }
},
        { 
            accessorKey: 'descripcion', 
            header: 'Descripción',
            meta: { className: 'hidden sm:table-cell' },
            cell: info => info.getValue() 
        },
        {
            accessorKey: 'monto',
            header: 'Monto',
            cell: info => `$${Number(info.getValue()).toLocaleString('es-AR')}`
        },
        {
            accessorKey: 'created_at',
            header: 'Fecha',
            cell: info => new Date(info.getValue()).toLocaleDateString()
        },
    ], [theme]);

    const table = useReactTable({
        data: gastos ?? [],
        columns,
        state: {
            sorting,
            globalFilter,
        },
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
        <div className="bg-white mt-9 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg block w-full overflow-hidden transition-colors duration-300">
            <div className="flex justify-end mb-4">
                <input
                    className="px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none w-64 transition-colors"
                    placeholder="Buscar gastos..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-slate-900 dark:text-slate-300 table-fixed">
                    <thead className="text-xs uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700">
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => {
                                    const sorted = header.column.getIsSorted();
                                    const metaClass = header.column.columnDef.meta?.className || '';
                                    return (
                                        <th
                                            key={header.id}
                                            className={`p-4 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 select-none ${metaClass}`}
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            <div className="flex items-center gap-2">
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                <span className="text-indigo-600 dark:text-indigo-400 text-xl">
                                                    {sorted === 'asc' ? (
                                                        <FaChevronUp size={10} />
                                                    ) : sorted === 'desc' ? (
                                                        <FaChevronDown size={10} />
                                                    ) : (
                                                        header.column.getCanSort() && <FaSort size={10} className="opacity-40" />
                                                    )}
                                                </span>
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="p-6 text-center text-slate-500 text-sm italic">
                                    No se encontraron registros.
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map(row => (
                                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    {row.getVisibleCells().map(cell => {
                                        const metaClass = cell.column.columnDef.meta?.className || '';
                                        return (
                                            <td key={cell.id} className={`p-4 text-sm ${metaClass}`}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginación avanzada */}
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 border-t border-slate-200 dark:border-slate-800 pt-4 gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>
                        Página <strong>{table.getState().pagination.pageIndex + 1}</strong> de{' '}
                        <strong>{table.getPageCount()}</strong>
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <div className="flex items-center gap-1">
                        <span>Ir a pág:</span>
                        <input
                            type="number"
                            min="1"
                            max={table.getPageCount()}
                            defaultValue={table.getState().pagination.pageIndex + 1}
                            onChange={e => {
                                const page = e.target.value ? Number(e.target.value) - 1 : 0;
                                table.setPageIndex(page);
                            }}
                            className="w-14 px-2 py-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-center text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 rounded text-xs hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 transition-colors"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                    >
                        {'<<'} Primero
                    </button>
                    <button
                        className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 rounded text-xs hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 transition-colors"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Anterior
                    </button>
                    <button
                        className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 rounded text-xs hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 transition-colors"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Siguiente
                    </button>
                    <button
                        className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 rounded text-xs hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 transition-colors"
                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                        disabled={!table.getCanNextPage()}
                    >
                        Último {'>>'}
                    </button>
                </div>
            </div>
        </div>
    );
}