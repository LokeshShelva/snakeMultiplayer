let socket = io();

function startGame(e) {
    start = true
    currentPlayerRef = new Snake(staticObstacle, scl)
    socket.emit('join game', {username: e.target.value})
}

let foods = []
let playersRef = {}
let currentPlayerRef;
let scl = 20;
let start = false;
let worldWidth = 2500;
let worldHeight = 1500;
let staticObstacle = [
    [200, 1000, 150, 500],
    [600, 300, 150, 500],
    [1800, 150, 150, 500],
    [1300, 800, 150, 500],
]


function addRandomFood(){
    for(let i = 0; i < 1000; i++){
        foods.push({x: random(0, worldWidth), y: random(0, worldHeight)})
    }
}

function endGame() {
    console.log("death")
    socket.emit('death', {id: socket.id})
    start = false;
}

function validPosition(x, y, w, z, x2, y2) {
    if(x < x2 && (x + w) > x2 && y2 > y && y2 < (y + h)){
        return false
    }
    return true
}

function setup() {
    let canvas = createCanvas(window.innerWidth - 100, window.innerHeight - 100); 
    canvas.parent("gameContainer");
    addRandomFood()
}

function draw() {
    background(0);
    fill(51);
    
    if(start){
        translate(width /2 -currentPlayerRef.x, height / 2 -currentPlayerRef.y)
        rect(0, 0, worldWidth, worldHeight);
        for(let i = 0; i < foods.length; i++){
            fill(255);
            rect(foods[i].x, foods[i].y, scl / 2, scl / 2)
        }
        for(let i = 0; i < foods.length; i++){
            if(currentPlayerRef.eat(foods[i])){
                foods.splice(i, 1);
            }
        }
        Object.keys(playersRef).forEach(i => {
            playersRef[i].show([185])
            playersRef[i].update()
        })
        currentPlayerRef.show([255])
        currentPlayerRef.update()
        currentPlayerRef.death(endGame)
    } else {
        let scaleFac = (width / worldWidth) / 1.05
        scale(scaleFac)
        translate((width / 2) - (worldWidth * scaleFac) / 2, (height / 2) - (worldHeight * scaleFac) / 2)
        fill(200);
        rect(0, 0, worldWidth, worldHeight);
        
        Object.keys(playersRef).forEach(i => {
            playersRef[i].show([185])
            playersRef[i].update()
        })
    }
    
    fill(0);
    for(let obs of staticObstacle){
        rect(...obs)
    }
}

function keyPressed () {
    if (keyCode === UP_ARROW && currentPlayerRef.prevdir != 3) {
        currentPlayerRef.dir(0, -1);
        currentPlayerRef.prevdir = 1;
    } else if (keyCode === DOWN_ARROW && currentPlayerRef.prevdir != 1) {
        currentPlayerRef.dir(0, 1);
        currentPlayerRef.prevdir = 3;
    } else if (keyCode === RIGHT_ARROW && currentPlayerRef.prevdir != 4) {
        currentPlayerRef.dir(1, 0);
        currentPlayerRef.prevdir = 2;
    } else if (keyCode === LEFT_ARROW && currentPlayerRef.prevdir != 2) {
        currentPlayerRef.dir(-1, 0);
        currentPlayerRef.prevdir = 4;
    }
    if(start){
        socket.emit('pos', {
            id: socket.id,
            x: currentPlayerRef.x,
            y: currentPlayerRef.y,
            xs: currentPlayerRef.xspeed,
            ys: currentPlayerRef.yspeed,
            total: currentPlayerRef.total
        }); 
    }
}

socket.on('connect', () => {
    console.log(`Socket id: ${socket.id}`)
    socket.emit('enter room', {
        roomId: window.location.href.split('?roomid=')[1],
    })
})

socket.on('new user', (data) => {
    console.log("new User: ", data)
    playersRef[data.id] = new Snake(null, scl)
})

socket.on('prev users', ({users}) => {
    if(users){
        for(let user of users){
            if (!playersRef[user.id] && user.id != socket.id) {
                playersRef[user.id] = new Snake(null, scl)
            }
        }
    }
})

socket.on('pos', (data) => {
    let snake = playersRef[data.id]
    if(snake){
        snake.setPos(data.x, data.y, data.xs, data.ys, data.total)
    }
})

socket.on('death', ({id}) => {
    if(playersRef[id]){
        delete playersRef[id]
    }
})

socket.on('user disconnect', ({id}) => {
    console.log("disconnected: ", id)
    if(playersRef[id]){
        delete playersRef[id]
    }
})