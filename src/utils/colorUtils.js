export function obtenerColorTextoIdeal(hexColor) {
if (!hexColor) return '#000000';
    let limpio = hexColor.replace('#', '').toLowerCase();
    
    if (limpio.length === 3) {
        limpio = limpio.split('').map(c => c + c).join('');
    }

    const r = parseInt(limpio.substr(0, 2), 16) || 0;
    const g = parseInt(limpio.substr(2, 2), 16) || 0;
    const b = parseInt(limpio.substr(4, 2), 16) || 0;
    
    // Forzamos texto negro si es un verde o amarillo brillante
    if ((g > 150 && g >= r && g >= b) || (r > 200 && g > 200)) {
        return '#000000';
    }

    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 170 ? '#000000' : '#ffffff';
}