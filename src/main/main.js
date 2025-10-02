const { ipcMain, app, BrowserWindow } = require('electron');
const path = require('path');
const ProductosHandler = require('./handlers/ProductosHandler');
const CajaHandler = require('./handlers/CajaHandler');
const MovimientosHandler = require('./handlers/MovimientosHandler');
const VentaHandler = require('./handlers/VentaHandler');
const ResumenDiarioHandler = require('./handlers/ResumenDiarioHandler');
const { getInstance } = require('../database/connection/DatabaseConnection');
const escpos = require('escpos');

if (require('electron-squirrel-startup')) {
  app.quit();
}

escpos.USB = require('escpos-usb');
const usb = require('usb');

const productosHandler = new ProductosHandler();
const cajaHandler = new CajaHandler();
const movimientosHandler = new MovimientosHandler();
const ventaHandler = new VentaHandler();
const resumenHandler = new ResumenDiarioHandler();

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const htmlPath = path.join(__dirname, 'main.html');
  console.log('Cargando HTML desde:', htmlPath);
  mainWindow.loadFile(htmlPath);

  // DevTools en desarrollo
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' && !mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.openDevTools();
    }
  });

  return mainWindow;
};

app.whenReady().then(() => {
  // Conectar DB (en producción, usar userData)
  getInstance().connect();

  // Registrar protocolo
  app.on('ready', () => {
    if (process.defaultApp) {
      if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('electron', process.execPath, [path.resolve(process.argv[1])]);
      }
    } else {
      app.setAsDefaultProtocolClient('electron');
    }
  });

  createWindow();
  registrarHandlersProductos();
  registrarHandlersCaja();
  registrarHandlersMovimientos();
  registrarHandlersVenta();
  registrarHandlersResumenDiario();
  registrarHandlersImpresion();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// -------------------
// Handlers de impresión
// -------------------
function registrarHandlersImpresion() {

  // ✅ Listar impresoras conectadas por USB
  ipcMain.handle('impresion:obtenerImpresoras', async () => {
    try {
      const devices = usb.getDeviceList();

      const impresoras = devices.map(d => ({
        vendorId: '0x' + d.deviceDescriptor.idVendor.toString(16).padStart(4, '0'),
        productId: '0x' + d.deviceDescriptor.idProduct.toString(16).padStart(4, '0'),
        description: `USB Device ${d.deviceDescriptor.idVendor}:${d.deviceDescriptor.idProduct}`
      }));

      return { success: true, impresoras, count: impresoras.length };
    } catch (error) {
      console.error('Error obteniendo impresoras:', error);
      return { success: false, error: error.message, impresoras: [] };
    }
  });

  // ✅ Test de impresión
  ipcMain.handle('impresion:test', async () => {
    try {
      const device = new escpos.USB();
      const printer = new escpos.Printer(device);

      return new Promise((resolve, reject) => {
        device.open((error) => {
          if (error) {
            reject({ success: false, error: error.message });
            return;
          }

          printer
            .font('a')
            .align('ct')
            .style('bu')
            .size(1, 1)
            .text('TEST IMPRESORA')
            .text('----------------')
            .text('Funcionando OK!')
            .cut()
            .close(() => {
              resolve({ success: true, message: 'Test impreso correctamente' });
            });
        });
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // ✅ Imprimir comanda
  ipcMain.handle('impresion:imprimirComanda', async (event, datosVenta) => {
    try {
      return await imprimirComanda(datosVenta);
    } catch (error) {
      console.error('Error en impresión:', error);
      return { success: false, error: error.message };
    }
  });
}

// -------------------
// Función de impresión de comanda
// -------------------
async function imprimirComanda(datosVenta) {
  return new Promise((resolve, reject) => {
    try {
      const device = new escpos.USB();
      const printer = new escpos.Printer(device, {
        encoding: 'GB18030',
        width: 42
      });

      device.open((error) => {
        if (error) {
          console.error('Error abriendo dispositivo:', error);
          reject({ success: false, error: error.message });
          return;
        }

        const fecha = new Date(datosVenta.fecha).toLocaleString('es-AR');

        printer
          .hardware('init')
          .font('a')
          .align('ct')
          .style('b')
          .size(1, 1)
          .text('COMANDA')
          .text(`#${datosVenta.id}`)
          .text('========================')
          .align('lt')
          .style('normal')
          .size(0, 0)
          .text(`Fecha: ${fecha}`)
          .text(`Método: ${datosVenta.metodoPago.toUpperCase()}`)
          .text('------------------------');

        printer
          .style('b')
          .text('PRODUCTOS:')
          .style('normal')
          .text('------------------------');

        datosVenta.productos.forEach(producto => {
          let nombre = producto.nombre;
          if (nombre.length > 24) {
            nombre = nombre.substring(0, 21) + '...';
          }

          const subtotal = (producto.precioUnitario * producto.cantidad).toFixed(2);

          printer
            .text(nombre)
            .text(`  ${producto.cantidad} x $${producto.precioUnitario.toFixed(2)}`)
            .align('rt')
            .text(`$${subtotal}`)
            .align('lt')
            .text(' ');
        });

        printer
          .text('========================')
          .style('b')
          .align('ct')
          .text(`TOTAL: $${datosVenta.total.toFixed(2)}`)
          .style('normal')
          .text(' ')
          .text(' ')
          .align('ct')
          .text('¡Gracias por su compra!')
          .text(' ')
          .feed(2)
          .cut()
          .close((error) => {
            if (error) {
              console.error('Error cerrando impresora:', error);
              reject({ success: false, error: error.message });
            } else {
              resolve({ success: true, message: 'Comanda impresa correctamente' });
            }
          });
      });

    } catch (error) {
      console.error('Error en imprimirComanda:', error);
      reject({ success: false, error: error.message });
    }
  });
}
// -------------------
// Handlers de negocio
// -------------------
function registrarHandlersProductos() {
  ipcMain.handle('producto:insertar', (event, datosProducto) => {
    return productosHandler.insertarProducto(datosProducto);
  });

  ipcMain.handle('producto:obtenerTodos', () => {
    return productosHandler.obtenerProductos();
  });

  ipcMain.handle('producto:obtenerPorId', (event, id) => {
    return productosHandler.obtenerProductoPorId(id);
  });

  ipcMain.handle('producto:obtenerPorNombre', (event, nombre) => {
    return productosHandler.obtenerProductoPorNombre(nombre);
  });

  ipcMain.handle('producto:actualizar', (event, id, datosProducto) => {
    return productosHandler.actualizarProducto(id, datosProducto);
  });

  ipcMain.handle('producto:eliminar', (event, id) => {
    return productosHandler.eliminarProducto(id);
  });
}

function registrarHandlersCaja() {
  ipcMain.handle('caja:abrir', (event, montoInicial, fechaApertura) => {
    return cajaHandler.abrirCaja(montoInicial, fechaApertura);
  });

  ipcMain.handle('caja:cerrar', (event, montoFinal, fechaCierre) => {
    return cajaHandler.cerrarCaja(montoFinal, fechaCierre);
  });

  ipcMain.handle('caja:estado', () => {
    return cajaHandler.obtenerEstadoCaja();
  });

  ipcMain.handle('caja:obtenerId', () => {
    return cajaHandler.obtenerIdCajaAbierta();
  });
}

function registrarHandlersMovimientos() {
  ipcMain.handle('movimiento:insertar', (event, datosMovimiento) => {
    return movimientosHandler.insertarMovimiento(datosMovimiento);
  });

  ipcMain.handle('movimiento:obtener', (event, id) => {
    return movimientosHandler.obtenerMovimientos(id);
  });

  ipcMain.handle('movimiento:obtenerPorFecha', (event, fecha) => {
    return movimientosHandler.obtenerMovimientosPorFecha(fecha);
  });
}

function registrarHandlersVenta() {
  ipcMain.handle('venta:insertar', (event, datosVenta) => {
    return ventaHandler.registrarVenta(datosVenta);
  });

  ipcMain.handle('venta:obtenerDelDia', (event, fecha) => {
    return ventaHandler.obtenerVentasDelDia(fecha);
  });

  ipcMain.handle('venta:obtenerHistorial', (event, limit) => {
    return ventaHandler.obtenerHistorialVentas(limit);
  });
}

function registrarHandlersResumenDiario() {
  ipcMain.handle('resumen:obtenerTodos', () => {
    return resumenHandler.obtenerTodos();
  });
  ipcMain.handle('resumen:obtenerPorDia', (event, fecha) => {
    return resumenHandler.obtenerPorFecha(fecha);
  });
  ipcMain.handle('resumen:obtenerPorRango', (event, fechaInicio, fechaFin) => {
    return resumenHandler.obtenerRangoFechas(fechaInicio, fechaFin);
  });
}

// Manejo global de errores
process.on('uncaughtException', (error) => {
  console.error('Error no capturado:', error);
});
