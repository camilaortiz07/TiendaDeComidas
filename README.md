# 🍔 Food Store Dashboard - Sistema de Gestión Integral

Panel administrativo diseñado para optimizar el inventario y las ventas de una tienda de comida. Permite un control total sobre el stock, los usuarios del sistema y la base de datos de clientes a través de una interfaz intuitiva.

## 🚀 Características principales

* **Gestión de Inventario (CRUD):** Control total sobre productos en stock (crear, leer, actualizar y eliminar).
* **Administración de Usuarios:** Control de acceso y perfiles para el personal de la tienda.
* **Módulo de Clientes:** Registro y seguimiento de la base de datos de clientes.
* **Dashboard Visual:** Resumen estadístico de la operación en tiempo real.
* **Arquitectura Robusta:** Comunicación cliente-servidor basada en peticiones HTTP.

## 🛠️ Tecnologías utilizadas

* **Backend:** Node.js / Express
* **Base de Datos:** MySQL (Gestionada con XAMPP)
* **Frontend:** HTML5, CSS3, JavaScript
* **Servidor Local:** Apache (XAMPP)

---

## ⚙️ Instalación y Configuración

Sigue estos pasos para correr el proyecto localmente:

### 1. Requisitos previos
* Tener instalado [XAMPP](https://www.apachefriends.org/).
* Tener instalado [Node.js](https://nodejs.org/).

### 2. Configuración de la Base de Datos
1. Abre el Panel de Control de **XAMPP** e inicia **Apache** y **MySQL**.
2. Accede a `http://localhost/phpmyadmin`.
3. Crea una nueva base de datos llamada `tienda_db`.
4. *(Opcional)* Importa el archivo `schema.sql` (si está incluido) para crear las tablas automáticamente.

### 3. Configuración del Proyecto
Clona este repositorio y navega a la carpeta raíz:

```bash
git clone https://github.com/camilaortiz07/TiendaDeComidas.git
