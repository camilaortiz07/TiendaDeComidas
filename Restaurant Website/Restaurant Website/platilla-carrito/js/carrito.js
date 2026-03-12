// carrito.js: lógica para manejar el carrito en localStorage

function obtenerCarrito() {
  return JSON.parse(localStorage.getItem('carrito')) || [];
}

function guardarCarrito(carrito) {
  localStorage.setItem('carrito', JSON.stringify(carrito));
}

function actualizarContador() {
  const contador = document.querySelector('.contar-pro');
  if (!contador) return;
  const carrito = obtenerCarrito();
  const total = carrito.reduce((acc, p) => acc + p.cantidad, 0);
  contador.textContent = total;
}

function agregarAlCarrito(producto) {
  const carrito = obtenerCarrito();
  const existente = carrito.find(p => p.id === producto.id);
  if (existente) {
    existente.cantidad += 1;
  } else {
    carrito.push({ ...producto, cantidad: 1 });
  }
  guardarCarrito(carrito);
  actualizarContador();
  // notificación sencilla
  alert(`${producto.nombre} agregado al carrito`);
}

function eliminarDelCarrito(id) {
  let carrito = obtenerCarrito();
  carrito = carrito.filter(p => p.id !== id);
  guardarCarrito(carrito);
  actualizarContador();
  return carrito;
}

function actualizarCantidad(id, cantidad) {
  const carrito = obtenerCarrito();
  const item = carrito.find(p => p.id === id);
  if (item) {
    item.cantidad = cantidad;
    if (item.cantidad < 1) item.cantidad = 1;
    guardarCarrito(carrito);
    actualizarContador();
  }
}

function calcularTotales() {
  const carrito = obtenerCarrito();
  const subtotal = carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
  const domicilio = subtotal * 0.1; // 10% por ejemplo
  const descuento = 0; // implementación futura
  const total = subtotal + domicilio - descuento;
  return { subtotal, domicilio, descuento, total };
}

// inicializar contador al cargar cualquier página
document.addEventListener('DOMContentLoaded', () => {
  actualizarContador();
  // todos los íconos de carrito navegan a la página cart.html
  document.querySelectorAll('.carrito').forEach(el => {
    el.addEventListener('click', () => { window.location.href = 'cart.html'; });
  });
});
