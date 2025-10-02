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

    COUNT(DISTINCT v.id) AS total_ventas,

    (SELECT SUM(total) FROM ventas WHERE DATE(fecha) = DATE(v.fecha)) AS ingresos_totales,

    SUM(vd.cantidad) AS productos_vendidos,
    
    ROUND(
        (SELECT SUM(total) FROM ventas WHERE DATE(fecha) = DATE(v.fecha)) * 1.0 / 
        COUNT(DISTINCT v.id), 
        2
    ) AS ticket_promedio,
    
    (SELECT vd2.nombreProducto
    FROM ventaDetalles vd2
    JOIN ventas v2 ON vd2.ventaId = v2.id
    WHERE DATE(v2.fecha) = DATE(v.fecha)
    GROUP BY vd2.nombreProducto
    ORDER BY SUM(vd2.cantidad) DESC
    LIMIT 1) AS producto_mas_vendido,
    

    (SELECT SUM(total) FROM ventas WHERE DATE(fecha) = DATE(v.fecha) AND metodoPago = 'efectivo') AS ingresos_efectivo,
    (SELECT SUM(total) FROM ventas WHERE DATE(fecha) = DATE(v.fecha) AND metodoPago = 'transferencia') AS ingresos_transferencia,
    (SELECT SUM(total) FROM ventas WHERE DATE(fecha) = DATE(v.fecha) AND metodoPago = 'debito') AS ingresos_debito,
    
    (SELECT SUM(m.monto) 
        FROM movimientos m 
        WHERE DATE(m.fecha) = DATE(v.fecha) AND m.tipo = 'ingreso') AS movimientos_ingresos,
    (SELECT SUM(m.monto) 
        FROM movimientos m 
        WHERE DATE(m.fecha) = DATE(v.fecha) AND m.tipo = 'egreso') AS movimientos_egresos

FROM ventas v
JOIN ventaDetalles vd ON v.id = vd.ventaId
GROUP BY DATE(v.fecha);