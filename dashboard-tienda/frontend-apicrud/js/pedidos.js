// pedidos.js: manejar listado y creación de pedidos en el panel administrativo

const MENU_ESTADOS = ['pendiente','procesando','completado','cancelado'];

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('tabla-pedidos')) {
    cargarPedidos();
  }
  if (document.getElementById('formulario-pedido')) {
    initCrearPedido();
  }
});

async function cargarPedidos() {
  console.log('cargarPedidos called');
  try {
    const pedidos = await apiGet('/pedidos');
    console.log('pedidos recibidos', pedidos);
    const tbody = document.getElementById('tabla-pedidos');
    tbody.innerHTML = '';
    if (!pedidos || pedidos.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="7" class="text-center">No hay pedidos en la base de datos</td>';
      tbody.appendChild(row);
      return;
    }
    pedidos.forEach(p => {
      const tr = document.createElement('tr');
      // asegurarse de que total sea número
      let totalVal = 0;
      if (p.total !== undefined && p.total !== null) {
        totalVal = typeof p.total === 'number' ? p.total : parseFloat(p.total) || 0;
      }
      tr.innerHTML = `
        <td>${p.id}</td>
        <td>${p.nombre} ${p.apellido}</td>
        <td>${p.email}</td>
        <td>${p.fecha || ''}</td>
        <td>${totalVal.toFixed(2)}</td>
        <td>
          <select class="estado-select form-control form-control-sm" data-id="${p.id}">
            ${MENU_ESTADOS.map(e => `<option value="${e}" ${p.estado===e?'selected':''}>${e}</option>`).join('')}
          </select>
        </td>
        <td><button class="btn btn-sm btn-danger btn-eliminar" data-id="${p.id}">Eliminar</button></td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.estado-select').forEach(sel => {
      sel.addEventListener('change', async () => {
        const id = sel.dataset.id;
        const estado = sel.value;
        try {
          await fetch(`${API_URL}/pedidos/${id}/estado`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado })
          });
          alert('Estado actualizado');
        } catch (err) {
          console.error(err);
          alert('Error al actualizar el estado');
        }
      });
    });

    tbody.querySelectorAll('.btn-eliminar').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Eliminar pedido?')) return;
        const id = btn.dataset.id;
        try {
          await apiDelete(`/pedidos/${id}`);
          btn.closest('tr').remove();
        } catch (err) {
          console.error(err);
          alert('Error al eliminar pedido');
        }
      });
    });
  } catch (err) {
    console.error('Error cargando pedidos', err);
    alert('No se pudieron cargar pedidos: '+err.message);
  }
}

async function initCrearPedido() {
  const selectCliente = document.getElementById('id_cliente');
  const selectMetodo = document.getElementById('metodo_pago');
  const tabla = document.getElementById('tabla-carrito').querySelector('tbody');
  const descuentoInput = document.getElementById('descuento');
  const aumentoInput = document.getElementById('aumento');
  const totalSpan = document.getElementById('total-pedido');

  let productos = [];

  // cargar clientes y productos
  try {
    const clientes = await apiGet('/clientes');
    clientes.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id_cliente;
      opt.textContent = `${c.nombre} ${c.apellido}`;
      selectCliente.appendChild(opt);
    });
    productos = await apiGet('/productos');
  } catch (err) {
    console.error('Error inicializando pedido', err);
  }

  function recalcularTotal() {
    let total = 0;
    tabla.querySelectorAll('tr').forEach(r => {
      const precio = parseFloat(r.querySelector('.prod-precio').textContent) || 0;
      const cant = parseInt(r.querySelector('.prod-cant').value) || 1;
      total += precio * cant;
    });
    const desc = parseFloat(descuentoInput.value) || 0;
    const aum = parseFloat(aumentoInput.value) || 0;
    total = total - desc + aum;
    totalSpan.textContent = `$${total.toFixed(2)}`;
  }

  // agregar producto
  const btnAdd = document.createElement('button');
  btnAdd.type = 'button';
  btnAdd.className = 'btn btn-sm btn-secondary ms-2';
  btnAdd.textContent = 'Agregar producto';
  const heading = document.querySelector('h5');
  if (heading) heading.appendChild(btnAdd);

  btnAdd.addEventListener('click', () => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <select class="form-control prod-select">
          <option value="">-- seleccionar --</option>
          ${productos.map(p => `<option value="${p.id}" data-precio="${p.precio}">${p.nombre}</option>`).join('')}
        </select>
      </td>
      <td class="prod-precio">0</td>
      <td><input type="number" min="1" value="1" class="form-control prod-cant" style="width:80px;"></td>
      <td class="prod-subtotal">0</td>
      <td><button type="button" class="btn btn-sm btn-danger btn-remove">✕</button></td>
    `;
    tabla.appendChild(tr);

    const selectProd = tr.querySelector('.prod-select');
    const cantInput = tr.querySelector('.prod-cant');
    const precioCell = tr.querySelector('.prod-precio');
    const subtotalCell = tr.querySelector('.prod-subtotal');

    function actualizarLinea() {
      const precio = parseFloat(selectProd.selectedOptions[0]?.dataset.precio) || 0;
      const cant = parseInt(cantInput.value) || 1;
      precioCell.textContent = precio.toFixed(2);
      subtotalCell.textContent = (precio * cant).toFixed(2);
      recalcularTotal();
    }

    selectProd.addEventListener('change', actualizarLinea);
    cantInput.addEventListener('input', actualizarLinea);
    tr.querySelector('.btn-remove').addEventListener('click', () => {
      tr.remove(); recalcularTotal();
    });
  });

  descuentoInput.addEventListener('input', recalcularTotal);
  aumentoInput.addEventListener('input', recalcularTotal);

  // envío del formulario
  const form = document.getElementById('formulario-pedido');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const id_cliente = selectCliente.value;
    const metodo_pago = selectMetodo.value;
    const descuento = parseFloat(descuentoInput.value) || 0;
    const aumento = parseFloat(aumentoInput.value) || 0;
    const items = [];
    tabla.querySelectorAll('tr').forEach(r => {
      const prodId = parseInt(r.querySelector('.prod-select').value, 10);
      const cantidad = parseInt(r.querySelector('.prod-cant').value, 10) || 1;
      const precio = parseFloat(r.querySelector('.prod-precio').textContent) || 0;
      const nombre = r.querySelector('.prod-select').selectedOptions?.[0]?.textContent || '';
      if (Number.isFinite(prodId) && prodId > 0) {
        items.push({ id_producto: prodId, nombre, cantidad, precio });
      }
    });
    if (!id_cliente || !metodo_pago || items.length===0) {
      alert('Complete cliente, método y al menos un producto');
      return;
    }
    const pedido = { id_cliente, metodo_pago, descuento, aumento, productos: items };
    console.log('Creando pedido (payload):', pedido);
    try {
      const data = await apiPost('/pedidos', pedido);
      alert('Pedido creado con id ' + (data.id||data.insertId));
      window.location.href='listado-pedidos.html';
    } catch(err) {
      console.error('Error creando pedido', err);
      alert('Error al crear pedido: '+err.message);
    }
  });
}
