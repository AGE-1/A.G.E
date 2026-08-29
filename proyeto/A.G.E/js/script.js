
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
