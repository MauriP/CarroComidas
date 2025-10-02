(function() {
    'use strict';

    class HistorialRenderer {
        constructor() {
            console.log('HistorialRenderer inicializado');
            this.ventas = [];
            this.ventaSeleccionada = null;
            
            setTimeout(() => {
                this.init();
            }, 100);
        }

        async init() {
            this.setupEventListeners();
            
            const hoy = new Date().toISOString().slice(0, 10);
            document.getElementById('fecha-filtro').value = hoy;
            await this.buscarVentas();
        }

        setupEventListeners() {
            const buscarBtn = document.getElementById('buscarBtn');
            if (buscarBtn) {
                buscarBtn.addEventListener('click', () => this.buscarVentas());
            }

            const limpiarBtn = document.getElementById('limpiar-filtros');
            if (limpiarBtn) {
                limpiarBtn.addEventListener('click', () => this.limpiarFiltros());
            }

            const fechaInput = document.getElementById('fecha-filtro');
            if (fechaInput) {
                fechaInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.buscarVentas();
                    }
                });
            }

            const modalOverlay = document.querySelector('#modal-detalle-venta .modal-overlay');
            const modalClose = document.querySelector('#modal-detalle-venta .modal-close');
            const btnCerrarModal = document.getElementById('cerrar-modal');
            const btnImprimir = document.getElementById('imprimir-detalle');

            if (modalOverlay) {
                modalOverlay.addEventListener('click', () => this.cerrarModal());
            }
            if (modalClose) {
                modalClose.addEventListener('click', () => this.cerrarModal());
            }
            if (btnCerrarModal) {
                btnCerrarModal.addEventListener('click', () => this.cerrarModal());
            }
            if (btnImprimir) {
                btnImprimir.addEventListener('click', () => this.imprimirDetalle());
            }

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    const modal = document.getElementById('modal-detalle-venta');
                    if (modal && modal.classList.contains('active')) {
                        this.cerrarModal();
                    }
                }
            });
        }

        limpiarFiltros() {
            const hoy = new Date().toISOString().slice(0, 10);
            document.getElementById('fecha-filtro').value = hoy;
            document.getElementById('metodo-pago-filtro').value = '';
            this.buscarVentas();
        }

        async buscarVentas() {
            const fecha = document.getElementById('fecha-filtro').value;
            const metodoPago = document.getElementById('metodo-pago-filtro').value;

            if (!fecha) {
                this.mostrarNotificacion('Selecciona una fecha', 'error');
                return;
            }

            try {
                const resultado = await window.ventasAPI.obtenerVentasDelDia(fecha);
                
                if (!resultado.success) {
                    this.mostrarNotificacion(resultado.error || 'Error al obtener ventas', 'error');
                    this.ventas = [];
                    this.renderizarVentas();
                    return;
                }

                // CORRECCIÓN: Usar resultado.data en lugar de resultado.ventas
                this.ventas = resultado.data || [];

                if (metodoPago) {
                    this.ventas = this.ventas.filter(v => 
                        v.metodoPago.toLowerCase() === metodoPago.toLowerCase()
                    );
                }

                this.renderizarVentas();
                
            } catch (error) {
                console.error('Error buscando ventas:', error);
                this.mostrarNotificacion('Error al buscar ventas', 'error');
                this.ventas = [];
                this.renderizarVentas();
            }
        }

        renderizarVentas() {
            const contenedor = document.getElementById('ventasLista');
            if (!contenedor) return;

            this.actualizarResumen();

            if (this.ventas.length === 0) {
                contenedor.innerHTML = `
                    <div class="empty-state">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <h3>No hay ventas</h3>
                        <p>No se encontraron ventas para los filtros seleccionados</p>
                    </div>
                `;
                return;
            }

            contenedor.innerHTML = this.ventas.map(venta => 
                this.crearCardVenta(venta)
            ).join('');

            contenedor.querySelectorAll('.venta-card').forEach(card => {
                card.addEventListener('click', () => {
                    const id = parseInt(card.dataset.id);
                    this.mostrarDetalleVenta(id);
                });
            });
        }

        crearCardVenta(venta) {
            const fecha = new Date(venta.fecha).toLocaleDateString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const metodoPagoClase = venta.metodoPago.toLowerCase();

            return `
                <div class="venta-card" data-id="${venta.id}">
                    <div class="venta-card-header">
                        <div class="venta-info-principal">
                            <div class="venta-id">Venta #${venta.id}</div>
                            <div class="venta-fecha">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                ${fecha}
                            </div>
                        </div>
                        <div class="venta-monto">$${venta.total.toFixed(2)}</div>
                    </div>
                    <div class="venta-card-body">
                        <div class="venta-detalle-item">
                            <span class="detalle-label">Método de Pago</span>
                            <span class="metodo-pago-badge ${metodoPagoClase}">
                                ${this.getIconoMetodoPago(venta.metodoPago)}
                                ${venta.metodoPago}
                            </span>
                        </div>
                        <div class="venta-detalle-item">
                            <span class="detalle-label">Productos</span>
                            <span class="detalle-valor">${venta.productos.length} items</span>
                        </div>
                    </div>
                </div>
            `;
        }

        getIconoMetodoPago(metodo) {
            const iconos = {
                'efectivo': '💵',
                'transferencia': '🔄',
                'debito': '💳'
            };
            return iconos[metodo.toLowerCase()] || '💰';
        }

        actualizarResumen() {
            const totalVentas = this.ventas.length;
            const montoTotal = this.ventas.reduce((sum, v) => sum + v.total, 0);

            document.getElementById('total-ventas-count').textContent = totalVentas;
            document.getElementById('total-ventas-monto').textContent = `$${montoTotal.toFixed(2)}`;
        }

        mostrarDetalleVenta(id) {
            const venta = this.ventas.find(v => v.id === id);
            if (!venta) return;

            this.ventaSeleccionada = venta;
            const modal = document.getElementById('modal-detalle-venta');
            const contenido = document.getElementById('detalle-venta-contenido');

            const fecha = new Date(venta.fecha).toLocaleDateString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            contenido.innerHTML = `
                <div class="detalle-venta-info">
                    <div class="detalle-seccion">
                        <div class="detalle-seccion-titulo">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                            Información General
                        </div>
                        <div class="detalle-grid">
                            <div class="venta-detalle-item">
                                <span class="detalle-label">ID de Venta</span>
                                <span class="detalle-valor">#${venta.id}</span>
                            </div>
                            <div class="venta-detalle-item">
                                <span class="detalle-label">Fecha y Hora</span>
                                <span class="detalle-valor">${fecha}</span>
                            </div>
                            <div class="venta-detalle-item">
                                <span class="detalle-label">Método de Pago</span>
                                <span class="metodo-pago-badge ${venta.metodoPago.toLowerCase()}">
                                    ${this.getIconoMetodoPago(venta.metodoPago)}
                                    ${venta.metodoPago}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="detalle-seccion">
                        <div class="detalle-seccion-titulo">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 7H4c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z"></path>
                                <path d="M12 2v5M12 17v5"></path>
                            </svg>
                            Productos
                        </div>
                        <div class="productos-detalle">
                            ${venta.productos.map(p => `
                                <div class="producto-detalle-item">
                                    <div class="producto-detalle-info">
                                        <div class="producto-detalle-nombre">${this.escaparHTML(p.nombre)}</div>
                                        <div class="producto-detalle-cantidad">Cantidad: ${p.cantidad} x $${p.precioUnitario.toFixed(2)}</div>
                                    </div>
                                    <div class="producto-detalle-precio">$${(p.precioUnitario * p.cantidad).toFixed(2)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="total-venta-detalle">
                        <span class="total-venta-label">Total de la Venta</span>
                        <span class="total-venta-valor">$${venta.total.toFixed(2)}</span>
                    </div>
                </div>
            `;

            modal.classList.add('active');
        }

        cerrarModal() {
            const modal = document.getElementById('modal-detalle-venta');
            if (modal) {
                modal.classList.remove('active');
                this.ventaSeleccionada = null;
            }
        }

        async imprimirDetalle() {
    if (!this.ventaSeleccionada) return;

    try {
        this.mostrarNotificacion('Imprimiendo comanda en XP-58...', 'info');
        
        // Usar la API de impresión en lugar de la ventana de impresión HTML
        const resultado =  await window.impresionAPI.imprimirComanda(this.ventaSeleccionada);
        
        if (resultado.success) {
            this.mostrarNotificacion('Comanda impresa correctamente', 'success');
        } else {
            this.mostrarNotificacion(`Error al imprimir: ${resultado.error}`, 'error');
            console.error('Error de impresión:', resultado.error);
        }
    } catch (error) {
        this.mostrarNotificacion('Error al conectar con la impresora XP-58', 'error');
        console.error('Error:', error);
    }
}

        escaparHTML(texto) {
            const div = document.createElement('div');
            div.textContent = texto;
            return div.innerHTML;
        }

        mostrarNotificacion(mensaje, tipo = 'info') {
            if (window.Notyf) {
                const notyf = new Notyf({
                    duration: 3000,
                    position: { x: 'right', y: 'top' },
                    types: [
                        { type: 'success', background: '#48bb78', icon: false },
                        { type: 'error', background: '#f56565', icon: false }
                    ]
                });

                if (tipo === 'success') {
                    notyf.success(mensaje);
                } else if (tipo === 'error') {
                    notyf.error(mensaje);
                } else {
                    notyf.success(mensaje);
                }
            } else {
                console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
            }
        }

        destroy() {
            console.log('Destruyendo historialRenderer...');
            
            this.ventas = [];
            this.ventaSeleccionada = null;
            
            const buscarBtn = document.getElementById('buscarBtn');
            const limpiarBtn = document.getElementById('limpiar-filtros');
            const fechaInput = document.getElementById('fecha-filtro');
            
            if (buscarBtn) buscarBtn.replaceWith(buscarBtn.cloneNode(true));
            if (limpiarBtn) limpiarBtn.replaceWith(limpiarBtn.cloneNode(true));
            if (fechaInput) fechaInput.replaceWith(fechaInput.cloneNode(true));
        }
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        window.historialApp = new HistorialRenderer();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            window.historialApp = new HistorialRenderer();
        });
    }
})();