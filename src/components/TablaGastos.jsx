import React, { useMemo, useEffect, useState } from 'react';
import { useTheme } from "../context/ThemeContext";
import { obtenerEstiloCategoriaComun } from "../utils/gastosUtils";
import {
    FaChevronUp,
    FaChevronDown,
    FaSort,
    FaFilter
} from 'react-icons/fa';

import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    flexRender,
} from '@tanstack/react-table';

export default function TablaGastos({ gastos = [] }) {
    const [sorting, setSorting] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [columnFilters, setColumnFilters] = useState([]); // <- Acá guardamos los filtros por columna

    const { theme } = useTheme();

    /*
     * ---------------------------------------------------------
     * COLUMNAS
     * ---------------------------------------------------------
     */
    const columns = useMemo(() => [
        {
            id: 'usuario',
            accessorKey: 'perfiles.nombre',
            header: 'Usuario',
            accessorFn: (row) => row.perfiles?.nombre || 'Invitado',
            cell: (info) => (
                <span className="truncate block max-w-[120px]">
                    {info.getValue()}
                </span>
            ),
            // Filtro exacto para el selector de usuario
            filterFn: (row, columnId, filterValue) => {
                if (!filterValue) return true;
                return row.getValue(columnId) === filterValue;
            },
        },

        {
            id: 'categoria',
            // Usamos un accessorFn limpio que devuelva el nombre de la categoría
            accessorFn: (row) => row.categorias?.nombre || 'Sin cat.',
            header: 'Categoría',
            cell: (info) => {
                const cat = info.row.original.categorias;
                if (!cat) {
                    return (
                        <span className="text-slate-500 dark:text-slate-500 text-xs italic">
                            Sin cat.
                        </span>
                    );
                }
                const estiloCategoria = obtenerEstiloCategoriaComun(cat, theme);
                return (
                    <span
                        className="
                            inline-block max-w-full truncate px-2 sm:px-2.5 py-1
                            rounded-full text-[9px] sm:text-[10px] font-bold uppercase shadow-sm
                        "
                        style={estiloCategoria}
                        title={cat.nombre}
                    >
                        {cat.nombre}
                    </span>
                );
            },
            // Filtro exacto para categoría
            filterFn: (row, columnId, filterValue) => {
                if (!filterValue) return true;
                return row.getValue(columnId) === filterValue;
            },
        },

        {
            accessorKey: 'descripcion',
            header: 'Descripción',
            cell: (info) => (
                <span className="block break-words whitespace-normal leading-5" title={info.getValue() || ''}>
                    {info.getValue() || 'Sin descripción'}
                </span>
            ),
        },

        {
            accessorKey: 'monto',
            header: 'Monto',
            cell: (info) => {
                const monto = Number(info.getValue()) || 0;
                return (
                    <span className="whitespace-nowrap font-medium">
                        ${monto.toLocaleString('es-AR', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                        })}
                    </span>
                );
            },
        },

        {
            accessorKey: 'created_at',
            header: 'Fecha',
            cell: (info) => {
                const fecha = info.getValue();
                if (!fecha) return '-';
                return (
                    <span className="whitespace-nowrap">
                        {new Date(fecha).toLocaleDateString('es-AR')}
                    </span>
                );
            },
        },
    ], [theme]);

    /*
     * ---------------------------------------------------------
     * LISTAS PARA LOS SELECTS DE FILTROS (Extraídas de los datos)
     * ---------------------------------------------------------
     */
    const listaUsuarios = useMemo(() => {
        const setU = new Set(gastos.map(g => g.perfiles?.nombre).filter(Boolean));
        return Array.from(setU);
    }, [gastos]);

    const listaCategorias = useMemo(() => {
        const setC = new Set(gastos.map(g => g.categorias?.nombre).filter(Boolean));
        return Array.from(setC);
    }, [gastos]);

    /*
     * ---------------------------------------------------------
     * TABLA CONFIGURACIÓN
     * ---------------------------------------------------------
     */
    const table = useReactTable({
        data: gastos,
        columns,
        state: {
            sorting,
            globalFilter,
            columnFilters,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: {
                pageSize: 10,
                pageIndex: 0,
            },
        },
    });

    // Volver a la página 1 si cambia cualquier filtro
    useEffect(() => {
        table.setPageIndex(0);
    }, [globalFilter, columnFilters]);

    const pageCount = table.getPageCount() || 1;
    const currentPage = table.getState().pagination.pageIndex + 1;

    /*
     * Helpers para manejar los filtros individuales de columnas fácilmente
     */
    const handleColumnFilterChange = (columnId, value) => {
        table.getColumn(columnId)?.setFilterValue(value === '' ? undefined : value);
    };

    const categoriaFiltroActual = table.getColumn('categoria')?.getFilterValue() || '';
    const usuarioFiltroActual = table.getColumn('usuario')?.getFilterValue() || '';

    return (
        <div
            className="
                w-full max-w-full bg-white dark:bg-slate-900 mt-6 sm:mt-9 p-3 sm:p-6
                rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg
                transition-colors duration-300 overflow-hidden
            "
        >
            {/* =================================================
                BARRA DE FILTROS MÚLTIPLES
            ================================================== */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                
                {/* 1. Buscador de Texto General */}
                <div className="relative">
                    <input
                        type="text"
                        className="
                            w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300
                            dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white
                            placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                            outline-none transition-colors
                        "
                        placeholder="Buscar en todo..."
                        value={globalFilter ?? ''}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                    />
                </div>

                {/* 2. Filtro por Categoría (Select dinámico) */}
                <div>
                    <select
                        className="
                            w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300
                            dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white
                            focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors
                        "
                        value={categoriaFiltroActual}
                        onChange={(e) => handleColumnFilterChange('categoria', e.target.value)}
                    >
                        <option value="">Todas las categorías</option>
                        {listaCategorias.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 3. Filtro por Usuario (Select dinámico) */}
                <div>
                    <select
                        className="
                            w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300
                            dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white
                            focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors
                        "
                        value={usuarioFiltroActual}
                        onChange={(e) => handleColumnFilterChange('usuario', e.target.value)}
                    >
                        <option value="">Todos los usuarios</option>
                        {listaUsuarios.map((usu) => (
                            <option key={usu} value={usu}>
                                {usu}
                            </option>
                        ))}
                    </select>
                </div>

            </div>


            {/* =================================================
                TABLA (Igual que antes)
            ================================================== */}
            <div className="w-full overflow-hidden rounded-lg">
                <table className="w-full table-fixed text-left text-slate-900 dark:text-slate-300 border-collapse">
                    <colgroup>
                        <col className="hidden sm:table-column sm:w-[16%]" />
                        <col className="w-[22%] sm:w-[18%]" />
                        <col className="w-[34%] sm:w-[30%]" />
                        <col className="w-[22%] sm:w-[18%]" />
                        <col className="w-[22%] sm:w-[18%]" />
                    </colgroup>

                    <thead className="text-[10px] sm:text-xs uppercase bg-slate-50 dark:bg-slate-950/50 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    const sorted = header.column.getIsSorted();
                                    const esUsuario = header.column.id === 'usuario';

                                    return (
                                        <th
                                            key={header.id}
                                            className={`p-2 sm:p-4 select-none align-middle ${esUsuario ? 'hidden sm:table-cell' : ''}`}
                                        >
                                            <button
                                                type="button"
                                                className="w-full flex items-center gap-1.5 text-left hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                <span className="truncate">
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                </span>
                                                <span className="flex-shrink-0 text-indigo-600 dark:text-indigo-400">
                                                    {sorted === 'asc' ? (
                                                        <FaChevronUp size={9} />
                                                    ) : sorted === 'desc' ? (
                                                        <FaChevronDown size={9} />
                                                    ) : (
                                                        header.column.getCanSort() && <FaSort size={9} className="opacity-40" />
                                                    )}
                                                </span>
                                            </button>
                                        </th>
                                    );
                                })}
                            </tr>
                        ))}
                    </thead>

                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="p-8 text-center text-slate-500 text-sm italic">
                                    No se encontraron registros con los filtros seleccionados.
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    {row.getVisibleCells().map((cell) => {
                                        const esUsuario = cell.column.id === 'usuario';
                                        return (
                                            <td
                                                key={cell.id}
                                                className={`p-2 sm:p-4 text-xs sm:text-sm align-middle break-words overflow-hidden ${esUsuario ? 'hidden sm:table-cell' : ''}`}
                                            >
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

            {/* Paginación (Se mantiene igual que la versión anterior) */}
            <div className="flex flex-col sm:flex-row items-center justify-between mt-5 sm:mt-6 border-t border-slate-200 dark:border-slate-700 pt-4 gap-4">
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>Página <strong>{currentPage}</strong> de <strong>{pageCount}</strong></span>
                </div>
                <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                    <button
                        type="button"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded text-xs disabled:opacity-30"
                    >
                        Anterior
                    </button>
                    <button
                        type="button"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded text-xs disabled:opacity-30"
                    >
                        Siguiente
                    </button>
                </div>
            </div>
        </div>
    );
}