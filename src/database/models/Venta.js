class Venta {
  constructor({ id, fecha, total, metodoPago, cajaId, productos }) {
    this.id = id
    this.fecha = fecha
    this.total = total
    this.metodoPago = metodoPago
    this.cajaId = cajaId
    this.productos = productos || [] 
  }
}

module.exports = Venta
