// dashboard.js: ejemplo de integración JSON con backend para el módulo productos

document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('table.align-middle')) {
    cargarProductos();
  }
});

async function cargarProductos() {
  try {
    const productos = await apiGet('/productos');
    console.log('productos recibidos', productos);
    const tbody = document.querySelector('table.align-middle tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    productos.forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.id}</td>
        <td>${p.nombre}</td>
        <td>${p.descripcion}</td>
        <td>${p.precio.toFixed ? p.precio.toFixed(2) : p.precio}</td>
        <td>${p.stock}</td>
        <td><img src="${p.imagen}" width="50"/></td>
        <td>
          <a href="crear-pro.html?id=${p.id}" class="btn btn-sm btn-primary">Editar</a>
          <button class="btn btn-sm btn-danger btn-eliminar" data-id="${p.id}">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-eliminar').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('¿Eliminar producto?')) return;
        const id = btn.dataset.id;
        try {
          await apiDelete(`/productos/${id}`);
          cargarProductos();
        } catch (err) {
          console.error(err);
          alert('Error eliminando producto');
        }
      });
    });
  } catch (err) {
    console.error('No se pudieron cargar los productos', err);
  }
}
