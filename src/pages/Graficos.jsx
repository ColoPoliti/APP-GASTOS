import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../supabaseClient';
import { useUser } from '../context/UserContext';
import { ClipLoader } from 'react-spinners';

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4'];

export default function Graficos() {
    const { hogarId } = useUser();
    const [gastos, setGastos] = useState([]);
    const [loading, setLoading] = useState(true);

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

    // 1. Agrupamos y sumamos los gastos por categoría
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
        <div className="w-full max-w-5xl mx-auto bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800 my-6">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-6 text-center">
                Distribución de Gastos por Categoría
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                
                {/* Lado Izquierdo: El Gráfico de Torta con sus porcentajes flotantes */}
                <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={dataGrafico}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={105}
                                paddingAngle={4}
                                dataKey="value"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Lado Derecho: Totales por categoría con indicador de color */}
                <div className="flex flex-col space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 max-h-80 overflow-y-auto">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Detalle de Categorías</span>
                    
                    {dataGrafico.map((item, index) => {
                        const colorFinal = item.color !== '#6366f1' ? item.color : COLORS[index % COLORS.length];
                        const porcentaje = totalGeneral > 0 ? ((item.value / totalGeneral) * 100).toFixed(1) : 0;

                        return (
                            <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                                <div className="flex items-center space-x-3">
                                    <span 
                                        className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm" 
                                        style={{ backgroundColor: colorFinal }}
                                    ></span>
                                    <span className="text-sm font-medium text-white">{item.name}</span>
                                </div>
                                
                                <div className="text-right">
                                    <span className="text-sm font-bold text-slate-200">
                                        ${item.value.toLocaleString('es-AR')}
                                    </span>
                                    <span className="text-xs text-slate-400 ml-2">
                                        ({porcentaje}%)
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