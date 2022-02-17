const express = require('express')
const aplicacion = express()
const bodyParser = require('body-parser')
const session = require('express-session')
const flash = require('express-flash')

const rutasMiddleware = require('./routes/middleware')
const rutasPublics = require('./routes/publics')
const rutasPrivates = require('./routes/privates')

aplicacion.use(bodyParser.json())
aplicacion.use(bodyParser.urlencoded({ extended: true }))
aplicacion.set("view engine", "ejs")
aplicacion.use(session({ secret: 'token-muy-secreto', resave: true, saveUninitialized: true }));
aplicacion.use(flash())
aplicacion.use(express.static('public'))

aplicacion.use(rutasMiddleware)
aplicacion.use(rutasPublics)
aplicacion.use(rutasPrivates)

aplicacion.listen(8080, () => {
  console.log("Servidor iniciado")
})
