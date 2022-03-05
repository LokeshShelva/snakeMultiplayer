let socket;
let playersSnakeRef = {}
let players = []
socket = io();
let admin = false;

const createNewPlayer = (id) => {
  const newCanvas = (sketch) => {
    let s;
    let scl = 10;
    let start = true;

    function stopGame() {
      start = false;
    }

    const setPos = (x, y, xs, ys, total) => {
      s.x = x * 0.5;
      s.y = y * 0.5;
      s.xspeed = xs;
      s.yspeed = ys;
      s.total = total != s.total ? total : s.total;
    }

    sketch.setup = function () {
      let canvas = sketch.createCanvas(300, 300);
      canvas.parent("otherPlayerContainer");
      sketch.frameRate(15);
      s = new Snake(sketch, scl, sketch.frameRate());
      playersSnakeRef[id] = {snake: s, setPos, stopGame};
      console.log(playersSnakeRef[id])
      // s.xspeed = 0.35  
    }

    sketch.draw = function () {
      if (start) {
        sketch.background(51);
        // s.death(stopGame);
        s.show();
        s.update();
        // s.remoteUpdate();
        sketch.fill(255, 0, 100);
      }
    }
  }
  return newCanvas
}

//Game Logic

const newPlayableCanvas = (sketch) => {

  let s;
  let scl = 20;
  let food;
  let start = true;

  function startGame() {
    start = true;
  }

  function stopGame() {
    start = false;
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
    let cols = sketch.floor(sketch.width / scl);
    let rows = sketch.floor(sketch.height / scl);
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
    let canvas = sketch.createCanvas(600, 600);
    canvas.parent("gameContainer");
    s = new Snake(sketch, scl);
    sketch.frameRate(15);
    pickLocation();
  }

  sketch.draw = function () {
    if (start) {
      sketch.background(51);
      if (s.eat(food)) {
        pickLocation();
      }
      s.update();
      s.show();
      sketch.fill(255, 0, 100);
      sketch.rect(food.x, food.y, scl, scl);
      s.death(stopGame);
    }
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
  })
})

socket.on('new user', (data) => {
  console.log(data)
  new p5(createNewPlayer(data.id))
  players.push(data.id)
  // players.push({canvas: playerCanvas, id: data.id})
})

socket.on('prev users', ({users}) => {
  if(users.length == 1){
    admin = true;
    return;
  }
  for (let user of users) {
    if (!playersSnakeRef[user] && user != socket.id) {
      players.push(user)
      let c = new p5(createNewPlayer(user))
      // players[user] = c;
    }
  }
})


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