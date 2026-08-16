import React, { useMemo, useEffect } from 'react';
import { useTheme } from "../context/ThemeContext";
import { obtenerEstiloCategoriaComun } from "../utils/gastosUtils";
import {
    FaChevronUp,
    FaChevronDown,
    FaSort
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
    const [sorting, setSorting] = React.useState([]);
    const [globalFilter, setGlobalFilter] = React.useState('');

    const { theme } = useTheme();

    /*
     * ---------------------------------------------------------
     * COLUMNAS
     * ---------------------------------------------------------
     */
    const columns = useMemo(() => [
        {
            accessorKey: 'perfiles.nombre',
            header: 'Usuario',

            accessorFn: (row) => {
                return row.perfiles?.nombre || 'Invitado';
            },

            cell: (info) => (
                <span className="truncate block max-w-[120px]">
                    {info.getValue()}
                </span>
            ),
        },

        {
            id: 'categoria',
            accessorFn: (row) => row.categorias?.nombre || '',

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

                const estiloCategoria =
                    obtenerEstiloCategoriaComun(cat, theme);

                return (
                    <span
                        className="
                            inline-block
                            max-w-full
                            truncate
                            px-2 sm:px-2.5
                            py-1
                            rounded-full
                            text-[9px] sm:text-[10px]
                            font-bold
                            uppercase
                            shadow-sm
                        "
                        style={estiloCategoria}
                        title={cat.nombre}
                    >
                        {cat.nombre}
                    </span>
                );
            },
        },

        {
            accessorKey: 'descripcion',

            header: 'Descripción',

            cell: (info) => (
                <span
                    className="
                        block
                        break-words
                        whitespace-normal
                        leading-5
                    "
                    title={info.getValue() || ''}
                >
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

                if (!fecha) {
                    return '-';
                }

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
     * TABLA
     * ---------------------------------------------------------
     */
    const table = useReactTable({
        data: gastos,

        columns,

        state: {
            sorting,
            globalFilter,
        },

        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,

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

    /*
     * Cuando cambia la búsqueda volvemos a la primera página.
     */
    useEffect(() => {
        table.setPageIndex(0);
    }, [globalFilter]);

    /*
     * ---------------------------------------------------------
     * PAGINACIÓN
     * ---------------------------------------------------------
     */
    const pageCount = table.getPageCount() || 1;

    const currentPage =
        table.getState().pagination.pageIndex + 1;

    /*
     * ---------------------------------------------------------
     * RENDER
     * ---------------------------------------------------------
     */

    return (
        <div
            className="
                w-full
                max-w-full
                bg-white
                dark:bg-slate-900
                mt-6 sm:mt-9
                p-3 sm:p-6
                rounded-xl
                border
                border-slate-200
                dark:border-slate-800
                shadow-lg
                transition-colors
                duration-300
                overflow-hidden
            "
        >

            {/* =================================================
                BUSCADOR
            ================================================== */}

            <div className="flex justify-end mb-4">
                <input
                    type="text"
                    className="
                        w-full
                        sm:w-64
                        px-4
                        py-2.5
                        bg-white
                        dark:bg-slate-950
                        border
                        border-slate-300
                        dark:border-slate-700
                        rounded-lg
                        text-sm
                        text-slate-900
                        dark:text-white
                        placeholder-slate-400
                        focus:ring-2
                        focus:ring-indigo-500
                        focus:border-indigo-500
                        outline-none
                        transition-colors
                    "
                    placeholder="Buscar gastos..."
                    value={globalFilter}
                    onChange={(e) =>
                        setGlobalFilter(e.target.value)
                    }
                />
            </div>


            {/* =================================================
                TABLA
            ================================================== */}

            <div className="w-full overflow-hidden rounded-lg">

                <table
                    className="
                        w-full
                        table-fixed
                        text-left
                        text-slate-900
                        dark:text-slate-300
                        border-collapse
                    "
                >

                    {/* -----------------------------------------
                        ANCHOS DE COLUMNAS
                    ------------------------------------------ */}

                    <colgroup>

                        {/* Usuario */}
                        <col className="hidden sm:table-column sm:w-[16%]" />

                        {/* Categoría */}
                        <col className="w-[22%] sm:w-[18%]" />

                        {/* Descripción */}
                        <col className="w-[34%] sm:w-[30%]" />

                        {/* Monto */}
                        <col className="w-[22%] sm:w-[18%]" />

                        {/* Fecha */}
                        <col className="w-[22%] sm:w-[18%]" />

                    </colgroup>


                    {/* =================================================
                        HEADER
                    ================================================== */}

                    <thead
                        className="
                            text-[10px]
                            sm:text-xs
                            uppercase
                            bg-slate-50
                            dark:bg-slate-950/50
                            text-slate-500
                            border-b
                            border-slate-200
                            dark:border-slate-700
                        "
                    >

                        {table.getHeaderGroups().map(
                            (headerGroup) => (

                                <tr key={headerGroup.id}>

                                    {headerGroup.headers.map(
                                        (header) => {

                                            const sorted =
                                                header.column.getIsSorted();

                                            /*
                                             * Ocultamos Usuario en móvil.
                                             */
                                            const esUsuario =
                                                header.column.id ===
                                                'perfiles_nombre';

                                            return (
                                                <th
                                                    key={header.id}
                                                    className={`
                                                        p-2
                                                        sm:p-4
                                                        select-none
                                                        align-middle
                                                        ${
                                                            esUsuario
                                                                ? 'hidden sm:table-cell'
                                                                : ''
                                                        }
                                                    `}
                                                >

                                                    <button
                                                        type="button"
                                                        className="
                                                            w-full
                                                            flex
                                                            items-center
                                                            gap-1.5
                                                            text-left
                                                            hover:text-indigo-600
                                                            dark:hover:text-indigo-400
                                                            transition-colors
                                                        "
                                                        onClick={
                                                            header.column.getToggleSortingHandler()
                                                        }
                                                    >

                                                        <span className="truncate">
                                                            {flexRender(
                                                                header.column.columnDef.header,
                                                                header.getContext()
                                                            )}
                                                        </span>

                                                        <span
                                                            className="
                                                                flex-shrink-0
                                                                text-indigo-600
                                                                dark:text-indigo-400
                                                            "
                                                        >

                                                            {sorted === 'asc' ? (
                                                                <FaChevronUp size={9} />
                                                            ) : sorted === 'desc' ? (
                                                                <FaChevronDown size={9} />
                                                            ) : (
                                                                header.column.getCanSort() && (
                                                                    <FaSort
                                                                        size={9}
                                                                        className="opacity-40"
                                                                    />
                                                                )
                                                            )}

                                                        </span>

                                                    </button>

                                                </th>
                                            );
                                        }
                                    )}

                                </tr>
                            )
                        )}

                    </thead>


                    {/* =================================================
                        BODY
                    ================================================== */}

                    <tbody
                        className="
                            divide-y
                            divide-slate-200
                            dark:divide-slate-800
                        "
                    >

                        {table.getRowModel().rows.length === 0 ? (

                            <tr>

                                <td
                                    colSpan={columns.length}
                                    className="
                                        p-8
                                        text-center
                                        text-slate-500
                                        text-sm
                                        italic
                                    "
                                >
                                    No se encontraron registros.
                                </td>

                            </tr>

                        ) : (

                            table.getRowModel().rows.map(
                                (row) => (

                                    <tr
                                        key={row.id}
                                        className="
                                            hover:bg-slate-50
                                            dark:hover:bg-slate-800/50
                                            transition-colors
                                        "
                                    >

                                        {row
                                            .getVisibleCells()
                                            .map((cell) => {

                                                /*
                                                 * Ocultar Usuario en móvil.
                                                 */
                                                const esUsuario =
                                                    cell.column.id ===
                                                    'perfiles_nombre';

                                                return (
                                                    <td
                                                        key={cell.id}
                                                        className={`
                                                            p-2
                                                            sm:p-4
                                                            text-xs
                                                            sm:text-sm
                                                            align-middle
                                                            break-words
                                                            overflow-hidden
                                                            ${
                                                                esUsuario
                                                                    ? 'hidden sm:table-cell'
                                                                    : ''
                                                            }
                                                        `}
                                                    >

                                                        {flexRender(
                                                            cell.column.columnDef.cell,
                                                            cell.getContext()
                                                        )}

                                                    </td>
                                                );
                                            })}

                                    </tr>

                                )
                            )

                        )}

                    </tbody>

                </table>

            </div>


            {/* =================================================
                PAGINACIÓN
            ================================================== */}

            <div
                className="
                    flex
                    flex-col
                    sm:flex-row
                    items-center
                    justify-between
                    mt-5
                    sm:mt-6
                    border-t
                    border-slate-200
                    dark:border-slate-700
                    pt-4
                    gap-4
                "
            >

                {/* ---------------------------------------------
                    INFORMACIÓN DE PÁGINA
                ---------------------------------------------- */}

                <div
                    className="
                        flex
                        flex-wrap
                        items-center
                        justify-center
                        gap-2
                        text-xs
                        text-slate-500
                        dark:text-slate-400
                    "
                >

                    <span>
                        Página{' '}
                        <strong>
                            {currentPage}
                        </strong>{' '}
                        de{' '}
                        <strong>
                            {pageCount}
                        </strong>
                    </span>

                    <span className="text-slate-300 dark:text-slate-600">
                        |
                    </span>

                    <div className="flex items-center gap-1.5">

                        <span>
                            Ir a:
                        </span>

                        <input
                            type="number"
                            min="1"
                            max={pageCount}
                            value={currentPage}
                            onChange={(e) => {

                                let page =
                                    Number(e.target.value) - 1;

                                if (Number.isNaN(page)) {
                                    page = 0;
                                }

                                page = Math.max(
                                    0,
                                    Math.min(page, pageCount - 1)
                                );

                                table.setPageIndex(page);
                            }}
                            className="
                                w-12
                                px-2
                                py-1.5
                                bg-white
                                dark:bg-slate-950
                                border
                                border-slate-300
                                dark:border-slate-700
                                rounded
                                text-center
                                text-slate-900
                                dark:text-white
                                text-xs
                                outline-none
                                focus:ring-1
                                focus:ring-indigo-500
                            "
                        />

                    </div>

                </div>


                {/* ---------------------------------------------
                    BOTONES
                ---------------------------------------------- */}

                <div
                    className="
                        flex
                        flex-wrap
                        justify-center
                        gap-1.5
                        sm:gap-2
                        w-full
                        sm:w-auto
                    "
                >

                    {/* Primero */}

                    <button
                        type="button"
                        onClick={() =>
                            table.setPageIndex(0)
                        }
                        disabled={
                            !table.getCanPreviousPage()
                        }
                        className="
                            px-2.5
                            sm:px-3
                            py-1.5
                            bg-slate-100
                            dark:bg-slate-800
                            rounded
                            text-xs
                            hover:bg-slate-200
                            dark:hover:bg-slate-700
                            disabled:opacity-30
                            disabled:cursor-not-allowed
                            text-slate-700
                            dark:text-slate-200
                            transition-colors
                        "
                    >
                        <span className="hidden sm:inline">
                            {'<<'} Primero
                        </span>

                        <span className="sm:hidden">
                            {'<<'}
                        </span>
                    </button>


                    {/* Anterior */}

                    <button
                        type="button"
                        onClick={() =>
                            table.previousPage()
                        }
                        disabled={
                            !table.getCanPreviousPage()
                        }
                        className="
                            px-2.5
                            sm:px-3
                            py-1.5
                            bg-slate-100
                            dark:bg-slate-800
                            rounded
                            text-xs
                            hover:bg-slate-200
                            dark:hover:bg-slate-700
                            disabled:opacity-30
                            disabled:cursor-not-allowed
                            text-slate-700
                            dark:text-slate-200
                            transition-colors
                        "
                    >
                        <span className="hidden sm:inline">
                            Anterior
                        </span>

                        <span className="sm:hidden">
                            ←
                        </span>
                    </button>


                    {/* Siguiente */}

                    <button
                        type="button"
                        onClick={() =>
                            table.nextPage()
                        }
                        disabled={
                            !table.getCanNextPage()
                        }
                        className="
                            px-2.5
                            sm:px-3
                            py-1.5
                            bg-slate-100
                            dark:bg-slate-800
                            rounded
                            text-xs
                            hover:bg-slate-200
                            dark:hover:bg-slate-700
                            disabled:opacity-30
                            disabled:cursor-not-allowed
                            text-slate-700
                            dark:text-slate-200
                            transition-colors
                        "
                    >
                        <span className="hidden sm:inline">
                            Siguiente
                        </span>

                        <span className="sm:hidden">
                            →
                        </span>
                    </button>


                    {/* Último */}

                    <button
                        type="button"
                        onClick={() =>
                            table.setPageIndex(
                                pageCount - 1
                            )
                        }
                        disabled={
                            !table.getCanNextPage()
                        }
                        className="
                            px-2.5
                            sm:px-3
                            py-1.5
                            bg-slate-100
                            dark:bg-slate-800
                            rounded
                            text-xs
                            hover:bg-slate-200
                            dark:hover:bg-slate-700
                            disabled:opacity-30
                            disabled:cursor-not-allowed
                            text-slate-700
                            dark:text-slate-200
                            transition-colors
                        "
                    >
                        <span className="hidden sm:inline">
                            Último {'>>'}
                        </span>

                        <span className="sm:hidden">
                            {'>>'}
                        </span>
                    </button>

                </div>

            </div>

        </div>
    );
}
