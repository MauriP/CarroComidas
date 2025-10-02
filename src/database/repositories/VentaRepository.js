const { getInstance } = require('../connection/DatabaseConnection')
const Venta = require('../models/Venta')
const VentaDetalle = require('../models/VentaDetalle')

class VentaRepository {
  constructor() {
    
  }

  getDb(){
    return getInstance().getDatabase()
  }

  insertar(venta) {
    const db = this.getDb()
    const transaction = db.transaction(() => {
      const ventaQuery = db.prepare(`
        INSERT INTO ventas (fecha, total, metodoPago, cajaId)
        VALUES (?, ?, ?, ?)
      `)

      const ventaResult = ventaQuery.run(
        venta.fecha,
        venta.total,
        venta.metodoPago,
        venta.cajaId
      )
      const ventaId = ventaResult.lastInsertRowid

      const detalleQuery = db.prepare(`
        INSERT INTO ventaDetalles 
        (ventaId, productoId, nombreProducto, cantidad, precioUnitario, subtotal) 
        VALUES (?, ?, ?, ?, ?, ?)
      `)

      const detalles = []

      venta.productos.forEach((producto) => {
        const detalleResult = detalleQuery.run(
          ventaId,
          producto.id,
          producto.nombre,
          producto.cantidad,
          producto.precioUnitario,
          producto.subtotal
        )

        detalles.push(
          new VentaDetalle({
            id: detalleResult.lastInsertRowid,
            ventaId: ventaId,
            productoId: producto.id,
            nombreProducto: producto.nombre,
            cantidad: producto.cantidad,
            precioUnitario: producto.precioUnitario,
            subtotal: producto.subtotal
          })
        )
      })

      return new Venta({
        id: ventaId,
        fecha: venta.fecha,
        total: venta.total,
        metodoPago: venta.metodoPago,
        cajaId: venta.cajaId,
        productos: detalles
      })
    })

    try {
      return transaction()
    } catch (error) {
      console.error('Error al registrar venta:', error)
      throw error
    }
  }

  obtenerVentasDelDia(fecha) {
    const db = this.getDb()
    const ventaQuery = db.prepare(`
      SELECT * FROM ventas 
      WHERE date(fecha) = date(?) 
      ORDER BY fecha DESC
    `)

    const detalleQuery = db.prepare(`
      SELECT * FROM ventaDetalles 
      WHERE ventaId = ?
    `)

    try {
      const ventasRows = ventaQuery.all(fecha)

      return ventasRows.map((row) => {
        const detallesRows = detalleQuery.all(row.id)
        const detalles = detallesRows.map(
          (d) =>
            new VentaDetalle({
              id: d.id,
              ventaId: d.ventaId,
              productoId: d.productoId,
              nombreProducto: d.nombreProducto,
              cantidad: d.cantidad,
              precioUnitario: d.precioUnitario,
              subtotal: d.subtotal
            })
        )

        return new Venta({
          id: row.id,
          fecha: row.fecha,
          total: row.total,
          metodoPago: row.metodoPago,
          cajaId: row.cajaId,
          productos: detalles
        })
      })
    } catch (error) {
      console.error('Error al obtener ventas del día:', error)
      throw error
    }
  }

  obtenerHistorialVentas(limit = 100) {
    const db = this.getDb()
    const ventaQuery = db.prepare(`
      SELECT * FROM ventas 
      ORDER BY fecha DESC
      LIMIT ?
    `)

    const detalleQuery = db.prepare(`
      SELECT * FROM ventaDetalles 
      WHERE ventaId = ?
    `)

    try {
      const ventasRows = ventaQuery.all(limit)

      return ventasRows.map((row) => {
        const detallesRows = detalleQuery.all(row.id)
        const detalles = detallesRows.map(
          (d) =>
            new VentaDetalle({
              id: d.id,
              ventaId: d.ventaId,
              productoId: d.productoId,
              nombreProducto: d.nombreProducto,
              cantidad: d.cantidad,
              precioUnitario: d.precioUnitario,
              subtotal: d.subtotal
            })
        )

        return new Venta({
          id: row.id,
          fecha: row.fecha,
          total: row.total,
          metodoPago: row.metodoPago,
          cajaId: row.cajaId,
          productos: detalles
        })
      })
    } catch (error) {
      console.error('Error al obtener historial de ventas:', error)
      throw error
    }
  }
}

module.exports = VentaRepository