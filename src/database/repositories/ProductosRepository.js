const Producto = require('../models/Productos')
const {getInstance} = require('../connection/DatabaseConnection');

class ProductosRepository {
    constructor() {
        
    }

    getDb(){
    return getInstance().getDatabase()
    }

    insertar(producto){
      const db = this.getDb()
      const query = db.prepare(`
        INSERT INTO productos (nombre, descripcion, precio, categoria, disponible, imagen)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      try {
        const result = query.run(
          producto.nombre,
          producto.descripcion,
          producto.precio,
          producto.categoria,
          producto.disponible ? 1 : 0,
          producto.imagen
        );
        
        return this.buscarPorId(result.lastInsertRowid);

      } catch (error) {
        console.error('Error al insertar producto:', error);
        throw error;
      }
    }

    buscarTodos(){
      const db = this.getDb()
      const listaProductos = [];
      const query = db.prepare('SELECT * FROM productos');
      try {
        const rows = query.all();
        for (const row of rows) {
          listaProductos.push(new Producto({
            id: row.id,
            nombre: row.nombre,
            descripcion: row.descripcion,
            precio: row.precio,
            categoria: row.categoria,
            disponible: row.disponible === 1,
            imagen: row.imagen
          }));
        }
      } catch (error) {
        console.error('Error al buscar productos:', error);
        throw error;
      }
      return listaProductos;
    }

    buscarPorId(id){
      const db = this.getDb()
      const query = db.prepare('SELECT * FROM productos WHERE id = ?');
      try {
        const row = query.get(id);
        if (row) {
          return new Producto({
  id: row.id,
  nombre: row.nombre,
  descripcion: row.descripcion,
  precio: row.precio,
  categoria: row.categoria,
  disponible: row.disponible === 1,
  imagen: row.imagen
});
        }
          return null;
      } catch (error) {
        console.error('Error al obtener producto por ID:', error);
        throw error;
      }
    }

    buscarPorNombre(nombre){
      const db = this.getDb()
      const listaProductos = [];
      const query = db.prepare('SELECT * FROM productos WHERE nombre LIKE ?');
      try {
        const rows = query.all(`%${nombre}%`);
        for (const row of rows) {
          listaProductos.push(new Producto({
  id: row.id,
  nombre: row.nombre,
  descripcion: row.descripcion,
  precio: row.precio,
  categoria: row.categoria,
  disponible: row.disponible === 1,
  imagen: row.imagen
}));
        }
      } catch (error) {
        console.error('Error al buscar productos por nombre:', error);
        throw error;
      }
      return listaProductos;
    }

    update(producto){
      const db = this.getDb()
      const query = db.prepare(`
        UPDATE productos
        SET nombre = ?, descripcion = ?, precio = ?, categoria = ?, disponible = ?, imagen = ?
        WHERE id = ?
      `);

      try {
        query.run(
          producto.nombre,
          producto.descripcion,
          producto.precio,
          producto.categoria,
          producto.disponible ? 1 : 0,
          producto.imagen,
          producto.id
        );
      } catch (error) {
        console.error('Error al actualizar producto:', error);
        throw error;
      }
      return this.buscarPorId(producto.id);
    }

    delete(id){
      const db = this.getDb()
      const query = db.prepare('DELETE FROM productos WHERE id = ?');
      try {
        query.run(id);
      } catch (error) {
        console.error('Error al eliminar producto:', error);
        throw error;
      }
    }
    
  }

module.exports = ProductosRepository;