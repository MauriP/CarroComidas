const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('productosAPI', {
    insertarProducto: (datosProducto) => {
        const datosSerializables = {
            nombre: String(datosProducto.nombre || ''),
            descripcion: String(datosProducto.descripcion || ''),
            precio: Number(datosProducto.precio || 0),
            categoria: String(datosProducto.categoria || ''),
            disponible: Boolean(datosProducto.disponible !== undefined ? datosProducto.disponible : true),
            imagen: String(datosProducto.imagen || '')
        };
        
        return ipcRenderer.invoke('producto:insertar', datosSerializables);
    },
    obtenerProductos: () => ipcRenderer.invoke('producto:obtenerTodos'),
    obtenerProductoPorId: (id) => ipcRenderer.invoke('producto:obtenerPorId', Number(id)),
    obtenerProductoPorNombre: (nombre) => ipcRenderer.invoke('producto:obtenerPorNombre', String(nombre)),
    actualizarProducto: (id, datosProducto) => {
        const datosSerializables = {
            nombre: String(datosProducto.nombre || ''),
            descripcion: String(datosProducto.descripcion || ''),
            precio: Number(datosProducto.precio || 0),
            categoria: String(datosProducto.categoria || ''),
            disponible: Boolean(datosProducto.disponible !== undefined ? datosProducto.disponible : true),
            imagen: String(datosProducto.imagen || '')
        };
        
        return ipcRenderer.invoke('producto:actualizar', Number(id), datosSerializables);
    },
    eliminarProducto: (id) => ipcRenderer.invoke('producto:eliminar', Number(id))
});

contextBridge.exposeInMainWorld('cajaAPI', {
    abrirCaja: (montoInicial, fechaApertura) => ipcRenderer.invoke('caja:abrir', Number(montoInicial), String(fechaApertura)),
    cerrarCaja: (montoFinal, fechaCierre) => ipcRenderer.invoke('caja:cerrar', Number(montoFinal), String(fechaCierre)),
    obtenerEstadoCaja: () => ipcRenderer.invoke('caja:estado'),
    obtenerCajaAbierta: () => ipcRenderer.invoke('caja:obtenerId')
});

contextBridge.exposeInMainWorld('movimientosAPI', {
    insertarMovimiento: (datosMovimiento) => {
        const datosSerializables = {
            cajaId: Number(datosMovimiento.cajaId),
            tipo: String(datosMovimiento.tipo),
            monto: Number(datosMovimiento.monto),
            motivo: String(datosMovimiento.motivo),
            fecha: String(datosMovimiento.fecha)
        };
        return ipcRenderer.invoke('movimiento:insertar', datosSerializables);
    },
    obtenerMovimientos: (id) => ipcRenderer.invoke('movimiento:obtener', Number(id)),
    obtenerPorFecha: (fecha) => ipcRenderer.invoke('movimiento:obtenerPorFecha', String(fecha))
});

contextBridge.exposeInMainWorld('ventasAPI', {
    registrarVenta: (datosVenta) => {
        const datosSerializables = {
            fecha: String(datosVenta.fecha),
            metodoPago: String(datosVenta.metodoPago),
            productos: datosVenta.productos.map(p => ({
                id: Number(p.id),
                nombre: String(p.nombre),
                cantidad: Number(p.cantidad),
                precioUnitario: Number(p.precioUnitario)
            }))
        };
        return ipcRenderer.invoke('venta:insertar', datosSerializables);
    },
    obtenerVentasDelDia: (fecha) => ipcRenderer.invoke('venta:obtenerDelDia', String(fecha)),
    obtenerHistorialVentas: (limit) => ipcRenderer.invoke('venta:obtenerHistorial', Number(limit || 100))
});

contextBridge.exposeInMainWorld('resumenAPI', {
    obtenerTodos: () => ipcRenderer.invoke('resumen:obtenerTodos'),
    obtenerPorFecha: (fecha) => ipcRenderer.invoke('resumen:obtenerPorDia', String(fecha)),
    obtenerPorRango: (fechaInicio, fechaFin) => ipcRenderer.invoke('resumen:obtenerPorRango', String(fechaInicio), String(fechaFin))
})

contextBridge.exposeInMainWorld('impresionAPI', {
    imprimirComanda: (datosVenta) => {
        // Asegurar que los datos sean serializables
        const datosSerializables = {
            id: Number(datosVenta.id || 0),
            fecha: String(datosVenta.fecha || new Date().toISOString()),
            metodoPago: String(datosVenta.metodoPago || 'efectivo'),
            total: Number(datosVenta.total || 0),
            productos: (datosVenta.productos || []).map(p => ({
                id: Number(p.id || 0),
                nombre: String(p.nombre || ''),
                cantidad: Number(p.cantidad || 0),
                precioUnitario: Number(p.precioUnitario || 0)
            }))
        };
        return ipcRenderer.invoke('impresion:imprimirComanda', datosSerializables);
    },
    
    obtenerImpresoras: () => ipcRenderer.invoke('impresion:obtenerImpresoras'),
    
    testImpresora: () => ipcRenderer.invoke('impresion:test')
});
