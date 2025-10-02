class VentaDetalle {
  constructor({ id, ventaId, productoId, nombreProducto, cantidad, precioUnitario, subtotal }) {
    this.id = id
    this.ventaId = ventaId
    this.productoId = productoId
    this.nombreProducto = nombreProducto
    this.cantidad = cantidad
    this.precioUnitario = precioUnitario
    this.subtotal = subtotal
  }
}

module.exports = VentaDetalle

