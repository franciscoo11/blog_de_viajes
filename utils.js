function obtenerAutorSegunCredenciales(connection,email,contrasena,){
    email = email.toLowerCase().trim()   
    const consulta = `
            SELECT
            *
            FROM autores
            WHERE
            email = ${connection.escape(email)} AND 
            contrasena = ${connection.escape(contrasena)}
    `
    connection.query(consulta, (error,filas,campos) => {
        if (error){
            return 0, true
        }
        if (filas.length == 0){
            return 0, false
        }
        return filas[0].id, false
    })

}

exports.obtenerAutorSegunCredenciales = obtenerAutorSegunCredenciales();