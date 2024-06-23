// Registrar el Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
        .then(registration => {
            console.log('Service Worker registrado con éxito:', registration);
        })
        .catch(error => {
            console.log('Error al registrar el Service Worker:', error);
        });
}

// Variables globales para almacenar datos
let comunidadSeleccionada = '';
let mesSeleccionado = '';
let diaSeleccionado = 0;
let totalGarrafonesVendidos = 0;
let totalGarrafonesFiados = 0;
let totalDineroRecaudado = 0;
let historialPorDia = {}; // Objeto para almacenar historial por día

// Obtener elementos del DOM
const empezarBtn = document.getElementById('empezarBtn');
const seleccionComunidad = document.getElementById('seleccionComunidad');
const seleccionMes = document.getElementById('seleccionMes');
const seleccionDia = document.getElementById('seleccionDia');
const registroVentas = document.getElementById('registroVentas');
const historialDia = document.getElementById('historialDia');
const volverRegistroBtn = document.getElementById('volverRegistroBtn');
const regresarBtns = document.querySelectorAll('.regresar-btn');
const comunidadBtns = document.querySelectorAll('.comunidad-btn');
const mesBtns = document.querySelectorAll('.mes-btn');
const diaBtns = document.querySelectorAll('.dia-btn');
const registroForm = document.getElementById('registroForm');
const tablaHistorial = document.getElementById('tablaHistorial');
const totalVendidos = document.getElementById('totalVendidos');
const totalFiados = document.getElementById('totalFiados');
const totalDineroElem = document.getElementById('totalDinero');
const historialBtn = document.getElementById('historialBtn');
const resetearHistorialBtn = document.getElementById('resetearHistorialBtn'); // Nuevo botón para resetear historial

// Mostrar selección de comunidad al hacer clic en Empezar
empezarBtn.addEventListener('click', () => {
    seleccionComunidad.classList.remove('hidden');
    seleccionMes.classList.add('hidden');
    seleccionDia.classList.add('hidden');
    registroVentas.classList.add('hidden');
    historialDia.classList.add('hidden');
});

// Seleccionar comunidad
comunidadBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        comunidadSeleccionada = btn.dataset.comunidad;
        seleccionComunidad.classList.add('hidden');
        seleccionMes.classList.remove('hidden');
        seleccionDia.classList.add('hidden');
        registroVentas.classList.add('hidden');
        historialDia.classList.add('hidden');
    });
});

// Regresar a selección de comunidad desde selección de mes o día
regresarBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        seleccionComunidad.classList.remove('hidden');
        seleccionMes.classList.add('hidden');
        seleccionDia.classList.add('hidden');
        registroVentas.classList.add('hidden');
        historialDia.classList.add('hidden');
    });
});

// Seleccionar mes
mesBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        mesSeleccionado = btn.dataset.mes;
        seleccionMes.classList.add('hidden');
        seleccionDia.classList.remove('hidden');
        seleccionComunidad.classList.add('hidden');
        registroVentas.classList.add('hidden');
        historialDia.classList.add('hidden');
    });
});

// Seleccionar día
diaBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        diaSeleccionado = parseInt(btn.textContent);
        seleccionDia.classList.add('hidden');
        registroVentas.classList.remove('hidden');

        // Si no hay historial para el día seleccionado, inicializarlo
        if (!historialPorDia[comunidadSeleccionada]) {
            historialPorDia[comunidadSeleccionada] = {};
        }
        if (!historialPorDia[comunidadSeleccionada][mesSeleccionado]) {
            historialPorDia[comunidadSeleccionada][mesSeleccionado] = {};
        }
        if (!historialPorDia[comunidadSeleccionada][mesSeleccionado][diaSeleccionado]) {
            historialPorDia[comunidadSeleccionada][mesSeleccionado][diaSeleccionado] = [];
        }
        mostrarHistorial();
    });
});

