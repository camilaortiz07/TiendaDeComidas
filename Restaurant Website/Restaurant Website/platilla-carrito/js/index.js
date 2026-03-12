// index.js: eventos específicos de la página principal

document.addEventListener('DOMContentLoaded', () => {
  // cada botón "añadir al carrito" debe leer los datos del producto
  document.querySelectorAll('.btn-product').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.card.producto');
      if (!card) return;
      const id = card.dataset.id;
      const nombre = card.dataset.name;
      const precio = parseFloat(card.dataset.price);
      const imagen = card.dataset.image;
      agregarAlCarrito({ id, nombre, precio, imagen });
    });
  });

  // icono del carrito navega a cart.html
  const carritoIcon = document.querySelector('.carrito');
  if (carritoIcon) {
    carritoIcon.addEventListener('click', () => {
      window.location.href = 'cart.html';
    });
  }
});
