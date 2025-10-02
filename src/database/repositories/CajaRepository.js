const Caja = require('../models/Caja')
const { getInstance } = require('../connection/DatabaseConnection')

class CajaRepository {
  constructor() {
    // No inicializar DB aquí
  }

  // Método privado para obtener la DB cuando se necesita
  getDb() {
    return getInstance().getDatabase()
  }

  abrirCaja(montoInicial, fechaApertura) {
    const db = this.getDb()
    
    if (this.hayCajaAbierta()) {
      throw new Error('Ya existe una caja abierta')
    }

    const query = db.prepare(`
      INSERT INTO cajas (montoInicial, fechaApertura, estado)
      VALUES (?, ?, 'abierta')
    `)

    try {
      query.run(montoInicial, fechaApertura)
      return this.obtenerCajaAbierta()
    } catch (error) {
      console.error('Error al abrir caja:', error)
      throw error
    }
  }

  cerrarCaja(montoFinal, fechaCierre) {
    const db = this.getDb()
    const cajaAbierta = this.obtenerCajaAbierta()

    if (!cajaAbierta) {
      throw new Error('No hay caja abierta para cerrar')
    }

    const query = db.prepare(`
      UPDATE cajas 
      SET montoFinal = ?, fechaCierre = ?, estado = 'cerrada'
      WHERE id = ?
    `)

    try {
      const result = query.run(montoFinal, fechaCierre, cajaAbierta.id)

      if (result.changes === 0) {
        throw new Error('No se pudo cerrar la caja')
      }

      return true
    } catch (error) {
      console.error('Error al cerrar caja:', error)
      throw error
    }
  }

  obtenerCajaAbierta() {
    const db = this.getDb()
    const query = db.prepare(`
      SELECT * FROM cajas 
      WHERE estado = 'abierta' 
      LIMIT 1
    `)

    try {
      const row = query.get()
      return row
        ? new Caja({
            id: row.id,
            montoInicial: row.montoInicial,
            montoFinal: row.montoFinal,
            fechaApertura: row.fechaApertura,
            fechaCierre: row.fechaCierre,
            estado: row.estado
          })
        : null
    } catch (error) {
      console.error('Error al obtener caja abierta:', error)
      throw error
    }
  }

  obtenerEstadoCaja() {
    const db = this.getDb()
    const query = db.prepare(`
      SELECT estado FROM cajas 
      ORDER BY id DESC
      LIMIT 1
    `)

    try {
      const row = query.get()
      return row ? row.estado : 'cerrada'
    } catch (error) {
      console.error('Error al obtener estado de caja:', error)
      throw error
    }
  }

  hayCajaAbierta() {
    return this.obtenerEstadoCaja() === 'abierta'
  }
}

module.exports = CajaRepository