
// ESTOS SON LOS SCRIPTS DEL LOGIN, REGISTRO Y RECUPERACION DE CONTRASEÑA, SOLO COMPRUEBAN QUE SE INTRODUJERON DATOS
// Y TAMBIEN GUARDAN EL NOMBRE DEL USUARIO EN EL LOCALSTORAGE PARA MOSTRARLO EN EL DASHBOARD
document.addEventListener('DOMContentLoaded', function () {
	const loginForm = document.getElementById('login-form');
	const registerForm = document.getElementById('register-form');
	const recoveryForm = document.getElementById('recovery-form');
	const usuarioDashboard = document.getElementById('usuario-dashboard');
	const historialBody = document.getElementById('historial-body');
	const productionBody = document.getElementById('historial-produccion-body');

	if (loginForm) {
		loginForm.addEventListener('submit', function () {
			const usuario = document.getElementById('nombre').value.trim();
			localStorage.setItem('usuario', usuario);
		});
	}

	if (registerForm) {
		registerForm.addEventListener('submit', function (event) {
			const password = document.getElementById('pass').value;
			const confirmPassword = document.getElementById('confirm_pass').value;

			if (password !== confirmPassword) {
				event.preventDefault();
				alert('Las contraseñas no coinciden.');
				return;
			}

			localStorage.setItem('usuario', document.getElementById('nombre').value.trim());
		});
	}
// ESTOS SON LOS SCRIPTS PARA EL FORMULARIO DE RECUPERACION DE CONTRASEÑA, SIMULAN EL ENVIO DE UN CODIGO AL CORREO DEL USUARIO Y MUESTRAN MENSAJES DE ESTADO
	if (recoveryForm) {
		const emailInput = document.getElementById('email');
		const sendCodeButton = document.getElementById('send-code');
		const resendCodeLink = document.getElementById('resend-code');
		const codeStep = document.getElementById('code-step');
		const recoveryStatus = document.getElementById('recovery-status');

		const sendCode = function (event) {
			if (event) {
				event.preventDefault();
			}

			if (!emailInput.value.trim()) {
				emailInput.reportValidity();
				return;
			}

			codeStep.hidden = false;
			recoveryStatus.hidden = false;
			recoveryStatus.textContent = 'Código enviado. Revisa tu correo para continuar.';
			sendCodeButton.textContent = 'Código enviado';
			sendCodeButton.disabled = true;
		};

		sendCodeButton.addEventListener('click', sendCode);
		resendCodeLink.addEventListener('click', function (event) {
			sendCode(event);
			sendCodeButton.disabled = false;
			sendCodeButton.textContent = 'Enviar código nuevamente';
		});
	}

	if (usuarioDashboard) {
		const usuarioGuardado = localStorage.getItem('usuario');
		if (usuarioGuardado) {
			usuarioDashboard.textContent = usuarioGuardado;
		}
	}
// ESTOS SON LOS SCRIPTS PARA FILTRAR LAS TABLAS DE HISTORIAL DE FACTURAS Y ORDENES DE PRODUCCION
	if (historialBody) {
		const searchInput = document.getElementById('buscar-factura');
		const statusSelect = document.getElementById('estado-factura');
		const noResults = document.getElementById('sin-resultados');

		const filterInvoices = function () {
			const search = searchInput.value.toLowerCase().trim();
			const status = statusSelect.value;
			let visibleRows = 0;

			historialBody.querySelectorAll('tr').forEach(function (row) {
				const matchesSearch = row.textContent.toLowerCase().includes(search);
				const matchesStatus = !status || row.dataset.estado === status;
				row.hidden = !matchesSearch || !matchesStatus;
				if (!row.hidden) visibleRows += 1;
			});

			noResults.hidden = visibleRows !== 0;
		};

		searchInput.addEventListener('input', filterInvoices);
		statusSelect.addEventListener('change', filterInvoices);
	}
// ESTOS SON LOS SCRIPTS PARA FILTRAR LAS TABLAS DE HISTORIAL DE FACTURAS Y ORDENES DE PRODUCCION
	if (productionBody) {
		const searchInput = document.getElementById('buscar-orden');
		const statusSelect = document.getElementById('estado-orden');
		const noResults = document.getElementById('sin-resultados-produccion');

		const filterProduction = function () {
			const search = searchInput.value.toLowerCase().trim();
			const status = statusSelect.value;
			let visibleRows = 0;

			productionBody.querySelectorAll('tr').forEach(function (row) {
				const matchesSearch = row.textContent.toLowerCase().includes(search);
				const matchesStatus = !status || row.dataset.estado === status;
				row.hidden = !matchesSearch || !matchesStatus;
				if (!row.hidden) visibleRows += 1;
			});

			noResults.hidden = visibleRows !== 0;
		};

		searchInput.addEventListener('input', filterProduction);
		statusSelect.addEventListener('change', filterProduction);
	}
});
// --------------------------------------------- FACTURACION ---------------------------------------------------------------------
// FACTURACION: crea facturas, calcula sus totales y las conserva en el navegador.
document.addEventListener('DOMContentLoaded', function () {
    const FACTURAS_KEY = 'facturasAGE';
    const IVA = 0.16;
    // Formato monetario de República Dominicana.
    const formatoPesos = new Intl.NumberFormat('es-DO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    const formatoMoneda = {
        format: valor => `RD$ ${formatoPesos.format(valor)}`
    };

    function leerFacturas() {
        try {
            return JSON.parse(localStorage.getItem(FACTURAS_KEY)) || [];
        } catch (error) {
            return [];
        }
    }

    function guardarFacturas(facturas) {
        localStorage.setItem(FACTURAS_KEY, JSON.stringify(facturas));
    }

    function obtenerFechaActual() {
        const fecha = new Date();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');
        return `${fecha.getFullYear()}-${mes}-${dia}`;
    }

    function actualizarResumen(facturas) {
        // Actualiza las tarjetas superiores con los datos almacenados.
        const emitidas = document.getElementById('resumen-emitidas');
        const pendientes = document.getElementById('resumen-pendientes');
        const total = document.getElementById('resumen-total');

        if (!emitidas || !pendientes || !total) return;

        emitidas.textContent = facturas.length;
        pendientes.textContent = facturas.filter(factura => factura.estado === 'Pendiente').length;
        total.textContent = formatoMoneda.format(
            facturas
                .filter(factura => factura.estado !== 'Anulada')
                .reduce((suma, factura) => suma + factura.total, 0)
        );
    }

    function mostrarFacturas() {
        // Dibuja el historial aplicando los filtros de búsqueda, estado y fecha.
        const cuerpo = document.getElementById('historial-body');
        if (!cuerpo) return;

        const facturas = leerFacturas();
        const busqueda = (document.getElementById('buscar-factura')?.value || '').toLowerCase().trim();
        const estado = document.getElementById('estado-factura')?.value || '';
        const desde = document.getElementById('fecha-factura')?.value || '';
        const sinResultados = document.getElementById('sin-resultados');

        cuerpo.textContent = '';
        const filtradas = facturas.filter(factura => {
            const coincideTexto = `${factura.numero} ${factura.cliente} ${factura.rnc}`
                .toLowerCase().includes(busqueda);
            const coincideEstado = !estado || factura.estado === estado;
            const coincideFecha = !desde || factura.fecha >= desde;
            return coincideTexto && coincideEstado && coincideFecha;
        });

        filtradas.forEach(factura => {
            const fila = document.createElement('tr');
            fila.dataset.estado = factura.estado;
            fila.dataset.id = factura.id;
            fila.innerHTML = `
                <td>${factura.numero}</td>
                <td>${factura.cliente}</td>
                <td>${new Date(`${factura.fecha}T00:00:00`).toLocaleDateString('es-DO')}</td>
                <td>${formatoMoneda.format(factura.total)}</td>
                <td><span class="estado estado-${factura.estado.toLowerCase()}">${factura.estado}</span></td>
                <td>
                    <a href="#" data-accion="ver" title="Ver factura"><i class="fa-regular fa-eye eye"></i></a>
                    <a href="#" data-accion="eliminar" title="Eliminar factura"><i class="fa-regular fa-trash-can falista"></i></a>
                </td>`;
            cuerpo.appendChild(fila);
        });

        if (sinResultados) sinResultados.hidden = filtradas.length !== 0;
        actualizarResumen(facturas);
    }

    const historialBody = document.getElementById('historial-body');
    if (historialBody) {
        // Los eventos se registran solo cuando estamos en la página de facturación.
        mostrarFacturas();

        ['buscar-factura', 'estado-factura', 'fecha-factura'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', mostrarFacturas);
            document.getElementById(id)?.addEventListener('change', mostrarFacturas);
        });

        historialBody.addEventListener('click', function (event) {
            const enlace = event.target.closest('[data-accion]');
            if (!enlace) return;

            event.preventDefault();
            const fila = enlace.closest('tr');
            const id = fila?.dataset.id;
            const factura = leerFacturas().find(item => item.id === id);
            if (!factura) return;

            if (enlace.dataset.accion === 'eliminar') {
                if (confirm(`¿Eliminar la factura ${factura.numero}?`)) {
                    guardarFacturas(leerFacturas().filter(item => item.id !== id));
                    mostrarFacturas();
                }
                return;
            }

            alert(`Factura ${factura.numero}\nCliente: ${factura.cliente}\nTotal: ${formatoMoneda.format(factura.total)}`);
        });
    }

    const botonAgregar = document.getElementById('fact-agregar-item');
    if (!botonAgregar) return;

    const items = [];
    const tipoFactura = document.getElementById('tipo-factura');
    const producto = document.getElementById('fact-producto');
    const productoManual = document.getElementById('fact-producto-manual');
    const cantidad = document.getElementById('fact-cantidad');
    const precio = document.getElementById('fact-precio');
    let ultimaFactura = null;
    const itemsContenedor = document.getElementById('factura-items');
    const interesContenedor = document.getElementById('interes-container');
    const tasaInteres = document.getElementById('tasa-interes');

    function cargarProductos() {
        // El inventario todavía no es obligatorio; si existe un catálogo, se carga aquí.
        let productos = [];
        try {
            productos = JSON.parse(localStorage.getItem('productosAGE')) || [];
        } catch (error) {
            productos = [];
        }

        productos.forEach(item => {
            const nombre = item.nombre || item.name;
            if (!nombre) return;
            const opcion = document.createElement('option');
            opcion.value = nombre;
            opcion.textContent = nombre;
            opcion.dataset.precio = item.precio || item.price || '';
            producto.appendChild(opcion);
        });
    }

    function actualizarTotales() {
        // Una factura vacía mantiene todos sus importes en cero.
        const subtotal = items.reduce((suma, item) => suma + item.total, 0);
        const iva = subtotal * IVA;
        const interes = tipoFactura.value === 'credito' ? subtotal * (Number(tasaInteres.value) || 0) / 100 : 0;

        document.getElementById('fact-subtotal').textContent = formatoMoneda.format(subtotal);
        document.getElementById('fact-iva').textContent = formatoMoneda.format(iva);
        document.getElementById('fact-interes').textContent = formatoMoneda.format(interes);
        document.getElementById('fact-total').textContent = formatoMoneda.format(subtotal + iva + interes);
        interesContenedor.style.display = tipoFactura.value === 'credito' ? 'block' : 'none';
    }

    function mostrarItems() {
        // Muestra los productos agregados o un mensaje cuando aún no hay ninguno.
        itemsContenedor.textContent = '';
        if (!items.length) {
            itemsContenedor.textContent = 'Sin productos aún';
            actualizarTotales();
            return;
        }

        items.forEach((item, indice) => {
            const fila = document.createElement('div');
            fila.className = 'item-factura';
            fila.textContent = `${item.producto} x${item.cantidad} - ${formatoMoneda.format(item.total)}`;

            const eliminar = document.createElement('button');
            eliminar.type = 'button';
            eliminar.textContent = 'Eliminar';
            eliminar.addEventListener('click', function () {
                items.splice(indice, 1);
                mostrarItems();
            });
            fila.appendChild(eliminar);
            itemsContenedor.appendChild(fila);
        });
        actualizarTotales();
    }

    function limpiarFactura() {
        items.length = 0;
        document.getElementById('cliente-nombre').value = '';
        document.getElementById('cliente-rfc').value = '';
        document.getElementById('fact-metodo-pago').value = '';
        cantidad.value = '';
        precio.value = '';
        productoManual.value = '';
        mostrarItems();
        document.querySelector('.factura-preview').textContent = 'La factura aparecerá aquí';
    }

    cargarProductos();
    producto.addEventListener('change', function () {
        if (producto.selectedOptions[0]?.dataset.precio) precio.value = producto.selectedOptions[0].dataset.precio;
    });
    tipoFactura.addEventListener('change', actualizarTotales);
    tasaInteres.addEventListener('input', actualizarTotales);

    botonAgregar.addEventListener('click', function (event) {
        // Los productos son opcionales por ahora, pero los que se agreguen deben ser válidos.
        event.preventDefault();
        const nombreProducto = productoManual.value.trim() || producto.value.trim();
        const cantidadProducto = Number(cantidad.value);
        const precioProducto = Number(precio.value);

        if (!nombreProducto || cantidadProducto < 1 || precioProducto < 0 || !precio.value) {
            alert('Selecciona un producto e indica una cantidad y un precio válidos.');
            return;
        }

        items.push({ producto: nombreProducto, cantidad: cantidadProducto, precio: precioProducto, total: cantidadProducto * precioProducto });
        producto.value = '';
        productoManual.value = '';
        cantidad.value = '';
        precio.value = '';
        mostrarItems();
    });

    document.getElementById('fact-limpiar').addEventListener('click', function (event) {
        event.preventDefault();
        limpiarFactura();
    });

    document.getElementById('fact-generar').addEventListener('click', function (event) {
        event.preventDefault();
        const cliente = document.getElementById('cliente-nombre').value.trim();
        const rnc = document.getElementById('cliente-rfc').value.trim();
        const metodoPago = document.getElementById('fact-metodo-pago').value;

        // Por ahora se permite guardar la factura sin productos del inventario.
        if (!cliente || !rnc || !metodoPago) {
            alert('Completa los datos del cliente y selecciona un método de pago.');
            return;
        }

        const subtotal = items.reduce((suma, item) => suma + item.total, 0);
        const iva = subtotal * IVA;
        const interes = tipoFactura.value === 'credito' ? subtotal * (Number(tasaInteres.value) || 0) / 100 : 0;
        const facturas = leerFacturas();
        const siguienteNumero = facturas.reduce((mayor, factura) => Math.max(mayor, Number(factura.numero.replace('F-', '')) || 0), 0) + 1;
        const factura = {
            id: `FAC-${Date.now()}`,
            numero: `F-${String(siguienteNumero).padStart(4, '0')}`,
            tipo: tipoFactura.value,
            cliente,
            rnc,
            metodoPago,
            fecha: obtenerFechaActual(),
            estado: 'Pendiente',
            diasCredito: Number(document.getElementById('dias-credito').value) || 0,
            tasaInteres: Number(tasaInteres.value) || 0,
            items: [...items],
            subtotal,
            iva,
            interes,
            total: subtotal + iva + interes
        };

        // Conserva la última factura para que pueda descargarse como PDF.
        ultimaFactura = factura;
        guardarFacturas([factura, ...facturas]);
        alert(`Factura ${factura.numero} guardada correctamente.`);
        limpiarFactura();
        document.querySelector('.factura-preview').textContent = `Factura ${factura.numero} creada para ${factura.cliente}. Total: ${formatoMoneda.format(factura.total)}`;
    });

    document.getElementById('fact-imprimir').addEventListener('click', function (event) {
        event.preventDefault();

        // jsPDF crea el archivo directamente sin abrir el diálogo de impresión.
        if (!ultimaFactura) {
            ultimaFactura = leerFacturas()[0] || null;
        }

        if (!ultimaFactura) {
            alert('Primero debes generar una factura.');
            return;
        }

        if (!window.jspdf) {
            alert('No se pudo cargar el generador de PDF. Revisa tu conexión a internet.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const documento = new jsPDF();
        const factura = ultimaFactura;

        documento.setFontSize(20);
        documento.text('FACTURA', 20, 25);
        documento.setFontSize(11);
        documento.text(`Número: ${factura.numero}`, 20, 38);
        documento.text(`Fecha: ${new Date(`${factura.fecha}T00:00:00`).toLocaleDateString('es-DO')}`, 20, 46);
        documento.text(`Cliente: ${factura.cliente}`, 20, 58);
        documento.text(`RNC: ${factura.rnc}`, 20, 66);

        let posicionY = 82;
        documento.setFont('helvetica', 'bold');
        documento.text('Producto', 20, posicionY);
        documento.text('Cantidad', 115, posicionY);
        documento.text('Total', 160, posicionY);
        documento.setFont('helvetica', 'normal');
        posicionY += 10;

        factura.items.forEach(item => {
            documento.text(String(item.producto), 20, posicionY);
            documento.text(String(item.cantidad), 115, posicionY);
            documento.text(formatoMoneda.format(item.total), 160, posicionY);
            posicionY += 8;
        });

        posicionY += 8;
        documento.text(`Subtotal: ${formatoMoneda.format(factura.subtotal)}`, 125, posicionY);
        documento.text(`IVA: ${formatoMoneda.format(factura.iva)}`, 125, posicionY + 8);
        documento.text(`Interés: ${formatoMoneda.format(factura.interes)}`, 125, posicionY + 16);
        documento.setFont('helvetica', 'bold');
        documento.text(`TOTAL: ${formatoMoneda.format(factura.total)}`, 125, posicionY + 28);
        documento.save(`factura-${factura.numero}.pdf`);
    });

    mostrarItems();
});
// --------------------------------------------- FACTURACION ---------------------------------------------------------------------
// Script para el nav
function abri() {
    const toggleBtn = document.getElementById('toggleBtn');
    const iconoBtn = toggleBtn.querySelector('i');
    const navlateral = document.getElementById('navlateral');
    
    toggleBtn.addEventListener('click', () => {
        navlateral.classList.toggle('open');
        
        if (navlateral.classList.contains('open')) {
            iconoBtn.style.color = '#000';
        } else {
            iconoBtn.style.color = '#fff';
        }
    });
} 
function abri2() {
  const toggleBtn = document.getElementById("toggleBtn2");
  const iconoBtn = toggleBtn.querySelector("i");
  const navConfig = document.getElementById("nav-Config");

  toggleBtn.addEventListener("click", () => {
    navConfig.classList.toggle("open");

    if (navConfig.classList.contains("open")) {
      iconoBtn.style.color = "#000";
    } else {
      iconoBtn.style.color = "#000";
    }
  });
} 


/*
A.G.E. - USUARIO

Por ahora se guarda un solo usuario en localStorage y ademas por ahora solo
se guarda el registro pero el inicio de seccion no.
*/


document.addEventListener("DOMContentLoaded", function () {
    // REGISTRO
    // Guarda los datos ingresados en register.html.

    const registro = document.getElementById("register-form");

    if (registro) {

        registro.addEventListener("submit", function (e) {

            e.preventDefault();

            const nombre = document.getElementById("nombre").value.trim();
            const correo = document.getElementById("email").value.trim();
            const password = document.getElementById("pass").value;
            const confirmar = document.getElementById("confirm_pass").value;

            if (password !== confirmar) {
                alert("Las contraseñas no coinciden.");
                return;
            }

            const fecha = new Date();

            const usuario = {
                id: "USR-0001",
                nombre: nombre,
                correo: correo,
                password: password,
                fechaCreacion: fecha.toLocaleDateString(),
                ultimoInicio: fecha.toLocaleString()
            };

            localStorage.setItem("usuarioAGE", JSON.stringify(usuario));

            localStorage.setItem("sesionAGE", "activa");

            window.location.href = "dashboard.html";
        });
    }

// CONFIGURACIÓN DE USUARIO
    // Coloca en configUsuario.html los datos del usuario
    // registrado y permite modificar nombre y correo.

    const campoNombre = document.getElementById("nombre-usuario");
    const campoCorreo = document.getElementById("correo");
    const campoFecha = document.getElementById("fecha-creacion");
    const campoInicio = document.getElementById("ultimo-inicio-sesion");
    const campoId = document.getElementById("id-usuario");

    if (
        campoNombre &&
        campoCorreo &&
        campoFecha &&
        campoInicio &&
        campoId
    ) {

        const usuario = JSON.parse(
            localStorage.getItem("usuarioAGE")
        );

         if (!usuario) {
             window.location.href = "login.html";
             return;
         }

        campoNombre.value = usuario.nombre;
        campoCorreo.value = usuario.correo;
        campoFecha.value = usuario.fechaCreacion;
        campoInicio.value = usuario.ultimoInicio;
        campoId.value = usuario.id;

        const formulario = campoNombre.closest("form");

        formulario.addEventListener("submit", function (e) {

            e.preventDefault();

            usuario.nombre = campoNombre.value.trim();
            usuario.correo = campoCorreo.value.trim();

            localStorage.setItem(
                "usuarioAGE",
                JSON.stringify(usuario)
            );

            alert("Datos actualizados correctamente.");
        });
    }

});

// PERFIL DE EMPRESA
// Se encarga de poner los datos de configPerfildeEmpresa automaticamente en agregarFactura por ahora solo en RNC
// Hasta que el encargado de esa parte modifique los campos asi ya agrego los campos que faltan 
document.addEventListener("DOMContentLoaded", function () {

    const rncPerfil = document.getElementById("rnc");
    const rncFactura = document.getElementById("cliente-rfc");

    const empresa = JSON.parse(localStorage.getItem("empresaAGE")) || {};

    // Perfil de empresa
    if (rncPerfil) {

        rncPerfil.value = empresa.rnc || "";

        rncPerfil.closest("form").addEventListener("submit", function (e) {
            e.preventDefault();

            empresa.rnc = rncPerfil.value.trim();

            localStorage.setItem(
                "empresaAGE",
                JSON.stringify(empresa)
            );

            alert("Datos guardados correctamente.");
        });
    }

    // Agregar factura
    if (rncFactura) {
        rncFactura.value = empresa.rnc || "";
    }

});


// Boton de Leer notificaciones
function marcarTodoLeido() {
    
    document.querySelectorAll('.indicador-izquierdo').forEach(izq => {
        izq.style.backgroundColor = 'transparent';
    });

    
    document.querySelectorAll('.indicador-derecho').forEach(der => {
        der.style.backgroundColor = '#cbd5e1';
    });
}



// Filtro notificaciones 
document.addEventListener('DOMContentLoaded', function () {

	// Esta parte es para buscar el select y sabver las tarjetas de notificacion que hay
    const selectFiltro = document.querySelector('.desplegable-filtro select');
    const notificaciones = document.querySelectorAll('.item-notificacion');


	// si el select ta, eto le agrega un evento para, para cuando se kiera cambiar la opcion
    if (selectFiltro) {
        selectFiltro.addEventListener('change', function () {
            const categoriaSeleccionada = this.value


			// eto recorre todas las notificaciones
            notificaciones.forEach(function (item) {
                const categoriaItem = item.querySelector('.etiqueta-categoria').textContent.toLowerCase().trim();

                // si se elige una categoria vacia no aparecera nd, pero si se elige una categoria con algun item aparecera
                if (categoriaSeleccionada === '' || categoriaItem === categoriaSeleccionada) {
                    item.style.display = 'grid';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }
});


// Busca y muestra los clientes guardados para mantener la tabla sincronizada.
document.addEventListener("DOMContentLoaded", function () {
    const buscadorClientes = document.getElementById("buscador-clientes1");
    const cuerpoTabla = document.getElementById("clientes-body");
    if (!cuerpoTabla) return;

    let clientes = [];
    try {
        const guardados = JSON.parse(localStorage.getItem("clientes")) || [];
        clientes = Array.isArray(guardados) ? guardados : [];
    } catch (error) {
        clientes = [];
    }

    function mostrarClientes() {
        const texto = buscadorClientes?.value.toLowerCase().trim() || "";
        cuerpoTabla.textContent = "";
        clientes.filter(cliente => `${cliente.nombre} ${cliente.telefono} ${cliente.ubicacion}`.toLowerCase().includes(texto))
            .forEach(cliente => {
                const fila = document.createElement("tr");
                [cliente.nombre, cliente.telefono, cliente.ubicacion].forEach(valor => {
                    const celda = document.createElement("th");
                    celda.textContent = valor || "";
                    fila.appendChild(celda);
                });

                const celdaAcciones = document.createElement("th");
                const botonVer = document.createElement("button");
                botonVer.className = "btn-ver";
                const enlaceVer = document.createElement("a");
                enlaceVer.href = `verCliente.html?id=${encodeURIComponent(cliente.id || "")}`;
                const iconoVer = document.createElement("i");
                iconoVer.className = "fa-regular fa-eye eye";
                enlaceVer.appendChild(iconoVer);
                botonVer.appendChild(enlaceVer);
                celdaAcciones.appendChild(botonVer);
                fila.appendChild(celdaAcciones);
                cuerpoTabla.appendChild(fila);
            });
    }

    buscadorClientes?.addEventListener("input", mostrarClientes);
    mostrarClientes();
});

// Anadir empleado 

document.addEventListener("DOMContentLoaded", function () {

    const formularioEmpleado = document.getElementById("form-empleado");

    if (!formularioEmpleado) return;

    formularioEmpleado.addEventListener("submit", function (event) {
        event.preventDefault();

        // Obtener los datos del formulario
        const nombre = document.getElementById("nombre").value.trim();
        const telefono = document.getElementById("telefono").value.trim();
        const correo = document.getElementById("correo").value.trim();
        const identificacion = document.getElementById("Identificacion").value.trim();
        const area = document.getElementById("area").value;
        const horario = document.getElementById("Horario").value;
        const descripcion = document.getElementById("Descripcion-cliente").value.trim();

        // Validar campos principales
        if (nombre === "" || telefono === "" || correo === "") {
            alert("Completa los campos obligatorios");
            return;
        }

        // Obtener empleados guardados
        let empleados = [];
        try {
            const guardados = JSON.parse(localStorage.getItem("empleados")) || [];
            empleados = Array.isArray(guardados) ? guardados : [];
        } catch (error) {
            empleados = [];
        }

        // Crear nuevo empleado
        const nuevoEmpleado = {
            id: `EMP-${Date.now()}`,
            nombre: nombre,
            telefono: telefono,
            correo: correo,
            identificacion: identificacion,
            area: area,
            horario: horario,
            descripcion: descripcion,
            estado: "Activo"
        };

        // Agregar empleado al array
        empleados.push(nuevoEmpleado);

        // Guardar nuevamente
        localStorage.setItem("empleados", JSON.stringify(empleados));

        alert("Empleado agregado correctamente");

        // Ir a la página de empleados
        window.location.href = "empleados.html";
    });

});

// Anadir Clientes
document.addEventListener("DOMContentLoaded", function () {

    const formularioCliente = document.getElementById("form-cliente");

    if (!formularioCliente) return;

    formularioCliente.addEventListener("submit", function (event) {
        event.preventDefault();

        // Obtener los datos del formulario
        const nombre = document.getElementById("nombre").value.trim();
        const telefono = document.getElementById("telefono").value.trim();
        const correo = document.getElementById("correo").value.trim();
        const ubi = document.getElementById("ubi").value.trim();
        const fecharegistro = document.getElementById("fecharegistro").value.trim();


        // Validar campos principales
        if (nombre === "" || telefono === "" || correo === "" || fecharegistro === "") {
            alert("Completa los campos obligatorios");
            return;
        }

        // Obtener clientes guardados
        let clientes = [];
        try {
            const guardados = JSON.parse(localStorage.getItem("clientes")) || [];
            clientes = Array.isArray(guardados) ? guardados : [];
        } catch (error) {
            clientes = [];
        }

        // Crear nuevo cliente
        const nuevoCliente = {
            id: `CLI-${Date.now()}`,
            nombre: nombre,
            telefono: telefono,
            correo: correo,
            ubicacion: ubi,
            fechaRegistro: fecharegistro,
        };

        // Agregar cliente al array
        clientes.push(nuevoCliente);

        // Guardar nuevamente
        localStorage.setItem("clientes", JSON.stringify(clientes));

        alert("Cliente agregado correctamente");

        // Ir a la página de clientes
        window.location.href = "clientes.html";
    });

});

// Muestra la ficha seleccionada y permite eliminar ese cliente de los registros.
document.addEventListener("DOMContentLoaded", function () {
    const botonEliminar = document.getElementById("eliminarclientebtn");
    if (!botonEliminar) return;

    const clienteId = new URLSearchParams(window.location.search).get("id");
    let clientes = [];
    try {
        const guardados = JSON.parse(localStorage.getItem("clientes")) || [];
        clientes = Array.isArray(guardados) ? guardados : [];
    } catch (error) {
        clientes = [];
    }

    const cliente = clientes.find(item => item.id === clienteId);
    if (!cliente) {
        botonEliminar.disabled = true;
        alert("No se encontró el cliente seleccionado.");
        window.location.href = "clientes.html";
        return;
    }

    document.getElementById("nombre").value = cliente.nombre || "";
    document.getElementById("telefono").value = cliente.telefono || "";
    document.getElementById("correo").value = cliente.correo || "";
    document.getElementById("ubi").value = cliente.ubicacion || "";
    document.getElementById("fecharegistro").value = cliente.fechaRegistro || "";
    document.getElementById("Descripcion-cliente").value = cliente.descripcion || "";

    botonEliminar.addEventListener("click", function () {
        if (!confirm(`¿Eliminar al cliente ${cliente.nombre}? Esta acción no se puede deshacer.`)) return;
        localStorage.setItem("clientes", JSON.stringify(clientes.filter(item => item.id !== clienteId)));
        window.location.href = "clientes.html";
    });
});

// El panel de estadísticas se calcula a partir de los mismos registros guardados.
document.addEventListener("DOMContentLoaded", function () {
    const ventas = document.getElementById("estadisticas-ventas-totales");
    const pedidos = document.getElementById("estadisticas-pedidos");
    const clientesNuevos = document.getElementById("estadisticas-clientes-nuevos");
    const clientesTotales = document.getElementById("estadisticas-clientes-totales");
    const clientesActivos = document.getElementById("estadisticas-clientes-activos");
    const clientesPanelNuevos = document.getElementById("estadisticas-panel-clientes-nuevos");
    const clientesInactivos = document.getElementById("estadisticas-clientes-inactivos");
    const rangosTarjetas = [
        document.getElementById("estadisticas-ventas-rango"),
        document.getElementById("estadisticas-ganancias-rango"),
        document.getElementById("estadisticas-pedidos-rango"),
        document.getElementById("estadisticas-clientes-rango")
    ];
    if (!ventas && !pedidos && !clientesNuevos && !clientesTotales) return;

    function leerLista(clave) {
        try {
            const datos = JSON.parse(localStorage.getItem(clave)) || [];
            return Array.isArray(datos) ? datos : [];
        } catch (error) {
            return [];
        }
    }

    function fechaDesdePeriodo(periodo) {
        const hoy = new Date();
        const fechaLocal = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
        if (periodo === "dia") return fechaLocal;
        if (periodo === "semana") {
            const diaSemana = (hoy.getDay() + 6) % 7;
            hoy.setDate(hoy.getDate() - diaSemana);
        } else if (periodo === "mes") {
            hoy.setDate(1);
        } else {
            hoy.setMonth(0, 1);
        }
        return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
    }

    function obtenerRangosMensuales() {
        const hoy = new Date();
        const inicioActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const inicioAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
        const finAnterior = new Date(inicioAnterior.getFullYear(), inicioAnterior.getMonth(), Math.min(hoy.getDate(), ultimoDiaMesAnterior));
        const aFechaISO = fecha => `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
        const formatoFecha = fecha => fecha.toLocaleDateString("es-DO", { day: "numeric", month: "short" });
        const fechaFinalActual = formatoFecha(hoy);
        const fechaFinalAnterior = formatoFecha(finAnterior);
        return {
            actualDesde: aFechaISO(inicioActual),
            actualHasta: aFechaISO(hoy),
            anteriorDesde: aFechaISO(inicioAnterior),
            anteriorHasta: aFechaISO(finAnterior),
            texto: `${fechaFinalAnterior} vs ${fechaFinalActual}`
        };
    }

    function porcentajeCambio(actual, anterior) {
        if (anterior === 0) {
            return { valor: actual === 0 ? "0%" : "Nuevo", estado: actual === 0 ? "igual" : "subio" };
        }

        const porcentaje = Math.round((actual - anterior) / anterior * 1000) / 10;
        return {
            valor: porcentaje > 0 ? `+${porcentaje}%` : `${porcentaje}%`,
            estado: porcentaje > 0 ? "subio" : porcentaje < 0 ? "bajo" : "igual"
        };
    }

    function mostrarCambio(id, cambio) {
        const elemento = document.getElementById(id);
        if (!elemento) return;
        const icono = elemento.querySelector("i");
        const valor = elemento.querySelector("span");
        const iconos = { subio: "fa-arrow-up", bajo: "fa-arrow-down", igual: "fa-minus" };
        elemento.className = `cf estadistica-variacion estadistica-variacion--${cambio.estado}`;
        if (icono) icono.className = `fa-solid ${iconos[cambio.estado]}`;
        if (valor) valor.textContent = cambio.valor;
    }

    function actualizarEstadisticas() {
        const facturas = leerLista("facturasAGE").filter(factura => factura.estado !== "Anulada");
        const clientes = leerLista("clientes");
        const periodo = document.querySelector(".panel-clientes .header-clientes .tiempo")?.value || "mes";
        const fechaInicio = fechaDesdePeriodo(periodo);
        const nuevos = clientes.filter(cliente => cliente.fechaRegistro && cliente.fechaRegistro >= fechaInicio).length;
        const activos = clientes.filter(cliente => cliente.estado !== "Inactivo").length;
        const inactivos = clientes.length - activos;
        const formatoMoneda = new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" });
        const periodoMetodos = document.querySelector(".tarjeta-metodos-pago .header-metodos .tiempo")?.value || "mes";
        const fechaInicioMetodos = fechaDesdePeriodo(periodoMetodos);
        const facturasPorMetodo = facturas.filter(factura => factura.fecha >= fechaInicioMetodos && factura.metodoPago);
        const totalPorMetodo = facturasPorMetodo.reduce((suma, factura) => suma + (Number(factura.total) || 0), 0);
        const rangos = obtenerRangosMensuales();
        const facturasActuales = facturas.filter(factura => factura.fecha >= rangos.actualDesde && factura.fecha <= rangos.actualHasta);
        const facturasAnteriores = facturas.filter(factura => factura.fecha >= rangos.anteriorDesde && factura.fecha <= rangos.anteriorHasta);
        const clientesActuales = clientes.filter(cliente => cliente.fechaRegistro >= rangos.actualDesde && cliente.fechaRegistro <= rangos.actualHasta);
        const clientesAnteriores = clientes.filter(cliente => cliente.fechaRegistro >= rangos.anteriorDesde && cliente.fechaRegistro <= rangos.anteriorHasta);
        const ventasActuales = facturasActuales.reduce((suma, factura) => suma + (Number(factura.total) || 0), 0);
        const ventasAnteriores = facturasAnteriores.reduce((suma, factura) => suma + (Number(factura.total) || 0), 0);

        if (ventas) ventas.textContent = formatoMoneda.format(facturas.reduce((suma, factura) => suma + (Number(factura.total) || 0), 0));
        if (pedidos) pedidos.textContent = String(facturas.length);
        if (clientesNuevos) clientesNuevos.textContent = String(nuevos);
        if (clientesTotales) clientesTotales.textContent = String(clientes.length);
        if (clientesActivos) clientesActivos.textContent = String(activos);
        if (clientesPanelNuevos) clientesPanelNuevos.textContent = String(nuevos);
        if (clientesInactivos) clientesInactivos.textContent = String(inactivos);
        mostrarCambio("estadisticas-ventas-periodo", porcentajeCambio(ventasActuales, ventasAnteriores));
        mostrarCambio("estadisticas-pedidos-periodo", porcentajeCambio(facturasActuales.length, facturasAnteriores.length));
        mostrarCambio("estadisticas-clientes-periodo", porcentajeCambio(clientesActuales.length, clientesAnteriores.length));
        rangosTarjetas.forEach(elemento => {
            if (elemento) elemento.textContent = rangos.texto;
        });

        document.querySelectorAll(".lista-metodos .metodo-fila").forEach(fila => {
            const totalMetodo = facturasPorMetodo
                .filter(factura => factura.metodoPago === fila.dataset.metodo)
                .reduce((suma, factura) => suma + (Number(factura.total) || 0), 0);
            const porcentaje = totalPorMetodo ? Math.round(totalMetodo / totalPorMetodo * 100) : 0;
            const etiqueta = fila.querySelector(".metodo-porcentaje");
            const barra = fila.querySelector(".barra-progreso");
            if (etiqueta) etiqueta.textContent = `${porcentaje}%`;
            if (barra) barra.style.width = `${porcentaje}%`;
        });
    }

    document.querySelector(".panel-clientes .header-clientes .tiempo")?.addEventListener("change", actualizarEstadisticas);
    document.querySelector(".tarjeta-metodos-pago .header-metodos .tiempo")?.addEventListener("change", actualizarEstadisticas);
    window.addEventListener("storage", actualizarEstadisticas);
    actualizarEstadisticas();
});

// --------------------------------------------- INVENTARIO ---------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function () {
    // Referencias de la página y clave donde se guarda el catálogo.
    const PRODUCTOS_KEY = 'productosAGE';
    const formulario = document.getElementById('formAgregarProducto');
    const cuerpoInventario = document.getElementById('inventario-body');
    const busqueda = document.getElementById('buscar-inventario');
    const dialogoProducto = document.getElementById('dialogo-producto');
    const dialogoEliminar = document.getElementById('dialogo-eliminar');
    let productoPendienteEliminar = null;

    // Muestra los detalles del producto en un diálogo en lugar de usar alert().
    function mostrarDetalleProducto(producto) {
        if (!dialogoProducto) return;

        const cantidad = Number(producto.cantidad) || 0;
        const estado = cantidad <= 0 ? 'Agotado' : cantidad <= 10 ? 'Bajo stock' : 'Disponible';
        const formatoMoneda = new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP'
        });

        document.getElementById('detalle-producto-nombre').textContent = producto.nombre || 'Sin nombre';
        document.getElementById('detalle-producto-codigo').textContent = producto.codigo || 'Sin código';
        document.getElementById('detalle-producto-categoria').textContent = producto.categoria || 'Sin categoría';
        document.getElementById('detalle-producto-proveedor').textContent = producto.proveedor || 'Sin proveedor';
        document.getElementById('detalle-producto-precio').textContent = formatoMoneda.format(Number(producto.precio) || 0);
        document.getElementById('detalle-producto-cantidad').textContent = String(cantidad);
        document.getElementById('detalle-producto-descripcion').textContent = producto.descripcion || 'Sin descripción';

        const etiquetaEstado = document.getElementById('detalle-producto-estado');
        etiquetaEstado.className = `dialogo-producto__estado dialogo-producto__estado--${cantidad <= 0 ? 'agotado' : cantidad <= 10 ? 'bajo' : 'disponible'}`;
        etiquetaEstado.textContent = estado;
        dialogoProducto.showModal();
    }

    // Funciones para leer, guardar y asignar códigos a los productos.
    function leerProductos() {
        try {
            const productos = JSON.parse(localStorage.getItem(PRODUCTOS_KEY)) || [];
            return Array.isArray(productos) ? productos : [];
        } catch (error) {
            return [];
        }
    }

    function guardarProductos(productos) {
        localStorage.setItem(PRODUCTOS_KEY, JSON.stringify(productos));
    }

    function siguienteCodigo(productos) {
        const mayor = productos.reduce((maximo, producto) => {
            const numero = Number(String(producto.codigo || '').replace(/\D/g, '')) || 0;
            return Math.max(maximo, numero);
        }, 0);
        return `PRD-${String(mayor + 1).padStart(4, '0')}`;
    }

    // TABLA Y BUSQUEDA: filtra productos, actualiza indicadores y dibuja las filas.
    function mostrarInventario() {
        if (!cuerpoInventario) return;

        const productos = leerProductos();
        const termino = busqueda.value.trim().toLowerCase();
        const filtrados = productos.filter(producto =>
            `${producto.codigo} ${producto.nombre} ${producto.categoria} ${producto.proveedor || ''} ${producto.descripcion || ''}`
                .toLowerCase().includes(termino)
        );
        const formatoMoneda = new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP'
        });
        const agotados = productos.filter(producto => Number(producto.cantidad) <= 0).length;
        const bajoStock = productos.filter(producto => Number(producto.cantidad) > 0 && Number(producto.cantidad) <= 10).length;
        const porcentaje = cantidad => productos.length ? `${((cantidad / productos.length) * 100).toFixed(2)}% del inventario` : '0% del inventario';

        document.getElementById('total-productos').textContent = productos.length;
        document.getElementById('productos-agotados').textContent = agotados;
        document.getElementById('productos-bajo-stock').textContent = bajoStock;
        document.getElementById('porcentaje-disponible').textContent = porcentaje(productos.length - agotados - bajoStock);
        document.getElementById('porcentaje-agotado').textContent = porcentaje(agotados);
        document.getElementById('porcentaje-bajo-stock').textContent = porcentaje(bajoStock);
        document.getElementById('titulo-tabla-productos').textContent = `Productos (${productos.length})`;
        cuerpoInventario.textContent = '';

        if (!filtrados.length) {
            const filaVacia = document.createElement('tr');
            const mensajeVacio = document.createElement('td');
            mensajeVacio.className = 'inventario-vacio';
            mensajeVacio.colSpan = 8;
            mensajeVacio.textContent = termino ? 'No se encontraron productos.' : 'No hay productos en el inventario.';
            filaVacia.appendChild(mensajeVacio);
            cuerpoInventario.appendChild(filaVacia);
            return;
        }

        filtrados.forEach(producto => {
            const cantidad = Number(producto.cantidad) || 0;
            const estado = cantidad <= 0 ? 'Agotado' : cantidad <= 10 ? 'Bajo stock' : 'Disponible';
            const fila = document.createElement('tr');
            const valores = [
                producto.codigo,
                producto.nombre,
                producto.categoria,
                String(cantidad),
                formatoMoneda.format(Number(producto.precio) || 0),
                producto.proveedor || 'Sin proveedor',
                estado
            ];

            valores.forEach((valor, indice) => {
                const celda = document.createElement('td');
                celda.textContent = valor || '';
                if (indice === 3) celda.className = cantidad <= 0 ? 'stock-agotado' : cantidad <= 10 ? 'stock-bajo' : 'stock-disponible';
                if (indice === 6) {
                    const etiqueta = document.createElement('div');
                    etiqueta.className = cantidad <= 0 ? 'agotado' : cantidad <= 10 ? 'bajo-stock' : 'disponible';
                    etiqueta.textContent = estado;
                    celda.textContent = '';
                    celda.appendChild(etiqueta);
                }
                fila.appendChild(celda);
            });

            const acciones = document.createElement('td');
            acciones.innerHTML = `<div class="acciones">
                <button type="button" class="btn-accion btn-verr" data-accion="ver" aria-label="Ver producto"><i class="fa-regular fa-eye"></i></button>
                <button type="button" class="btn-accion btn-editar" data-accion="editar" aria-label="Editar producto"><i class="fa-regular fa-pen-to-square"></i></button>
                <button type="button" class="btn-accion btn-eliminar" data-accion="eliminar" aria-label="Eliminar producto"><i class="fa-regular fa-trash-can"></i></button>
            </div>`;
            fila.dataset.id = producto.id;
            fila.appendChild(acciones);
            cuerpoInventario.appendChild(fila);
        });
    }

    // FORMULARIO DE PRODUCTOS: carga los datos al editar y guarda altas o cambios.
    if (formulario) {
        const parametros = new URLSearchParams(window.location.search);
        const idEdicion = parametros.get('editar');
        const productos = leerProductos();
        const productoEdicion = productos.find(producto => producto.id === idEdicion);

        if (productoEdicion) {
            ['nombre', 'descripcion', 'categoria', 'proveedor', 'precio', 'cantidad'].forEach(campo => {
                formulario.elements[campo].value = productoEdicion[campo] ?? '';
            });
            formulario.querySelector('button[type="submit"]').textContent = 'Guardar cambios';
            document.querySelector('.tit').textContent = 'Editar Producto';
        }

        formulario.addEventListener('submit', function (event) {
            event.preventDefault();
            const datos = new FormData(formulario);
            const producto = {
                id: productoEdicion?.id || `PRD-${Date.now()}`,
                codigo: productoEdicion?.codigo || siguienteCodigo(productos),
                nombre: datos.get('nombre').trim(),
                descripcion: datos.get('descripcion').trim(),
                categoria: datos.get('categoria').trim(),
                precio: Number(datos.get('precio')),
                cantidad: Number(datos.get('cantidad')),
                proveedor: datos.get('proveedor').trim()
            };

            const nuevosProductos = productoEdicion
                ? productos.map(item => item.id === productoEdicion.id ? producto : item)
                : [...productos, producto];
            guardarProductos(nuevosProductos);
            window.location.href = 'inventario.html';
        });
    }

    // ACCIONES DE LA TABLA: ver detalles, editar o eliminar un producto.
    if (cuerpoInventario) {
        mostrarInventario();
        busqueda.addEventListener('input', mostrarInventario);

        cuerpoInventario.addEventListener('click', function (event) {
            const boton = event.target.closest('[data-accion]');
            if (!boton) return;

            const fila = boton.closest('tr');
            const producto = leerProductos().find(item => item.id === fila.dataset.id);
            if (!producto) return;

            if (boton.dataset.accion === 'editar') {
                window.location.href = `agregarProducto.html?editar=${encodeURIComponent(producto.id)}`;
            } else if (boton.dataset.accion === 'eliminar') {
                // Solicita confirmación en el diálogo antes de borrar el producto.
                productoPendienteEliminar = producto;
                document.getElementById('nombre-producto-eliminar').textContent = producto.nombre || 'este producto';
                dialogoEliminar?.showModal();
            } else if (boton.dataset.accion === 'ver') {
                mostrarDetalleProducto(producto);
            }
        });

        dialogoProducto?.querySelectorAll('[data-cerrar-detalle]').forEach(boton => {
            boton.addEventListener('click', () => dialogoProducto.close());
        });

        dialogoProducto?.addEventListener('click', function (event) {
            if (event.target === dialogoProducto) dialogoProducto.close();
        });

        dialogoProducto?.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                event.preventDefault();
                dialogoProducto.close();
            }
        });

        dialogoEliminar?.querySelectorAll('[data-cancelar-eliminar]').forEach(boton => {
            boton.addEventListener('click', () => dialogoEliminar.close());
        });

        dialogoEliminar?.querySelector('[data-confirmar-eliminar]')?.addEventListener('click', function () {
            if (!productoPendienteEliminar) return;

            const idProducto = productoPendienteEliminar.id;
            guardarProductos(leerProductos().filter(item => item.id !== idProducto));
            productoPendienteEliminar = null;
            dialogoEliminar.close();
            mostrarInventario();
        });

        dialogoEliminar?.addEventListener('click', function (event) {
            if (event.target === dialogoEliminar) dialogoEliminar.close();
        });

        dialogoEliminar?.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                event.preventDefault();
                dialogoEliminar.close();
            }
        });

        dialogoEliminar?.addEventListener('close', function () {
            productoPendienteEliminar = null;
        });

        // EXPORTAR INVENTARIO: descarga el catálogo actual como archivo JSON.
        document.querySelector('.btn-exportar').addEventListener('click', function (event) {
            event.preventDefault();
            const archivo = new Blob([JSON.stringify(leerProductos(), null, 2)], { type: 'application/json' });
            const enlace = document.createElement('a');
            enlace.href = URL.createObjectURL(archivo);
            enlace.download = 'inventario-age.json';
            enlace.click();
            URL.revokeObjectURL(enlace.href);
        });

        // IMPORTAR INVENTARIO: valida un archivo JSON y combina sus productos con el catálogo.
        document.getElementById('archivo-custom').addEventListener('change', function () {
            const archivo = this.files[0];
            if (!archivo) return;

            const lector = new FileReader();
            lector.onload = () => {
                try {
                    const importados = JSON.parse(lector.result);
                    if (!Array.isArray(importados) || importados.some(item =>
                        !item || typeof item.nombre !== 'string' || typeof item.categoria !== 'string' ||
                        !Number.isFinite(Number(item.precio)) || !Number.isFinite(Number(item.cantidad))
                    )) {
                        throw new Error('Formato no válido');
                    }

                    if (!confirm(`Se importarán ${importados.length} productos. Los códigos existentes se actualizarán. ¿Continuar?`)) return;
                    const actuales = leerProductos();
                    importados.forEach(item => {
                        const producto = {
                            ...item,
                            id: item.id || `PRD-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                            codigo: item.codigo || siguienteCodigo(actuales),
                            precio: Number(item.precio),
                            cantidad: Number(item.cantidad)
                        };
                        const indice = actuales.findIndex(actual => actual.codigo === producto.codigo);
                        if (indice >= 0) actuales[indice] = producto;
                        else actuales.push(producto);
                    });
                    guardarProductos(actuales);
                    mostrarInventario();
                    alert('Inventario importado correctamente.');
                } catch (error) {
                    alert('No se pudo importar el archivo. Usa un JSON exportado desde el inventario.');
                } finally {
                    this.value = '';
                }
            };
            lector.readAsText(archivo);
        });
    }
});