let socket;
let playersSnakeRef = {}
let players = []
socket = io();
let admin = false;
let start = false;

// prevent the scrolling of page by keys
window.addEventListener("keydown", function(e) {
  if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
      e.preventDefault();
  }
}, false);

let btn = document.getElementById("admin_start")
btn.style.display = "none"

function shoeAdminBtn() {
  let btn = document.getElementById("admin_start")
  btn.style.display = "block"
}

function startGame() {
  socket.emit('start')
}

// Game Logic
const createNewPlayer = (id, username) => {
  const newCanvas = (sketch) => {
    let s;
    let scl = 10;
    let gameOver = false;

    function stopGame() {
      gameOver = true;
    }

    const setPos = (x, y, xs, ys, total) => {
      s.x = x * 0.5;
      s.y = y * 0.5;
      s.xspeed = xs;
      s.yspeed = ys;
      s.total = total != s.total ? total : s.total;
    }

    sketch.setup = function () {
      let canvas = sketch.createCanvas(300, 325);
      canvas.parent("otherPlayerContainer");
      sketch.frameRate(15);
      s = new Snake(sketch, scl, sketch.frameRate());
      playersSnakeRef[id] = {snake: s, setPos, stopGame};
      console.log(playersSnakeRef[id])
      // s.xspeed = 0.35  
    }

    sketch.draw = function () {
      sketch.translate(0, 25);
      sketch.background(51);
      if (start && !gameOver) {
        // s.death(stopGame);
        s.show();
        s.update();
        // s.remoteUpdate();
        sketch.fill(255, 0, 100);
      } else if (gameOver){
        sketch.fill(255);
        sketch.textSize(24);
        sketch.textAlign(sketch.CENTER);
        sketch.text("Game Over", 150, 120);
        sketch.textSize(18);
        sketch.textAlign(sketch.LEFT)
        sketch.text(username, 50, 160);
        sketch.text(`Score: ${s.total}`, 50, 180);
        sketch.noLoop(); 
      }
      sketch.fill(255);
      sketch.rect(0, -25, 300, 25);
      sketch.fill(0);
      sketch.textSize(12);
      sketch.textAlign(sketch.RIGHT);
      sketch.text(username, 300, -5);
      sketch.textAlign(sketch.LEFT);
      sketch.text(`Score: ${s.total}`, 0, -5);
    }
  }
  return newCanvas
}

const newPlayableCanvas = (sketch) => {

  let s;
  let scl = 20;
  let food;
  let gameOver = false;
  let width = 600, height= 600;
  let username = localStorage.getItem('snake_username');

  function startGame() {
    start = true;
  }

  function stopGame() {
    gameOver = true;
    socket.emit('death', {id: socket.id})
  }

  function validPos(x, y) {
    if (sketch.dist(x, y, s.x, s.y) < scl * 2) {
      return false;
    }

    for (let i = 0; i < s.tail.length; i++) {
      if (sketch.dist(s.tail[i].x, s.tail[i].y, x, y) < scl * 2) {
        return false;
      }
    }
    return true;
  }

  function pickLocation() {
    let cols = sketch.floor(width / scl);
    let rows = sketch.floor(height / scl);
    let x, y;

    while (true) {
      x = sketch.floor(sketch.random(cols))
      y = sketch.floor(sketch.random(rows))
      if (validPos(x, y)) {
        break;
      }
    }

    food = sketch.createVector(x, y);
    food.mult(scl);
  }

  sketch.setup = function () {
    let canvas = sketch.createCanvas(600, 650);
    canvas.parent("gameContainer");
    s = new Snake(sketch, scl);
    sketch.frameRate(15);
    pickLocation();
  }
  
  sketch.draw = function () {
    sketch.translate(0, 50);
    sketch.background(51);
    if (start && !gameOver) {
      if (s.eat(food)) {
        pickLocation();
      }
      s.show();
      s.update();
      sketch.fill(255, 0, 100);
      sketch.rect(food.x, food.y, scl, scl);
      s.death(stopGame);
    } else if (gameOver) {
      s.show()
      sketch.fill(255, 0, 100);
      sketch.rect(food.x, food.y, scl, scl);
      sketch.fill('rgba(0, 0, 0, 0.5)');
      sketch.rect(0, 0, width, height);
      sketch.fill(255);
      sketch.textSize(32);
      sketch.textAlign(sketch.CENTER);
      sketch.text("Game Over", width/2, (height/2) - 30);
      sketch.textSize(24);
      sketch.text(`Score: ${s.total}`, width / 2, (height / 2) + 10);
      sketch.noLoop();
    }
    sketch.fill(255);
    sketch.rect(0, -50, width, 50);
    sketch.fill(0);
    sketch.textSize(22);
    sketch.textAlign(sketch.LEFT);
    sketch.text(`Score: ${s.total}`, 0, -10);
    sketch.textAlign(sketch.RIGHT);
    sketch.text(username, width, -10);
  }

  sketch.keyPressed = function () {
    if(start){
      if (sketch.keyCode === sketch.UP_ARROW && s.prevdir != 3) {
      s.dir(0, -1);
      s.prevdir = 1;
    } else if (sketch.keyCode === sketch.DOWN_ARROW && s.prevdir != 1) {
      s.dir(0, 1);
      s.prevdir = 3;
    } else if (sketch.keyCode === sketch.RIGHT_ARROW && s.prevdir != 4) {
      s.dir(1, 0);  
      s.prevdir = 2;
    } else if (sketch.keyCode === sketch.LEFT_ARROW && s.prevdir != 2) {
      s.dir(-1, 0);
      s.prevdir = 4;
    }
    socket.emit('pos', {
      id: socket.id,
      x: s.x,
      y: s.y,
      xs: s.xspeed,
      ys: s.yspeed,
      total: s.total
    });
  }
  }
}

socket.on('connect', () => {
  console.log(`connected ${socket.id}`)
  new p5(newPlayableCanvas)
  
  // enter a given room after connection
  socket.emit('enter room', {
    roomId: window.location.href.split('/')[4],
    username: localStorage.getItem('snake_username')
  })
})

// Event that recieves all the previous users of the room
socket.on('prev users', ({users}) => {
  if(users.length == 1){
    admin = true;
    shoeAdminBtn()
    return;
  }
  for (let user of users) {
    if (!playersSnakeRef[user.id] && user.id != socket.id) {
      players.push(user.id)
      let c = new p5(createNewPlayer(user.id, user.username))
    }
  }
})

// Event when a new user joins the room 
socket.on('new user', (data) => {
  console.log(data)
  new p5(createNewPlayer(data.id, data.username))
  players.push(data.id)
})

socket.on('start', () => {
  start = true;
})

// Event that recieves the game data
socket.on('pos', (data) => {
  let snake = playersSnakeRef[data.id]
  if (snake) {
    snake.setPos(data.x, data.y, data.xs, data.ys, data.total)
  }
})

socket.on('death', ({id}) => {
  let snake = playersSnakeRef[id]
  console.log("death: ", snake)
  if(snake){  
    snake.stopGame()
  }
})