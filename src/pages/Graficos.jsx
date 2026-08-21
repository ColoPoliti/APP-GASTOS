import React, { useEffect, useState, useCallback } from 'react';
import { PieChart, Pie, Sector, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../supabaseClient';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { ClipLoader } from 'react-spinners';
import { obtenerEstiloCategoriaComun } from "../utils/gastosUtils";
import { obtenerColorTextoIdeal } from '../utils/colorUtils';


const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4'];

// Función que dibuja la porción activa (agrandada) con su etiqueta flotante adaptable
const renderActiveShape = (props) => {
    const isDark = document.documentElement.classList.contains('dark');
    const mainTextColor = isDark ? '#ffffff' : '#0f172a';
    const subTextColor = isDark ? '#cbd5e1' : '#334155';
    const percentTextColor = isDark ? '#94a3b8' : '#64748b';

    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 8) * cos;
    const sy = cy + (outerRadius + 8) * sin;
    const mx = cx + (outerRadius + 18) * cos;
    const my = cy + (outerRadius + 18) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 18;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
        <g>
            <text x={cx} y={cy} dy={8} textAnchor="middle" fill={mainTextColor} className="text-xs sm:text-sm font-bold">
                {payload.name}
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 6}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 8}
                outerRadius={outerRadius + 12}
                fill={fill}
            />
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
            <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
            <text x={ex + (cos >= 0 ? 1 : -1) * 10} y={ey} textAnchor={textAnchor} fill={subTextColor} className="text-[11px] sm:text-xs">{`$${value.toLocaleString('es-AR')}`}</text>
            <text x={ex + (cos >= 0 ? 1 : -1) * 10} y={ey} dy={16} textAnchor={textAnchor} fill={percentTextColor} className="text-[9px] sm:text-[10px]">
                {`(${(percent * 100).toFixed(1)}%)`}
            </text>
        </g>
    );
};

export default function Graficos() {
    const { hogarId } = useUser();
    const { theme } = useTheme();
    const [gastos, setGastos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);

    const onPieEnter = useCallback((_, index) => {
        setActiveIndex(index);
    }, []);

    useEffect(() => {
        if (!hogarId) return;

        async function fetchGastosGrafico() {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('gastos')
                    .select('*, categorias(nombre, color), perfiles(id, nombre, email)')
                    .eq('hogar_id', hogarId);

                if (error) throw error;
                setGastos(data || []);
            } catch (err) {
                console.error("Error al cargar gastos para gráficos:", err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchGastosGrafico();
    }, [hogarId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <ClipLoader color="#ffffff" size={40} />
            </div>
        );
    }

    if (!gastos || gastos.length === 0) {
        return <div className="text-center p-8 text-slate-400">No hay gastos cargados aún en este hogar para mostrar gráficos.</div>;
    }

    const categoriasMap = {};

    gastos.forEach(g => {
        const catObj = g.categorias || g.categoria || {};
        const catNombre = typeof catObj === 'string' ? catObj : (catObj.nombre || 'Sin categoría');
        const catColor = catObj.color || '#6366f1';

        if (!categoriasMap[catNombre]) {
            categoriasMap[catNombre] = {
                name: catNombre,
                value: 0,
                color: catColor
            };
        }

        categoriasMap[catNombre].value += parseFloat(g.monto) || 0;
    });

    const dataGrafico = Object.values(categoriasMap).map(item => ({
        ...item,
        value: Math.round(item.value * 100) / 100
    }));

    const totalGeneral = dataGrafico.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:p-6 my-6 text-xs outline-none focus:outline-none focus:ring-0">
            <div className="mb-8">
                <h1 className="text-3xl font-black mb-1  mt-12 text-dark dark:text-slate-100">Mis Gráficos</h1>
                <p className="text-slate-400 text-sm">Distribución de Gastos por Categoría</p>
            </div>

            <hr className="border-slate-800 my-6" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">

                {/* Lado Izquierdo: Gráfico adaptable */}
                <div className="w-full h-72 sm:h-96 outline-none focus:outline-none focus:ring-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart className="outline-none">
                            <Pie
                                activeIndex={activeIndex}
                                activeShape={renderActiveShape}
                                data={dataGrafico}
                                cx="50%"
                                cy="50%"
                                innerRadius="48%"
                                outerRadius="72%"
                                dataKey="value"
                                onMouseEnter={onPieEnter}
                            >
                                {dataGrafico.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color !== '#6366f1' ? entry.color : COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value) => [`$${value.toLocaleString('es-AR')}`, 'Total']}
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', fontSize: '15px', fontWeight: 'bold', borderRadius: '12px', color: '#fff' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Lado Derecho: Lista de Categorías */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-3 overflow-y-auto pr-1 mt-6">
                    {dataGrafico.map((item, index) => {
                        const colorFinal = item.color !== '#6366f1' ? item.color : COLORS[index % COLORS.length];
                        const porcentaje = totalGeneral > 0 ? ((item.value / totalGeneral) * 100).toFixed(1) : 0;
                        const isSelected = activeIndex === index;

                        // Obtenemos los estilos adaptados a modo claro/oscuro con su color base y contraste
                        const estiloComun = obtenerEstiloCategoriaComun({ color: colorFinal }, theme);

                        // Forzamos que en modo claro use la función de texto ideal para mejor visibilidad, 
                        // y en modo oscuro mantenga el estilo dinámico optimizado.
                        const isDark = theme === 'dark' || (typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark');
                        const textColorFinal = isDark ? estiloComun.color : obtenerColorTextoIdeal(colorFinal);

                        return (
                            <div
                                key={index}
                                onMouseEnter={() => setActiveIndex(index)}
                                className={`relative overflow-hidden flex items-center justify-between p-3 bg-white dark:bg-slate-900/40 border transition-all cursor-pointer shadow-sm ${isSelected
                                        ? 'border-2 shadow-md'
                                        : 'border-slate-200 dark:border-slate-800'
                                    }`}
                                style={{
                                    borderColor: isSelected ? colorFinal : undefined
                                }}
                            >
                                {/* Bloque izquierdo aplicando el estilo unificado */}
                                <span
                                    className="absolute inset-y-0 left-0 px-3.5 flex items-center justify-center text-[16px] font-bold shadow-sm"
                                    style={{
                                        backgroundColor: estiloComun.backgroundColor,
                                        color: textColorFinal,
                                        borderRight: `1px solid ${colorFinal}40`
                                    }}
                                >
                                    ({porcentaje}%)
                                </span>

                                {/* Nombre de la categoría */}
                                <div className="ml-24 flex items-center">
                                    <span className="text-sm font-bold dark:text-white text-slate-950">
                                        {item.name}
                                    </span>
                                </div>

                                {/* Monto a la derecha */}
                                <div className="text-right">
                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-200">
                                        ${item.value.toLocaleString('es-AR')}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    );
}