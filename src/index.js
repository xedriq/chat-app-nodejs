// core module
const path = require('path')
const http = require('http')

// npm package
const express = require('express')

const app = express()
const server = http.createServer(app)

// Define path for Express config
const publicPath = path.join(__dirname, '../public')

// Setup express to use static public directory to serve
app.use(express.static(publicPath))

const port = process.env.PORT || 3000

server.listen(port, () => {
    console.log(`Server is running on port ${port}...`)
})
