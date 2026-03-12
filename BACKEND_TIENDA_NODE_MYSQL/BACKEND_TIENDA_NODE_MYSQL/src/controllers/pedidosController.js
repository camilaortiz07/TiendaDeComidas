const { getPool } = require("../database/connection")
const { handleError } = require("../utils/errorHandler")

// Obtener todos los pedidos o uno por ID
const getPedidos = async (req, res) => {
  try {
    const { id } = req.params
    const pool = getPool()
    const connection = await pool.getConnection()

    if (id) {
      // Obtener pedido con información del cliente
      const [pedidos] = await connection.query(
        `SELECT p.*, c.nombre, c.apellido, c.email 
        FROM pedido p 
        INNER JOIN clientes c ON p.id_cliente = c.id_cliente 
        WHERE p.id = ?`,
        [id],
      )

      if (pedidos.length > 0) {
        const pedido = pedidos[0]

        // Obtener detalles del pedido
        const [detalles] = await connection.query(
          `SELECT dp.*, pr.nombre as producto_nombre 
          FROM detalle_pedido dp 
          INNER JOIN productos pr ON dp.id_producto = pr.id 
          WHERE dp.id_pedido = ?`,
          [id],
        )

        pedido.detalles = detalles
        res.json(pedido)
      } else {
        res.status(404).json({ message: "Pedido no encontrado" })
      }
    } else {
      const [rows] = await connection.query(
        `SELECT p.*, c.nombre, c.apellido, c.email 
        FROM pedido p 
        INNER JOIN clientes c ON p.id_cliente = c.id_cliente 
        ORDER BY p.id DESC`,
      )
      res.json(rows)
    }

    connection.release()
  } catch (error) {
    handleError(res, error, "Error al obtener pedidos")
  }
}

// Crear pedido
const createPedido = async (req, res) => {
  try {
    const { id_cliente, descuento, metodo_pago, aumento, productos } = req.body

    if (!id_cliente || !metodo_pago || !productos || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ message: "Cliente, método de pago y productos son requeridos" })
    }

    const debugProductos = productos.map(p => ({ id_producto: p?.id_producto, nombre: p?.nombre }))

    console.log('Creating pedido:', { id_cliente, metodo_pago, productos: debugProductos })

    const pool = getPool()
    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      // Crear el pedido
      const [pedidoResult] = await connection.query(
        "INSERT INTO pedido (id_cliente, descuento, metodo_pago, aumento) VALUES (?, ?, ?, ?)",
        [id_cliente, descuento || 0, metodo_pago, aumento || 0],
      )
      const pedidoId = pedidoResult.insertId

      // Debug: log payload
      console.log('Creating pedido:', { id_cliente, metodo_pago, productos })

      // Agregar productos al detalle del pedido
      for (const producto of productos) {
        // Asegurar que el producto exista en la base de datos.
        // Si no existe por id, buscamos por nombre y si sigue sin existir, lo creamos.
        let idProducto = producto.id_producto ?? null
        if (idProducto !== null) {
          idProducto = Number(idProducto)
          if (!Number.isFinite(idProducto) || idProducto <= 0) {
            console.warn('id_producto no numérico o inválido, se ignorará:', producto.id_producto)
            idProducto = null
          }
        }

        // Tratar de usar el ID si viene y es válido
        if (idProducto) {
          const [rowsById] = await connection.query("SELECT id FROM productos WHERE id = ?", [idProducto])
          if (rowsById.length === 0) {
            console.warn('Producto con id no encontrado, se buscará por nombre:', idProducto)
            idProducto = null
          }
        }

        // Si no se encontró por ID, buscar por nombre
        if (!idProducto && producto.nombre) {
          const [rowsByName] = await connection.query("SELECT id FROM productos WHERE nombre = ?", [producto.nombre])
          if (rowsByName.length > 0) {
            console.warn('Producto encontrado por nombre:', producto.nombre, '-> id', rowsByName[0].id)
            idProducto = rowsByName[0].id
          }
        }

        // Si todavía no existe, crearlo
        if (!idProducto) {
          console.warn('No se encontró producto, se creará uno nuevo para:', producto)
          const [insertResult] = await connection.query(
            "INSERT INTO productos (nombre, descripcion, precio, stock, imagen) VALUES (?, ?, ?, ?, ?)",
            [
              producto.nombre || 'Producto sin nombre',
              producto.descripcion || '',
              producto.precio || 0,
              producto.cantidad || 0,
              producto.imagen || '',
            ],
          )
          idProducto = insertResult.insertId
        }

        if (!idProducto) {
          throw new Error('No se pudo determinar el ID del producto para detalle_pedido')
        }

        console.log('Detalle pedido: producto enviado', producto, '-> id_producto usado', idProducto)

        await connection.query(
          "INSERT INTO detalle_pedido (id_pedido, id_producto, precio, cantidad) VALUES (?, ?, ?, ?)",
          [pedidoId, idProducto, producto.precio, producto.cantidad],
        )

        // Actualizar stock
        await connection.query("UPDATE productos SET stock = stock - ? WHERE id = ?", [
          producto.cantidad,
          idProducto,
        ])
      }

      await connection.commit()

      res.status(201).json({
        message: "Pedido creado con éxito",
        id: pedidoId,
      })
    } catch (error) {
      await connection.rollback()

      // Enviar siempre debug en caso de fallos para facilitar la depuración desde el frontend.
      console.error('Error creando pedido:', error.message, 'Payload:', debugProductos)
      return res.status(500).json({
        message: `Error al crear pedido: ${error.message}`,
        debug: {
          productos: debugProductos,
          error: error.message
        }
      })
    } finally {
      connection.release()
    }
  } catch (error) {
    handleError(res, error, "Error al crear pedido")
  }
}


