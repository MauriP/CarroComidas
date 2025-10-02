const CajaRepository = require('../../database/repositories/CajaRepository')

class CajaHandler {
  constructor() {
    this.repositorio = new CajaRepository()
  }

  abrirCaja(montoInicial, fechaApertura) {
    try {
      const cajaAbierta = this.repositorio.abrirCaja(parseFloat(montoInicial), fechaApertura)
      return {
        success: true,
        caja: cajaAbierta,
        message: 'Caja abierta correctamente'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  cerrarCaja(montoFinal, fechaCierre) {
    try {
      this.repositorio.cerrarCaja(parseFloat(montoFinal), fechaCierre)
      return {
        success: true,
        message: 'Caja cerrada correctamente'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // En tu handler - CORREGIR
obtenerEstadoCaja() {
    try {
      const hayCajaAbierta = this.repositorio.hayCajaAbierta()

      return {
        success: true,
        data: hayCajaAbierta 
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
}

  obtenerIdCajaAbierta() {
    try {
      const cajaAbierta = this.repositorio.obtenerCajaAbierta()
      if (!cajaAbierta) {
        return {
          success: false,
          error: 'No hay caja abierta'
        }
      }

      return {
        success: true,
        data: cajaAbierta  
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
}
}

module.exports = CajaHandler