// Mostrar historial del día
historialBtn.addEventListener('click', () => {
    mostrarHistorial();
    historialDia.classList.remove('hidden');
    seleccionComunidad.classList.add('hidden');
    seleccionMes.classList.add('hidden');
    seleccionDia.classList.add('hidden');
    registroVentas.classList.add('hidden');
});

// Volver al registro desde historial del día
volverRegistroBtn.addEventListener('click', () => {
    historialDia.classList.add('hidden');
    registroVentas.classList.remove('hidden');
    seleccionComunidad.classList.add('hidden');
    seleccionMes.classList.add('hidden');
    seleccionDia.classList.add('hidden');
});

// Agregar registro de venta al formulario
registroForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const cliente = document.getElementById('cliente').value.trim();
    const cantidad = parseInt(document.getElementById('cantidad').value.trim());
    const precio = parseFloat(document.getElementById('precio').value.trim());
    const tipo = document.getElementById('tipo').value;

    if (cantidad <= 0 || isNaN(cantidad)) {
        alert('La cantidad debe ser un número mayor a cero.');
        return;
    }

    const total = cantidad * precio;

    // Agregar registro al historial del día seleccionado
    historialPorDia[comunidadSeleccionada][mesSeleccionado][diaSeleccionado].push({
        cliente: cliente,
        cantidad: cantidad,
        precio: precio,
        total: total,
        tipo: tipo
    });

    // Agregar registro a la tabla de historial
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${cliente}</td>
        <td>${cantidad}</td>
        <td>${precio}</td>
        <td>${total.toFixed(2)}</td>
        <td>${tipo}</td>
        <td><button class="eliminar-btn">Eliminar</button></td> <!-- Botón para eliminar registro -->
    `;
    tablaHistorial.querySelector('tbody').appendChild(row);

    // Actualizar totales de garrafones vendidos o fiados y dinero
    if (tipo === 'venta') {
        totalGarrafonesVendidos += cantidad;
    } else if (tipo === 'fiado') {
        totalGarrafonesFiados += cantidad;
    }

    if (tipo === 'venta' || tipo === 'cobrado') {
        totalDineroRecaudado += total;
    }

    // Actualizar los elementos en el DOM
    totalVendidos.textContent = totalGarrafonesVendidos.toString();
    totalFiados.textContent = totalGarrafonesFiados.toString();
    totalDineroElem.textContent = totalDineroRecaudado.toFixed(2);

    // Guardar registro en IndexedDB
    guardarVentaEnDB({
        comunidad: comunidadSeleccionada,
        mes: mesSeleccionado,
        dia: diaSeleccionado,
        cliente: cliente,
        cantidad: cantidad,
        precio: precio,
        total: total,
        tipo: tipo
    });

    // Limpiar formulario
    registroForm.reset();
});

// Función para mostrar el historial del día
function mostrarHistorial() {
    // Limpiar tabla antes de agregar nuevos registros
    const tbody = tablaHistorial.querySelector('tbody');
    tbody.innerHTML = '';

    // Obtener historial del día seleccionado
    const historial = historialPorDia[comunidadSeleccionada][mesSeleccionado][diaSeleccionado];

    // Iterar sobre los registros y agregarlos a la tabla
    historial.forEach((registro, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${registro.cliente}</td>
            <td>${registro.cantidad}</td>
            <td>${registro.precio}</td>
            <td>${registro.total.toFixed(2)}</td>
            <td>${registro.tipo}</td>
            <td><button class="eliminar-btn" data-index="${index}">Eliminar</button></td>
        `;
        tbody.appendChild(row);

        // Agregar listener para el botón de eliminar
        row.querySelector('.eliminar-btn').addEventListener('click', () => {
            // Eliminar registro del historialPorDia
            historialPorDia[comunidadSeleccionada][mesSeleccionado][diaSeleccionado].splice(index, 1);
            // Eliminar registro de IndexedDB
            eliminarRegistroEnDB(comunidadSeleccionada, mesSeleccionado, diaSeleccionado, index);
            // Volver a mostrar el historial actualizado
            mostrarHistorial();
        });
    });

    // Calcular totales de garrafones vendidos, fiados y dinero recaudado solo del día seleccionado
    totalGarrafonesVendidos = 0;
    totalGarrafonesFiados = 0;
    totalDineroRecaudado = 0;

    historial.forEach(registro => {
        if (registro.tipo === 'venta') {
            totalGarrafonesVendidos += registro.cantidad;
        } else if (registro.tipo === 'fiado') {
            totalGarrafonesFiados += registro.cantidad;
        }

        if (registro.tipo === 'venta' || registro.tipo === 'cobrado') {
            totalDineroRecaudado += registro.total;
        }
    });

    // Actualizar los elementos en el DOM
    totalVendidos.textContent = totalGarrafonesVendidos.toString();
    totalFiados.textContent = totalGarrafonesFiados.toString();
    totalDineroElem.textContent = totalDineroRecaudado.toFixed(2);
}

