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
    res.sendFile(__dirname + '/public/game.html')
})

const isUserPresent = (room, id) => {
    for(let user of users[room]){
        if(user.id == id){
            return true
        }
    }
    return false
}

const leaderboard = (room) => {
    users[room].sort((a, b) => a.score - b.score)
    return users[room].slice(0, 5)
}

const sendLearderBoard = () => {
    Object.keys(users).forEach((room) => {
        io.to(room).emit('leaderboard', {players: leaderboard(room)})
    })
}

setInterval(sendLearderBoard, 5000)

io.on('connection', (client) => {
    console.log(`user connected ${client.id}`)
    
    // add user to the room after connection
    client.on('enter room', ({roomId}) => {
        
        client.on('join game', ({username, color}) => {
            // add user to local user manager object
            if (users[roomId] && !isUserPresent(roomId, client.id)) {
                users[roomId].push({id: client.id, username, score: 0, color})
            } else if (users[roomId] == undefined) {
                users[roomId] = [{id: client.id, username, score: 0, color}]
            }
            
            // broadcast the new user to all users in the room
            client.to(roomId).emit('new user', {
                id: client.id,
                username,
                color
            })
        })
        
        // join the user's room
        client.join(roomId);
        
        client.on('start', () => {
            io.to(roomId).emit('start')
        })
        
        // send all users in the room to the new user
        client.emit('prev users', {users: users[roomId]})
        
        // event to broadcast the game data 
        client.on('pos', (data) => {
            client.to(roomId).emit('pos', data)
        })
        
        client.on('death', ({id}) => {
            for(let user of users[roomId]){
                if(user.id == id){
                    user.score = 0;
                }
            }
            client.to(roomId).emit('death', {id})
        })
        
        client.on('score', ({score}) => {
            for(let user of users[roomId]){
                if(user.id == client.id){
                    user.score = score
                }
            }
        })
        
        // remove user after they discoonnect
        client.on('disconnect', () => {
            client.to(roomId).emit('user disconnect', {id: client.id})
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
