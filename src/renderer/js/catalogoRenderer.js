(function() {
    'use strict';

    class CatalogoRenderer {
        constructor() {
            this.productos = [];
            this.filtroCategoria = '';
            
            setTimeout(() => {
                this.init();
            }, 100);
        }

        async init() {
            this.setupEventListeners();
            await this.cargarProductos();
        }

        setupEventListeners() {
            const form = document.getElementById('form-producto');
            const buscarInput = document.getElementById('buscar-producto');
            const filtroCategoria = document.getElementById('filtro-categoria');
            
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.agregarProducto();
                });
            }
            
            if (buscarInput) {
                buscarInput.addEventListener('input', (e) => {
                    this.filtrarProductos(e.target.value);
                });
            }

            if (filtroCategoria) {
                filtroCategoria.addEventListener('change', (e) => {
                    this.filtroCategoria = e.target.value;
                    this.aplicarFiltros();
                });
            }

            this.setupEventListenersDinamicos();
        }

        setupEventListenersDinamicos() {
            // Delegación de eventos para botones dinámicos
            document.addEventListener('click', (e) => {
                // Botón eliminar - buscar en el elemento o sus padres
                const btnEliminar = e.target.closest('.btn-delete');
                if (btnEliminar) {
                    const id = parseInt(btnEliminar.getAttribute('data-id'));
                    if (id) this.eliminarProducto(id);
                    return;
                }
                
                // Botón editar - buscar en el elemento o sus padres
                const btnEditar = e.target.closest('.btn-edit');
                if (btnEditar) {
                    const id = parseInt(btnEditar.getAttribute('data-id'));
                    if (id) this.abrirModalEdicion(id);
                    return;
                }
            });

            // Modal de edición
            const modal = document.getElementById('modal-edicion');
            const modalOverlay = modal?.querySelector('.modal-overlay');
            const modalClose = modal?.querySelector('.modal-close');
            const btnCancelar = document.getElementById('btn-cancelar-edicion');
            const formEdicion = document.getElementById('form-edicion');

            if (modal) {
                // Cerrar con overlay
                if (modalOverlay) {
                    modalOverlay.addEventListener('click', () => {
                        this.cerrarModalEdicion();
                    });
                }
                
                // Cerrar con ESC
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && modal.classList.contains('active')) {
                        this.cerrarModalEdicion();
                    }
                });
            }

            if (modalClose) {
                modalClose.addEventListener('click', () => {
                    this.cerrarModalEdicion();
                });
            }

            if (btnCancelar) {
                btnCancelar.addEventListener('click', () => {
                    this.cerrarModalEdicion();
                });
            }

            if (formEdicion) {
                formEdicion.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.guardarEdicion();
                });
            }

            // Modal de confirmación
            const modalConfirm = document.getElementById('modal-confirm');
            const confirmOverlay = modalConfirm?.querySelector('.modal-overlay');
            
            if (confirmOverlay) {
                confirmOverlay.addEventListener('click', () => {
                    this.cerrarConfirmacion();
                });
            }
        }

        async cargarProductos() {
            try {
                const resultado = await window.productosAPI.obtenerProductos();
                
                if (resultado.success) {
                    this.productos = resultado.productos;
                    this.actualizarEstadisticas();
                    this.aplicarFiltros();
                } else {
                    this.mostrarNotificacion('Error cargando productos: ' + resultado.error, 'error');
                }
            } catch (error) {
                this.mostrarNotificacion('Error de conexión: ' + error.message, 'error');
            }
        }

        actualizarEstadisticas() {
            const totalProductos = document.getElementById('total-productos');
            const productosDisponibles = document.getElementById('productos-disponibles');
            
            if (totalProductos) {
                totalProductos.textContent = this.productos.length;
            }
            
            if (productosDisponibles) {
                const disponibles = this.productos.filter(p => p.disponible).length;
                productosDisponibles.textContent = disponibles;
            }
        }

        async agregarProducto() {
            const form = document.getElementById('form-producto');
            
            if (!form) return;

            const nombreInput = document.getElementById('nombre');
            const descripcionInput = document.getElementById('descripcion');
            const precioInput = document.getElementById('precio');
            const categoriaSelect = document.getElementById('categoria');
            const disponibleCheckbox = document.getElementById('disponible');

            const productoData = {
                nombre: nombreInput?.value || '',
                descripcion: descripcionInput?.value || '',
                precio: precioInput?.value ? parseFloat(precioInput.value) : 0,
                categoria: categoriaSelect?.value || '',
                disponible: disponibleCheckbox?.checked || true
            };

            // Validaciones
            if (!productoData.nombre.trim()) {
                this.mostrarNotificacion('El nombre es obligatorio', 'error');
                return;
            }
            if (!productoData.precio || productoData.precio <= 0) {
                this.mostrarNotificacion('El precio debe ser mayor a 0', 'error');
                return;
            }
            if (!productoData.categoria.trim()) {
                this.mostrarNotificacion('La categoría es obligatoria', 'error');
                return;
            }

            try {
                const resultado = await window.productosAPI.insertarProducto(productoData);
                
                if (resultado.success) {
                    this.mostrarNotificacion('✅ Producto agregado correctamente', 'success');
                    form.reset();
                    await this.cargarProductos();
                } else {
                    this.mostrarNotificacion('❌ Error: ' + resultado.error, 'error');
                }
            } catch (error) {
                this.mostrarNotificacion('❌ Error de conexión: ' + error.message, 'error');
            }
        }

        async eliminarProducto(id) {
            if (!id || isNaN(id)) {
                this.mostrarNotificacion('ID de producto inválido', 'error');
                return;
            }

            this.abrirConfirmacion(
                '¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.',
                async (confirmado) => {
                    if (!confirmado) return;

                    try {
                        const resultado = await window.productosAPI.eliminarProducto(id);
                        
                        if (resultado.success) {
                            this.mostrarNotificacion('🗑️ Producto eliminado correctamente', 'success');
                            await this.cargarProductos();
                        } else {
                            this.mostrarNotificacion('❌ Error eliminando producto: ' + resultado.error, 'error');
                        }
                    } catch (error) {
                        this.mostrarNotificacion('❌ Error de conexión: ' + error.message, 'error');
                    }
                }
            );
        }

        abrirConfirmacion(mensaje, callback) {
            const modal = document.getElementById('modal-confirm');
            const texto = document.getElementById('confirm-texto');
            const btnSi = document.getElementById('confirm-si');
            const btnNo = document.getElementById('confirm-no');

            if (!modal || !texto || !btnSi || !btnNo) return;

            texto.textContent = mensaje;
            modal.classList.add('active');

            // Remover eventos anteriores
            const newBtnSi = btnSi.cloneNode(true);
            const newBtnNo = btnNo.cloneNode(true);
            btnSi.replaceWith(newBtnSi);
            btnNo.replaceWith(newBtnNo);

            newBtnSi.onclick = () => {
                this.cerrarConfirmacion();
                callback(true);
            };
            
            newBtnNo.onclick = () => {
                this.cerrarConfirmacion();
                callback(false);
            };
        }

        cerrarConfirmacion() {
            const modal = document.getElementById('modal-confirm');
            if (modal) {
                modal.classList.remove('active');
            }
        }

        async abrirModalEdicion(id) {
            try {
                const resultado = await window.productosAPI.obtenerProductoPorId(id);
                
                if (resultado.success && resultado.producto) {
                    const producto = resultado.producto;
                    
                    document.getElementById('edicion-id').value = producto.id;
                    document.getElementById('edicion-nombre').value = producto.nombre;
                    document.getElementById('edicion-descripcion').value = producto.descripcion || '';
                    document.getElementById('edicion-precio').value = producto.precio;
                    document.getElementById('edicion-categoria').value = producto.categoria;
                    document.getElementById('edicion-disponible').checked = producto.disponible;
                    
                    document.getElementById('modal-edicion').classList.add('active');
                } else {
                    this.mostrarNotificacion('Error cargando producto para editar', 'error');
                }
            } catch (error) {
                this.mostrarNotificacion('Error: ' + error.message, 'error');
            }
        }

        cerrarModalEdicion() {
            const modal = document.getElementById('modal-edicion');
            if (modal) {
                modal.classList.remove('active');
                document.getElementById('form-edicion').reset();
            }
        }

        async guardarEdicion() {
            const id = parseInt(document.getElementById('edicion-id').value);
            const formData = new FormData(document.getElementById('form-edicion'));
            
            const productoData = {
                nombre: formData.get('nombre'),
                descripcion: formData.get('descripcion'),
                precio: parseFloat(formData.get('precio')),
                categoria: formData.get('categoria'),
                disponible: document.getElementById('edicion-disponible').checked
            };

            if (!productoData.nombre.trim()) {
                this.mostrarNotificacion('El nombre es obligatorio', 'error');
                return;
            }

            try {
                const resultado = await window.productosAPI.actualizarProducto(id, productoData);
                
                if (resultado.success) {
                    this.mostrarNotificacion('💾 Producto actualizado correctamente', 'success');
                    this.cerrarModalEdicion();
                    await this.cargarProductos();
                } else {
                    this.mostrarNotificacion('❌ Error actualizando producto: ' + resultado.error, 'error');
                }
            } catch (error) {
                this.mostrarNotificacion('❌ Error de conexión: ' + error.message, 'error');
            }
        }

        aplicarFiltros() {
            const buscarInput = document.getElementById('buscar-producto');
            const termino = buscarInput?.value || '';
            
            let productosFiltrados = this.productos;

            // Filtrar por categoría
            if (this.filtroCategoria) {
                productosFiltrados = productosFiltrados.filter(p => 
                    p.categoria === this.filtroCategoria
                );
            }

            // Filtrar por búsqueda
            if (termino) {
                productosFiltrados = productosFiltrados.filter(producto =>
                    producto.nombre.toLowerCase().includes(termino.toLowerCase()) ||
                    producto.descripcion?.toLowerCase().includes(termino.toLowerCase())
                );
            }

            this.mostrarProductos(productosFiltrados);
        }

        filtrarProductos(termino) {
            this.aplicarFiltros();
        }

        mostrarProductos(productos = this.productos) {
            const container = document.getElementById('lista-productos');
            
            if (!container) return;

            if (productos.length === 0) {
                container.innerHTML = `
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

            container.innerHTML = productos.map(producto => this.crearCardProducto(producto)).join('');
        }

        crearCardProducto(producto) {
            const disponibleBadge = producto.disponible 
                ? '<span class="producto-badge badge-disponible">Disponible</span>'
                : '<span class="producto-badge badge-no-disponible">No disponible</span>';

            return `
                <div class="producto-card" data-id="${producto.id}">
                    <div class="producto-header">
                        <h3 class="producto-nombre">${this.escaparHTML(producto.nombre)}</h3>
                        ${disponibleBadge}
                    </div>
                    
                    <span class="producto-categoria">${this.escaparHTML(producto.categoria)}</span>
                    
                    ${producto.descripcion ? `
                        <p class="producto-descripcion">${this.escaparHTML(producto.descripcion)}</p>
                    ` : ''}
                    
                    <div class="producto-footer">
                        <span class="producto-precio">$${producto.precio.toFixed(2)}</span>
                        <div class="producto-acciones">
                            <button class="btn-icon btn-edit" data-id="${producto.id}" title="Editar producto">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button class="btn-icon btn-delete" data-id="${producto.id}" title="Eliminar producto">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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

        escaparHTML(texto) {
            const div = document.createElement('div');
            div.textContent = texto;
            return div.innerHTML;
        }

        mostrarNotificacion(mensaje, tipo = 'info') {
            // Si existe Notyf, usarlo
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
                // Fallback a mensaje básico
                const div = document.getElementById('mensaje-resultado');
                if (div) {
                    div.textContent = mensaje;
                    div.className = `mensaje ${tipo}`;
                    div.style.display = 'block';
                    
                    setTimeout(() => {
                        div.style.display = 'none';
                    }, 5000);
                }
            }
        }

        destroy() {
    console.log('Destruyendo ventasRenderer...');
    
    // Limpiar carrito
    this.carrito = [];
    this.productos = [];
    
    // Remover listeners
    const finalizarBtn = document.getElementById('finalizarVentaBtn');
    const limpiarBtn = document.getElementById('limpiar-carrito');
    const buscarInput = document.getElementById('buscar-producto-venta');
    
    if (finalizarBtn) finalizarBtn.replaceWith(finalizarBtn.cloneNode(true));
    if (limpiarBtn) limpiarBtn.replaceWith(limpiarBtn.cloneNode(true));
    if (buscarInput) buscarInput.replaceWith(buscarInput.cloneNode(true));
    
    // Limpiar categorías
    document.querySelectorAll('.categoria-btn').forEach(btn => {
        btn.replaceWith(btn.cloneNode(true));
    });
}
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        window.catalogoApp = new CatalogoRenderer();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            window.catalogoApp = new CatalogoRenderer();
        });
    }
})();