(function() {
    'use strict';

    class DashboardRenderer {
        constructor() {
            console.log('DashboardRenderer inicializado');
            this.datos = null;
            this.periodo = 'hoy';
            this.chartVentas = null;
            this.chartPagos = null;
            
            setTimeout(() => {
                this.init();
            }, 100);
        }

        async init() {
            this.setupEventListeners();
            await this.cargarDatos();
        }

        setupEventListeners() {
            const filtroPeriodo = document.getElementById('filtro-periodo');
            if (filtroPeriodo) {
                filtroPeriodo.addEventListener('change', (e) => {
                    this.periodo = e.target.value;
                    this.manejarCambioPeriodo();
                });
            }

            const btnRefrescar = document.getElementById('refrescar-dashboard');
            if (btnRefrescar) {
                btnRefrescar.addEventListener('click', () => {
                    this.refrescarDatos();
                });
            }

            const btnAplicarRango = document.getElementById('aplicar-rango');
            if (btnAplicarRango) {
                btnAplicarRango.addEventListener('click', () => {
                    this.aplicarRangoPersonalizado();
                });
            }
        }

        manejarCambioPeriodo() {
            const rangoPersonalizado = document.getElementById('rango-personalizado');
            
            if (this.periodo === 'personalizado') {
                rangoPersonalizado.style.display = 'block';
            } else {
                rangoPersonalizado.style.display = 'none';
                this.cargarDatos();
            }
        }

        async aplicarRangoPersonalizado() {
            const fechaInicio = document.getElementById('fecha-inicio').value;
            const fechaFin = document.getElementById('fecha-fin').value;

            if (!fechaInicio || !fechaFin) {
                this.mostrarNotificacion('Selecciona ambas fechas', 'error');
                return;
            }

            if (new Date(fechaInicio) > new Date(fechaFin)) {
                this.mostrarNotificacion('La fecha de inicio debe ser anterior a la fecha de fin', 'error');
                return;
            }

            await this.cargarDatosPorRango(fechaInicio, fechaFin);
        }

        async refrescarDatos() {
            const btn = document.getElementById('refrescar-dashboard');
            if (btn) {
                btn.style.animation = 'spin 0.5s linear';
                setTimeout(() => {
                    btn.style.animation = '';
                }, 500);
            }
            await this.cargarDatos();
        }

        
        obtenerFechaLocal(date = new Date()) {
            const timezoneOffset = date.getTimezoneOffset() * 60000; 
            const localTime = new Date(date.getTime() - timezoneOffset);
            return localTime.toISOString().slice(0, 19).replace('T', ' ');
        }

        
        obtenerFechaPorPeriodo() {
            const hoy = new Date();

            switch (this.periodo) {
                case 'hoy':
                    return this.obtenerFechaLocal(hoy).slice(0, 10);
                case 'ayer':
                    const ayer = new Date(hoy);
                    ayer.setDate(hoy.getDate() - 1);
                    return this.obtenerFechaLocal(ayer).slice(0, 10);
                case 'semana':
                case 'mes':
                    return null;
                default:
                    return this.obtenerFechaLocal(hoy).slice(0, 10);
            }
        }

        async cargarDatos() {
            try {
                if (this.periodo === 'semana' || this.periodo === 'mes') {
                    let fechaInicio, fechaFin;
                    const hoy = new Date();

                    if (this.periodo === 'semana') {
                        const primerDia = new Date(hoy);
                        primerDia.setDate(hoy.getDate() - hoy.getDay());
                        fechaInicio = this.obtenerFechaLocal(primerDia).slice(0, 10);

                        const ultimoDia = new Date(primerDia);
                        ultimoDia.setDate(primerDia.getDate() + 6);
                        fechaFin = this.obtenerFechaLocal(ultimoDia).slice(0, 10);
                    } else {
                        const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                        const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
                        fechaInicio = this.obtenerFechaLocal(primerDiaMes).slice(0, 10);
                        fechaFin = this.obtenerFechaLocal(ultimoDiaMes).slice(0, 10);
                    }

                    await this.cargarDatosPorRango(fechaInicio, fechaFin);
                    return;
                }

                let fechaConsulta = this.obtenerFechaPorPeriodo();
                const resultado = await window.resumenAPI.obtenerPorFecha(fechaConsulta);

                if (resultado && resultado.success) {
                    this.datos = resultado.data;
                    this.renderizarDashboard();
                } else {
                    this.mostrarDatosVacios();
                    if (resultado && resultado.error) {
                        this.mostrarNotificacion(resultado.error, 'error');
                    }
                }
            } catch (error) {
                console.error('Error cargando datos:', error);
                this.mostrarNotificacion('Error al cargar datos del dashboard', 'error');
                this.mostrarDatosVacios();
            }
        }

        async cargarDatosPorRango(fechaInicio, fechaFin) {
            try {
                const resultado = await window.resumenAPI.obtenerPorRango(fechaInicio, fechaFin);
                
                if (resultado && resultado.success) {
                    this.datos = resultado.data;
                    this.renderizarDashboard();
                } else {
                    this.mostrarDatosVacios();
                    if (resultado && resultado.error) {
                        this.mostrarNotificacion(resultado.error, 'error');
                    }
                }
            } catch (error) {
                console.error('Error cargando datos por rango:', error);
                this.mostrarNotificacion('Error al cargar datos por rango', 'error');
                this.mostrarDatosVacios();
            }
        }

        renderizarDashboard() {
    if (!this.datos) {
        this.mostrarDatosVacios();
        return;
    }

    document.getElementById('total-ventas-dashboard').textContent = 
        this.datos.totalVentas || 0;
    
    
    const ingresosTotales = this.datos.movimientosIngresos || 0;
    document.getElementById('total-ingresos-dashboard').textContent = 
        `$${ingresosTotales.toFixed(2)}`;
    
    const egresos = this.datos.movimientosEgresos || 0;
    document.getElementById('total-egresos-dashboard').textContent = 
        `$${egresos.toFixed(2)}`;
    
    // CORRECCIÓN: Balance = todos los ingresos - todos los egresos
    const balance = ingresosTotales - egresos;
    document.getElementById('balance-neto-dashboard').textContent = 
        `$${balance.toFixed(2)}`;

    this.renderizarProductosMasVendidos();
    this.renderizarActividadReciente();
    this.renderizarGraficos();
}

        renderizarProductosMasVendidos() {
            const container = document.getElementById('productos-vendidos');
            if (!container) return;
            
            if (this.datos.productoMasVendido) {
                container.innerHTML = `
                    <div class="producto-item">
                        <div class="producto-ranking">1</div>
                        <div class="producto-info">
                            <div class="producto-nombre">${this.escaparHTML(this.datos.productoMasVendido)}</div>
                            <div class="producto-cantidad">Producto más vendido</div>
                        </div>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <h3>Sin datos</h3>
                        <p>No hay productos vendidos en este período</p>
                    </div>
                `;
            }
        }

        renderizarActividadReciente() {
            const container = document.getElementById('actividad-reciente');
            if (!container) return;
            
            const actividades = [];
            
            
            if (this.datos.totalVentas && this.datos.totalVentas > 0) {
                actividades.push({
                    tipo: 'venta',
                    icono: 'venta',
                    // Texto simplificado - totalVentas ya son transacciones
                    titulo: `${this.datos.totalVentas} Venta${this.datos.totalVentas > 1 ? 's' : ''}`,
                    descripcion: `Total: $${(this.datos.ingresosTotales || 0).toFixed(2)}`,
                    tiempo: 'Hoy'
                });
            }
            
            // CORRECCIÓN: Mostrar ingresos totales (ventas + movimientos)
            const ingresosTotales = (this.datos.ingresosTotales || 0) + (this.datos.movimientosIngresos || 0);
            if (ingresosTotales > 0) {
                actividades.push({
                    tipo: 'movimiento',
                    icono: 'movimiento',
                    titulo: 'Ingresos totales',
                    descripcion: `$${ingresosTotales.toFixed(2)}`,
                    tiempo: 'Hoy'
                });
            }
            
            if (this.datos.movimientosEgresos && this.datos.movimientosEgresos > 0) {
                actividades.push({
                    tipo: 'movimiento',
                    icono: 'movimiento',
                    titulo: 'Egresos registrados',
                    descripcion: `$${this.datos.movimientosEgresos.toFixed(2)}`,
                    tiempo: 'Hoy'
                });
            }

            if (actividades.length > 0) {
                container.innerHTML = actividades.map(act => `
                    <div class="actividad-item">
                        <div class="actividad-icon ${act.icono}">
                            ${this.getIconoActividad(act.tipo)}
                        </div>
                        <div class="actividad-contenido">
                            <div class="actividad-titulo">${act.titulo}</div>
                            <div class="actividad-descripcion">${act.descripcion}</div>
                        </div>
                        <div class="actividad-tiempo">${act.tiempo}</div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <h3>Sin actividad</h3>
                        <p>No hay actividad registrada en este período</p>
                    </div>
                `;
            }
        }

        getIconoActividad(tipo) {
            const iconos = {
                venta: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>',
                movimiento: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>',
                caja: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>'
            };
            return iconos[tipo] || iconos.movimiento;
        }

        renderizarGraficos() {
            if (this.chartVentas) {
                this.chartVentas.destroy();
                this.chartVentas = null;
            }
            if (this.chartPagos) {
                this.chartPagos.destroy();
                this.chartPagos = null;
            }

            this.renderizarGraficoMetodosPago();
            
            if (this.datos.ventasPorDia && this.datos.ventasPorDia.length > 0) {
                this.renderizarGraficoVentas();
            } else {
                this.mostrarMensajeGraficoVentas();
            }
        }

        renderizarGraficoVentas() {
            const ctxVentas = document.getElementById('grafico-ventas');
            if (!ctxVentas) return;

            const card = ctxVentas.closest('.grafico-card');
            const mensajes = card.querySelectorAll('.empty-state');
            mensajes.forEach(msg => msg.remove());

            ctxVentas.style.display = 'block';

            const labels = this.datos.ventasPorDia.map(d => {
                const fecha = new Date(d.fecha);
                return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
            });

            this.chartVentas = new Chart(ctxVentas, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Ventas ($)',
                        data: this.datos.ventasPorDia.map(d => d.total),
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#667eea',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom',
                            labels: {
                                padding: 15,
                                font: {
                                    size: 12,
                                    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Ventas: $${context.parsed.y.toFixed(2)}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toFixed(0);
                                }
                            }
                        }
                    }
                }
            });
        }

        renderizarGraficoMetodosPago() {
            const ctxPagos = document.getElementById('grafico-pagos');
            if (!ctxPagos) return;

            const card = ctxPagos.closest('.grafico-card');
            const mensajes = card.querySelectorAll('.empty-state');
            mensajes.forEach(msg => msg.remove());

            const metodosPago = {
                'Efectivo': this.datos.ingresosEfectivo || 0,
                'Transferencia': this.datos.ingresosTransferencia || 0, 
                'Débito': this.datos.ingresosDebito || 0
            };

            const tieneDatos = Object.values(metodosPago).some(valor => valor > 0);
            
            if (!tieneDatos) {
                ctxPagos.style.display = 'none';
                const mensaje = document.createElement('div');
                mensaje.className = 'empty-state';
                mensaje.innerHTML = `
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"></path>
                    </svg>
                    <h3>Sin datos</h3>
                    <p>No hay datos de métodos de pago</p>
                `;
                card.querySelector('.card-body').appendChild(mensaje);
                return;
            }

            ctxPagos.style.display = 'block';

            this.chartPagos = new Chart(ctxPagos, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(metodosPago),
                    datasets: [{
                        data: Object.values(metodosPago),
                        backgroundColor: ['#48bb78', '#4299e1', '#ed8936'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 15,
                                font: {
                                    size: 12,
                                    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.label}: $${context.parsed.toFixed(2)}`;
                                }
                            }
                        }
                    }
                }
            });
        }

        mostrarMensajeGraficoVentas() {
            const ctxVentas = document.getElementById('grafico-ventas');
            if (!ctxVentas) return;

            const card = ctxVentas.closest('.grafico-card');
            const mensajes = card.querySelectorAll('.empty-state');
            mensajes.forEach(msg => msg.remove());

            ctxVentas.style.display = 'none';
            
            const mensaje = document.createElement('div');
            mensaje.className = 'empty-state';
            mensaje.innerHTML = `
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="20" x2="12" y2="10"></line>
                    <line x1="18" y1="20" x2="18" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="16"></line>
                </svg>
                <h3>Gráfico no disponible</h3>
                <p>No hay datos de ventas por día en este período</p>
            `;
            card.querySelector('.card-body').appendChild(mensaje);
        }

        mostrarDatosVacios() {
            document.getElementById('total-ventas-dashboard').textContent = '0';
            document.getElementById('total-ingresos-dashboard').textContent = '$0.00';
            document.getElementById('total-egresos-dashboard').textContent = '$0.00';
            document.getElementById('balance-neto-dashboard').textContent = '$0.00';

            const productos = document.getElementById('productos-vendidos');
            if (productos) productos.innerHTML = `
                <div class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="8" y1="15" x2="16" y2="15"></line>
                        <line x1="9" y1="9" x2="9.01" y2="9"></line>
                        <line x1="15" y1="9" x2="15.01" y2="9"></line>
                    </svg>
                    <h3>Sin productos vendidos</h3>
                    <p>No hay datos de productos para mostrar</p>
                </div>
            `;

            const actividad = document.getElementById('actividad-reciente');
            if (actividad) actividad.innerHTML = `
                <div class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <h3>Sin actividad</h3>
                    <p>No hay actividad registrada en este período</p>
                </div>
            `;

            this.mostrarMensajeGraficoVentas();

            const ctxPagos = document.getElementById('grafico-pagos');
            if (ctxPagos) {
                const card = ctxPagos.closest('.grafico-card');
                ctxPagos.style.display = 'none';
                
                const mensajes = card.querySelectorAll('.empty-state');
                mensajes.forEach(msg => msg.remove());
                
                const mensaje = document.createElement('div');
                mensaje.className = 'empty-state';
                mensaje.innerHTML = `
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"></path>
                    </svg>
                    <h3>Sin datos</h3>
                    <p>No hay datos de métodos de pago</p>
                `;
                card.querySelector('.card-body').appendChild(mensaje);
            }
        }

        mostrarNotificacion(mensaje, tipo = 'info') {
            if (window.mostrarToast) {
                window.mostrarToast(mensaje, tipo);
            } else {
                console.log(`[${tipo}] ${mensaje}`);
            }
        }

        escaparHTML(str) {
            if (!str) return '';
            return str.toString()
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        window.dashboardApp = new DashboardRenderer();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            window.dashboardApp = new DashboardRenderer();
        });
    }
})();