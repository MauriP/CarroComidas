class MainRenderer {
    constructor() {
        this.contentArea = document.getElementById("content-area");
        this.navLinks = document.querySelectorAll("nav a");
        this.currentView = 'catalogo';
        this.loadedScripts = new Set();
        this.currentAppInstance = null;

        // Inicializar librerías
        this.inicializarLibrerias();

        this.init();
    }

    inicializarLibrerias() {
        console.log('=== INICIALIZANDO LIBRERÍAS ===');

        if (typeof Chart !== 'undefined') {
            window.Chart = Chart;
            console.log('✅ Chart.js inicializado');
        } else {
            console.warn('❌ Chart.js no disponible');
        }

        if (typeof Swal !== 'undefined') {
            window.Swal = Swal;
            console.log('✅ SweetAlert2 inicializado');
        } else {
            console.warn('❌ SweetAlert2 no disponible');
        }

        if (typeof Notyf !== 'undefined') {
            window.Notyf = Notyf;
            console.log('✅ Notyf inicializado');
        } else {
            console.warn('❌ Notyf no disponible');
        }

        console.log('Estado librerías - Chart:', !!window.Chart, 'Swal:', !!window.Swal, 'Notyf:', !!window.Notyf);
    }

    init() {
        this.setupNavigation();
        this.loadView('catalogo');
    }

    setupNavigation() {
        this.navLinks.forEach((link) => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                const view = link.getAttribute("data-view");
                this.loadView(view);
                this.updateActiveNav(link);
            });
        });
    }

    updateActiveNav(activeLink) {
        this.navLinks.forEach(link => link.classList.remove('active'));
        activeLink.classList.add('active');
    }

    destroyCurrentView() {
        console.log('Destruyendo vista actual...');

        // Destruir instancia actual si existe
        if (this.currentAppInstance && typeof this.currentAppInstance.destroy === 'function') {
            console.log('Llamando destroy() en instancia actual');
            this.currentAppInstance.destroy();
        }

        // Limpiar referencias globales
        ['catalogoApp','ventaApp','cajaApp','movimientosApp','historialApp','dashboardApp']
            .forEach(appName => {
                if (window[appName]) {
                    if (typeof window[appName].destroy === 'function') window[appName].destroy();
                    window[appName] = null;
                }
            });

        this.currentAppInstance = null;

        // 🔹 Solo limpiar contenido, NO reemplazar el nodo
        this.contentArea.innerHTML = '';
    }

    async loadView(viewName) {
        try {
            this.showLoading();

            // Destruir vista anterior
            this.destroyCurrentView();

            this.currentView = viewName;

            // Remover script anterior si existe
            const existingScript = document.getElementById(`script-${viewName}`);
            if (existingScript) {
                console.log(`Removiendo script anterior: ${viewName}`);
                existingScript.remove();
                this.loadedScripts.delete(viewName);
            }

            // Cargar HTML
            const html = await this.fetchViewHTML(viewName);

            // Insertar HTML nuevo
            this.contentArea.innerHTML = html;

            // Cargar CSS
            await this.loadViewCSS(viewName);

            // Cargar JS
            await this.loadViewScript(viewName);

            console.log(`Vista ${viewName} cargada exitosamente`);
            console.log('Librerías disponibles para la vista:', {
                Chart: !!window.Chart,
                Swal: !!window.Swal,
                Notyf: !!window.Notyf
            });

        } catch (error) {
            console.error('Error cargando vista:', error);
            this.contentArea.innerHTML = `
                <div style="padding: 20px; color: red;">
                    <h3>Error al cargar la vista: ${viewName}</h3>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <p style="font-size: 12px; margin-top: 10px;">
                        Librerías: Chart: ${!!window.Chart}, Swal: ${!!window.Swal}, Notyf: ${!!window.Notyf}
                    </p>
                </div>
            `;
        }
    }

    async fetchViewHTML(viewName) {
        const url = `../renderer/views/${viewName}.html`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.text();
    }

    async loadViewCSS(viewName) {
        const url = `../renderer/css/${viewName}.css`;

        return new Promise((resolve) => {
            const existingCSS = document.getElementById(`css-${viewName}`);
            if (existingCSS) existingCSS.remove();

            const link = document.createElement('link');
            link.id = `css-${viewName}`;
            link.rel = 'stylesheet';
            link.href = url + '?t=' + Date.now();
            link.onload = () => resolve();
            link.onerror = () => {
                console.warn(`CSS no encontrado: ${viewName}`);
                resolve();
            };
            document.head.appendChild(link);
        });
    }

    async loadViewScript(viewName) {
        const url = `../renderer/js/${viewName}Renderer.js`;
        console.log('Cargando script:', url);

        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.id = `script-${viewName}`;
            script.src = url + '?t=' + Date.now();
            script.type = 'text/javascript';

            script.onload = () => {
                this.loadedScripts.add(viewName);
                setTimeout(() => {
                    this.currentAppInstance = window[`${viewName}App`] || null;
                    resolve();
                }, 50);
            };

            script.onerror = (error) => {
                console.error('Error cargando script:', url, error);
                resolve();
            };

            document.body.appendChild(script);
        });
    }

    showLoading() {
        this.contentArea.innerHTML = `
            <div style="padding: 60px; text-align: center;">
                <div style="display: inline-block; width: 50px; height: 50px; border: 4px solid #f3f3f3; border-top: 4px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <p style="margin-top: 20px; font-size: 16px; color: #666;">Cargando vista...</p>
                <p style="font-size: 12px; color: #999; margin-top: 10px;">
                    Librerías: Chart: ${!!window.Chart}, Swal: ${!!window.Swal}, Notyf: ${!!window.Notyf}
                </p>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
    }
}

// Inicialización
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.mainApp = new MainRenderer();
    });
} else {
    window.mainApp = new MainRenderer();
}
