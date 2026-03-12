// clientes.js: manejar listado y creación/edición de clientes en el panel administrativo

// helper para leer parámetros de querystring
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('tabla-clientes')) {
    cargarClientes();
  }
  if (document.getElementById('formulario-cliente')) {
    initFormCliente();
  }
});

async function cargarClientes() {
  try {
    const clientes = await apiGet('/clientes');
    const tbody = document.getElementById('tabla-clientes');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!clientes || clientes.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="7" class="text-center">No hay clientes en la base de datos</td>';
      tbody.appendChild(row);
      return;
    }
    clientes.forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${c.id_cliente}</td>
        <td>${c.nombre}</td>
        <td>${c.apellido}</td>
        <td>${c.email}</td>
        <td>${c.celular || ''}</td>
        <td>${c.direccion || ''}</td>
        <td>
          <a href="crear-cliente.html?id=${c.id_cliente}" class="btn btn-sm btn-primary">Editar</a>
          <button class="btn btn-sm btn-danger btn-eliminar" data-id="${c.id_cliente}">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-eliminar').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('¿Eliminar cliente?')) return;
        const id = btn.dataset.id;
        try {
          await apiDelete(`/clientes/${id}`);
          cargarClientes();
        } catch (err) {
          console.error(err);
          alert('Error eliminando cliente');
        }
      });
    });
  } catch (err) {
    console.error('Error cargando clientes', err);
    alert('No se pudieron cargar clientes: ' + err.message);
  }
}

async function initFormCliente() {
  const form = document.getElementById('formulario-cliente');
  const submitBtn = form.querySelector('button[type=submit]');
  const id = getQueryParam('id');

  if (id) {
    try {
      const c = await apiGet(`/clientes/${id}`);
      document.getElementById('nombre-cli').value = c.nombre || '';
      document.getElementById('apellido-cli').value = c.apellido || '';
      document.getElementById('email-cli').value = c.email || '';
      document.getElementById('celular-cli').value = c.celular || '';
      document.getElementById('direccion-cli').value = c.direccion || '';
      document.getElementById('direccion2-cli').value = c.direccion2 || '';
      document.getElementById('descripcion-cli').value = c.descripcion || '';
      submitBtn.textContent = 'Actualizar Cliente';
      const heading = document.querySelector('h1.h3');
      if (heading) heading.textContent = 'Editar Cliente';
    } catch (err) {
      console.error('No se pudo cargar cliente', err);
      alert('No se pudo cargar cliente para edición');
    }
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const cliente = {
      nombre: document.getElementById('nombre-cli').value,
      apellido: document.getElementById('apellido-cli').value,
      email: document.getElementById('email-cli').value,
      celular: document.getElementById('celular-cli').value,
      direccion: document.getElementById('direccion-cli').value,
      direccion2: document.getElementById('direccion2-cli').value,
      descripcion: document.getElementById('descripcion-cli').value,
    };
    try {
      if (id) {
        await apiPut(`/clientes/${id}`, cliente);
        alert('Cliente actualizado');
      } else {
        await apiPost('/clientes', cliente);
        alert('Cliente creado');
      }
      window.location.href = 'listado-clientes.html';
    } catch (err) {
      console.error(err);
      alert('Error al guardar cliente: ' + err.message);
    }
  });
}