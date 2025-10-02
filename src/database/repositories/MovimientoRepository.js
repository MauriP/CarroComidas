const { getInstance } = require('../connection/DatabaseConnection')
const Movimiento = require('../models/Movimientos')

class MovimientoRepository {
  constructor() {
  }

  getDb(){
    return getInstance().getDatabase()
  }
  insertar(movimiento) {
    const db = this.getDb()
    const query = db.prepare(`
      INSERT INTO movimientos (cajaId, tipo, monto, motivo, fecha)
      VALUES (?, ?, ?, ?, ?)
    `)

    try {
      const result = query.run(
        movimiento.cajaId,
        movimiento.tipo,
        movimiento.monto,
        movimiento.motivo,
        movimiento.fecha
      )
      return {
        id: result.lastInsertRowid,
        succes: true
      }
    } catch (error) {
      console.error('Error al registrar movimiento:', error)
      throw error
    }
  }

  obtenerMovimientosDeCaja(cajaId) {
    const db = this.getDb();
    const query = db.prepare(`
      SELECT * FROM movimientos
      WHERE cajaId = ?
      ORDER BY fecha DESC
    `)

    try {
      const rows = query.all(cajaId)
      return rows.map(
        (r) =>
          new Movimiento({
            id: r.id,
            cajaId: r.cajaId,
            tipo: r.tipo,
            monto: r.monto,
            motivo: r.motivo,
            fecha: r.fecha
          })
      )
    } catch (error) {
      console.error('Error al obtener movimientos de caja:', error)
      throw error
    }
  }

  obtenerMovimientosDelDia(fecha) {
    const db = this.getDb()
    const query = db.prepare(`
      SELECT * FROM movimientos
      WHERE date(fecha) = date(?)
      ORDER BY fecha DESC
    `)

    try {
      const rows = query.all(fecha)
      return rows.map(
        (r) =>
          new Movimiento({
            id: r.id,
            cajaId: r.cajaId,
            tipo: r.tipo,
            monto: r.monto,
            motivo: r.motivo,
            fecha: r.fecha
          })
      )
    } catch (error) {
      console.error('Error al obtener movimientos del día:', error)
      throw error
    }
  }

}

module.exports = MovimientoRepository
