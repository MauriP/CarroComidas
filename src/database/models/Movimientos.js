class Movimientos {
  constructor({ id, cajaId, tipo, monto, motivo, fecha }) {
    this.id = id
    this.cajaId = cajaId
    this.tipo = tipo
    this.monto = monto
    this.motivo = motivo || ''
    this.fecha = fecha
  }
}

module.exports = Movimientos

