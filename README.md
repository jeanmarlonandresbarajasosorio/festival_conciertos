# 🎶 Festival de Conciertos en Colombia

Este proyecto modela y gestiona una base de datos NoSQL en MongoDB para un festival de conciertos realizado en varias ciudades del país. Se utilizan colecciones relacionadas (`bandas`, `escenarios`, `presentaciones`, `asistentes`) junto con consultas avanzadas, funciones, transacciones e índices para simular operaciones reales del sistema.

---

## 👨‍💻 Integrantes

- jean marlon barajas

---

## 📁 Archivos del Repositorio

- `consultas.js` → Contiene todas las consultas, funciones, transacciones e índices requeridos.
- `README.md` → Este archivo con explicaciones, responsables y evidencias.

---

## 📌 Estructura de la base de datos: `festival_conciertos`

### Colecciones:

- `bandas`: bandas participantes, su género, país, miembros y estado (activa/inactiva).
- `escenarios`: escenarios del evento con ubicación, capacidad y ciudad.
- `presentaciones`: fechas, horarios y duración de shows de las bandas.
- `asistentes`: personas registradas y sus boletos comprados.

---

## 🔍 Consultas realizadas

### 1. Expresiones Regulares

- **Bandas que comienzan por "A":**
```js
db.bandas.find({nombre:{$regex: "^A"}})
/// Resultado de la consulta
[
  {
    _id: ObjectId('6852f2346889b872a1ed7c9e'),
    nombre: 'Aterciopelados',
    genero: 'Rock',
    pais_origen: 'Colombia',
    miembros: [ 'Andrea Echeverri', 'Héctor Buitrago' ],
    activa: true
  }
]
```
- **Buscar asistentes cuyo nombre contenga "Gómez"**.
```js
db.asistentes.find({nombre:{$regex: "Gómez"}})
/// Resultado de la consulta
[
  {
    _id: ObjectId('6852f2996889b872a1ed7cac'),
    nombre: 'María Gómez',
    edad: 34,
    ciudad: 'Bogotá',
    generos_favoritos: [ 'Electro Tropical' ],
    boletos_comprados: [ { escenario: 'Escenario Alterno', dia: '2025-06-19' } ]
  }
]
```
### 2. **Operadores de Arreglos**
- **Buscar asistentes que tengan `"Rock"` dentro de su campo `generos_favoritos`.** 
```js
db.asistentes.find({generos_favoritos: "Rock"})
/// Resultado de la consulta
[
  {
    _id: ObjectId('6852f2996889b872a1ed7cab'),
    nombre: 'Juan Pérez',
    edad: 27,
    ciudad: 'Medellín',
    generos_favoritos: [ 'Rock', 'Indie' ],
    boletos_comprados: [
      { escenario: 'Escenario Principal', dia: '2025-06-18' },
      { escenario: 'Escenario Principal', dia: '2025-06-22' }
    ]
  },
  {
    _id: ObjectId('6852f2996889b872a1ed7cae'),
    nombre: 'Luisa Quintero',
    edad: 29,
    ciudad: 'Barranquilla',
    generos_favoritos: [ 'Pop Fusión', 'Rock' ],
    boletos_comprados: [ { escenario: 'Escenario Principal', dia: '2025-06-22' } ]
  }
]
```

### 3. **Aggregation Framework**
- **Agrupar presentaciones por `escenario` y contar cuántas presentaciones hay por cada uno.**
```js
db.presentaciones.aggregate([
  {
    $group: {
      _id: "$escenario",
      totalPresentaciones: { $sum: 1 }
    }
  }
])
/// Resultado de la consulta
[
  { _id: 'Escenario Alterno', totalPresentaciones: 1 },
  { _id: 'Tarima Caribe', totalPresentaciones: 2 },
  { _id: 'Escenario Principal', totalPresentaciones: 2 }
]

```

- **Calcular el **promedio de duración** de las presentaciones.**
```js
db.presentaciones.aggregate([
  { $group: { _id: null, promedio_duracion: { $avg: "$duracion_minutos" } } }
]);
/// Resultado de la consulta
[ { _id: null, promedio_duracion: 80 } ]
```
---

