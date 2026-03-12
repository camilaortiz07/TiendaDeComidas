// usuarios.js: manejar listado y creación/edición de usuarios en el panel administrativo

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('tabla-usuarios')) {
    cargarUsuarios();
  }
  if (document.getElementById('formulario-usuario')) {
    initFormUsuario();
  }
});

async function cargarUsuarios() {
  try {
    const usuarios = await apiGet('/usuarios');
    const tbody = document.getElementById('tabla-usuarios');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!usuarios || usuarios.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="5" class="text-center">No hay usuarios en la base de datos</td>';
      tbody.appendChild(row);
      return;
    }
    usuarios.forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${u.id}</td>
        <td>${u.usuario}</td>
        <td>${u.rol}</td>
        <td>${u.created_at || ''}</td>
        <td>
          <a href="crear-usuario.html?id=${u.id}" class="btn btn-sm btn-primary">Editar</a>
          <button class="btn btn-sm btn-danger btn-eliminar" data-id="${u.id}">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('.btn-eliminar').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('¿Eliminar usuario?')) return;
        const id = btn.dataset.id;
        try {
          await apiDelete(`/usuarios/${id}`);
          cargarUsuarios();
        } catch (err) {
          console.error(err);
          alert('Error eliminando usuario');
        }
      });
    });
  } catch (err) {
    console.error('Error cargando usuarios', err);
    alert('No se pudieron cargar usuarios: ' + err.message);
  }
}

async function initFormUsuario() {
  const form = document.getElementById('formulario-usuario');
  const submitBtn = form.querySelector('button[type=submit]');
  const id = getQueryParam('id');

  if (id) {
    try {
      const u = await apiGet(`/usuarios/${id}`);
      document.getElementById('rol').value = u.rol || '';
      document.getElementById('usuario').value = u.usuario || '';
      submitBtn.textContent = 'Actualizar Usuario';
      const heading = document.querySelector('h1.h3');
      if (heading) heading.textContent = 'Editar Usuario';
    } catch (err) {
      console.error('No se pudo cargar usuario', err);
      alert('No se pudo cargar usuario para edición');
    }
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const rol = document.getElementById('rol').value;
    const usuario = document.getElementById('usuario').value;
    const contrasena = document.getElementById('contrasena').value;
    const confirmar = document.getElementById('confirmar_contrasena').value;
    if (contrasena || confirmar) {
      if (contrasena !== confirmar) {
        alert('Las contraseñas no coinciden');
        return;
      }
    }
    const payload = { rol, usuario };
    if (contrasena) payload.contrasena = contrasena;
    try {
      if (id) {
        await apiPut(`/usuarios/${id}`, payload);
        alert('Usuario actualizado');
      } else {
        if (!contrasena) {
          alert('La contraseña es obligatoria para un nuevo usuario');
          return;
        }
        await apiPost('/usuarios', payload);
        alert('Usuario creado');
      }
      window.location.href = 'listado-usuarios.html';
    } catch (err) {
      console.error(err);
      alert('Error al guardar usuario: ' + err.message);
    }
  });
}