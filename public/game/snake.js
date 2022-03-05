function Snake(sketch, scl, frameRate) {
  this.x = 0;
  this.y = 0;
  this.xspeed = 1;
  this.yspeed = 0;
  this.total = 0;
  this.tail = [];
  this.speedMultiplier = scl / 2;
  this.prevdir = 2;

  this.eat = function (pos) {
    let d = sketch.dist(this.x, this.y, pos.x, pos.y);
    if (d < scl) {
      this.total++;
      return true;
    } else {
      return false;
    }
  };

  this.dir = function (x, y) {
    this.xspeed = x;
    this.yspeed = y;
  };

  this.death = function (game) {
    let nextxPos = this.x + this.xspeed * this.speedMultiplier;
    let nextyPos = this.y + this.yspeed * this.speedMultiplier;
    // if(nextxPos < 15 || nextxPos > sketch.width - scl || nextyPos < 0 || nextyPos > sketch.height - scl){
    //   game()
    // }

    if ((nextxPos < 0 || nextxPos > sketch.width) || (nextyPos < 0 || nextyPos > sketch.height)) {
      game();
    }

    for (var i = 0; i < this.tail.length; i++) {
      var pos = this.tail[i];
      var d = sketch.dist(this.x, this.y, pos.x, pos.y);
      if (d < 1) {
        this.total = 0;
        this.tail = [];
        game();
      }
    }
    // console.log(this.x, this.y)
  };

  this.update = function () {
    // let deltaSpeed = sketch.floor((scl * this.speedMultiplier) / sketch.frameRate());

    for (let i = 0; i < this.tail.length - 1; i++) {
      this.tail[i] = this.tail[i + 1];
    }
    if (this.total >= 1) {
      this.tail[this.total - 1] = sketch.createVector(this.x, this.y);
    }

    // this.x = this.x + this.xspeed * (deltaSpeed != Infinity ? deltaSpeed : 1);
    // this.y = this.y + this.yspeed * (deltaSpeed != Infinity ? deltaSpeed : 1);

    this.x = this.x + this.xspeed * this.speedMultiplier;
    this.y = this.y + this.yspeed * this.speedMultiplier;

    // this.x = sketch.constrain(this.x, 0, sketch.width - scl);
    // this.y = sketch.constrain(this.y, 0, sketch.height - scl);
  };

  this.show = function () {
    sketch.fill(255);
    for (let i = 0; i < this.tail.length; i++) {
      sketch.noStroke();
      sketch.rect(this.tail[i].x, this.tail[i].y, scl, scl);
    }
    sketch.noStroke();
    sketch.rect(this.x, this.y, scl, scl);
  };
}