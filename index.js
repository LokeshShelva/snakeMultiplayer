const express = require("express");
const port = process.env.PORT || 3000
const app = express()

app.use(express.json())
app.use(express.static("public"))

const server = app.listen(port, () => console.log("Listening on port " + port))
let {
    Server
} = require('socket.io')
let io = new Server(server)
let users = {}

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/game', (req, res) => {
    res.sendFile(__dirname + '/public/game/game.html')
})

io.on('connection', (client) => {
    console.log(`user connected ${client.id}`)
   
    // add user to the room after connection
    client.on('enter room', ({roomId, username}) => {
        // add user to local user manager object
        if (users[roomId]) {
            users[roomId].push({id: client.id, username})
        } else {
            users[roomId] = [{id: client.id, username}]
        }

        // join the user's room
        client.join(roomId);
        
        // send all users in the room to the new user
        client.emit('prev users', {users: users[roomId]})
        
        // broadcast the new user to all users in the room
        client.to(roomId).emit('new user', {
            id: client.id,
            username
        })

        client.on('start', () => {
            io.to(roomId).emit('start')
        })
        
        // event to broadcast the game data 
        client.on('pos', (data) => {
            client.to(roomId).emit('pos', data)
        })

        client.on('death', ({id}) => {
            client.to(roomId).emit('death', {id})
        })
        
        // remove user after they discoonnect
        client.on('disconnect', () => {
            client.leave(roomId)
            console.log(`User disconneted ${client.id}`)
            Object.keys(users).forEach(room => {
                users[room] = users[room].filter(user => user.id !== client.id)
            })
            
            for(let room in users){
                if(users[room].length == 0){
                    delete users[room]
                }
            }
        })
    })
})