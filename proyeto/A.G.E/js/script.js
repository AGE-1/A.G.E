
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
    const formatoMoneda = new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'USD'
    });

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

        // Por ahora se permite guardar la factura sin productos del inventario.
        if (!cliente || !rnc) {
            alert('Completa los datos del cliente.');
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

        guardarFacturas([factura, ...facturas]);
        alert(`Factura ${factura.numero} guardada correctamente.`);
        limpiarFactura();
        document.querySelector('.factura-preview').textContent = `Factura ${factura.numero} creada para ${factura.cliente}. Total: ${formatoMoneda.format(factura.total)}`;
    });

    document.getElementById('fact-imprimir').addEventListener('click', function (event) {
        event.preventDefault();
        window.print();
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
