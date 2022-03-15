let socket = io();
let scoreUpdateInterval;

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
let score = 0;
let wallTopImg, wallRightImg, wallLeftImg, wallObstacle, wallDownImg, font;
let wallCornerRight, wallCornerBottomRight, wallCornerBottomLeft, wallCornerLeft;
let leaderboard = []
const colors = ['799496', 'E9EB9E', 'ACC196', 'ED9390', 'FFB997']

function changeLeaderboard() {
    let leaderboardEl = document.querySelector('.leaderboard-player-list')
    let innerString = ""
    for(let player of leaderboard){
        innerString += `<p class="leaderboard-name">${player.username}</p>`
    }
    leaderboardEl.innerHTML = innerString
}

function incrementScore() {
    score = currentPlayerRef.total;
    let scoreboard = document.querySelector('.scoreboard')
    scoreboard.innerHTML = `<p class='score'>Score: ${score}</p>`
}

function startGame(e) {
    // document.querySelector(".overlay").classList.add('hide')
    document.querySelector(".input-container").classList.add('hide')
    let username = document.getElementById('username').value
    let color = colors[Math.floor(Math.random() * colors.length)]
    currentPlayerRef = new Snake(staticObstacle, scl, username, color)
    socket.emit('join game', {username, color})
    start = true
    scoreUpdateInterval = setInterval(sendScoreUpdate, 5000)
}

function sendScoreUpdate() {
    socket.emit('score', {score: currentPlayerRef.total})
}

function addRandomFood(){
    for(let i = 0; i < 1000; i++){
        foods.push({x: random(0, worldWidth), y: random(0, worldHeight)})
    }
}

function spawnFood() {  
    if(foods.length < 5000){
        for(let i = 0; i < 10; i++){
            foods.push({x: random(0, worldWidth), y: random(0, worldHeight)})
        }
    }
}

function endGame() {
    // document.querySelector(".overlay").classList.remove('hide')
    document.querySelector(".input-container").classList.remove('hide')
    start = false;
    clearInterval(scoreUpdateInterval)
    socket.emit('death', {id: socket.id})
}

function validPosition(x, y, w, z, x2, y2) {
    if(x < x2 && (x + w) > x2 && y2 > y && y2 < (y + h)){
        return false
    }
    return true
}


function preload() {
    wallObstacle = loadImage('../assests/wall-obstacle.png')
    wallTopImg = loadImage('../assests/wall-top.png')
    wallRightImg = loadImage('../assests/wall-right.png')
    wallLeftImg = loadImage('../assests/wall-left.png')
    wallDownImg = loadImage('../assests/wall-down.png')
    wallCornerRight = loadImage('../assests/wall-edge-right.png')
    wallCornerLeft = loadImage('../assests/wall-edge-left.png')
    wallCornerBottomLeft = loadImage('../assests/wall-edge-bottom-left.png')
    wallCornerBottomRight = loadImage('../assests/wall-edge-bottom-right.png')
    font = loadFont('../fonts/Roboto-Regular.ttf')
}

function setup() {
    let canvas = createCanvas(window.innerWidth - 100, window.innerHeight - 100); 
    canvas.parent("gameContainer");
    setInterval(spawnFood, 2000)
    addRandomFood()
}

let wx = 0;
let wy = 0;
let ws = 1;
function draw() {
    background('#260a0d');
    
    fill("#260a0d");
    if(start){
        wx = lerp(wx, width /2 -currentPlayerRef.x, 0.06)
        wy = lerp(wy, height / 2 -currentPlayerRef.y, 0.06)
        translate(wx, wy)
        rect(0, 0, worldWidth, worldHeight);
        for(let i = 0; i < foods.length; i++){
            fill('#f9f4f5');
            rect(foods[i].x, foods[i].y, scl / 2, scl / 2)
        }
        for(let i = 0; i < foods.length; i++){
            if(currentPlayerRef.eat(foods[i])){
                incrementScore()
                foods.splice(i, 1);
            }
        }
        Object.keys(playersRef).forEach(i => {
            playersRef[i].show([185], font)
            playersRef[i].update()
        })
        currentPlayerRef.show([207, 59, 73], font)
        currentPlayerRef.update()
        currentPlayerRef.death(endGame)
    } else {
        fill("#260a0d");
        let scaleFac = (width / worldWidth) / 1.4
        ws = lerp(ws, scaleFac, 0.008)
        scale(ws)
        wx = lerp(wx, (width / 2) - (worldWidth * scaleFac) / 2, 0.08)
        wy = lerp(wy, (height / 2) - (worldHeight * scaleFac) / 2, 0.08)
        translate(wx, wy)
        rect(0, 0, worldWidth, worldHeight);
        

        Object.keys(playersRef).forEach(i => {
            playersRef[i].show([185], font)
            playersRef[i].update()
        })
    }
    
    fill(0);
    for(let obs of staticObstacle){
        image(wallObstacle, ...obs)
    }

    for(let i = 0; i < worldWidth / 100; i++){
        image(wallTopImg, i * 100, -80)
        image(wallDownImg, i * 100, worldHeight)
    }

    for(let i = 0; i < worldHeight / 100; i++){
        image(wallRightImg, worldWidth, i * 100)
        image(wallLeftImg, -80, i * 100)
    }

    image(wallCornerRight, worldWidth, -80)
    image(wallCornerLeft, -80, -80)
    image(wallCornerBottomRight, worldWidth, worldHeight)
    image(wallCornerBottomLeft, -80, worldHeight)
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
    playersRef[data.id] = new Snake(null, scl, data.username, data.color)
})

socket.on('prev users', ({users}) => {
    if(users){
        for(let user of users){
            if (!playersRef[user.id] && user.id != socket.id) {
                playersRef[user.id] = new Snake(null, scl, user.username, data.color)
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
    console.log("disconnected: ", id)
    if(playersRef[id]){
        delete playersRef[id]
    }
})

socket.on('user disconnect', ({id}) => {
    if(playersRef[id]){
        delete playersRef[id]
    }
})

// socket.on('leaderboard', ({players}) => {
//     leaderboard = players
//     changeLeaderboard()
// })