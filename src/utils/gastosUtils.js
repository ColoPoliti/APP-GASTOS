// Recibe 'gastos' como parámetro, así es una función pura y testeable
export const calcularDeudas = (gastos) => {
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

export const obtenerEstiloCategoria = (categoria, conBordeIzquierdo = false) => {
    const color = categoria?.color || '#6366f1';
    const baseStyle = {
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}50`,
        fontSize: '0.875rem',
        fontWeight: '700'
    };
    if (conBordeIzquierdo) {
        return { 
            ...baseStyle, 
            borderLeftWidth: '7px', 
            borderLeftStyle: 'solid', 
            borderLeftColor: color, 
            fontSize: '3rem', 
            fontWeight: '700' 
        };
    }
    return baseStyle;
};