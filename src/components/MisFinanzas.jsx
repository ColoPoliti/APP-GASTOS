import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { ClipLoader } from 'react-spinners';
import { FaWallet, FaMoneyBillWave, FaChartLine, FaPiggyBank, FaEdit, FaCheck, FaExchangeAlt, FaUserTag, FaPlus, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function MisFinanzas() {
    const { hogarId, sesion } = useUser();
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [gastosTotales, setGastosTotales] = useState(0);
    const [transferenciasEnviadas, setTransferenciasEnviadas] = useState(0);
    
    // Estados para Gastos Personales desde la nueva tabla
    const [listaGastosPersonales, setListaGastosPersonales] = useState([]);
    const [gastosPersonalesTotal, setGastosPersonalesTotal] = useState(0);
    const [modalPersonalesAbierto, setModalPersonalesAbierto] = useState(false);
    const [nuevoGastoDesc, setNuevoGastoDesc] = useState('');
    const [nuevoGastoMonto, setNuevoGastoMonto] = useState('');

    // Estado para el sueldo guardado en localStorage
    const [sueldo, setSueldo] = useState(() => {
        const guardado = localStorage.getItem(`sueldo_hogar_${hogarId}`);
        return guardado ? parseFloat(guardado) : 0;
    });
    const [editandoSueldo, setEditandoSueldo] = useState(false);
    const [inputSueldo, setInputSueldo] = useState(sueldo.toString());

    // Función para recargar todos los datos financieros
    const fetchDatosFinanzas = async () => {
        if (!hogarId || !sesion?.user?.id) return;

        try {
            setLoading(true);
            const userId = sesion.user.id;
            
            // 1. Traer gastos totales del hogar
            const { data: gastosData, error: gastosError } = await supabase
                .from('gastos')
                .select('monto')
                .eq('hogar_id', hogarId);

            if (gastosError) throw gastosError;
            const sumaGastos = (gastosData || []).reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0);
            setGastosTotales(sumaGastos);

            // 2. Traer transferencias enviadas por el usuario actual
            const { data: transData, error: transError } = await supabase
                .from('transferencias')
                .select('*')
                .eq('hogar_id', hogarId);

            if (!transError && transData) {
                const sumaEnviadas = transData.reduce((acc, curr) => {
                    const montoTrans = parseFloat(curr.monto) || 0;
                    if (curr.enviado_por === userId) {
                        return acc + montoTrans;
                    }
                    return acc;
                }, 0);
                setTransferenciasEnviadas(sumaEnviadas);
            }

            // 3. Traer gastos personales de la nueva tabla
            const { data: personalesData, error: personalesError } = await supabase
                .from('gastos_personales')
                .select('*')
                .eq('user_id', userId)
                .eq('hogar_id', hogarId);

            if (!personalesError && personalesData) {
                setListaGastosPersonales(personalesData);
                const sumaPersonales = personalesData.reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0);
                setGastosPersonalesTotal(sumaPersonales);
            }

        } catch (err) {
            console.error("Error al calcular datos para finanzas:", err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDatosFinanzas();
    }, [hogarId, sesion]);

    const guardarSueldo = (e) => {
        e.preventDefault();
        const nuevoSueldo = parseFloat(inputSueldo) || 0;
        setSueldo(nuevoSueldo);
        localStorage.setItem(`sueldo_hogar_${hogarId}`, nuevoSueldo.toString());
        setEditandoSueldo(false);
        toast.success("Sueldo actualizado con éxito", { position: 'bottom-center' });
    };

    const agregarGastoPersonal = async (e) => {
        e.preventDefault();
        if (!nuevoGastoDesc.trim() || !nuevoGastoMonto) {
            toast.error("Completá la descripción y el monto");
            return;
        }

        try {
            const { error } = await supabase.from('gastos_personales').insert([{
                user_id: sesion.user.id,
                hogar_id: hogarId,
                descripcion: nuevoGastoDesc.trim(),
                monto: parseFloat(nuevoGastoMonto)
            }]);

            if (error) throw error;

            toast.success("Gasto personal agregado", { position: 'bottom-center' });
            setNuevoGastoDesc('');
            setNuevoGastoMonto('');
            setModalPersonalesAbierto(false);
            fetchDatosFinanzas();
        } catch (err) {
            console.error("Error al guardar gasto personal:", err.message);
            toast.error("No se pudo guardar el gasto");
        }
    };

    const eliminarGastoPersonal = async (id) => {
        try {
            const { error } = await supabase.from('gastos_personales').delete().eq('id', id);
            if (error) throw error;
            toast.success("Gasto eliminado", { position: 'bottom-center' });
            fetchDatosFinanzas();
        } catch (err) {
            console.error("Error al eliminar:", err.message);
            toast.error("No se pudo eliminar");
        }
    };

    // Cálculos: Sueldo - (Mitad de Gastos Hogar) - (Transferencias Enviadas) - (Gastos Personales)
    const mitadGastos = gastosTotales / 2;
    const gastoFinalCalculado = mitadGastos + transferenciasEnviadas + gastosPersonalesTotal;
    const balance = sueldo - gastoFinalCalculado;
    const porcentajeGastado = sueldo > 0 ? Math.min(100, Math.round((gastoFinalCalculado / sueldo) * 100)) : 0;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <ClipLoader color="#6366f1" size={40} />
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:p-6 my-6 text-xs outline-none">
            {/* Cabecera */}
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="sm:text-3xl text-lg font-black mb-1 mt-1 sm:mt-12 text-slate-900 dark:text-slate-100 flex items-center gap-3">
                        <FaPiggyBank className="text-indigo-500" /> Mis Finanzas
                    </h1>
                    <p className="text-slate-400 text-sm">Controlá tu sueldo, gastos compartidos, transferencias, gastos personales y tu balance</p>
                </div>
                <button
                    onClick={() => setModalPersonalesAbierto(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
                >
                    <FaPlus size={11} /> Agregar Gasto Personal
                </button>
            </div>

            <hr className="border-slate-800 my-6" />

            {/* Tarjetas de Información */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                
                {/* 1. Sueldo */}
                <div className="p-5 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                                <FaMoneyBillWave className="text-emerald-500" size={13} /> Mi Sueldo
                            </span>
                            {!editandoSueldo && (
                                <button
                                    onClick={() => { setInputSueldo(sueldo.toString()); setEditandoSueldo(true); }}
                                    className="text-indigo-400 hover:text-indigo-300 transition-colors p-1 cursor-pointer"
                                    title="Editar sueldo"
                                >
                                    <FaEdit size={13} />
                                </button>
                            )}
                        </div>

                        {editandoSueldo ? (
                            <form onSubmit={guardarSueldo} className="space-y-2">
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 font-bold">$</span>
                                    <input
                                        type="number"
                                        step="any"
                                        value={inputSueldo}
                                        onChange={(e) => setInputSueldo(e.target.value)}
                                        className="w-full pl-7 pr-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Ej: 500000"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-1 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setEditandoSueldo(false)}
                                        className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-[10px] font-semibold cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                                    >
                                        <FaCheck size={9} /> Guardar
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                                ${sueldo.toLocaleString('es-AR')}
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Mitad de Gastos del Hogar */}
                <div className="p-5 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col justify-between">
                    <div>
                        <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5 mb-3">
                            <FaWallet className="text-rose-500" size={13} /> Mitad de Gastos (50%)
                        </span>
                        <div className="text-xl sm:text-2xl font-black text-rose-500">
                            -${mitadGastos.toLocaleString('es-AR')}
                        </div>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2 block">
                        Total hogar: ${gastosTotales.toLocaleString('es-AR')}
                    </span>
                </div>

                {/* 3. Transferencias Enviadas */}
                <div className="p-5 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col justify-between">
                    <div>
                        <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5 mb-3">
                            <FaExchangeAlt className="text-amber-500" size={13} /> Transf. Enviadas
                        </span>
                        <div className="text-xl sm:text-2xl font-black text-rose-500">
                            -${transferenciasEnviadas.toLocaleString('es-AR')}
                        </div>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2 block">
                        Plata enviada por vos
                    </span>
                </div>

                {/* 4. Gastos Personales */}
                <div className="p-5 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col justify-between">
                    <div>
                        <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5 mb-3">
                            <FaUserTag className="text-purple-500" size={13} /> Gastos Personales
                        </span>
                        <div className="text-xl sm:text-2xl font-black text-rose-500">
                            -${gastosPersonalesTotal.toLocaleString('es-AR')}
                        </div>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2 block">
                        {listaGastosPersonales.length} ítem(s) cargados
                    </span>
                </div>

                {/* 5. Balance Final */}
                <div className={`p-5 border rounded-2xl shadow-sm flex flex-col justify-between sm:col-span-2 lg:col-span-1 ${
                    balance >= 0 
                        ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30' 
                        : 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/30'
                }`}>
                    <div>
                        <span className="text-[11px] uppercase font-bold tracking-wider flex items-center gap-1.5 mb-3 text-slate-400">
                            <FaChartLine className={balance >= 0 ? 'text-emerald-500' : 'text-rose-500'} size={13} /> Balance Final
                        </span>
                        <div className={`text-xl sm:text-2xl font-black ${balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            ${balance.toLocaleString('es-AR')}
                        </div>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2 block">
                        {balance >= 0 ? '🟢 Estás en positivo' : '🔴 Estás en negativo'}
                    </span>
                </div>

            </div>

            {/* Listado detallado de Gastos Personales */}
            {listaGastosPersonales.length > 0 && (
                <div className="p-6 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm mb-6">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 text-sm">Detalle de tus Gastos Personales</h3>
                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {listaGastosPersonales.map((gasto) => (
                            <div key={gasto.id} className="py-2.5 flex justify-between items-center">
                                <div>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">{gasto.descripcion}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-rose-500">-${parseFloat(gasto.monto).toLocaleString('es-AR')}</span>
                                    <button 
                                        onClick={() => eliminarGastoPersonal(gasto.id)}
                                        className="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                                        title="Eliminar gasto"
                                    >
                                        <FaTrash size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Barra de Progreso */}
            {sueldo > 0 && (
                <div className="p-6 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
                    <div className="flex justify-between items-center text-sm font-bold">
                        <span className="text-slate-700 dark:text-slate-300">Porcentaje del sueldo destinado (Gastos hogar + Transferencias + Personales)</span>
                        <span className={porcentajeGastado > 100 ? 'text-rose-500' : 'text-indigo-400'}>{porcentajeGastado}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 rounded-full ${
                                porcentajeGastado > 85 ? 'bg-rose-500' : porcentajeGastado > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${porcentajeGastado}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100% del sueldo</span>
                    </div>
                </div>
            )}

            {/* Modal para Agregar Gasto Personal */}
            {modalPersonalesAbierto && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="text-base font-black text-slate-900 dark:text-white mb-4">Nuevo Gasto Personal</h3>
                        <form onSubmit={agregarGastoPersonal} className="space-y-4">
                            <div>
                                <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">Descripción (ej: Tarjeta, Suscripción)</label>
                                <input
                                    type="text"
                                    value={nuevoGastoDesc}
                                    onChange={(e) => setNuevoGastoDesc(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Ej: Netflix / Mercado Pago"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">Monto ($)</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={nuevoGastoMonto}
                                    onChange={(e) => setNuevoGastoMonto(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Ej: 15000"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setModalPersonalesAbierto(false)}
                                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm"
                                >
                                    Guardar Gasto
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}