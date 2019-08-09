// core module
const path = require('path')
const http = require('http')

// npm package
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')

// my utils
const { generateMessage, generatedLocationMessage } = require('../utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('../utils/users')

// Instantiantions
const app = express()
const server = http.createServer(app)
const io = socketio(server)

// Define path for Express config
const publicPath = path.join(__dirname, '../public')

// Setup express to use static public directory to serve
app.use(express.static(publicPath))

io.on('connection', (socket) => {
    console.log('New websocket connection..')

    // Listen for username and room login
    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room })

        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        // Welcome message when a client join
        socket.emit('message', generateMessage('Admin', `Welcome to ${user.room} room, ${user.username}`))

        // Alert message to connected clients when a new client join a room
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} joined the room`))

        // Update client list
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    // Receive message from clients
    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)

        const filter = new Filter()

        // Checks for profanity and filter them out
        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed!')
        }

        // Send message to the clients
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })

    // Receieve a location from clients
    socket.on('sendLocation', ({ lat, long }, callback) => {
        const user = getUser(socket.id)

        // Send the location to clients
        io.to(user.room).emit('locationMessage', generatedLocationMessage(user.username, `https://google.com/maps?q=${lat},${long}`))
        callback()
    })

    // Alert message to connected client when a client leaves
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage(user.username, `${user.username} has left the room.`))

            // Update client list
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

const port = process.env.PORT || 3000

server.listen(port, () => {
    console.log(`Server is running on port ${port}...`)
})
