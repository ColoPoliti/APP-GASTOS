// Utilidades para el manejo de Vaquitas (gastos compartidos)

export const redondearMonto = (monto) =>
  Math.round((parseFloat(monto) || 0) * 100) / 100;

// Calcula el split de una vaquita:
// - Total gastado en la vaquita
// - Cuota (por cabeza) = Total / participantes
// - Balances por participante (lo que puso - lo que le tocaba)
// - Deudas entre participantes (quién le debe a quién)
export const calcularSplitVaquita = (gastos = [], participantes = []) => {
  const listaGastos = gastos || [];
  const listaParticipantes = participantes || [];

  const totalGeneral = redondearMonto(
    listaGastos.reduce((acc, g) => acc + (parseFloat(g.monto) || 0), 0),
  );

  const cantParticipantes = listaParticipantes.length || 1;
  const porCabeza =
    cantParticipantes > 0 ? redondearMonto(totalGeneral / cantParticipantes) : 0;

  // Inicializar aportes exclusivamente con los participantes actuales
  const aportesPorUsuario = {};
  listaParticipantes.forEach((p) => {
    aportesPorUsuario[p.usuario_id || p.id] = 0;
  });

  // Sumar solo los gastos de usuarios que sigan participando activamente
  listaGastos.forEach((g) => {
    if (aportesPorUsuario[g.usuario_id] !== undefined) {
      aportesPorUsuario[g.usuario_id] += parseFloat(g.monto) || 0;
    }
  });

  const balances = listaParticipantes.map((p) => {
    const key = p.usuario_id || p.id;
    const puesto = redondearMonto(aportesPorUsuario[key] || 0);
    const diferencia = redondearMonto(puesto - porCabeza);
    return {
      usuario_id: key,
      email: p.perfiles?.email || p.nombre || "Participante",
      puesto,
      diferencia,
    };
  });

  const deudas = calcularDeudasEntre(balances);

  return {
    totalGeneral,
    porCabeza,
    cantParticipantes,
    balances,
    deudas,
  };
};

// Calcula las deudas entre los participantes de una vaquita
// Devuelve pares tipo: { deudor_id, deudor_email, acreedor_id, acreedor_email, monto }
export const calcularDeudasEntre = (balances = []) => {
  const deudas = [];

  // Créditos: quienes pusieron de más y por lo tanto le deben dinero
  const creditos = balances
    .filter((b) => b.diferencia > 0.005)
    .map((b) => ({ ...b }));

  // Deudores: quienes le deben dinero
  const deudores = balances
    .filter((b) => b.diferencia < -0.005)
    .map((b) => ({ ...b, debe: Math.abs(b.diferencia) }));

  // Reparto greedy: cada deudor le paga a los acreedores lo que les falta
  for (const deudor of deudores) {
    let montoPendiente = deudor.debe;

    for (const credito of creditos) {
      if (montoPendiente <= 0.005) break;

      const abono = Math.min(montoPendiente, credito.diferencia);
      if (abono > 0.005) {
        deudas.push({
          deudor_id: deudor.usuario_id,
          deudor_email: deudor.email,
          acreedor_id: credito.usuario_id,
          acreedor_email: credito.email,
          monto: redondearMonto(abono),
        });

        montoPendiente = redondearMonto(montoPendiente - abono);
        credito.diferencia = redondearMonto(credito.diferencia - abono);
      }
    }
  }

  return deudas;
};
