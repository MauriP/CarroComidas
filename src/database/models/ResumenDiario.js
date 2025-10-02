class ResumenDiario {
  constructor({
    fecha,
    total_ventas,
    ingresos_totales,
    productos_vendidos,
    ticket_promedio,
    producto_mas_vendido,
    ingresos_efectivo,
    ingresos_transferencia,
    ingresos_debito,
    movimientos_ingresos,
    movimientos_egresos
  }) {
    this.fecha = fecha
    this.totalVentas = total_ventas
    this.ingresosTotales = ingresos_totales
    this.productosVendidos = productos_vendidos
    this.ticketPromedio = ticket_promedio
    this.productoMasVendido = producto_mas_vendido
    this.ingresosEfectivo = ingresos_efectivo
    this.ingresosTransferencia = ingresos_transferencia
    this.ingresosDebito = ingresos_debito
    this.movimientosIngresos = movimientos_ingresos
    this.movimientosEgresos = movimientos_egresos
  }
}

module.exports = ResumenDiario