const ProductosRepository = require('../../database/repositories/ProductosRepository');
const Producto = require('../../database/models/Productos');

class ProductosHandler {
    constructor() {
        this.productosRepository = new ProductosRepository();
    }

    insertarProducto(datosProducto) {
        try {
            const nuevoProducto = new Producto({
                nombre: datosProducto.nombre || '',
                descripcion: datosProducto.descripcion || '',
                precio: datosProducto.precio || 0,
                categoria: datosProducto.categoria || '',
                disponible: datosProducto.disponible !== undefined ? datosProducto.disponible : true,
                imagen: datosProducto.imagen || ''
            });
            
            const resultado = this.productosRepository.insertar(nuevoProducto);
            
            return { 
                success: true, 
                producto: resultado, 
                message: 'Producto guardado correctamente' 
            };
            
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    obtenerProductos() {
        try {
            const productos = this.productosRepository.buscarTodos();
            return { success: true, productos: productos };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    obtenerProductoPorId(id) {
        try {
            const producto = this.productosRepository.buscarPorId(id);
            return { success: true, producto: producto };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    obtenerProductoPorNombre(nombre) {
        try {
            const productos = this.productosRepository.buscarPorNombre(nombre);
            return { success: true, productos: productos };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    actualizarProducto(id, datosProducto) {
        try {
            const productoActualizado = new Producto({ 
                id: id, 
                ...datosProducto 
            });
            
            const resultado = this.productosRepository.update(productoActualizado);
            return { success: true, producto: resultado };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    eliminarProducto(id) {
        try {
            this.productosRepository.delete(id);
            return { success: true, message: 'Producto eliminado correctamente' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = ProductosHandler;