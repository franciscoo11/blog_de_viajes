function obtenerAutorSegunCredenciales(connection,email,contrasena){
    email = email.toLowerCase().trim()   
    const consulta = `
            SELECT
            *
            FROM autores
            WHERE
            email = ${connection.escape(email)} AND 
            contrasena = ${connection.escape(contrasena)}
    `
    
    let idAutor = 0
    let error = false
    
    connection.query(consulta, function)

    return idAutor, error
}

exports.obtenerAutorSegunCredenciales = obtenerAutorSegunCredenciales;