## **🔍 Funciones en system.js**
---
**1. Crear una función llamada `escenariosPorCiudad(ciudad)` que devuelva todos los escenarios en esa ciudad.**
```js
db.system.js.insertOne({
    _id: "escenariosPorCiudad",
    value: new Code("function(ciudad){return db.escenarios.find({ciudad: ciudad});}")
});

const f1 = db.system.js.findOne({ _id: "escenariosPorCiudad" });
const escenariosPorCiudad = new Function('return ' + f1.value.code)();
escenariosPorCiudad("Cali");
/// Resultado de la consulta
[
  {
    _id: ObjectId('685320481eaabe630bed7ca4'),
    nombre: 'Escenario Alterno',
    ubicacion: 'Cancha Panamericana',
    capacidad: 2500,
    ciudad: 'Cali'
  }
]
```
**2. Crear una función llamada `bandasPorGenero(genero)` que devuelva todas las bandas activas de ese género.**
```js
db.system.js.insertOne({
  _id: "bandasPorGenero",
  value: new Code("function(genero) { return db.bandas.find({ genero: genero, activa: true }); }")
});

const f2 = db.system.js.findOne({ _id: "bandasPorGenero" });
const bandasPorGenero = new Function('return ' + f1.value.code)();
bandasPorGenero("Rock");
/// Resultado de la consulta
[
  {
    _id: ObjectId('685320441eaabe630bed7c9e'),
    nombre: 'Aterciopelados',
    genero: 'Rock',
    pais_origen: 'Colombia',
    miembros: [ 'Andrea Echeverri', 'Héctor Buitrago' ],
    activa: true
  }
]
```
## **🔍 Transacciones (requiere replica set)**

**1. Simular compra de un boleto:**
- **Insertar nuevo boleto en `boletos_comprados` de un asistente.**
```js
const session = db.getMongo().startSession();
const dbSession = session.getDatabase("festival_conciertos");
session.startTransaction();

try{
    dbSession.asistentes.updateOne(
        { nombre : "Juan Pérez" },
        { $push: { boletos_comprados: { escenario: "Escenario Principal", dia: new Date() } } })

        session.commitTransaction();
    } catch (error) {
    session.abortTransaction();
    print("Error al comprar el boleto:", error);
} finally {
    session.endSession();
}
/// Resultado de la consulta
{
  "_id": {
    "$oid": "6852f2996889b872a1ed7cab"
  },
  "nombre": "Juan Pérez",
  "edad": 27,
  "ciudad": "Medellín",
  "generos_favoritos": [
    "Rock",
    "Indie"
  ],
  "boletos_comprados": [
    {
      "escenario": "Escenario Principal",
      "dia": "2025-06-18"
    },
    {
      "escenario": "Escenario Principal",
      "dia": "2025-06-22"
    },
    {
      "escenario": "Escenario Principal",
      "dia": "2025-06-25"
    }
  ]
}
```
- **Disminuir en 1 la capacidad del escenario correspondiente.**
```js 
const session2 = db.getMongo().startSession();
const dbSession2 = session2.getDatabase("festival_conciertos");
session2.startTransaction();

try {
    dbSession2.escenarios.updateOne(
        { nombre: "Escenario Principal" },
        { $inc: { capacidad: -1 } }
    );
    session2.commitTransaction();

} catch (error) {
    session2.abortTransaction();
    print("Error al disminuir la capacidad del escenario:", error);
}
finally {
    session2.endSession();
}
/// Resultado de la consulta
{
  "_id": {
    "$oid": "6852f2646889b872a1ed7ca3"
  },
  "nombre": "Escenario Principal",
  "ubicacion": "Parque Simón Bolívar",
  "capacidad": 4999,
  "ciudad": "Bogotá"
}
```
**2. Reversar la compra:**
- **Eliminar el boleto insertado anteriormente.**
```js
const session3 = db.getMongo().startSession();
const dbSession3 = session3.getDatabase("festival_conciertos");
session3.startTransaction();
try {
    dbSession3.asistentes.updateOne(
        {nombre:"Juan Pérez"},
        {$pull: {boletos_comprados: {escenario: "Escenario Principal", dia: "2025-06-25"}}}
    );
    session3.commitTransaction();
} catch (error) {
    session3.abortTransaction();
    print("Error al eliminar el boleto:", error);
}
finally {
    session3.endSession();
}
/// Resultado de la consulta
{
  "_id": {
    "$oid": "6852f2996889b872a1ed7cab"
  },
  "nombre": "Juan Pérez",
  "edad": 27,
  "ciudad": "Medellín",
  "generos_favoritos": [
    "Rock",
    "Indie"
  ],
  "boletos_comprados": [
    {
      "escenario": "Escenario Principal",
      "dia": "2025-06-18"
    },
    {
      "escenario": "Escenario Principal",
      "dia": "2025-06-22"
    }
  ]
}
```
- **Incrementar la capacidad del escenario.**
```js
const session4 = db.getMongo().startSession();
const dbSession4 = session4.getDatabase("festival_conciertos");
session4.startTransaction();

try {
    dbSession4.escenarios.updateOne(
        { nombre: "Escenario Alterno" },
        { $inc: { capacidad: 105 } }
    );
    session4.commitTransaction();

} catch (error) {
    session4.abortTransaction();
    print("Error al aumentar la capacidad del escenario:", error);
}
finally {
    session4.endSession();
}
/// Resultado de la consulta
{
  "_id": {
    "$oid": "6852f2646889b872a1ed7ca4"
  },
  "nombre": "Escenario Alterno",
  "ubicacion": "Cancha Panamericana",
  "capacidad": 2605, // su valor anterior era 2500
  "ciudad": "Cali"
}
```

