let socket = io();

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
let wallImg;


function startGame(e) {
    document.querySelector(".overlay").classList.add('hide')
    document.querySelector(".input-container").classList.add('hide')
    // document.querySelector(".overlay").classList.add('hide')
    start = true
    currentPlayerRef = new Snake(staticObstacle, scl)
    socket.emit('join game', {username: e.target.value})
}

function addRandomFood(){
    for(let i = 0; i < 1000; i++){
        foods.push({x: random(0, worldWidth), y: random(0, worldHeight)})
    }
}

function endGame() {
    document.querySelector(".overlay").classList.remove('hide')
    document.querySelector(".input-container").classList.remove('hide')
    start = false;
}

function validPosition(x, y, w, z, x2, y2) {
    if(x < x2 && (x + w) > x2 && y2 > y && y2 < (y + h)){
        return false
    }
    return true
}

function preload() {
    wallImg = loadImage('../assests/wall.png')
}

function setup() {
    let canvas = createCanvas(window.innerWidth - 100, window.innerHeight - 100); 
    canvas.parent("gameContainer");
    addRandomFood()
}

let wx = 0;
let wy = 0;
let ws = 1;
function draw() {
    background(0);
    fill("#202342");
    
    if(start){
        wx = lerp(wx, width /2 -currentPlayerRef.x, 0.06)
        wy = lerp(wy, height / 2 -currentPlayerRef.y, 0.06)
        translate(wx, wy)
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
            fill("#202342");
        let scaleFac = (width / worldWidth) / 1.3
        ws = lerp(ws, scaleFac, 0.008)
        scale(ws)
        wx = lerp(wx, (width / 2) - (worldWidth * scaleFac) / 2, 0.08)
        wy = lerp(wy, (height / 2) - (worldHeight * scaleFac) / 2, 0.08)
        translate(wx, wy)
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

    for(let i = 0; i < worldWidth / 200; i++){
        image(wallImg, i * 200, -120, 200, 120)
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