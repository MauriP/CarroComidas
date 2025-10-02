// handlers/ResumenDiarioHandler.js
const ResumenDiarioRepository = require('../../database/repositories/ResumenDiarioRepository')

class ResumenDiarioHandler {
  constructor() {
    this.repositorio = new ResumenDiarioRepository()
  }

  obtenerTodos() {
    try {
      const resumen = this.repositorio.obtenerTodos()
      return {
        success: true,
        data: resumen
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  obtenerPorFecha(fecha) {
    try {
      const resumen = this.repositorio.obtenerPorFecha(fecha)
      if (!resumen) {
        return {
          success: false,
          error: `No se encontró resumen para la fecha ${fecha}`
        }
      }

      return {
        success: true,
        data: resumen
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  obtenerRangoFechas(fechaInicio, fechaFin) {
  try {
    const resumenArray = this.repositorio.obtenerRangoFechas(fechaInicio, fechaFin)
    
    
    const resumenAgregado = {
      totalVentas: 0,
      ingresosTotales: 0,
      ingresosEfectivo: 0,
      ingresosTransferencia: 0,
      ingresosDebito: 0,
      movimientosIngresos: 0,
      movimientosEgresos: 0,
      productoMasVendido: null,
      ventasPorDia: [] 
    };

    resumenArray.forEach(dia => {
      resumenAgregado.totalVentas += dia.totalVentas || 0;
      resumenAgregado.ingresosTotales += dia.ingresosTotales || 0;
      resumenAgregado.ingresosEfectivo += dia.ingresosEfectivo || 0;
      resumenAgregado.ingresosTransferencia += dia.ingresosTransferencia || 0;
      resumenAgregado.ingresosDebito += dia.ingresosDebito || 0;
      resumenAgregado.movimientosIngresos += dia.movimientosIngresos || 0;
      resumenAgregado.movimientosEgresos += dia.movimientosEgresos || 0;
      
      if (!resumenAgregado.productoMasVendido && dia.productoMasVendido) {
        resumenAgregado.productoMasVendido = dia.productoMasVendido;
      }

      
      resumenAgregado.ventasPorDia.push({
        fecha: dia.fecha,
        total: dia.ingresosTotales || 0,
        cantidad: dia.totalVentas || 0
      });
    });

    return {
      success: true,
      data: resumenAgregado
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}
}

module.exports = ResumenDiarioHandler