// IndexedDB
let db;
const request = indexedDB.open('VentasDB', 1);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    const objectStore = db.createObjectStore('ventas', { keyPath: 'id', autoIncrement: true });
    objectStore.createIndex('comunidad', 'comunidad', { unique: false });
    objectStore.createIndex('mes', 'mes', { unique: false });
    objectStore.createIndex('dia', 'dia', { unique: false });
};

request.onsuccess = function(event) {
    db = event.target.result;
    sincronizarDatos();
};

request.onerror = function(event) {
    console.error('Error al abrir la base de datos', event.target.errorCode);
};

function guardarVentaEnDB(venta) {
    const transaction = db.transaction(['ventas'], 'readwrite');
    const objectStore = transaction.objectStore('ventas');
    objectStore.add(venta);
}

function eliminarRegistroEnDB(comunidad, mes, dia, index) {
    const transaction = db.transaction(['ventas'], 'readwrite');
    const objectStore = transaction.objectStore('ventas');
    const indexComunidad = objectStore.index('comunidad');
    const request = indexComunidad.openCursor(IDBKeyRange.only(comunidad));

    request.onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            if (cursor.value.mes === mes && cursor.value.dia === dia && index === 0) {
                objectStore.delete(cursor.primaryKey);
                return;
            }
            cursor.continue();
        }
    };
}

function sincronizarDatos() {
    if (navigator.onLine) {
        const transaction = db.transaction(['ventas'], 'readonly');
        const objectStore = transaction.objectStore('ventas');
        const request = objectStore.getAll();

        request.onsuccess = function(event) {
            const ventas = event.target.result;
            ventas.forEach(venta => {
                if (!historialPorDia[venta.comunidad]) {
                    historialPorDia[venta.comunidad] = {};
                }
                if (!historialPorDia[venta.comunidad][venta.mes]) {
                    historialPorDia[venta.comunidad][venta.mes] = {};
                }
                if (!historialPorDia[venta.comunidad][venta.mes][venta.dia]) {
                    historialPorDia[venta.comunidad][venta.mes][venta.dia] = [];
                }
                historialPorDia[venta.comunidad][venta.mes][venta.dia].push({
                    cliente: venta.cliente,
                    cantidad: venta.cantidad,
                    precio: venta.precio,
                    total: venta.total,
                    tipo: venta.tipo
                });
            });
        };
    }
}

// Eventos de conexión/desconexión
window.addEventListener('online', sincronizarDatos);
window.addEventListener('offline', () => {
    console.log('Conexión perdida. Modo sin conexión activado.');
});

// Nuevo evento para resetear el historial
resetearHistorialBtn.addEventListener('click', () => {
    if (confirm('¿Estás seguro de que deseas resetear el historial? Esta acción no se puede deshacer.')) {
        historialPorDia = {};
        const transaction = db.transaction(['ventas'], 'readwrite');
        const objectStore = transaction.objectStore('ventas');
        objectStore.clear().onsuccess = function() {
            console.log('Historial reseteado exitosamente.');
        };
        mostrarHistorial();
    }
});
