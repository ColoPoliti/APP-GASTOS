import React, { useEffect, useState, useCallback } from 'react';
import { PieChart, Pie, Sector, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../supabaseClient';
import { useUser } from '../context/UserContext';
import { ClipLoader } from 'react-spinners';
import { obtenerColorTextoIdeal } from '../utils/colorUtils';

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4'];

// Función que dibuja la porción activa (agrandada) con su etiqueta flotante adaptable
const renderActiveShape = (props) => {
    // Detectamos si el documento tiene la clase 'dark' para los colores dinámicos
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
        <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 my-6 text-xs">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-6 text-center">
                Distribución de Gastos por Categoría
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">

                {/* Lado Izquierdo: Gráfico adaptable con altura responsive y radios porcentuales */}
                <div className="w-full h-72 sm:h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
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

                {/* Lado Derecho: Totales por categoría */}
                <div className="flex flex-col space-y-3 p-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Detalle de Categorías</span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-3  overflow-y-auto pr-1">
                        {dataGrafico.map((item, index) => {
                            const colorFinal = item.color !== '#6366f1' ? item.color : COLORS[index % COLORS.length];
                            const porcentaje = totalGeneral > 0 ? ((item.value / totalGeneral) * 100).toFixed(1) : 0;
                            const isSelected = activeIndex === index;
                            
                            // Calculamos el color ideal de contraste por cada categoría iterada
                            const colorTextoIdeal = obtenerColorTextoIdeal(colorFinal);

                            return (
                                <div
                                    key={index}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    className={`flex items-center justify-between p-2.5 bg-white shadow dark:bg-slate-900 border transition-all cursor-pointer ${isSelected ? 'shadow shadow-indigo-500/10 bg-slate-850' : 'border-0'
                                        }`}
                                    style={{
                                        borderColor: isSelected ? colorFinal : undefined
                                    }}
                                >
                                    <div className="flex items-center space-x-3">
                                        <span
                                            className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                                            style={{ backgroundColor: colorFinal }}
                                        ></span>
                                        <span 
                                            className="text-sm font-bold" 
                                            style={{ color: colorTextoIdeal }}
                                        >
                                            {item.name}
                                        </span>
                                    </div>

                                    <div className="text-right">
                                        <span className="text-sm font-bold dark:text-slate-200">
                                            ${item.value.toLocaleString('es-AR')}
                                        </span>
                                        <span className="text-xs dark:text-slate-400 ml-2">
                                            ({porcentaje}%)
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}