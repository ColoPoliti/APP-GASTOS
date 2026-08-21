import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // 1. Resetea la ventana principal por las dudas
        window.scrollTo(0, 0);

        // 2. Resetea cualquier contenedor tipo <main> o divs con scroll interno en la app
        const mainContainer = document.querySelector('main');
        if (mainContainer) {
            mainContainer.scrollTop = 0;
        }

        // 3. Por si acaso, busca elementos con scroll vertical activo y los manda arriba
        const elementosConScroll = document.querySelectorAll('*');
        elementosConScroll.forEach(el => {
            if (el.scrollTop > 0) {
                el.scrollTop = 0;
            }
        });
    }, [pathname]);

    return null;
}