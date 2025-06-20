//Consultas
// 1. **Expresiones Regulares**
//     - Buscar bandas cuyo nombre **empiece por la letra “A”**.
db.bandas.find({nombre:{$regex: "^A"}})

//     - Buscar asistentes cuyo **nombre contenga "Gómez"**.
db.asistentes.find({nombre:{$regex: "Gómez"}})

// 2. **Operadores de Arreglos**
//     - Buscar asistentes que tengan `"Rock"` dentro de su campo `generos_favoritos`.
db.asistentes.find({generos_favoritos: "Rock"})

// 3. **Aggregation Framework**
//     - Agrupar presentaciones por `escenario` y contar cuántas presentaciones hay por cada uno.
db.presentaciones.aggregate([
  {
    $group: {
      _id: "$escenario",
      totalPresentaciones: { $sum: 1 }
    }
  }
])
//     - Calcular el **promedio de duración** de las presentaciones.
db.presentaciones.aggregate([
  { $group: { _id: null, promedio_duracion: { $avg: "$duracion_minutos" } } }
]);


// ### Funciones en system.js**
// 1. Crear una función llamada `escenariosPorCiudad(ciudad)` que devuelva todos los escenarios en esa ciudad.
db.system.js.insertOne({
    _id: "escenariosPorCiudad",
    value: new Code("function(ciudad){return db.escenarios.find({ciudad: ciudad});}")
});

const f1 = db.system.js.findOne({ _id: "escenariosPorCiudad" });
const escenariosPorCiudad = new Function('return ' + f1.value.code)();
escenariosPorCiudad("Cali");

// 2. Crear una función llamada `bandasPorGenero(genero)` que devuelva todas las bandas activas de ese género.
db.system.js.insertOne({
  _id: "bandasPorGenero",
  value: new Code("function(genero) { return db.bandas.find({ genero: genero, activa: true }); }")
});

const f2 = db.system.js.findOne({ _id: "bandasPorGenero" });
const bandasPorGenero = new Function('return ' + f1.value.code)();
bandasPorGenero("Rock");

// ### **Transacciones (requiere replica set)**
// 1. Simular compra de un boleto:
//     - Insertar nuevo boleto en `boletos_comprados` de un asistente.
const session = db.getMongo().startSession();
const dbSession = session.getDatabase("festival_conciertos");
session.startTransaction();

try{
    dbSession.asistentes.updateOne(
        { nombre : "Juan Pérez" },
        { $push: { boletos_comprados: { escenario: "Escenario Principal", dia: "2025-06-25" } } })

        session.commitTransaction();
    } catch (error) {
    session.abortTransaction();
    print("Error al comprar el boleto:", error);
} finally {
    session.endSession();
}
//     - Disminuir en 1 la capacidad del escenario correspondiente.
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
// 2. Reversar la compra:
//     - Eliminar el boleto insertado anteriormente.
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

//     - Incrementar la capacidad del escenario.
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

// ### **Índices + Consultas**
// 1. Crear un índice en `bandas.nombre` y buscar una banda específica por nombre.
db.bandas.createIndex({ nombre: 1 });
db.bandas.getIndexes()
[
  { v: 2, key: { _id: 1 }, name: '_id_' },
  { v: 2, key: { nombre: 1 }, name: 'nombre_1' }
]

// 2. Crear un índice en `presentaciones.escenario` y hacer una consulta para contar presentaciones de un escenario.
db.presentaciones.createIndex({ escenario: 1 });
db.presentaciones.getIndexes()
[
  { v: 2, key: { _id: 1 }, name: '_id_' },
  { v: 2, key: { escenario: 1 }, name: 'escenario_1' }
]
db.presentaciones.countDocuments({ escenario: "Tarima Caribe" });
2

// 3. Crear un índice compuesto en `asistentes.ciudad` y `edad`, luego consultar asistentes de Bogotá menores de 30.
db.asistentes.createIndex({ ciudad: 1, edad: 1 });
db.asistentes.getIndexes()
[
  { v: 2, key: { _id: 1 }, name: '_id_' },
  { v: 2, key: { ciudad: 1, edad: 1 }, name: 'ciudad_1_edad_1' }
]
db.asistentes.find({ ciudad: "Bogotá", edad: { $lt: 30 } });

