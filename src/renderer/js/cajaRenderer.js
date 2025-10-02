(function() {
    'use strict';

    class CajaRenderer {
        constructor() {
            console.log('CajaRenderer inicializado');
            this.estadoActual = null;
            this.montoInicial = 0;
            
            setTimeout(() => {
                this.init();
            }, 100);
        }

        async init() {
            this.setupEventListeners();
            await this.cargarEstadoCaja();
            await this.cargarResumenCaja();
            console.log('CajaRenderer completamente inicializado');
        }

        setupEventListeners() {
            const abrirCajaBtn = document.getElementById('abrirCajaBtn');
            const cerrarCajaBtn = document.getElementById('cerrarCajaBtn');
            const refrescarEstadoBtn = document.getElementById('refrescarEstadoBtn');

            if (abrirCajaBtn) {
                abrirCajaBtn.addEventListener('click', () => this.abrirCaja());
            }

            if (cerrarCajaBtn) {
                cerrarCajaBtn.addEventListener('click', () => this.cerrarCaja());
            }

            if (refrescarEstadoBtn) {
                refrescarEstadoBtn.addEventListener('click', () => this.refrescarEstado());
            }
        }

        configurarInputCierre(totalEsperado) {
    const montoCierreInput = document.getElementById('montoCierre');
    
    if (montoCierreInput) {
        // Remover event listeners anteriores para evitar duplicados
        montoCierreInput.removeEventListener('input', this.calcularDiferenciaCierre);
        
        // Crear nueva función con el total esperado actual
        this.calcularDiferenciaCierre = (event) => {
            const montoCierre = parseFloat(event.target.value) || 0;
            const diferencia = montoCierre - totalEsperado;
            
            this.mostrarAlertaDiferenciaCierre(diferencia, totalEsperado, montoCierre);
        };
        
        // Agregar event listener
        montoCierreInput.addEventListener('input', this.calcularDiferenciaCierre);
        
        // Calcular diferencia inicial si ya hay un valor
        if (montoCierreInput.value) {
            const montoCierre = parseFloat(montoCierreInput.value) || 0;
            const diferencia = montoCierre - totalEsperado;
            this.mostrarAlertaDiferenciaCierre(diferencia, totalEsperado, montoCierre);
        }
    }
        }

        async cargarEstadoCaja() {
            try {
                const resultado = await window.cajaAPI.obtenerEstadoCaja();
                console.log('Estado caja cargado:', resultado);

                if (resultado && resultado.success) {
                    console.log('Estado de caja:', resultado.data);
                    this.estadoActual = resultado.data;
                    this.actualizarEstadoUI(this.estadoActual);
                } else {
                    console.log('Mostrando estado cerrado');
                    this.mostrarEstadoCerrado();
                }
            } catch (error) {
                console.error('Error cargando estado:', error);
                this.mostrarEstadoCerrado();
            }
        }

        async cargarResumenCaja() {
            try {
                // Obtener la caja abierta actual (con todos sus datos)
                const cajaResultado = await window.cajaAPI.obtenerCajaAbierta();
                
                if (cajaResultado && cajaResultado.success && cajaResultado.data) {
                    const cajaAbierta = cajaResultado.data;
                    console.log('Caja abierta encontrada:', cajaAbierta);
                    
                    // Guardar el monto inicial REAL de esta caja
                    this.montoInicial = cajaAbierta.montoInicial || 0;
                    
                    // Obtener movimientos de ESTA caja específica
                    const movimientosResultado = await window.movimientosAPI.obtenerMovimientos(cajaAbierta.id);
                    
                    this.actualizarResumenCaja(movimientosResultado, cajaAbierta);
                } else {
                    console.log('No hay caja abierta, mostrando resumen cero');
                    this.mostrarResumenCero();
                }
            } catch (error) {
                console.error('Error cargando resumen de caja:', error);
                this.mostrarResumenCero();
            }
        }

        actualizarEstadoUI(estado) {
            const badge = document.getElementById('estado-badge');
            const texto = document.getElementById('estado-texto');
            const contenido = document.getElementById('estado-caja-contenido');
            
            console.log('Actualizando UI con estado:', estado);
            
            // estado es true/false directamente desde el handler
            if (estado === true) {
                badge.className = 'estado-badge abierta';
                texto.textContent = 'Caja Abierta';
                
                // Obtener detalles de la caja abierta para mostrar monto inicial correcto
                this.obtenerDetallesCajaAbierta();
                
                contenido.innerHTML = `
                    <div class="estado-activo">
                        <div class="estado-info-item">
                            <div class="info-label">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                Abierta desde
                            </div>
                            <div class="info-valor">Hoy</div>
                        </div>
                        <div class="estado-info-item">
                            <div class="info-label">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="1" x2="12" y2="23"></line>
                                    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"></path>
                                </svg>
                                Monto inicial
                            </div>
                            <div class="info-valor">$${this.montoInicial.toFixed(2)}</div>
                        </div>
                        <div class="estado-info-item">
                            <div class="info-label">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                Usuario
                            </div>
                            <div class="info-valor">Sistema</div>
                        </div>
                        <div class="estado-info-item">
                            <div class="info-label">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M12 8v4l3 3"></path>
                                </svg>
                                Estado
                            </div>
                            <div class="info-valor positivo">Activa</div>
                        </div>
                    </div>
                `;
            } else {
                this.mostrarEstadoCerrado();
            }
        }

        async obtenerDetallesCajaAbierta() {
            try {
                const cajaResultado = await window.cajaAPI.obtenerCajaAbierta();
                if (cajaResultado && cajaResultado.success && cajaResultado.data) {
                    this.montoInicial = cajaResultado.data.montoInicial || 0;
                    console.log('Monto inicial obtenido:', this.montoInicial);
                }
            } catch (error) {
                console.error('Error obteniendo detalles caja:', error);
                this.montoInicial = 0;
            }
        }

        mostrarEstadoCerrado() {
            const badge = document.getElementById('estado-badge');
            const texto = document.getElementById('estado-texto');
            const contenido = document.getElementById('estado-caja-contenido');
            
            badge.className = 'estado-badge cerrada';
            texto.textContent = 'Caja Cerrada';
            contenido.innerHTML = `
                <div class="estado-vacio">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0110 0v4"></path>
                    </svg>
                    <h3>Caja Cerrada</h3>
                    <p>La caja no está abierta actualmente</p>
                </div>
            `;

            this.montoInicial = 0;
        }

        actualizarResumenCaja(movimientosResultado, cajaAbierta) {
    if (!movimientosResultado || !movimientosResultado.success) {
        this.mostrarResumenCero();
        return;
    }

    const movimientos = movimientosResultado.data || [];

    let ingresosCaja = 0;
    let egresosCaja = 0;
    
    movimientos.forEach(mov => {
        if (mov.tipo === 'ingreso') {
            ingresosCaja += mov.monto || 0;

        } else if (mov.tipo === 'egreso') {
            egresosCaja += mov.monto || 0;
        }
    });

    const totalEsperado = this.montoInicial + ingresosCaja - egresosCaja;

    console.log('Resumen CAJA ACTUAL:', {
        cajaId: cajaAbierta.id,
        montoInicial: this.montoInicial,
        ingresosCaja: ingresosCaja,
        egresosCaja: egresosCaja,
        totalEsperado: totalEsperado
    });

    document.getElementById('total-ingresos').textContent = `$${ingresosCaja.toFixed(2)}`;
    document.getElementById('total-egresos').textContent = `$${egresosCaja.toFixed(2)}`;
    document.getElementById('total-esperado').textContent = `$${totalEsperado.toFixed(2)}`;

    this.configurarInputCierre(totalEsperado);
        }

        mostrarAlertaDiferenciaCierre(diferencia, totalEsperado, montoCierre) {
    const cardBody = document.querySelector('.resumen-card .card-body');
    let alertaExistente = cardBody.querySelector('.alerta-diferencia-cierre');

    if (alertaExistente) {
        alertaExistente.remove();
    }

    // Solo mostrar alerta si hay un monto de cierre ingresado
    if (montoCierre > 0) {
        const diferenciaAbsoluta = Math.abs(diferencia);
        
        if (diferenciaAbsoluta > 0.01) { // Tolerancia de 1 centavo
            const alerta = document.createElement('div');
            alerta.className = 'alerta-diferencia';
            
            let mensaje = '';
            let tipo = '';
            
            if (diferencia > 0) {
                mensaje = `Sobrante: $${diferenciaAbsoluta.toFixed(2)} (Cierre: $${montoCierre.toFixed(2)} vs Esperado: $${totalEsperado.toFixed(2)})`;
                tipo = 'sobrante';
            } else {
                mensaje = `Faltante: $${diferenciaAbsoluta.toFixed(2)} (Cierre: $${montoCierre.toFixed(2)} vs Esperado: $${totalEsperado.toFixed(2)})`;
                tipo = 'faltante';
            }
            
            alerta.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <div class="alerta-diferencia-contenido">
                    <h4>Diferencia al cerrar</h4>
                    <p>${mensaje}</p>
                </div>
            `;
            
            if (tipo === 'sobrante') {
                alerta.style.borderLeft = '4px solid #48bb78';
                alerta.querySelector('svg').style.color = '#48bb78';
            } else {
                alerta.style.borderLeft = '4px solid #f56565';
                alerta.querySelector('svg').style.color = '#f56565';
            }
            
            alerta.className = 'alerta-diferencia alerta-diferencia-cierre';
            cardBody.appendChild(alerta);
        }
    }
        }   

        mostrarResumenCero() {
            document.getElementById('total-ingresos').textContent = '$0.00';
            document.getElementById('total-egresos').textContent = '$0.00';
            
            const totalEsperado = this.montoInicial;
            document.getElementById('total-esperado').textContent = `$${totalEsperado.toFixed(2)}`;
        }

        async refrescarEstado() {
            const btn = document.getElementById('refrescarEstadoBtn');
            if (btn) {
                btn.style.animation = 'spin 0.5s linear';
                setTimeout(() => {
                    btn.style.animation = '';
                }, 500);
            }
            
            await this.cargarEstadoCaja();
            await this.cargarResumenCaja();
            this.mostrarMensaje('Estado actualizado', 'success');
        }

        async abrirCaja() {
            const montoInput = document.getElementById('montoInicial');
            const monto = montoInput.value;
            
            if (!monto || parseFloat(monto) <= 0) {
                this.mostrarMensaje('Ingrese un monto inicial válido', 'error');
                return;
            }

            try {
                const fecha = new Date().toISOString().slice(0, 19).replace('T', ' ');
                const resultado = await window.cajaAPI.abrirCaja(parseFloat(monto), fecha);
                
                if (resultado.success) {
                    this.mostrarMensaje(resultado.message || 'Caja abierta exitosamente', 'success');
                    montoInput.value = '';
                    await this.cargarEstadoCaja();
                    await this.cargarResumenCaja();
                } else {
                    this.mostrarMensaje(resultado.error || 'Error al abrir caja', 'error');
                }
            } catch (error) {
                console.error('Error abriendo caja:', error);
                this.mostrarMensaje('Error al abrir caja: ' + error.message, 'error');
            }
        }

        async cerrarCaja() {
            const montoInput = document.getElementById('montoCierre');
            const monto = montoInput.value;

            if (!monto || parseFloat(monto) < 0) {
                this.mostrarMensaje('Ingrese un monto de cierre válido', 'error');
                return;
            }

            try {
                const fecha = new Date().toISOString().slice(0, 19).replace('T', ' ');
                const resultado = await window.cajaAPI.cerrarCaja(parseFloat(monto), fecha);
                
                if (resultado.success) {
                    this.mostrarMensaje(resultado.message || 'Caja cerrada exitosamente', 'success');
                    montoInput.value = '';
                    await this.cargarEstadoCaja();
                    await this.cargarResumenCaja();
                } else {
                    this.mostrarMensaje(resultado.error || 'Error al cerrar caja', 'error');
                }
            } catch (error) {
                console.error('Error cerrando caja:', error);
                this.mostrarMensaje('Error al cerrar caja: ' + error.message, 'error');
            }
        }

        mostrarMensaje(mensaje, tipo = 'info') {
            if (window.Notyf) {
                const notyf = new Notyf({
                    duration: 3000,
                    position: { x: 'right', y: 'top' },
                    types: [
                        { type: 'success', background: '#48bb78', icon: false },
                        { type: 'error', background: '#f56565', icon: false },
                        { type: 'info', background: '#4299e1', icon: false }
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
                let mensajeDiv = document.getElementById('mensaje-caja');
                if (!mensajeDiv) {
                    mensajeDiv = document.createElement('div');
                    mensajeDiv.id = 'mensaje-caja';
                    mensajeDiv.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        padding: 15px;
                        border-radius: 5px;
                        z-index: 1000;
                        color: white;
                        font-weight: bold;
                        display: none;
                    `;
                    document.body.appendChild(mensajeDiv);
                }
                
                mensajeDiv.textContent = mensaje;
                mensajeDiv.style.backgroundColor = tipo === 'error' ? '#f44336' : 
                                                tipo === 'success' ? '#4CAF50' : '#2196F3';
                
                mensajeDiv.style.display = 'block';
                
                setTimeout(() => {
                    mensajeDiv.style.display = 'none';
                }, 3000);
            }
        }

        destroy() {
            console.log('Destruyendo CajaRenderer...');
            
            const abrirCajaBtn = document.getElementById('abrirCajaBtn');
            const cerrarCajaBtn = document.getElementById('cerrarCajaBtn');
            const refrescarEstadoBtn = document.getElementById('refrescarEstadoBtn');
            
            if (abrirCajaBtn) abrirCajaBtn.replaceWith(abrirCajaBtn.cloneNode(true));
            if (cerrarCajaBtn) cerrarCajaBtn.replaceWith(cerrarCajaBtn.cloneNode(true));
            if (refrescarEstadoBtn) refrescarEstadoBtn.replaceWith(refrescarEstadoBtn.cloneNode(true));
            
            this.estadoActual = null;
            this.montoInicial = 0;
        }
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        window.cajaApp = new CajaRenderer();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            window.cajaApp = new CajaRenderer();
        });
    }
})();