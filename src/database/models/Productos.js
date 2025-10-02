class Productos {
    constructor({ id, nombre, descripcion, precio, categoria, disponible, imagen }) {
        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.precio = precio;
        this.categoria = categoria;
        this.disponible = disponible !== undefined ? disponible : true;
        this.imagen = imagen;
    }

}

module.exports = Productos;