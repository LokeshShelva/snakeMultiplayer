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
// require('./socket')(io)

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/game', (req, res) => {
    res.sendFile(__dirname + '/public/game/game.html')
})

io.on('connection', (client) => {
    console.log(`user connected ${client.id}`)
   
    // add user to the room after connection
    client.on('enter room', ({roomId}) => {
        if (users[roomId]) {
            users[roomId].push(client.id)
        } else {
            users[roomId] = [client.id]
        }

        client.join(roomId);
        // send all users in the room to the new user
        client.emit('prev users', {users: users[roomId]})
        
        client.to(roomId).emit('new user', {
            id: client.id
        })
        
        client.on('pos', (data) => {
            // console.log(data)m
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
                users[room] = users[room].filter(user => user !== client.id)
            })
            
            for(let room in users){
                if(users[room].length == 0){
                    delete users[room]
                }
            }
        })
    })


})


// io.of("/").adapter.on("create-room", (room) => {
//     console.log(`room ${room} was created`);
// });