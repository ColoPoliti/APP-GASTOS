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
            // 1. Cargar transferencias del hogar
            const { data: transData, error: transError } = await supabase
                .from('transferencias')
                .select('*')
                .eq('hogar_id', hogarId)
                .order('fecha', { ascending: false });

            if (transError) throw transError;
            setTransferencias(transData || []);

            // 2. Cargar miembros del hogar / perfiles
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
        <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white">Transferencias</h1>
                    <p className="text-sm text-slate-400">Gestioná los pagos y movimientos entre los miembros del hogar.</p>
                </div>
                
                <TransferenciaForm 
                    hogarId={hogarId}
                    sesionId={sesion?.user?.id}
                    miembros={miembros}
                    onGuardar={cargarDatos}
                />
            </div>

            {cargando ? (
                <p className="text-slate-400 text-center py-8">Cargando transferencias...</p>
            ) : (
                <ListaTransferencias 
                    transferencias={transferencias}
                    miembros={miembros}
                    sesionId={sesion?.user?.id}
                    onTransferenciaEliminada={cargarDatos}
                />
            )}
        </div>
    );
}