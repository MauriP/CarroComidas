(function() {
    'use strict';

    class MovimientosRenderer {
        constructor() {
            console.log('MovimientosRenderer inicializado');
            this.movimientos = [];
            this.cajaId = null;
            this.filtroActual = 'todos';
            
            setTimeout(() => {
                this.init();
            }, 100);
        }

        async init() {
            await this.obtenerCajaId();
            this.setupEventListeners();
            await this.cargarMovimientos();
        }

        setupEventListeners() {
            
            const form = document.getElementById('form-movimiento');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.agregarMovimiento();
                });
            }

            
            const btnLimpiar = document.getElementById('btn-limpiar-form');
            if (btnLimpiar) {
                btnLimpiar.addEventListener('click', () => {
                    document.getElementById('form-movimiento').reset();
                });
            }

            
            const filtroTipo = document.getElementById('filtro-tipo');
            if (filtroTipo) {
                filtroTipo.addEventListener('change', (e) => {
                    this.filtroActual = e.target.value;
                    this.renderizarMovimientos();
                });
            }

            document.addEventListener('click', (e) => {
                const btnEliminar = e.target.closest('.btn-eliminar-movimiento');
                if (btnEliminar) {
                    const id = parseInt(btnEliminar.dataset.id);
                    if (id) this.eliminarMovimiento(id);
                }
            });
        }

        async obtenerCajaId() {
            try {
                const resultado = await window.cajaAPI.obtenerCajaAbierta();
                
                if (resultado.success && resultado.data) {
                    this.cajaId = resultado.data.id;
                    console.log('Caja ID obtenida:', this.cajaId);
                } else {
                    this.mostrarNotificacion('⚠️ No hay caja abierta. Abre una caja para registrar movimientos.', 'error');
                }
            } catch (error) {
                console.error('Error obteniendo caja:', error);
                this.mostrarNotificacion('Error al obtener la caja', 'error');
            }
        }

        obtenerHoraLocal() {
            const now = new Date();
            return now.toLocaleString('sv-SE').slice(0, 19);
        }

        async cargarMovimientos() {
            if (!this.cajaId) {
                this.renderizarMovimientos();
                return;
            }

            try {
                const resultado = await window.movimientosAPI.obtenerMovimientos(this.cajaId);

                if (resultado.success) {
                    this.movimientos = resultado.data || [];
                    this.renderizarMovimientos();
                    this.actualizarResumen();
                } else {
                    this.movimientos = [];
                    this.renderizarMovimientos();
                }
            } catch (error) {
                console.error('Error cargando movimientos:', error);
                this.mostrarNotificacion('Error al cargar movimientos', 'error');
                this.movimientos = [];
                this.renderizarMovimientos();
            }
        }

        async agregarMovimiento() {
            if (!this.cajaId) {
                this.mostrarNotificacion('❌ No hay caja abierta para registrar movimientos', 'error');
                return;
            }

            const montoInput = document.getElementById('monto-movimiento');
            const tipoSelect = document.getElementById('tipo-movimiento');
            const motivoInput = document.getElementById('motivo-movimiento');

            const monto = montoInput?.value ? parseFloat(montoInput.value) : 0;
            const tipo = tipoSelect?.value || 'ingreso';
            const motivo = motivoInput?.value?.trim() || '';

            if (!monto || monto <= 0) {
                this.mostrarNotificacion('El monto debe ser mayor a 0', 'error');
                return;
            }

            if (!motivo) {
                this.mostrarNotificacion('El motivo es obligatorio', 'error');
                return;
            }

            const movimientoData = {
                cajaId: this.cajaId,
                tipo,
                monto,
                motivo,
                fecha: this.obtenerHoraLocal()
            };

            try {
                const resultado = await window.movimientosAPI.insertarMovimiento(movimientoData);

                if (resultado.success) {
                    this.mostrarNotificacion(`✅ ${tipo === 'ingreso' ? 'Ingreso' : 'Egreso'} registrado correctamente`, 'success');
                    document.getElementById('form-movimiento').reset();
                    await this.cargarMovimientos();
                } else {
                    this.mostrarNotificacion('❌ Error: ' + resultado.error, 'error');
                }
            } catch (error) {
                console.error('Error agregando movimiento:', error);
                this.mostrarNotificacion('❌ Error al registrar movimiento', 'error');
            }
        }

        async eliminarMovimiento(id) {
            if (!confirm('¿Estás seguro de que deseas eliminar este movimiento?')) {
                return;
            }

            try {
                const resultado = await window.movimientosAPI.eliminarMovimiento(id);
                
                if (resultado.success) {
                    this.mostrarNotificacion('🗑️ Movimiento eliminado correctamente', 'success');
                    await this.cargarMovimientos();
                } else {
                    this.mostrarNotificacion('❌ Error: ' + resultado.error, 'error');
                }
            } catch (error) {
                console.error('Error eliminando movimiento:', error);
                this.mostrarNotificacion('❌ Error al eliminar movimiento', 'error');
            }
        }

        renderizarMovimientos() {
            const container = document.getElementById('movimientos-container');
            if (!container) return;

            let movimientosFiltrados = this.movimientos;

            // Aplicar filtro
            if (this.filtroActual !== 'todos') {
                movimientosFiltrados = this.movimientos.filter(m => 
                    m.tipo === this.filtroActual
                );
            }

            if (movimientosFiltrados.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                        <h3>Sin movimientos</h3>
                        <p>No hay movimientos registrados para mostrar</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = movimientosFiltrados.map(m => 
                this.crearItemMovimiento(m)
            ).join('');
        }

        crearItemMovimiento(movimiento) {
            const fecha = new Date(movimiento.fecha).toLocaleString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const signo = movimiento.tipo === 'ingreso' ? '+' : '-';
            const icono = movimiento.tipo === 'ingreso' ? '📥' : '📤';

            return `
                <div class="movimiento-item ${movimiento.tipo}">
                    <div class="movimiento-header">
                        <span class="movimiento-tipo-badge ${movimiento.tipo}">
                            ${icono} ${movimiento.tipo}
                        </span>
                        <span class="movimiento-monto ${movimiento.tipo}">
                            ${signo}$${movimiento.monto.toFixed(2)}
                        </span>
                    </div>
                    <div class="movimiento-motivo">
                        ${this.escaparHTML(movimiento.motivo)}
                    </div>
                    <div class="movimiento-footer">
                        <span class="movimiento-fecha">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            ${fecha}
                        </span>
                        <div class="movimiento-acciones">
                            <button class="btn-eliminar-movimiento" data-id="${movimiento.id}" title="Eliminar movimiento">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        actualizarResumen() {
            const ingresos = this.movimientos
                .filter(m => m.tipo === 'ingreso')
                .reduce((sum, m) => sum + m.monto, 0);
            
            const egresos = this.movimientos
                .filter(m => m.tipo === 'egreso')
                .reduce((sum, m) => sum + m.monto, 0);

            document.getElementById('total-ingresos').textContent = `$${ingresos.toFixed(2)}`;
            document.getElementById('total-egresos').textContent = `$${egresos.toFixed(2)}`;
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
            console.log('Destruyendo movimientosRenderer...');
            
            this.movimientos = [];
            this.cajaId = null;
            
            const form = document.getElementById('form-movimiento');
            const btnLimpiar = document.getElementById('btn-limpiar-form');
            const filtroTipo = document.getElementById('filtro-tipo');
            
            if (form) form.replaceWith(form.cloneNode(true));
            if (btnLimpiar) btnLimpiar.replaceWith(btnLimpiar.cloneNode(true));
            if (filtroTipo) filtroTipo.replaceWith(filtroTipo.cloneNode(true));
        }
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        window.movimientosApp = new MovimientosRenderer();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            window.movimientosApp = new MovimientosRenderer();
        });
    }
})();
