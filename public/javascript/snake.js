// function Snake(sketch, scl, frameRate) {
//   this.x = 0;
//   this.y = 0;
//   this.xspeed = 1;
//   this.yspeed = 0;
//   this.total = 0;
//   this.tail = [];
//   this.speedMultiplier = scl / 2;
//   this.prevdir = 2;

//   this.eat = function (pos) {
//     let d = sketch.dist(this.x, this.y, pos.x, pos.y);
//     if (d < scl) {
//       this.total++;
//       return true;
//     } else {
//       return false;
//     }
//   };

//   this.dir = function (x, y) {
//     this.xspeed = x;
//     this.yspeed = y;
//   };

//   this.death = function (game) {
//     let nextxPos = this.x + this.xspeed * this.speedMultiplier;
//     let nextyPos = this.y + this.yspeed * this.speedMultiplier;
//     // if(nextxPos < 15 || nextxPos > sketch.width - scl || nextyPos < 0 || nextyPos > sketch.height - scl){
//     //   game()
//     // }

//     if ((nextxPos < 0 || nextxPos > sketch.width) || (nextyPos < 0 || nextyPos > sketch.height)) {
//       game();
//     }

//     for (var i = 0; i < this.tail.length; i++) {
//       var pos = this.tail[i];
//       var d = sketch.dist(this.x, this.y, pos.x, pos.y);
//       if (d < 1) {
//         this.total = 0;
//         this.tail = [];
//         game();
//       }
//     }
//     // console.log(this.x, this.y)
//   };

//   this.update = function () {
//     // let deltaSpeed = sketch.floor((scl * this.speedMultiplier) / sketch.frameRate());

//     for (let i = 0; i < this.tail.length - 1; i++) {
//       this.tail[i] = this.tail[i + 1];
//     }
//     if (this.total >= 1) {
//       this.tail[this.total - 1] = sketch.createVector(this.x, this.y);
//     }

//     // this.x = this.x + this.xspeed * (deltaSpeed != Infinity ? deltaSpeed : 1);
//     // this.y = this.y + this.yspeed * (deltaSpeed != Infinity ? deltaSpeed : 1);

//     this.x = this.x + this.xspeed * this.speedMultiplier;
//     this.y = this.y + this.yspeed * this.speedMultiplier;

//     // this.x = sketch.constrain(this.x, 0, sketch.width - scl);
//     // this.y = sketch.constrain(this.y, 0, sketch.height - scl);
//   };

//   this.show = function () {
//     sketch.fill(255);
//     for (let i = 0; i < this.tail.length; i++) {
//       sketch.noStroke();
//       sketch.rect(this.tail[i].x, this.tail[i].y, scl, scl);
//     }
//     sketch.noStroke();
//     sketch.rect(this.x, this.y, scl, scl);
//   };
// }

function Snake(obstacles, scl, username, color) {
  this.x = 500;
  this.y = 250;
  this.xspeed = 1;
  this.yspeed = 0;
  this.total = 10;
  this.tail = [];
  this.speedMultiplier = 5; //scl /2
  this.prevdir = 2;
  this.scl = scl;
  this.eating = false;
  this.obstacles = obstacles
  this.username = username
  this.color = color

  for(let i = 0; i < this.total - 1; i++){
    this.tail.push(createVector(this.x - (i * this.scl), this.y))
  }
  
  this.setPos = (x, y, xs, ys, t) => {
    this.x = x;
    this.y = y;
    this.xspeed = xs;
    this.yspeed = ys;
    this.total = t != this.total ? t : this.total;
  }

  this.eat = function (pos) {
    if(!this.eating){
      this.eating = true
      let d = dist(this.x, this.y, pos.x, pos.y);
      if (d < this.scl) {
        this.total++;
        this.eating = false
        return true;
      } else {
        this.eating = false
        return false;
      }
    }
  };

  this.dir = function (x, y) {
    this.xspeed = x;
    this.yspeed = y;
  };

  this.death = function (game) {
    let nextxPos = this.x + this.xspeed * this.speedMultiplier;
    let nextyPos = this.y + this.yspeed * this.speedMultiplier;
    // if(nextxPos < 15 || nextxPos > width - scl || nextyPos < 0 || nextyPos > height - scl){
    //   game()
    // }

    if ((nextxPos < 0 || nextxPos > worldWidth) || (nextyPos < 0 || nextyPos > worldHeight)) {
      game();
    }

    for (var i = 0; i < this.tail.length - 1; i++) {
      var pos = this.tail[i];
      if(pos){
        var d = dist(this.x, this.y, pos.x, pos.y);
        if (d < 1) {
          this.total = 0;
          this.tail = [];
          game();
        }
      }
    }
    for(let ops of this.obstacles){
      let x1 = ops[0]
      let y1 = ops[1]
      let w = ops[2]
      let h = ops[3]
      if(this.x > x1 && this.x - this.scl < x1 + w && this.y + this.scl > y1 && this.y < y1 + h){
        this.total = 0;
        this.tail = [];
        game();
      }
    }
    // console.log(this.x, this.y)
  };

  this.update = function () {
    // let deltaSpeed = floor((scl * this.speedMultiplier) / frameRate());
    // console.log(this.tail)
    for (let i = 0; i < this.tail.length - 1; i++) {
      this.tail[i] = this.tail[i + 1];
    }
    if (this.total >= 1) {
      this.tail[this.total - 1] = createVector(this.x, this.y);
    }

    // this.x = this.x + this.xspeed * (deltaSpeed != Infinity ? deltaSpeed : 1);
    // this.y = this.y + this.yspeed * (deltaSpeed != Infinity ? deltaSpeed : 1);

    this.x = this.x + this.xspeed * this.speedMultiplier;
    this.y = this.y + this.yspeed * this.speedMultiplier;

    this.x = constrain(this.x, 0, worldWidth - this.scl);
    this.y = constrain(this.y, 0, worldHeight - this.scl);
  };

  this.show = function (font) {
    fill(`#${color}`);
    for (let i = 0; i < this.tail.length; i++) {
      //noStroke();
      if(this.tail[i] != undefined){
        rect(this.tail[i].x, this.tail[i].y, this.scl, this.scl);
      }
    }
    noStroke();
    rect(this.x, this.y, this.scl, this.scl);
    textSize(18);
    textFont(font)
    fill(255);
    if(this.prevdir == 3){
      text(this.username, this.x + 25, this.y + 6);
    } else {
      text(this.username, this.x, this.y - 12);
    }
  };
}