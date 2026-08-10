export const calcularDeudas = (gastos, transferencias = []) => {
    if (!gastos || gastos.length === 0) return ["No hay gastos cargados aún."];

    // 1. Mapeamos los IDs a nombres reales
    const mapaNombres = {};
    gastos.forEach(g => {
        if (g.perfiles?.id) {
            mapaNombres[g.perfiles.id] = g.perfiles.nombre || g.perfiles.email || "Invitado";
        }
    });

    // 2. Acumulamos EXCLUSIVAMENTE los gastos de cada usuario (para aplicar la división justa por 2)
    const saldosGastos = {};
    gastos.forEach(g => {
        const id = g.perfiles?.id || 'invitado';
        saldosGastos[id] = (saldosGastos[id] || 0) + parseFloat(g.monto);
    });

    const idsUsuarios = Object.keys(saldosGastos);
    if (idsUsuarios.length < 2) return ["Necesitás registros de al menos 2 personas."];

    const idA = idsUsuarios[0];
    const idB = idsUsuarios[1];
    
    const nombreA = mapaNombres[idA] || idA;
    const nombreB = mapaNombres[idB] || idB;

    const totalGastosA = saldosGastos[idA] || 0;
    const totalGastosB = saldosGastos[idB] || 0;

    const totalGeneralGastos = totalGastosA + totalGastosB;
    const cuotaIdeal = totalGeneralGastos / 2;

    // Balance neto puramente de los gastos (cuánto puso cada uno vs su cuota ideal)
    let balanceA = totalGastosA - cuotaIdeal; 
    let balanceB = totalGastosB - cuotaIdeal; 

    // 3. APLICAMOS LAS TRANSFERENCIAS ENTERAS (sin dividir por 2)
    // La transferencia es un pago directo que reduce la deuda del que la envió.
    transferencias.forEach(t => {
        const montoTransferido = parseFloat(t.monto) || 0;
        const emisorId = String(t.enviado_por);

        if (emisorId === String(idA)) {
            // Si A envió plata, su saldo a favor sube o su deuda baja directamente por el total
            balanceA += montoTransferido;
            balanceB -= montoTransferido;
        } else if (emisorId === String(idB)) {
            // Si B envió plata, su saldo a favor sube o su deuda baja directamente por el total
            balanceB += montoTransferido;
            balanceA -= montoTransferido;
        }
    });

    // Redondeamos para evitar problemas de decimales flotantes (ej: 0.00000005)
    balanceA = Math.round(balanceA * 100) / 100;
    balanceB = Math.round(balanceB * 100) / 100;

    if (Math.abs(balanceA) < 1 && Math.abs(balanceB) < 1) return ["¡Todo está saldado!"];

    // 4. Determinamos quién le debe a quién según el balance final ajustado
    if (balanceA < 0 && balanceB > 0) {
        return [`${nombreA} debe pagar $${Math.abs(balanceA).toLocaleString('es-AR')} a ${nombreB}`];
    } else if (balanceB < 0 && balanceA > 0) {
        return [`${nombreB} debe pagar $${Math.abs(balanceB).toLocaleString('es-AR')} a ${nombreA}`];
    } else {
        if (balanceA < balanceB) {
            return [`${nombreA} debe pagar $${Math.abs(balanceA).toLocaleString('es-AR')} a ${nombreB}`];
        } else if (balanceB < balanceA) {
            return [`${nombreB} debe pagar $${Math.abs(balanceB).toLocaleString('es-AR')} a ${nombreA}`];
        }
    }

    return ["¡Todo está saldado!"];
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