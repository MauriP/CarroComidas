const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

class DatabaseConnection {
    constructor() {
        this.db = null;
        this.dbPath = this.getDatabasePath();
    }

    // Devuelve la ruta de la DB en userData
    getDatabasePath() {
    const userDataPath = app.getPath('userData');
    const dbFolder = path.join(userDataPath, 'database');
    
    console.log('📁 UserData path:', userDataPath);
    console.log('📁 DB folder:', dbFolder);
    
    if (!fs.existsSync(dbFolder)) {
        console.log('📁 Creando carpeta DB...');
        fs.mkdirSync(dbFolder, { recursive: true });
    }
    
    const dbPath = path.join(dbFolder, 'carro_comidas.db');
    console.log('📁 DB path final:', dbPath);
    
    return dbPath;
}

    // Encuentra schema.sql según entorno
    findSchemaPath() {
    const possiblePaths = [
        // Desarrollo
        path.join(__dirname, '../database/schema.sql'),
        // Producción - desde extraResource
        path.join(process.resourcesPath, 'schema.sql'),
        // Fallback para desarrollo
        path.join(__dirname, '../../database/schema.sql'),
    ];

    for (const schemaPath of possiblePaths) {
        console.log('Buscando schema en:', schemaPath);
        if (fs.existsSync(schemaPath)) {
            console.log('✅ Schema encontrado en:', schemaPath);
            return schemaPath;
        }
    }

    console.error('❌ No se encontró schema.sql en ninguna ruta');
    return null;
}

    // Conecta la DB
    connect() {
        if (this.db) return this.db;

        try {
            console.log('Conectando a DB en:', this.dbPath);
            this.db = new Database(this.dbPath);
            this.db.pragma('journal_mode = WAL');
            this.db.pragma('foreign_keys = ON');

            this.createTables();

            console.log('✅ Base de datos conectada');
            return this.db;
        } catch (error) {
            console.error('❌ Error conectando DB:', error);
            throw error;
        }
    }

    // Crea tablas usando schema.sql o desde código
    createTables() {
        try {
            const schemaPath = this.findSchemaPath();
            if (schemaPath && fs.existsSync(schemaPath)) {
                const schemaSql = fs.readFileSync(schemaPath, 'utf8');
                this.db.exec(schemaSql);
                console.log('✅ Tablas creadas desde schema.sql');
            } else {
                this.createTablesFromCode();
                console.log('✅ Tablas creadas desde código');
            }
        } catch (error) {
            console.error('Error creando tablas:', error);
            this.createTablesFromCode();
        }
    }

    // Crea tablas desde código (fallback)
    createTablesFromCode() {
        const schemaSql = `
            CREATE TABLE IF NOT EXISTS productos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                descripcion TEXT,
                precio REAL NOT NULL,
                categoria TEXT NOT NULL,
                disponible BOOLEAN DEFAULT TRUE,
                imagen TEXT
            );

            CREATE TABLE IF NOT EXISTS cajas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fechaApertura DATETIME DEFAULT CURRENT_TIMESTAMP,
                fechaCierre DATETIME,
                montoInicial REAL NOT NULL,
                montoFinal REAL,
                estado TEXT DEFAULT 'cerrada' CHECK(estado IN ('abierta', 'cerrada'))
            );

            CREATE TABLE IF NOT EXISTS ventas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fecha DATETIME NOT NULL,
                total REAL NOT NULL,
                metodoPago TEXT NOT NULL CHECK(metodoPago IN ('efectivo', 'transferencia', 'debito')),
                cajaId INTEGER,
                FOREIGN KEY (cajaId) REFERENCES cajas (id)
            );

            CREATE TABLE IF NOT EXISTS ventaDetalles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ventaId INTEGER NOT NULL,
                productoId INTEGER,
                nombreProducto TEXT NOT NULL,
                cantidad INTEGER NOT NULL,
                precioUnitario REAL NOT NULL,
                subtotal REAL NOT NULL,
                FOREIGN KEY (ventaId) REFERENCES ventas (id),
                FOREIGN KEY (productoId) REFERENCES productos (id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS movimientos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cajaId INTEGER,
                tipo TEXT NOT NULL CHECK(tipo IN ('ingreso', 'egreso')),
                monto REAL NOT NULL,
                motivo TEXT,
                fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (cajaId) REFERENCES cajas (id)
            );

            CREATE VIEW IF NOT EXISTS vista_resumen_diario AS
            SELECT 
                DATE(v.fecha) AS fecha,
                COUNT(v.id) AS total_ventas,
                SUM(v.total) AS ingresos_totales,
                SUM(vd.cantidad) AS productos_vendidos,
                ROUND(SUM(v.total) * 1.0 / COUNT(v.id), 2) AS ticket_promedio,
                (SELECT vd2.nombreProducto
                FROM ventaDetalles vd2
                JOIN ventas v2 ON vd2.ventaId = v2.id
                WHERE DATE(v2.fecha) = DATE(v.fecha)
                GROUP BY vd2.nombreProducto
                ORDER BY SUM(vd2.cantidad) DESC
                LIMIT 1) AS producto_mas_vendido,
                SUM(CASE WHEN v.metodoPago = 'efectivo' THEN v.total ELSE 0 END) AS ingresos_efectivo,
                SUM(CASE WHEN v.metodoPago = 'transferencia' THEN v.total ELSE 0 END) AS ingresos_transferencia,
                SUM(CASE WHEN v.metodoPago = 'debito' THEN v.total ELSE 0 END) AS ingresos_debito,
                (SELECT SUM(m.monto) 
                    FROM movimientos m 
                    WHERE DATE(m.fecha) = DATE(v.fecha) AND m.tipo = 'ingreso') AS movimientos_ingresos,
                (SELECT SUM(m.monto) 
                    FROM movimientos m 
                    WHERE DATE(m.fecha) = DATE(v.fecha) AND m.tipo = 'egreso') AS movimientos_egresos
            FROM ventas v
            JOIN ventaDetalles vd ON v.id = vd.ventaId
            GROUP BY DATE(v.fecha);
        `;
        this.db.exec(schemaSql);
    }

    // Retorna la instancia de DB asegurando que exista
    getDatabase() {
        if (!this.db) this.connect();

        // Verificar que tabla principal exista
        const tableCheck = this.db.prepare(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='productos';"
        ).get();

        if (!tableCheck) {
            console.log('⚠️ Tablas no encontradas, creando...');
            this.createTables();
        }

        return this.db;
    }

    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            console.log('Base de datos cerrada');
        }
    }
}

// Singleton
let instance = null;

module.exports = {
    getInstance: () => {
        if (!instance) instance = new DatabaseConnection();
        return instance;
    },
    closeInstance: () => {
        if (instance) {
            instance.close();
            instance = null;
        }
    }
};
