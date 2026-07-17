


import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FaPen, FaTrash, FaLock } from "react-icons/fa";
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useUser } from "../context/UserContext.jsx";
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function DashboardOld() {
  const { loading } = useUser();
  const { sesion, hogarId, nombreUsuario, setHogarId } = useUser();
  const [tempHogar, setTempHogar] = useState("");
  const [tabActiva, setTabActiva] = useState('todos');
  const [categorias, setCategorias] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [idGastoEditando, setIdGastoEditando] = useState(null);
  const [idCategoriaEditando, setIdCategoriaEditando] = useState(null);
  const [colorCategoria, setColorCategoria] = useState('#6366f1');
  const { esModoOscuro } = useTheme();

  useEffect(() => {
    if (hogarId) {
      traerCategorias();
      traerGastos();
    }
  }, [hogarId]);

  const traerCategorias = async () => {
    const { data, error } = await supabase.from('categorias').select('*').eq('hogar_id', hogarId);
    if (!error) setCategorias(data);
  };

  const traerGastos = async () => {
    const { data, error } = await supabase
      .from('gastos')
      .select(`*, categorias (nombre, color), perfiles (nombre, email)`)
      .eq('hogar_id', hogarId);

    if (error) {
      console.error("Error al traer gastos:", error);
      return;
    }
    setGastos(data || []);
  };

  const guardarGasto = async (e) => {
    e.preventDefault();
    if (!monto || !categoriaSeleccionada) return;

    const datosGasto = {
      monto: parseFloat(monto),
      descripcion: descripcion,
      categoria_id: parseInt(categoriaSeleccionada),
      hogar_id: hogarId,
      pagado_por: sesion.user.id
    };

    if (idGastoEditando) {
      await supabase.from('gastos').update(datosGasto).eq('id', idGastoEditando);
      setIdGastoEditando(null);
    } else {
      await supabase.from('gastos').insert([datosGasto]);
    }

    setMonto('');
    setDescripcion('');
    setCategoriaSeleccionada('');
    await traerGastos();
  };

  const guardarCategoria = async (e) => {
    e.preventDefault();
    if (!nuevaCategoria) return;

    const datosCat = {
      nombre: nuevaCategoria.toUpperCase(),
      hogar_id: hogarId,
      color: colorCategoria
    };

    if (idCategoriaEditando) {
      await supabase.from('categorias').update(datosCat).eq('id', idCategoriaEditando);
      setIdCategoriaEditando(null);
    } else {
      await supabase.from('categorias').insert([datosCat]);
    }

    setNuevaCategoria('');
    setColorCategoria('#6366f1');
    await traerCategorias();
    await traerGastos();
  };

  const eliminarGasto = async (gasto) => {
    // Verificación de seguridad extra
    if (String(gasto.pagado_por) !== String(sesion.user.id)) {
      alert("¡Ni lo intentes, crack! Solo podés borrar tus propios gastos.");
      return;
    }

    if (!window.confirm("¿Seguro querés eliminar este consumo?")) return;

    const { error } = await supabase.from('gastos').delete().eq('id', gasto.id);

    if (!error) {
      traerGastos(); // Recargamos solo si la eliminación fue exitosa
    }
  };

  const eliminarCategoria = async (id) => {
    if (!window.confirm("¿Seguro querés eliminar esta categoría?")) return;
    await supabase.from('categorias').delete().eq('id', id);
    await traerCategorias();
    await traerGastos();
  };

  const obtenerEstiloCategoria = (categoria, conBordeIzquierdo = false) => {
    const color = categoria?.color || '#6366f1';
    const baseStyle = {
      backgroundColor: `${color}20`,
      color: color,
      border: `1px solid ${color}50`,
      fontSize: '0.875rem',
      fontWeight: '700'
    };
    if (conBordeIzquierdo) {
      return { ...baseStyle, borderLeftWidth: '7px', borderLeftStyle: 'solid', borderLeftColor: color, fontSize: '3rem', fontWeight: '700' };
    }
    return baseStyle;
  };

  const totalesPorUsuario = gastos.reduce((acc, gasto) => {
    const nombre = gasto.perfiles?.nombre || gasto.perfiles?.email || 'Invitado';
    acc[nombre] = (acc[nombre] || 0) + parseFloat(gasto.monto);
    return acc;
  }, {});

  const calcularDeudasDirectas = () => {
    if (!gastos || gastos.length === 0) return ["No hay gastos cargados aún."];
    const saldos = gastos.reduce((acc, g) => {
      let identificador = g.perfiles?.nombre || g.perfiles?.email || `Invitado`;
      acc[identificador] = (acc[identificador] || 0) + parseFloat(g.monto);
      return acc;
    }, {});
    const usuarios = Object.keys(saldos);
    if (usuarios.length < 2) return [`Necesitás gastos de al menos 2 personas.`];
    const [usuarioA, usuarioB] = usuarios;
    const totalA = saldos[usuarioA];
    const totalB = saldos[usuarioB];
    const totalGeneral = totalA + totalB;
    const cuotaIdeal = totalGeneral / 2;
    if (Math.abs(totalA - cuotaIdeal) < 1) return ["¡Todo está saldado!"];
    return totalA > totalB
      ? [`${usuarioB} debe pagar $${(totalA - cuotaIdeal).toLocaleString('es-AR')} a ${usuarioA}`]
      : [`${usuarioA} debe pagar $${(totalB - cuotaIdeal).toLocaleString('es-AR')} a ${usuarioB}`];
  };

  const totalesPorCategoria = categorias.map(cat => ({
    nombre: cat.nombre,
    total: gastos.filter(g => g.categoria_id === cat.id).reduce((acc, current) => acc + current.monto, 0)
  }));

  const iniciarEdicionCategoria = (cat) => { setIdCategoriaEditando(cat.id); setNuevaCategoria(cat.nombre); setColorCategoria(cat.color || '#6366f1'); };
  const iniciarEdicion = (gasto) => { setIdGastoEditando(gasto.id); setMonto(gasto.monto); setDescripcion(gasto.descripcion || ''); setCategoriaSeleccionada(gasto.categoria_id); };
  const cancelarEdicion = () => { setIdGastoEditando(null); setMonto(''); setDescripcion(''); setCategoriaSeleccionada(''); };

  const nombresUsuarios = [...new Set(gastos.map(g => g.perfiles?.nombre || g.perfiles?.email || 'Invitado'))];

  // Filtramos la lista según la pestaña
  const gastosFiltrados = tabActiva === 'todos'
    ? gastos
    : gastos.filter(g => (g.perfiles?.nombre || g.perfiles?.email || 'Invitado') === tabActiva);

  if (sesion && !hogarId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
        <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 text-center max-w-sm w-full animate-in fade-in zoom-in duration-300">
          <h2 className="text-white text-xl font-bold mb-4">¡Bienvenido!</h2>
          <p className="text-slate-400 mb-6 text-sm">Ingresá el código de tu hogar:</p>

          <input
            className="w-full p-2 mb-4 bg-slate-950 text-white border border-slate-700 rounded-lg uppercase outline-none focus:border-indigo-500"
            placeholder="Ej: GASTOS-COLOS"
            value={tempHogar}
            onChange={(e) => setTempHogar(e.target.value.toUpperCase())}
          />

          <button
            onClick={async () => {
              if (!tempHogar) return;
              await supabase.from('perfiles').update({ hogar_id: tempHogar }).eq('id', sesion.user.id);
              setHogarId(tempHogar); // Esto actualiza el estado y refresca el Dashboard sin recargar
            }}
            className="bg-indigo-600 text-white w-full p-2 rounded-lg font-bold hover:bg-indigo-500 transition-all"
          >
            Confirmar y Activar Panel
          </button>
        </div>
      </div>
    );

    return (
      <div className={`${esModoOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex h-screen items-center justify-center bg-slate-950 p-4">
          <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 text-center max-w-sm w-full">
            <h2 className="text-white text-xl font-bold mb-4">¡Bienvenido!</h2>
            <p className="text-slate-400 mb-6 text-sm">Ingresá el código de tu hogar:</p>
            <input className="w-full p-2 mb-4 bg-slate-950 text-white border border-slate-700 rounded-lg uppercase" placeholder="Ej: GASTOS-COLOS" onChange={(e) => { tempHogar = e.target.value.toUpperCase(); }} />
            <button onClick={async () => { if (!tempHogar) return; await supabase.from('perfiles').update({ hogar_id: tempHogar }).eq('id', sesion.user.id); window.location.reload(); }} className="bg-indigo-600 text-white w-full p-2 rounded-lg font-bold">Confirmar y Activar Panel</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-stone-950 bg-white dark:bg-slate-950 dark:text-white min-h-screen transition-colors duration-300 antialiased font-sans">
      <div className="min-h-screen transition-colors duration-300 antialiased font-sans">
        <div className="max-w-6xl mx-auto px-4 py-6 md:py-10">
          <header className="flex flex-col items-center justify-center gap-2 mb-10 pb-6 border-b border-slate-900 text-center">
            <h1 className="text-4xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 font-black">
              ¡Bienvenido, <span className="font-bold text-dark dark:text-white">{nombreUsuario}</span>!
            </h1>

          </header>

          <section className="p-5 rounded-xl mb-10 border border-slate-200 dark:border-indigo-500/30">
            <h3 className="font-bold text-indigo-400 uppercase tracking-widest mb-4">¿Quién le debe a quién?</h3>
            {calcularDeudasDirectas().map((mensaje, index) => <p key={index}>👉 {mensaje}</p>)}
          </section>

          <section className="mt-6 p-5 border border-slate-800 rounded-xl mb-9">
            <h3 className="text-sm font-bold text-indigo-400 uppercase mb-4">Gastos por usuario</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(totalesPorUsuario).map(([nombre, total]) => (
                <div key={nombre} className="bg-slate-900 p-3 rounded-lg">
                  <p className="text-xs text-slate-400">{nombre}</p>
                  <p className="text-xl font-bold">$ {total.toLocaleString('es-AR')}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10 border">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {totalesPorCategoria.map((item, index) => {
                const categoriaOriginal = categorias.find(c => c.nombre === item.nombre);
                const estilo = obtenerEstiloCategoria(categoriaOriginal, true);
                return (
                  <div key={index} className="p-4 border" style={estilo}>
                    <span className="block text-[10px] uppercase font-bold opacity-80">{item.nombre}</span>
                    <div className="text-2xl font-black font-mono">${item.total.toLocaleString('es-AR')}</div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-5 space-y-6">
              <section className="bg-amber-400 border dark:bg-slate-900/30 border-slate-900 p-5 rounded-xl">
                <h3 className="text-sm font-bold uppercase mb-3">{idCategoriaEditando ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
                <form onSubmit={guardarCategoria} className="flex gap-2">
                  <input type="text" value={nuevaCategoria} onChange={(e) => setNuevaCategoria(e.target.value)} className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2.5 uppercase" />
                  <input type="color" value={colorCategoria} onChange={(e) => setColorCategoria(e.target.value)} className="w-10 h-10 cursor-pointer" />
                  <button type="submit" className="bg-indigo-600 px-4 rounded-lg">{idCategoriaEditando ? '✅' : '➕'}</button>
                </form>
                <div className="mt-4 flex flex-wrap gap-2">
                  {categorias.map(cat => (
                    <div key={cat.id} className="flex items-center gap-1 bg-slate-800/50 pl-2 pr-1 py-1 rounded-md border border-slate-700">
                      <span className="text-[9px] uppercase font-bold" style={{ color: cat.color }}>{cat.nombre}</span>
                      <button onClick={() => iniciarEdicionCategoria(cat)} className="text-slate-500 hover:text-indigo-400"><FaPen /></button>
                      <button onClick={() => eliminarCategoria(cat.id)} className="text-slate-500 hover:text-rose-500">×</button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="p-5 rounded-xl border bg-slate-900/30 border-slate-900">
                <h3 className="text-sm font-bold uppercase mb-4">{idGastoEditando ? 'Editar Registro' : 'Cargar Gasto'}</h3>
                <form onSubmit={guardarGasto} className="space-y-4">
                  <input type="number" placeholder="Monto" value={monto} onChange={(e) => setMonto(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5" />
                  <input type="text" placeholder="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5" />
                  <select value={categoriaSeleccionada} onChange={(e) => setCategoriaSeleccionada(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                    <option value="">-- Seleccionar --</option>
                    {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                  </select>
                  <button type="submit" className="w-full bg-indigo-600 rounded-lg py-3 font-bold">{idGastoEditando ? 'Actualizar' : 'Confirmar Gasto'}</button>
                </form>
              </section>
            </div>

            <div className="md:col-span-7">
              <h3 className="text-sm font-bold uppercase text-slate-400 mb-4">Historial</h3>
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setTabActiva('todos')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold ${tabActiva === 'todos' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                  Todos
                </button>

                {nombresUsuarios.map(nombre => (
                  <button
                    key={nombre}
                    onClick={() => setTabActiva(nombre)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold ${tabActiva === nombre ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                  >
                    {nombre}
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                {gastosFiltrados.length > 0 ? (
                  gastosFiltrados.map((gasto) => {
                    // Esto ya lo tenías, es perfecto
                    const esPropietario = String(gasto.pagado_por) === String(sesion.user.id);

                    return (
                      <div key={gasto.id} className="bg-slate-900/20 border border-slate-900 p-4 rounded-xl flex justify-between items-center transition-all hover:border-indigo-500/50">
                        <div>
                          <span className="text-[14px] px-2 py-0.5 rounded-md uppercase font-bold border" style={obtenerEstiloCategoria(gasto.categorias)}>
                            {gasto.categorias?.nombre}
                          </span>
                          <p className="text-sm mt-1">
                            {gasto.descripcion}
                            <span className="text-[10px] text-slate-500 ml-2 italic">
                              - {gasto.perfiles?.nombre || 'Invitado'}
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="font-bold text-2xl font-mono">${parseFloat(gasto.monto).toLocaleString('es-AR')}</div>

                          {/* Si es propietario, mostramos los botones. Si no, podemos poner un candadito o nada */}
                          {esPropietario ? (
                            <div className="flex gap-2">
                              <button onClick={() => iniciarEdicion(gasto)} className="text-slate-500 hover:text-indigo-400"><FaPen /></button>
                              <button onClick={() => eliminarGasto(gasto)} className="text-slate-500 hover:text-rose-500"><FaTrash /></button>
                            </div>
                          ) : (
                            // Opcional: mostrar un ícono pequeño para indicar que es de otro usuario
                            <span className="text-slate-700 text-xs"><FaLock /></span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-slate-500 py-10">No hay gastos en esta categoría.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}