// Actualizar pedido
const updatePedido = async (req, res) => {
  try {
    const { id } = req.params
    const { id_cliente, descuento, metodo_pago, aumento } = req.body

    const pool = getPool()
    const connection = await pool.getConnection()
    const [result] = await connection.query(
      "UPDATE pedido SET id_cliente = ?, descuento = ?, metodo_pago = ?, aumento = ? WHERE id = ?",
      [id_cliente, descuento, metodo_pago, aumento, id],
    )
    connection.release()

    if (result.affectedRows > 0) {
      res.json({ message: "Pedido actualizado con éxito" })
    } else {
      res.status(404).json({ message: "Pedido no encontrado" })
    }
  } catch (error) {
    handleError(res, error, "Error al actualizar pedido")
  }
}

// Actualizar estado del pedido (PATCH)
const updateEstadoPedido = async (req, res) => {
  try {
    const { id } = req.params
    const { estado } = req.body

    const estadosValidos = ["pendiente", "procesando", "completado", "cancelado"]
    
    if (!estado || !estadosValidos.includes(estado)) {
      return res.status(400).json({ 
        message: "Estado inválido. Debe ser: pendiente, procesando, completado o cancelado" 
      })
    }

    const pool = getPool()
    const connection = await pool.getConnection()
    const [result] = await connection.query(
      "UPDATE pedido SET estado = ? WHERE id = ?",
      [estado, id],
    )
    connection.release()

    if (result.affectedRows > 0) {
      res.json({ message: "Estado del pedido actualizado con éxito", estado })
    } else {
      res.status(404).json({ message: "Pedido no encontrado" })
    }
  } catch (error) {
    handleError(res, error, "Error al actualizar estado del pedido")
  }
}

// Eliminar pedido
const deletePedido = async (req, res) => {
  try {
    const { id } = req.params

    const pool = getPool()
    const connection = await pool.getConnection()
    const [result] = await connection.query("DELETE FROM pedido WHERE id = ?", [id])
    connection.release()

    if (result.affectedRows > 0) {
      res.json({ message: "Pedido eliminado con éxito" })
    } else {
      res.status(404).json({ message: "Pedido no encontrado" })
    }
  } catch (error) {
    handleError(res, error, "Error al eliminar pedido")
  }
}

module.exports = {
  getPedidos,
  createPedido,
  updatePedido,
  updateEstadoPedido,
  deletePedido,
}
