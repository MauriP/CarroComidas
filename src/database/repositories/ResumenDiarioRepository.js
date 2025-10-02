// repositories/ResumenDiarioRepository.js
const ResumenDiario = require('../models/ResumenDiario')
const { getInstance } = require('../connection/DatabaseConnection')

class ResumenDiarioRepository {
  constructor() {
  }

  getDb(){
    return getInstance().getDatabase()
  }

  obtenerTodos() {
    const db = this.getDb()
    const query = db.prepare(`
      SELECT * FROM vista_resumen_diario 
      ORDER BY fecha DESC
    `)

    try {
      const rows = query.all()
      return rows.map(row => new ResumenDiario(row))
    } catch (error) {
      console.error('Error al obtener resumen diario:', error)
      throw error
    }
  }

  obtenerPorFecha(fecha) {
    const db = this.getDb()
    const query = db.prepare(`
      SELECT * FROM vista_resumen_diario 
      WHERE fecha = ?
      LIMIT 1
    `)

    try {
      const row = query.get(fecha)
      return row ? new ResumenDiario(row) : null
    } catch (error) {
      console.error('Error al obtener resumen por fecha:', error)
      throw error
    }
  }

  obtenerRangoFechas(fechaInicio, fechaFin) {
    const db = this.getDb()
    const query = db.prepare(`
      SELECT * FROM vista_resumen_diario
      WHERE fecha BETWEEN ? AND ?
      ORDER BY fecha ASC
    `)

    try {
      const rows = query.all(fechaInicio, fechaFin)
      return rows.map(row => new ResumenDiario(row))
    } catch (error) {
      console.error('Error al obtener resumen por rango de fechas:', error)
      throw error
    }
  }
}

module.exports = ResumenDiarioRepository
