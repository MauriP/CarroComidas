(function() {
    'use strict';

    class VentaRenderer {
        constructor() {
            console.log('VentaRenderer inicializado');
            this.carrito = [];
            this.productos = [];
            this.categoriaActual = 'all';
            this.terminoBusqueda = '';
            
            setTimeout(() => {
                this.init();
            }, 100);
        }

        async init() {
            await this.cargarProductos();
            this.setupEventListeners();
            this.actualizarEstadoBotonFinalizar();
            this.renderizarCarritoVacio();
        }

        async cargarProductos() {
            try {
                const resultado = await window.productosAPI.obtenerProductos();
                if (!resultado.success) {
                    this.mostrarNotificacion(resultado.error || 'Error al cargar productos', 'error');
                    return;
                }

                this.productos = resultado.productos.filter(p => p.disponible); 
                this.renderizarProductos();
            } catch (error) {
                console.error('Error cargando productos:', error);
                this.mostrarNotificacion('Error al cargar productos', 'error');
            }
        }

        setupEventListeners() {
            const finalizarBtn = document.getElementById('finalizarVentaBtn');
            if (finalizarBtn) {
                finalizarBtn.addEventListener('click', () => this.finalizarVenta());
            }

            const limpiarBtn = document.getElementById('limpiar-carrito');
            if (limpiarBtn) {
                limpiarBtn.addEventListener('click', () => this.limpiarCarrito());
            }

            const buscarInput = document.getElementById('buscar-producto-venta');
            if (buscarInput) {
                buscarInput.addEventListener('input', (e) => {
                    this.terminoBusqueda = e.target.value.toLowerCase();
                    this.renderizarProductos();
                });
            }

            const botonesCategorias = document.querySelectorAll('.categoria-btn');
            botonesCategorias.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const categoria = e.currentTarget.dataset.categoria;
                    this.filtrarPorCategoria(categoria);
                    botonesCategorias.forEach(b => b.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                });
            });
        }

        filtrarPorCategoria(categoria) {
            this.categoriaActual = categoria;
            this.renderizarProductos();
        }

        obtenerProductosFiltrados() {
            let productosFiltrados = this.productos;

            if (this.categoriaActual !== 'all') {
                productosFiltrados = productosFiltrados.filter(p => 
                    p.categoria === this.categoriaActual
                );
            }

            if (this.terminoBusqueda) {
                productosFiltrados = productosFiltrados.filter(p =>
                    p.nombre.toLowerCase().includes(this.terminoBusqueda) ||
                    p.descripcion?.toLowerCase().includes(this.terminoBusqueda)
                );
            }

            return productosFiltrados;
        }

        renderizarProductos() {
            const contenedor = document.getElementById('productosContainer');
            if (!contenedor) return;

            const productosFiltrados = this.obtenerProductosFiltrados();

            if (productosFiltrados.length === 0) {
                contenedor.innerHTML = `
                    <div class="empty-state">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <h3>No hay productos</h3>
                        <p>No se encontraron productos con los filtros aplicados</p>
                    </div>
                `;
                return;
            }

            contenedor.innerHTML = productosFiltrados.map(producto => 
                this.crearCardProducto(producto)
            ).join('');

            contenedor.querySelectorAll('.producto-venta-card').forEach(card => {
                card.addEventListener('click', () => {
                    const id = parseInt(card.dataset.id);
                    const producto = this.productos.find(p => p.id === id);
                    if (producto) {
                        this.agregarAlCarrito(producto);
                    }
                });
            });
        }

        crearCardProducto(producto) {
            const cantidadEnCarrito = this.obtenerCantidadEnCarrito(producto.id);
            const badgeCantidad = cantidadEnCarrito > 0 
                ? `<span class="badge-cantidad">${cantidadEnCarrito}</span>` 
                : '';

            return `
                <div class="producto-venta-card ${!producto.disponible ? 'no-disponible' : ''}" 
                    data-id="${producto.id}">
                    ${badgeCantidad}
                    <h3 class="producto-venta-nombre">${this.escaparHTML(producto.nombre)}</h3>
                    <span class="producto-venta-categoria">${this.escaparHTML(producto.categoria)}</span>
                    <span class="producto-venta-precio">$${producto.precio.toFixed(2)}</span>
                </div>
            `;
        }

        obtenerCantidadEnCarrito(productoId) {
            const item = this.carrito.find(p => p.id === productoId);
            return item ? item.cantidad : 0;
        }

        agregarAlCarrito(producto) {
            const existente = this.carrito.find(p => p.id === producto.id);
            
            if (existente) {
                existente.cantidad++;
            } else {
                this.carrito.push({ ...producto, cantidad: 1 });
            }

            const card = document.querySelector(`.producto-venta-card[data-id="${producto.id}"]`);
            if (card) {
                card.classList.add('agregando');
                setTimeout(() => card.classList.remove('agregando'), 400);
            }

            this.renderizarCarrito();
            this.renderizarProductos();
            this.actualizarEstadoBotonFinalizar();
            
            this.mostrarNotificacion(`✅ ${producto.nombre} agregado al carrito`, 'success');
        }

        renderizarCarrito() {
            const contenedor = document.getElementById('carritoContainer');
            if (!contenedor) return;

            if (this.carrito.length === 0) {
                this.renderizarCarritoVacio();
                this.actualizarTotales(0);
                return;
            }

            contenedor.innerHTML = this.carrito.map(item => 
                this.crearItemCarrito(item)
            ).join('');

            contenedor.querySelectorAll('.cantidad-btn-menos').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = parseInt(btn.dataset.id);
                    this.disminuirCantidad(id);
                });
            });

            contenedor.querySelectorAll('.cantidad-btn-mas').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = parseInt(btn.dataset.id);
                    this.aumentarCantidad(id);
                });
            });

            contenedor.querySelectorAll('.btn-eliminar-item').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = parseInt(btn.dataset.id);
                    this.eliminarDelCarrito(id);
                });
            });

            this.actualizarTotales(this.calcularTotal());
        }

        crearItemCarrito(item) {
            const subtotal = item.precio * item.cantidad;

            return `
                <div class="carrito-item">
                    <div class="carrito-item-info">
                        <div class="carrito-item-nombre">${this.escaparHTML(item.nombre)}</div>
                        <div class="carrito-item-precio">$${item.precio.toFixed(2)} c/u</div>
                    </div>
                    <div class="carrito-item-cantidad">
                        <button class="cantidad-btn cantidad-btn-menos" data-id="${item.id}">−</button>
                        <span class="cantidad-valor">${item.cantidad}</span>
                        <button class="cantidad-btn cantidad-btn-mas" data-id="${item.id}">+</button>
                    </div>
                    <span class="carrito-item-total">$${subtotal.toFixed(2)}</span>
                    <button class="btn-eliminar-item" data-id="${item.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            `;
        }

        renderizarCarritoVacio() {
            const contenedor = document.getElementById('carritoContainer');
            if (!contenedor) return;

            contenedor.innerHTML = `
                <div class="carrito-vacio">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    <p>El carrito está vacío</p>
                    <span>Agrega productos para comenzar</span>
                </div>
            `;
        }

        aumentarCantidad(productoId) {
            const item = this.carrito.find(p => p.id === productoId);
            if (item) {
                item.cantidad++;
                this.renderizarCarrito();
                this.renderizarProductos();
            }
        }

        disminuirCantidad(productoId) {
            const item = this.carrito.find(p => p.id === productoId);
            if (item) {
                if (item.cantidad > 1) {
                    item.cantidad--;
                    this.renderizarCarrito();
                    this.renderizarProductos();
                } else {
                    this.eliminarDelCarrito(productoId);
                }
            }
        }

        eliminarDelCarrito(productoId) {
            const item = this.carrito.find(p => p.id === productoId);
            const nombreProducto = item ? item.nombre : 'Producto';
            
            this.carrito = this.carrito.filter(item => item.id !== productoId);
            this.renderizarCarrito();
            this.renderizarProductos();
            this.actualizarEstadoBotonFinalizar();
            
            this.mostrarNotificacion(`🗑️ ${nombreProducto} eliminado del carrito`, 'error');
        }

        limpiarCarrito() {
            if (this.carrito.length === 0) return;

            if (confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
                this.carrito = [];
                this.renderizarCarrito();
                this.renderizarProductos();
                this.actualizarEstadoBotonFinalizar();
                this.mostrarNotificacion('🧹 Carrito vaciado', 'success');
            }
        }

        calcularTotal() {
            return this.carrito.reduce((total, item) => {
                return total + (item.precio * item.cantidad);
            }, 0);
        }

        actualizarTotales(total) {
            const subtotalEl = document.getElementById('subtotal-carrito');
            const totalEl = document.getElementById('total-carrito');

            if (subtotalEl) {
                subtotalEl.textContent = `$${total.toFixed(2)}`;
            }
            if (totalEl) {
                totalEl.textContent = `$${total.toFixed(2)}`;
            }
        }

        actualizarEstadoBotonFinalizar() {
            const finalizarBtn = document.getElementById('finalizarVentaBtn');
            if (finalizarBtn) {
                finalizarBtn.disabled = this.carrito.length === 0;
            }
        }

        async finalizarVenta() {
    if (this.carrito.length === 0) {
        this.mostrarNotificacion('❌ El carrito está vacío', 'error');
        return;
    }

    try {
        const estadoCaja = await window.cajaAPI.obtenerEstadoCaja();
        if (!estadoCaja.success || !estadoCaja.data) {
            this.mostrarNotificacion('❌ No hay caja abierta. Abre la caja primero.', 'error');
            return;
        }
    } catch (error) {
        console.error('Error verificando caja:', error);
        this.mostrarNotificacion('❌ Error verificando estado de caja', 'error');
        return;
    }

    const metodoPagoSeleccionado = document.querySelector('input[name="metodo-pago"]:checked');
    const metodoPago = metodoPagoSeleccionado ? metodoPagoSeleccionado.value : 'efectivo';
    
    const fecha = this.obtenerFechaLocal();
    const total = this.calcularTotal();
    
    const datosVenta = {
        fecha,
        metodoPago,
        total: total,
        productos: this.carrito.map(p => ({
            id: p.id,
            nombre: p.nombre,
            cantidad: p.cantidad,
            precioUnitario: p.precio
        }))
    };

    const finalizarBtn = document.getElementById('finalizarVentaBtn');
    if (finalizarBtn) {
        finalizarBtn.disabled = true;
        finalizarBtn.innerHTML = `<svg class="loading-spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
        </svg> Procesando...`;
    }

    try {
        const imprimirCheckbox = document.getElementById('checkbox-imprimir');
        
        
        if (imprimirCheckbox && imprimirCheckbox.checked) {
            try {
                
                const datosVentaTemporal = {
                    ...datosVenta,
                    id: Date.now() 
                };
                
                const resultadoImpresion = await window.impresionAPI.imprimirComanda(datosVentaTemporal);
                
                if (!resultadoImpresion.success) {
                    
                    this.mostrarNotificacion('❌ Error al imprimir comanda. Venta no registrada.', 'error');
                    
                    // Revertir el estado del botón
                    if (finalizarBtn) {
                        finalizarBtn.disabled = false;
                        finalizarBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg> Finalizar Venta`;
                    }
                    return; 
                }
                
                this.mostrarNotificacion('✅ Comanda impresa correctamente', 'success');
            } catch (errorImpresion) {
                
                console.error('Error en impresión:', errorImpresion);
                this.mostrarNotificacion('❌ Error al imprimir comanda. Venta no registrada.', 'error');
                
                
                if (finalizarBtn) {
                    finalizarBtn.disabled = false;
                    finalizarBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg> Finalizar Venta`;
                }
                return; 
            }
        }
        
        
        const resultado = await window.ventasAPI.registrarVenta(datosVenta);
        console.log('Respuesta completa de registrarVenta:', resultado);
        
        if (resultado.success) {
            this.mostrarNotificacion(`✅ Venta registrada exitosamente - Total: $${total.toFixed(2)}`, 'success');
            
            this.carrito = [];
            this.renderizarCarrito();
            this.renderizarProductos();
            this.actualizarEstadoBotonFinalizar();
            
            if (imprimirCheckbox) {
                imprimirCheckbox.checked = false;
            }
        } else {
            this.mostrarNotificacion('❌ ' + (resultado.error || 'Error registrando venta'), 'error');
        }
    } catch (error) {
        console.error('Error registrando venta:', error);
        this.mostrarNotificacion('❌ Error al registrar la venta: ' + error.message, 'error');
    } finally {
        if (finalizarBtn) {
            finalizarBtn.disabled = false;
            finalizarBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg> Finalizar Venta`;
            this.actualizarEstadoBotonFinalizar();
        }
    }
}

        obtenerFechaLocal() {
            const now = new Date();
            const timezoneOffset = now.getTimezoneOffset() * 60000; 
            const localTime = new Date(now.getTime() - timezoneOffset);
            
            return localTime.toISOString().slice(0, 19).replace('T', ' ');
        }

        async imprimirComanda(datosVenta) {
            try {
                const resultado = await window.impresionAPI.imprimirComanda(datosVenta);
                
                if (resultado.success) {
                    this.mostrarNotificacion('✅ Comanda impresa correctamente', 'success');
                } else {
                    console.error('Error en impresión:', resultado.error);
                    this.mostrarNotificacion('❌ Error al imprimir: ' + resultado.error, 'error');
                    
                    // Fallback a impresión HTML si la impresora ESC/POS falla
                    this.imprimirComandaHTML(datosVenta);
                }
            } catch (error) {
                console.error('Error en impresión:', error);
                this.mostrarNotificacion('❌ Error al imprimir comanda', 'error');
                
                // Fallback a impresión HTML
                this.imprimirComandaHTML(datosVenta);
            }
        }

        // ✅ MÉTODO AGREGADO: Fallback para impresión HTML
        imprimirComandaHTML(datosVenta) {
            try {
                const total = datosVenta.productos.reduce((sum, p) => sum + (p.precioUnitario * p.cantidad), 0);
                const contenido = `<!DOCTYPE html>
                <html>
                <head>
                    <title>Comanda - ${new Date().toLocaleDateString()}</title>
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { 
                            font-family: 'Courier New', monospace; 
                            font-size: 14px; 
                            padding: 20px; 
                            max-width: 400px; 
                            margin: 0 auto; 
                        }
                        .header { 
                            text-align: center; 
                            margin-bottom: 20px; 
                            border-bottom: 2px dashed #333; 
                            padding-bottom: 15px; 
                        }
                        .header h1 { 
                            font-size: 24px; 
                            margin-bottom: 5px; 
                        }
                        .fecha { 
                            font-size: 12px; 
                            color: #666; 
                            margin-top: 5px; 
                        }
                        .productos { 
                            margin: 20px 0; 
                        }
                        .producto { 
                            margin: 10px 0; 
                            display: flex; 
                            justify-content: space-between; 
                            padding: 5px 0; 
                        }
                        .producto-info { 
                            flex: 1; 
                        }
                        .producto-nombre { 
                            font-weight: bold; 
                        }
                        .producto-cantidad { 
                            color: #666; 
                            font-size: 12px; 
                        }
                        .totales { 
                            border-top: 2px dashed #333; 
                            padding-top: 15px; 
                            margin-top: 15px; 
                        }
                        .total-linea { 
                            display: flex; 
                            justify-content: space-between; 
                            margin: 8px 0; 
                            font-size: 16px; 
                        }
                        .total-final { 
                            font-weight: bold; 
                            font-size: 20px; 
                            border-top: 2px solid #333; 
                            padding-top: 10px; 
                            margin-top: 10px; 
                        }
                        .metodo-pago { 
                            text-align: center; 
                            margin-top: 15px; 
                            padding-top: 15px; 
                            border-top: 1px dashed #ccc; 
                            color: #666; 
                            font-size: 12px; 
                        }
                        .footer { 
                            text-align: center; 
                            margin-top: 20px; 
                            font-size: 12px; 
                            color: #999; 
                        }
                        @media print { 
                            body { padding: 10px; } 
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>🍔 COMANDA</h1>
                        <div class="fecha">${new Date().toLocaleString('es-AR')}</div>
                    </div>
                    <div class="productos">
                        ${datosVenta.productos.map(p => `
                            <div class="producto">
                                <div class="producto-info">
                                    <div class="producto-nombre">${p.nombre}</div>
                                    <div class="producto-cantidad">Cantidad: ${p.cantidad} x $${p.precioUnitario.toFixed(2)}</div>
                                </div>
                                <div class="producto-total">
                                    $${(p.precioUnitario * p.cantidad).toFixed(2)}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="totales">
                        <div class="total-linea total-final">
                            <span>TOTAL:</span>
                            <span>$${total.toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="metodo-pago">
                        Método de pago: <strong>${datosVenta.metodoPago.toUpperCase()}</strong>
                    </div>
                    <div class="footer">
                        ¡Gracias por su compra!
                    </div>
                </body>
                </html>`;

                const ventanaImpresion = window.open('', '_blank');
                if (ventanaImpresion) {
                    ventanaImpresion.document.write(contenido);
                    ventanaImpresion.document.close();
                    setTimeout(() => {
                        ventanaImpresion.print();
                        setTimeout(() => ventanaImpresion.close(), 500);
                    }, 250);
                } else {
                    this.mostrarNotificacion('⚠️ No se pudo abrir la ventana de impresión', 'error');
                }
            } catch (error) {
                console.error('Error al imprimir comanda HTML:', error);
                this.mostrarNotificacion('❌ Error al imprimir comanda', 'error');
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
                        {
                            type: 'success',
                            background: '#48bb78',
                            icon: false
                        },
                        {
                            type: 'error',
                            background: '#f56565',
                            icon: false
                        }
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
                alert(mensaje);
            }
        }

        destroy() {
            console.log('Destruyendo ventasRenderer...');
            this.carrito = [];
            this.productos = [];
            
            const finalizarBtn = document.getElementById('finalizarVentaBtn');
            const limpiarBtn = document.getElementById('limpiar-carrito');
            const buscarInput = document.getElementById('buscar-producto-venta');
            
            if (finalizarBtn) finalizarBtn.replaceWith(finalizarBtn.cloneNode(true));
            if (limpiarBtn) limpiarBtn.replaceWith(limpiarBtn.cloneNode(true));
            if (buscarInput) buscarInput.replaceWith(buscarInput.cloneNode(true));
            
            document.querySelectorAll('.categoria-btn').forEach(btn => {
                btn.replaceWith(btn.cloneNode(true));
            });
        }
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        window.ventaApp = new VentaRenderer();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            window.ventaApp = new VentaRenderer();
        });
    }
})();