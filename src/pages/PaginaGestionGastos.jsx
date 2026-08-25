import React from 'react';
import { useUser } from '../context/UserContext.jsx';
import GestionGastos from '../components/GestionGastos';

export default function PaginaGestionGastos() {
    const { sesion, hogarId, nombreHogar } = useUser();

    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:p-6 my-6 text-xs outline-none focus:outline-none focus:ring-0 box-border overflow-x-hidden">
            <div className="mb-8">
                <h1 className="sm:text-3xl text-lg font-black mb-1 mt-1 sm:mt-12  text-dark dark:text-slate-100">Gestión de Gastos</h1>
                <p className="text-slate-400 text-sm">Administrá tus categorías, registrá nuevos gastos y transferencias para: <span className="font-bold text-indigo-400">{nombreHogar}</span></p>
            </div>
            <hr className="border-slate-800 my-6" />

            <GestionGastos hogarId={hogarId} sesion={sesion} />
        </div>
    );
}