## **🔍 Índices + Consultas**

**1. Crear un índice en `bandas.nombre` y buscar una banda específica por nombre.**
```js
db.bandas.createIndex({ nombre: 1 });
///Se muestran los indices
db.bandas.getIndexes()
[
  { v: 2, key: { _id: 1 }, name: '_id_' },
  { v: 2, key: { nombre: 1 }, name: 'nombre_1' }
]
/// Resultado de la consulta
[
  {
    _id: ObjectId('6852f2346889b872a1ed7c9e'),
    nombre: 'Aterciopelados',
    genero: 'Rock',
    pais_origen: 'Colombia',
    miembros: [ 'Andrea Echeverri', 'Héctor Buitrago' ],
    activa: true
  }
]
```
**2. Crear un índice en `presentaciones.escenario` y hacer una consulta para contar presentaciones de un escenario.**
```js
db.presentaciones.createIndex({ escenario: 1 });
///Se muestran los indices
db.presentaciones.getIndexes()
[
  { v: 2, key: { _id: 1 }, name: '_id_' },
  { v: 2, key: { escenario: 1 }, name: 'escenario_1' }
]
/// Resultado de la consulta
db.presentaciones.countDocuments({ escenario: "Tarima Caribe" });
2
```
**3. Crear un índice compuesto en `asistentes.ciudad` y `edad`, luego consultar asistentes de Bogotá menores de 30.**
```js
db.asistentes.createIndex({ ciudad: 1, edad: 1 });
///Se muestran los indices
db.asistentes.getIndexes()
[
  { v: 2, key: { _id: 1 }, name: '_id_' },
  { v: 2, key: { ciudad: 1, edad: 1 }, name: 'ciudad_1_edad_1' }
]
/// Resultado de la consulta
db.asistentes.find({ ciudad: "Bogotá", edad: { $lt: 30 } });
```

---


## ✅ Estado del Proyecto

| Funcionalidad                            | Estado  |
|-----------------------------------------|---------|
| Consultas con expresiones regulares     | ✅ Hecho |
| Consultas con operadores de arreglos    | ✅ Hecho |
| Agregaciones (`$group`, `$avg`)         | ✅ Hecho |
| Funciones almacenadas (`system.js`)     | ✅ Hecho |
| Transacciones (simulación compra/rollback) | ✅ Hecho |
| Creación y uso de índices               | ✅ Hecho |
| Documentación en `README.md`            | ✅ Hecho |

---

## 📝 Comentarios Finales

- Este proyecto permite simular con fidelidad una gestión de eventos musicales a nivel nacional usando MongoDB.
- Las funciones almacenadas permiten modularizar y reutilizar lógica de consulta.
- El uso de índices mejora significativamente el rendimiento en búsquedas frecuentes.

---

### 🎉 ¡Gracias por revisar esta actividad!  
