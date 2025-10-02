const VentaRepository = require('../../database/repositories/VentaRepository')
const MovimientoRepository = require('../../database/repositories/MovimientoRepository')
const CajaHandler = require('./CajaHandler')
const Venta = require('../../database/models/Venta')
const Movimiento = require('../../database/models/Movimientos')

class VentaHandler {
  constructor() {
    this.repositorio = new VentaRepository()
    this.movimientoRepositorio = new MovimientoRepository()
    this.cajaHandler = new CajaHandler()
  }

  registrarVenta(datosVenta) {
    try {
      const resultadoCaja = this.cajaHandler.obtenerIdCajaAbierta()

      if (!resultadoCaja.success || !resultadoCaja.data) { 
        return {
          success: false,
          error: 'No hay una caja abierta. Debe abrir caja primero.'
        }
      }

      const cajaId = resultadoCaja.data.id 

      const productosConSubtotal = datosVenta.productos.map(producto => ({
        id: producto.id,
        nombre: producto.nombre,
        cantidad: producto.cantidad,
        precioUnitario: producto.precioUnitario,
        subtotal: producto.precioUnitario * producto.cantidad
      }))

      const total = productosConSubtotal.reduce((sum, item) => sum + item.subtotal, 0)

      
      const nuevaVenta = new Venta({
        fecha: datosVenta.fecha,
        total: total,
        metodoPago: datosVenta.metodoPago,
        cajaId: cajaId, 
        productos: productosConSubtotal
      })

      const ventaRegistrada = this.repositorio.insertar(nuevaVenta)

      if (datosVenta.metodoPago === 'efectivo') {
        const nuevoMovimiento = new Movimiento({
          cajaId: cajaId, 
          tipo: 'ingreso',
          monto: total,
          motivo: 'venta',
          fecha: datosVenta.fecha
        })

        this.movimientoRepositorio.insertar(nuevoMovimiento)
      }

      return {
        success: true,
        venta: ventaRegistrada,
        message: 'Venta registrada correctamente'
      }

    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }
  
  obtenerVentasDelDia(fecha){
    try{
      const ventas = this.repositorio.obtenerVentasDelDia(fecha)
      return { 
        success: true, 
        data: ventas 
      }
    }catch(error){
      return { 
        success: false, 
        error: error.message
      }
    }
  }
  
  obtenerHistorialVentas(limit = 100) { 
    try { 
      const ventas = this.repositorio.obtenerHistorialVentas(limit) 
      return { 
        success: true, 
        data: ventas 
      } 
    } catch (error) { 
      return { 
        success: false, 
        error: error.message 
      } 
    }
  }
}

module.exports = VentaHandler