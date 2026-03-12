// api.js: funciones auxiliares para interactuar con la API REST
// en este examen solamente nos interesa POST /api/pedidos, pero se pueden
// agregar más helpers aquí en el futuro.

const API_URL = 'http://localhost:3000/api';

async function apiGet(path) {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`GET ${path} falló: ${res.status}`);
  return res.json();
}

async function apiPost(path, data) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    let errorBody = null;
    try {
      errorBody = await res.json();
    } catch {
      errorBody = await res.text();
    }
    const errorDetails = typeof errorBody === 'string' ? errorBody : JSON.stringify(errorBody);
    const err = new Error(`POST ${path} falló: ${res.status} ${errorDetails}`);
    err.responseBody = errorBody;
    throw err;
  }
  return res.json();
}

// otros métodos (PUT, DELETE) se pueden añadir si se necesitan

async function apiPut(path, data) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PUT ${path} falló: ${res.status} ${text}`);
  }
  return res.json();
}

async function apiDelete(path) {
  const res = await fetch(`${API_URL}${path}`, { method: 'DELETE' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DELETE ${path} falló: ${res.status} ${text}`);
  }
  return res.json();
}

