const MovimientoRepository = require('../../database/repositories/MovimientoRepository')
const Movimiento = require('../../database/models/Movimientos')
const CajaHandler = require('./CajaHandler')

const cajaHandler = new CajaHandler();

class MovimientosHandler {
  constructor() {
    this.repositorio = new MovimientoRepository();
  }

  insertarMovimiento(datosMovimiento) {
    try {
      const resultado = cajaHandler.obtenerIdCajaAbierta();
      
      // CORRECIÓN: El handler ahora devuelve data, no cajaID
      if (!resultado.success || !resultado.data) { // ← CAMBIADO
        return {
          success: false,
          error: 'No hay una caja abierta. Debe abrir caja primero.'
        };
      }

      const nuevoMovimiento = new Movimiento({
        cajaId: resultado.data.id, // ← CAMBIADO: resultado.data.id
        tipo: datosMovimiento.tipo,
        monto: datosMovimiento.monto,
        motivo: datosMovimiento.motivo,
        fecha: datosMovimiento.fecha
      })

      const insertado = this.repositorio.insertar(nuevoMovimiento)
      
      return {
        success: true,
        movimiento: insertado,
        message: 'Movimiento guardado correctamente'
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
}

  obtenerMovimientos(cajaId) {
    try {
      const movimientos = this.repositorio.obtenerMovimientosDeCaja(cajaId)
      return {
        success: true,
        data: movimientos 
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
}

  obtenerMovimientosPorFecha(fecha) {
    try {
      const movimientos = this.repositorio.obtenerMovimientosDelDia(fecha)
      return {
        success: true,
        data: movimientos 
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
}
}

module.exports = MovimientosHandler;