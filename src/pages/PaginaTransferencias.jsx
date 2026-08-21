import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../context/UserContext';
import ListaTransferencias from '../components/ListaTransferencias';
import TransferenciaForm from '../components/TransferenciaForm';

export default function PaginaTransferencias() {
    const { hogarId, sesion } = useUser();
    const [transferencias, setTransferencias] = useState([]);
    const [miembros, setMiembros] = useState([]);
    const [cargando, setCargando] = useState(true);

    const cargarDatos = async () => {
        if (!hogarId) return;
        setCargando(true);
        try {
            const { data: transData, error: transError } = await supabase
                .from('transferencias')
                .select('*')
                .eq('hogar_id', hogarId)
                .order('fecha', { ascending: false });

            if (transError) throw transError;
            setTransferencias(transData || []);

            const { data: perfilData, error: perfilError } = await supabase
                .from('perfiles')
                .select('*');

            if (perfilError) throw perfilError;
            setMiembros(perfilData || []);
        } catch (error) {
            console.error("Error al cargar datos de transferencias:", error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, [hogarId]);

    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:p-6 my-6 text-xs outline-none focus:outline-none focus:ring-0 box-border overflow-x-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
                <div className="w-full sm:w-auto flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-black mb-1 mt-12 text-dark dark:text-slate-100 break-words">
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

            {cargando ? (
                <p className="text-slate-400 text-center py-8">Cargando transferencias...</p>
            ) : (
                <div className="w-full overflow-x-auto max-w-full">
                    <ListaTransferencias 
                        transferencias={transferencias}
                        miembros={miembros}
                        sesionId={sesion?.user?.id}
                        onTransferenciaEliminada={cargarDatos}
                    />
                </div>
            )}
        </div>
    );
}