export default function BadgeCategoria({ categoria }) {
    const color = categoria?.color || '#6366f1';
    return (
        <span 
            className="px-2 py-0.5 rounded-md uppercase font-bold border"
            style={{
                backgroundColor: `${color}20`,
                color: color,
                borderColor: `${color}50`
            }}
        >
            {categoria?.nombre}
        </span>
    );
}