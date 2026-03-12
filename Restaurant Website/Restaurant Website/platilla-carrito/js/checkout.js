// checkout.js: manejar la página checkout.html

document.addEventListener('DOMContentLoaded', () => {
  cargarCarritoEnCheckout();
  cargarDatosCliente();
  // recalcular si cambia método de pago
  document.querySelectorAll('[name="metodo-pago"]').forEach(radio => {
    radio.addEventListener('change', () => {
      actualizarTotalCheckout();
    });
  });

  // logo regresa al inicio
  document.querySelectorAll('#logo, #logo2').forEach(el => {
    el.addEventListener('click', (e) => { e.preventDefault(); window.location.href='index.html'; });
  });

  const form = document.getElementById('form-checkout');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nombres = document.getElementById('nombres-checkout').value.trim();
      const apellidos = document.getElementById('apellidos-checkout').value.trim();
      const email = document.getElementById('email-checkout').value.trim();
      const celular = document.getElementById('celular-checkout').value.trim();
      const direccion = document.getElementById('direccion-checkout').value.trim();
      const notas = document.getElementById('notas-checkout').value.trim();
      const metodoPago = document.querySelector('[name="metodo-pago"]:checked').value;

      if (!nombres || !apellidos || !email || !celular || !direccion) {
        alert('Por favor complete todos los campos requeridos');
        return;
      }

      const carrito = obtenerCarrito();
      console.log('Carrito antes de enviar pedido:', carrito);
      if (carrito.length === 0) {
        alert('El carrito está vacío');
        return;
      }

      // primero conseguir o crear cliente en BD
      const clienteData = {
        nombre: document.getElementById('nombres-checkout').value.trim(),
        apellido: document.getElementById('apellidos-checkout').value.trim(),
        email: document.getElementById('email-checkout').value.trim(),
        celular: document.getElementById('celular-checkout').value.trim(),
        direccion: document.getElementById('direccion-checkout').value.trim(),
      };
      guardarDatosCliente(clienteData);

      let idCliente;
      try {
        idCliente = await obtenerOCrearCliente(clienteData);
      } catch (err) {
        console.error('Error con cliente', err);
        const errMsg = (err && err.message && err.message.includes('Failed to fetch'))
          ? 'No se pudo conectar al servidor. Asegúrate de que el backend esté corriendo en http://localhost:3000 y de abrir esta página desde un servidor local (http://), no desde file://.'
          : err.message;
        alert('No se pudo registrar cliente: ' + errMsg);
        return;
      }

      let totals = calcularTotales();
      // aplicar recargo por método contra-entrega (+5%)
      if (metodoPago === 'contra-entrega') {
        totals.total = totals.total * 1.05;
      }

      const pedido = {
        id_cliente: idCliente,
        metodo_pago: metodoPago,
        estado: 'pendiente',
        total: totals.total,
        notas: notas,
        productos: carrito
          .map(p => {
            const id = Number(p.id);
            const producto = {
              nombre: p.nombre,
              imagen: p.imagen,
              precio: p.precio,
              cantidad: p.cantidad,
            };
            if (Number.isFinite(id) && id > 0) {
              producto.id_producto = id;
            }
            return producto;
          })
          .filter(p => p.nombre && p.cantidad > 0)
      };
      // note: el backend espera precio para insertar detalle_pedido, se calcula allí mismo.

      try {
        console.log('Enviando pedido:', JSON.stringify(pedido));
        const data = await apiPost('/pedidos', pedido);
        // guardar número de pedido proporcionado por el backend
        const numeroServidor = data.id || data.insertId;
        if (numeroServidor) {
          localStorage.setItem('numeroPedido', `#PED-${numeroServidor}`);
        }
        localStorage.removeItem('carrito');
        window.location.href = 'thankyou.html';
      } catch (err) {
        console.error('Error enviando pedido', err);
        const backendDebug = err?.responseBody;
        if (backendDebug) {
          console.error('Debug backend:', backendDebug);
        }
        const errMsg = (err && err.message && err.message.includes('Failed to fetch'))
          ? 'No se pudo conectar al servidor. Asegúrate de que el backend esté corriendo en http://localhost:3000 y de abrir esta página desde un servidor local (http://), no desde file://.'
          : err.message;
        const alertMsg = backendDebug ? `${errMsg}\n\nDebug: ${JSON.stringify(backendDebug, null, 2)}` : errMsg;
        alert('Error al procesar el pedido: ' + alertMsg);
      }
    });
  }
});

function cargarCarritoEnCheckout() {
  const carrito = obtenerCarrito();
  const detalle = document.getElementById('detalle-productos-checkout');
  const totalSpan = document.getElementById('total-checkout');
  if (!detalle || !totalSpan) return;
  detalle.innerHTML = '';
  const totals = calcularTotales();
  carrito.forEach(item => {
    const div = document.createElement('div');
    div.classList.add('d-flex', 'justify-content-between', 'mb-16');
    div.innerHTML = `<span>${item.nombre} x${item.cantidad}</span><span>$${(item.precio * item.cantidad).toFixed(2)}</span>`;
    detalle.appendChild(div);
  });
  totalSpan.textContent = `$${totals.total.toFixed(2)}`;
  // aplicar recargo inicial si es contra-entrega
  actualizarTotalCheckout();
}

// helper: crea o devuelve cliente por email
async function obtenerOCrearCliente(datos) {
  try {
    const res = await apiPost('/clientes', datos);
    return res.id || res.insertId;
  } catch (err) {
    if (err.message.includes('409')) {
      // email duplicado, buscarlo
      const lista = await apiGet('/clientes');
      const c = lista.find(x => x.email === datos.email);
      return c ? c.id_cliente : null;
    }
    throw err;
  }
}

// guarda datos de cliente en localStorage para precargar luego
function guardarDatosCliente(datos) {
  localStorage.setItem('clienteDatos', JSON.stringify(datos));
}

function cargarDatosCliente() {
  const str = localStorage.getItem('clienteDatos');
  if (!str) return;
  try {
    const datos = JSON.parse(str);
    document.getElementById('nombres-checkout').value = datos.nombre || '';
    document.getElementById('apellidos-checkout').value = datos.apellido || '';
    document.getElementById('email-checkout').value = datos.email || '';
    document.getElementById('celular-checkout').value = datos.celular || '';
    document.getElementById('direccion-checkout').value = datos.direccion || '';
  } catch (e) {
    console.warn('No se pudieron cargar datos de cliente', e);
  }
}

// actualiza el campo total tomando en cuenta el método de pago
function actualizarTotalCheckout() {
  const totals = calcularTotales();
  const metodoPago = document.querySelector('[name="metodo-pago"]:checked').value;
  let total = totals.total;
  if (metodoPago === 'contra-entrega') {
    total = total * 1.05;
  }
  const totalSpan = document.getElementById('total-checkout');
  if (totalSpan) totalSpan.textContent = `$${total.toFixed(2)}`;
}
