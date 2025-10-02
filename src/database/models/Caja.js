class Caja {
  constructor({ id, montoInicial, montoFinal, fechaApertura, fechaCierre, estado }) {
    this.id = id;
    this.montoInicial = montoInicial;
    this.montoFinal = montoFinal;
    this.fechaApertura = fechaApertura;
    this.fechaCierre = fechaCierre;
    this.estado = estado !== undefined ? estado : 'cerrada';
  }
}

module.exports = Caja;