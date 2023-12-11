// Arrays para almacenar las compras y ventas
let compras = [];
let ventas = [];
let saldos = [];
let historialSaldos = [];
let indiceSecuencial = 1; // Esta variable llevará la cuenta del número total de entradas


// Clona el estado actual de los saldos y devuelve un nuevo objeto.
function clonarEstadoSaldos() {
    return saldos.map(saldo => ({
        fecha: saldo.fecha,
        productos_en_saldo: saldo.productos_en_saldo.map(producto => ({
            cantidad: producto.cantidad,
            precio: producto.precio
        }))
    }));
}


// Actualiza el historial de saldos después de una compra o venta.
function actualizarHistorialSaldos(entrada) {
    historialSaldos.push({
        indice: entrada.indice,
        fecha: entrada.fecha,
        saldos: clonarEstadoSaldos() // Clona y guarda el estado actual de saldos
    });
}

// Función para actualizar los saldos después de una venta
function actualizarSaldosPorVenta(venta) {
  let cantidadVentaPendiente = venta.cantidad;

  // Procesamos los saldos de forma FIFO
  for (let i = 0; i < saldos.length && cantidadVentaPendiente > 0; i++) {
    let saldo = saldos[i];

    // Recorremos los productos en el saldo
    saldo.productos_en_saldo = saldo.productos_en_saldo.filter((producto) => {
      if (cantidadVentaPendiente > 0 && producto.cantidad > 0) {
        let cantidadAUsar = Math.min(producto.cantidad, cantidadVentaPendiente);
        producto.cantidad -= cantidadAUsar;
        cantidadVentaPendiente -= cantidadAUsar;
      }
      return producto.cantidad > 0; // Mantenemos solo los productos que aún tienen cantidad
    });
  }

  // Eliminar saldos vacíos
  saldos = saldos.filter((saldo) => saldo.productos_en_saldo.length > 0);

  // Si todavía quedan productos después de procesar todos los saldos, es un error
  if (cantidadVentaPendiente > 0) {
    console.error(
      "Error: intentando vender más productos de los que hay en los saldos."
    );
  }

  
}


// Función para agregar un saldo después de una compra
function agregarActualizarSaldoPorCompra(compra) {
  // Buscamos si ya existe un saldo para la fecha de la compra
  let saldoExistente = saldos.find((saldo) => saldo.fecha === compra.fecha);

  if (saldoExistente) {
    // Si existe, agregamos los productos al saldo existente
    saldoExistente.productos_en_saldo.push({
      cantidad: compra.cantidad,
      precio: compra.precio,
    });
  } else {
    // Si no existe, creamos un nuevo saldo
    saldos.push({
      indice: indiceSecuencial,
      fecha: compra.fecha,
      productos_en_saldo: [
        { cantidad: compra.cantidad, precio: compra.precio },
      ],
    });
  }

}

function calcularPrecioVenta(cantidad) {
  let costoUnitario = 0;
  let cantidadVentaPendiente = cantidad;

  for (let saldo of saldos) {
    for (let producto of saldo.productos_en_saldo) {
      if (cantidadVentaPendiente > 0 && producto.cantidad > 0) {
        let cantidadAUsar = Math.min(producto.cantidad, cantidadVentaPendiente);
        costoUnitario = producto.precio; // Asignamos el precio del producto más antiguo
        cantidadVentaPendiente -= cantidadAUsar;
        if (cantidadVentaPendiente === 0) break;
      }
    }
    if (cantidadVentaPendiente === 0) break;
  }

  if (cantidadVentaPendiente > 0) {
    console.error(
      "Error: No hay suficientes productos en el inventario para la venta."
    );
  }

  return costoUnitario;
}

// Función para agregar una entrada al array correspondiente
function agregarEntrada(tipo, fecha, cantidad, precio) {
  let cantidadNumerica = parseInt(cantidad, 10);
  let precioNumerico = tipo === "compra" ? parseFloat(precio) : 0; // Inicializar precio a 0 para ventas
  let costoUnitario = 0;
  let costoTotal = 0;

  if (tipo === "venta") {
    // Calculamos el precio de venta con base en el inventario existente
    costoUnitario = calcularPrecioVenta(cantidadNumerica);
    costoTotal = costoUnitario * cantidadNumerica;
  } else {
    // Para compras, usamos el precio proporcionado y calculamos el costo total
    costoTotal = cantidadNumerica * precioNumerico;
  }

  const entrada = {
    indice: indiceSecuencial++,
    tipo: tipo,
    fecha: fecha,
    cantidad: cantidadNumerica,
    precio: costoUnitario || precioNumerico, // Usamos costoUnitario para ventas y precioNumerico para compras
    costoTotal: costoTotal,
  };

  // Agregamos la entrada a las listas correspondientes
  if (tipo === "compra") {
    compras.push(entrada);
    agregarActualizarSaldoPorCompra(entrada);
  } else if (tipo === "venta") {
    // Solo agregamos la venta si hay un costo unitario válido
    if (costoUnitario > 0) {
      ventas.push(entrada);
      actualizarSaldosPorVenta(entrada);
    } else {
      alert("No hay suficiente inventario para realizar la venta.");
      return; // No procedemos a agregar la venta
    }
  }

  actualizarHistorialSaldos(entrada);

  actualizarTabla();
}

