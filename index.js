//jshint esversion:6
const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

const scoreEl = document.querySelector("#scoreEl");
const startGameBtn = document.querySelector("#startGameBtn");
const modalEl = document.querySelector("#modalEl");
const bigScoreEl = document.querySelector("#bigScoreEl");

class Player {
  constructor(x, y, radius, colour) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.colour = colour;
  }

  draw(){
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.colour;
    c.fill();
  }
}

class Projectile {
  constructor(x, y, radius, colour, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.colour = colour;
    this.velocity = velocity;
  }

  draw(){
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.colour;
    c.fill();
  }

  update(){
    this.draw();
    this.x += this.velocity.x;
    this.y += this.velocity.y;
  }
}

class Enemy {
  constructor(x, y, radius, colour, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.colour = colour;
    this.velocity = velocity;
  }

  draw(){
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.colour;
    c.fill();
  }

  update(){
    this.draw();
    this.x += this.velocity.x;
    this.y += this.velocity.y;
  }
}

const friction = 0.99;
class Particle {
  constructor(x, y, radius, colour, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.colour = colour;
    this.velocity = velocity;
    this.alpha = 1;
  }

  draw(){
    c.save();
    c.globalAlpha = this.alpha;
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.colour;
    c.fill();
    c.restore();
  }

  update(){
    this.draw();
    this.velocity.x *= friction;
    this.velocity.y *= friction;
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    this.alpha -= 0.01;
  }
}

const x = canvas.width / 2;
const y = canvas.height / 2;

const projectile = new Projectile(x, y, 5, "red", {x: 1, y: 1});

let player = new Player(x, y, 10, "white");
let projectiles = [];
let enemies = [];
let particles = [];
let enemySpawnRate = 1000;

function init() {
  player = new Player(x, y, 10, "white");
  projectiles = [];
  enemies = [];
  particles = [];
  score = 0;
  scoreEl.innerHTML = score;
  enemySpawnRate = 1000;
}

function spawnEnemiesFunction() {
  const radius = Math.random() * (30 - 5) + 5;
  let x;
  let y;

  if (Math.random() > 0.5) {
    x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
    y = Math.random() * canvas.height;
  } else {
    x = Math.random() * canvas.width;
    y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
  }
  const colour = "hsl(" + Math.random() * 360 + ", 50%, 50%)";

  const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);
  const velocity = {
    x: Math.cos(angle),
    y: Math.sin(angle)
  };

  enemies.push(new Enemy(x, y, radius, colour, velocity));
}

const spawnEnemiesInterval = setInterval(spawnEnemiesFunction, enemySpawnRate);

let animationId;
let score = 0;
function animate() {
  animationId = requestAnimationFrame(animate);
  c.fillStyle = "rgba(0, 0, 0, 0.1)";
  c.fillRect(0, 0, canvas.width, canvas.height);
  player.draw();

  enemySpawnRate -= 0.1;
  console.log(enemySpawnRate);

  particles.forEach(function(particle, index){
    if (particle.alpha <= 0) {
      setTimeout(function() {
        particles.splice(index, 1);
      }, 0);
    } else {
      particle.update();
    }
    if (particle.x + particle.radius < 0 ||
       particle.x - particle.radius > canvas.width ||
       particle.y + particle.radius < 0 ||
       particle.y + particle.radius > canvas.height) {
      setTimeout(function() {
        particles.splice(index, 1);
      }, 0);
    }
  });

  projectiles.forEach(function(projectile, index){
    projectile.update();
    if (projectile.x + projectile.radius < 0 ||
       projectile.x - projectile.radius > canvas.width ||
       projectile.y + projectile.radius < 0 ||
       projectile.y + projectile.radius > canvas.height) {
      setTimeout(function() {
        projectiles.splice(index, 1);
      }, 0);
    }
  });

  enemies.forEach(function(enemy, enemyIndex) {
    enemy.update();

    const playerDist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    if (playerDist - player.radius - enemy.radius < 1) {
      cancelAnimationFrame(animationId);
      bigScoreEl.innerHTML = score;
      modalEl.style.display = "flex";
    }

    projectiles.forEach(function(projectile, projectileIndex) {
      const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
      if (dist - enemy.radius - projectile.radius <= 1) {

        for (var i = 0; i < enemy.radius * 2; i++) {
          particles.push(new Particle(projectile.x, projectile.y,
            Math.random() * 2, enemy.colour,
            {x: ((Math.random() - 0.5) * (Math.random() * 6)), y: ((Math.random() - 0.5) * (Math.random() * 6))}));
        }

        if (enemy.radius - 10 > 5) {
          score += 1;
          scoreEl.innerHTML = score;
          gsap.to(enemy, {
            radius: enemy.radius - 10
          });
          setTimeout(function() {
            projectiles.splice(projectileIndex, 1);
          }, 0);
        } else {
          score += 3;
          scoreEl.innerHTML = score;
          setTimeout(function() {
            enemies.splice(enemyIndex, 1);
            projectiles.splice(projectileIndex, 1);
          }, 0);
        }
      }
    });
  });
}

addEventListener("click", function(event){
  const angle = Math.atan2(event.y - y, event.x - x);
  const velocity = {
    x: Math.cos(angle) * 5,
    y: Math.sin(angle) * 5
  };
  projectiles.push(new Projectile(x, y, 5, "white", {x: velocity.x, y: velocity.y}));
});

let reload = false;

startGameBtn.addEventListener("click", function(event) {
  if (reload == false) {
    init();
    animate();
    setInterval(spawnEnemiesFunction, enemySpawnRate);
    modalEl.style.display = "none";
    reload = true;
  } else {
    location.reload();
    reload = true;
  }
});
