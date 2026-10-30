import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../context/UserContext';
import ListaTransferencias from '../components/ListaTransferencias';
import TransferenciaForm from '../components/TransferenciaForm';
import { HashLoader } from 'react-spinners';

export default function PaginaTransferencias() {
    const { hogarId, sesion } = useUser();
    const [transferencias, setTransferencias] = useState([]);
    const [miembros, setMiembros] = useState([]);
    const [cargando, setCargando] = useState(true);

    const cargarDatos = async () => {
        if (!hogarId) return;
        setCargando(true);
        try {
            const [transResult, perfilesResult, gastosResult] = await Promise.all([
                supabase
                    .from('transferencias')
                    .select('*')
                    .eq('hogar_id', hogarId)
                    .order('fecha', { ascending: false }),
                supabase.from('perfiles').select('*'),
                supabase
                    .from('gastos')
                    .select('*, categorias (*), perfiles (*)')
                    .eq('hogar_id', hogarId),
            ]);

            const transData = transResult.data || [];
            const transError = transResult.error;
            if (transError) throw transError;
            setTransferencias(transData);

            const perfilData = perfilesResult.data || [];
            const perfilError = perfilesResult.error;
            if (perfilError) throw perfilError;

            // Coleccionamos los usuarios que participaron de este bolsín (gastos y transferencias).
            // Con esto no perdemos de vista a un contacto aunque después haya cambiado de bolsín.
            const idsParticipantes = new Set();
            const agregarParticipante = (id) => {
                if (id) idsParticipantes.add(id);
            };

            transData.forEach((t) => {
                agregarParticipante(t.enviado_por);
                agregarParticipante(t.recibido_por);
            });

            (gastosResult.data || []).forEach((g) => {
                agregarParticipante(g.perfiles?.id);
                agregarParticipante(g.pagado_por);
            });

            const miembrosDelBolsino = (perfilData || []).filter(
                (p) =>
                    idsParticipantes.has(p.id) ||
                    p.hogar_id === hogarId ||
                    p.hogarId === hogarId ||
                    (!p.hogar_id && !p.hogarId)
            );

            setMiembros(miembrosDelBolsino);
        } catch (error) {
            console.error("Error al cargar datos de transferencias:", error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, [hogarId]);

    if (cargando) {
        const isDark = document.documentElement.classList.contains('dark');
        const colorLoader = isDark ? '#ffffff' : '#4f46e5';

        return (
            <div className="fixed inset-0 z-50 flex flex-col text-slate-950 dark:text-white items-center justify-center dark:bg-slate-950 bg-slate-50 transition-colors duration-300 gap-4">
                <HashLoader color={colorLoader} size={60} />
                <span className="text-sm font-semibold tracking-wide">Cargando transferencias...</span>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:p-6 my-6 text-xs outline-none focus:outline-none focus:ring-0 box-border overflow-x-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
                <div className="w-full sm:w-auto flex-1 min-w-0">
                    <h1 className="sm:text-3xl text-lg font-black mb-1 mt-1 sm:mt-12 text-dark dark:text-slate-100 break-words">
                        Transferencias
                    </h1>
                    <p className="text-slate-400 text-sm break-words">
                        Gestioná los pagos y movimientos entre los miembros del hogar.
                    </p>
                </div>
               
                <div className="w-full sm:w-auto flex-shrink-0">
                    <TransferenciaForm 
                        hogarId={hogarId}
                        sesionId={sesion?.user?.id}
                        miembros={miembros}
                        onGuardar={cargarDatos}
                    />
                </div>
            </div>

            <hr className="border-slate-800 my-6 w-full" />

            <div className="w-full overflow-x-auto max-w-full">
                <ListaTransferencias 
                    transferencias={transferencias}
                    miembros={miembros}
                    sesionId={sesion?.user?.id}
                    onTransferenciaEliminada={cargarDatos}
                />
            </div>
        </div>
    );
}