// Función para actualizar la tabla con los datos de las compras y ventas
function actualizarTabla() {
  const cuerpoTabla = document.querySelector("#inventory-table tbody");
  cuerpoTabla.innerHTML = ""; // Limpiamos la tabla antes de actualizar

  let entradasCombinadas = [...compras, ...ventas];

  // Ordenamos por índice secuencial ya que cada índice es único y refleja el orden de entrada
  entradasCombinadas.sort((a, b) => a.indice - b.indice);

  // Agregamos las entradas combinadas en el orden correcto
  entradasCombinadas.forEach((entrada) => {
    const fila = cuerpoTabla.insertRow();
    fila.insertCell().textContent = entrada.indice;
    fila.insertCell().textContent = entrada.fecha;

    // Rellenamos las celdas de compra o venta según corresponda
    let celdaCompraCantidad = fila.insertCell();
    let celdaCompraPrecio = fila.insertCell();
    let celdaCompraTotal = fila.insertCell();
    let celdaVentaCantidad = fila.insertCell();
    let celdaVentaPrecio = fila.insertCell();
    let celdaVentaTotal = fila.insertCell();

    let celdaSaldoCantidad = fila.insertCell();
    let celdaSaldoPrecio = fila.insertCell();
    let celdaSaldoTotal = fila.insertCell();

    if (entrada.tipo === "compra") {
        fila.style.backgroundColor = "#90EE90";
      celdaCompraCantidad.textContent = entrada.cantidad;
      celdaCompraPrecio.textContent = entrada.precio.toFixed(2);
      celdaCompraTotal.textContent = entrada.costoTotal.toFixed(2);
      celdaVentaCantidad.textContent = "";
      celdaVentaPrecio.textContent = "";
      celdaVentaTotal.textContent = "";
    } else if (entrada.tipo === "venta") {
        fila.style.backgroundColor = "#FFB6C1";
      celdaCompraCantidad.textContent = "";
      celdaCompraPrecio.textContent = "";
      celdaCompraTotal.textContent = "";
      celdaVentaCantidad.textContent = entrada.cantidad;
      celdaVentaPrecio.textContent = entrada.precio.toFixed(2);
      celdaVentaTotal.textContent = entrada.costoTotal.toFixed(2);
    }

    // Ahora, agregamos la información del saldo en la misma fila
    // Suponiendo que 'saldos' es un array y que 'fecha' es la fecha que quieres buscar
    
    let saldosTemp=historialSaldos[entrada.indice-1].saldos;

//    console.log(saldosTemp[0].productos_en_saldo);

    if (saldosTemp && saldosTemp[0] && saldosTemp[0].productos_en_saldo) {
      let cantidades = "";
      let costosunitarios = "";
      let saldoCantidadTotalAux = 0;
      saldosTemp[0].productos_en_saldo.forEach((producto) => {
        cantidades += producto.cantidad + ", ";
        costosunitarios += producto.precio + ", ";
        saldoCantidadTotalAux += producto.cantidad * producto.precio;
      });
      console.log("vueas");
      celdaSaldoCantidad.textContent = cantidades.slice(0, -2); // Removemos la última coma y espacio
      celdaSaldoPrecio.textContent = costosunitarios.slice(0, -2); // Removemos la última coma y espacio
      celdaSaldoTotal.textContent = saldoCantidadTotalAux.toFixed(2); // Formateamos a dos decimales
    } else {
      celdaSaldoCantidad.textContent = "";
      celdaSaldoPrecio.textContent = "";
      celdaSaldoTotal.textContent = "";
    }
    

  });

//   console.log(historialSaldos);
  // Actualizamos los totales de compras, ventas y saldo
  document.getElementById("total_costo_compra").textContent = compras
    .reduce((sum, item) => sum + item.costoTotal, 0)
    .toFixed(2);
  document.getElementById("total_costo_venta").textContent = ventas
    .reduce((sum, item) => sum + item.costoTotal, 0)
    .toFixed(2);
  // Calculamos el total del saldo cuando tengamos esa lógica implementada
}

// Event listener para el formulario de inventario
document
  .getElementById("inventory-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const fecha = document.getElementById("fecha").value;
    const cantidad = document.getElementById("cantidad").value;
    const precio = document.getElementById("precio").value;
    const tipo = document.getElementById("tipo").value;
    //si es venta no es necesario tener el precio ya que siempre tomara por el indice de entrada
    console.log(tipo);
    if (tipo === "venta" && precio === "") {
      agregarEntrada(tipo, fecha, cantidad, precio);
    } else if (tipo === "compra" && precio != "") {
      agregarEntrada(tipo, fecha, cantidad, precio);
    } else {
      alert("necesitas colocar el precio");
    }
  });

// Inicialización para cargar cualquier dato preexistente
document.addEventListener("DOMContentLoaded", function () {
  actualizarTabla();
  limpiarFormulario();
});

function limpiarFormulario() {
  document.getElementById('fecha').value='';
     document.getElementById('cantidad').value='';
  document.getElementById("precio").value = "";
     document.getElementById('tipo').value='';
}
