export const calcularDeudas = (gastos, transferencias = []) => {
    // ... (todo el código de deudas dejalo tal cual lo tenés, está perfecto)
    if (!gastos || gastos.length === 0) return ["No hay gastos cargados aún."];

    const mapaNombres = {};
    gastos.forEach(g => {
        if (g.perfiles?.id) {
            mapaNombres[g.perfiles.id] = g.perfiles.nombre || g.perfiles.email || "Invitado";
        }
    });

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

    let balanceA = totalGastosA - cuotaIdeal;
    let balanceB = totalGastosB - cuotaIdeal;

    transferencias.forEach(t => {
        const montoTransferido = parseFloat(t.monto) || 0;
        const emisorId = String(t.enviado_por);

        if (emisorId === String(idA)) {
            balanceA += montoTransferido;
            balanceB -= montoTransferido;
        } else if (emisorId === String(idB)) {
            balanceB += montoTransferido;
            balanceA -= montoTransferido;
        }
    });

    balanceA = Math.round(balanceA * 100) / 100;
    balanceB = Math.round(balanceB * 100) / 100;

    if (Math.abs(balanceA) < 1 && Math.abs(balanceB) < 1) return ["¡Todo está saldado!"];

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

export const obtenerEstiloCategoria = (categoria, theme, conBordeIzquierdo = false) => {
    const color = categoria?.color || '#6366f1';
    
    // Aquí definimos esDarkMode basándonos en la lógica anterior
    const currentTheme = theme || (typeof window !== 'undefined' ? localStorage.getItem('theme') : 'light');
    const esDarkMode = currentTheme === 'dark';

    if (conBordeIzquierdo) {
        return {
            backgroundColor: esDarkMode ? `${color}15` : '#ffffff',
            color: esDarkMode ? color : '#1e293b',
            borderTop: esDarkMode ? `1px solid ${color}40` : '1px solid #e2e8f0',
            borderRight: esDarkMode ? `1px solid ${color}40` : '1px solid #e2e8f0',
            borderBottom: esDarkMode ? `1px solid ${color}40` : '1px solid #e2e8f0',
            borderLeft: `7px solid ${color}`,
            boxShadow: esDarkMode
                ? '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)'
                : '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
        };
    }

};

export const obtenerEstiloCategoriaComun = (categoria, theme) => {
    const color = categoria?.color || '#6366f1';
    const currentTheme = theme || (typeof window !== 'undefined' ? localStorage.getItem('theme') : 'light');
    const esDarkMode = currentTheme === 'dark';

    return {
        backgroundColor: esDarkMode ? `${color}20` : `${color}`,
        color: esDarkMode ? color : `#333`,
        border: `1px solid ${color}40`,
    };
};