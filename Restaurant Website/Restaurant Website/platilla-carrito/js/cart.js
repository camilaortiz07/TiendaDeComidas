// cart.js: lógica de la página cart.html

function cargarCarrito() {
  const carrito = obtenerCarrito();
  const tbody = document.getElementById('carrito-items');
  if (!tbody) return;
  tbody.innerHTML = '';

  carrito.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="product-block">
        <button class="remove-btn" data-product-id="${item.id}">✕</button>
        <img src="${item.imagen}" alt="">
        <span>${item.nombre}</span>
      </td>
      <td>$${item.precio.toFixed(2)}</td>
      <td>
        <input type="number" value="${item.cantidad}" min="1" class="cantidad-carrito" data-product-id="${item.id}">
      </td>
      <td class="subtotal-producto" data-product-id="${item.id}">$${(item.precio * item.cantidad).toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });

  // agregar eventos después de renderizar
  tbody.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.productId;
      eliminarDelCarrito(id);
      cargarCarrito();
    });
  });

  tbody.querySelectorAll('.cantidad-carrito').forEach(input => {
    input.addEventListener('change', () => {
      let cant = parseInt(input.value);
      if (isNaN(cant) || cant < 1) cant = 1;
      const id = input.dataset.productId;
      actualizarCantidad(id, cant);
      cargarCarrito();
    });
  });

  actualizarResumen();
}

function actualizarResumen() {
  const { subtotal, domicilio, descuento, total } = calcularTotales();
  const subEl = document.getElementById('subtotal-resumen');
  const domEl = document.getElementById('domicilio-resumen');
  const descEl = document.getElementById('descuento-resumen');
  const totEl = document.getElementById('total-resumen');
  if (subEl) subEl.textContent = `$${subtotal.toFixed(2)}`;
  if (domEl) domEl.textContent = `$${domicilio.toFixed(2)}`;
  if (descEl) descEl.textContent = `-$${descuento.toFixed(2)}`;
  if (totEl) totEl.textContent = `$${total.toFixed(2)}`;
}

// iniciar al cargar la página

document.addEventListener('DOMContentLoaded', cargarCarrito);
