export function obtenerColorTextoIdeal(hexColor) {
    if (!hexColor) return '#000000';
    let limpio = hexColor.replace('#', '').toLowerCase();
    
    if (limpio.length === 3) {
        limpio = limpio.split('').map(c => c + c).join('');
    }

    const r = parseInt(limpio.substr(0, 2), 16) || 0;
    const g = parseInt(limpio.substr(2, 2), 16) || 0;
    const b = parseInt(limpio.substr(4, 2), 16) || 0;

    // Forzamos texto negro si es un amarillo brillante, verde claro o cualquier tono muy luminoso
    if ((r > 200 && g > 200) || (g > 180 && g >= r && g >= b)) {
        return '#000000';
    }

    const yiq = (r * 299 + g * 587 + b * 114) / 1000;

    // Umbral equilibrado para textos blancos solo en fondos realmente oscuros
    if (yiq < 125) {
        return '#ffffff';
    }

    return '#000000';
}
