// survivalMode.js
// ============================
// CHAOS KEYBOARD BATTLE - SURVIVAL MODE
// ============================

let canvas, ctx;
let paused = false;
let gameOverState = false;
let startTime = 0;
let enemySpawnInterval, powerUpSpawnInterval;

const enemyBullets = [];
const enemies = [];
const powerUps = [];

// Player setup
const player = {
  x: 0,
  y: 0,
  width: 50,
  height: 50,
  speed: 5,
  baseSpeed: 5,
  health: 100,
  score: 0,
  bullets: [],
  shieldActive: false,
  dashCooldown: 0,
  lastShot: 0,
};

// Controls
const keys = {};

// 1. Attach keydown and keyup listeners inside Survival Mode.
function attachEventListeners() {
  document.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'p') togglePause();
  });
  document.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
  });
}

function spawnEnemy() {
  enemies.push({
    x: Math.random() * (canvas.width - 50),
    y: -50,
    width: 50,
    height: 50,
    speed: Math.random() * 2 + 1 + getWave() * 0.2,
    health: 30 + getWave() * 5,
    lastShot: Date.now(),
  });
}

function spawnPowerUp() {
  const types = ["health", "shield", "speed", "bullet"];
  const type = types[Math.floor(Math.random() * types.length)];
  const powerUp = {
    x: Math.random() * (canvas.width - 30),
    y: Math.random() * (canvas.height - 30),
    width: 30,
    height: 30,
    type: type,
    spawnTime: Date.now(),
  };
  powerUps.push(powerUp);
}

function shootBullet() {
  player.bullets.push({
    x: player.x + player.width / 2 - 5,
    y: player.y,
    width: 10,
    height: 10,
    speed: 6,
  });
}

function dash() {
  if (player.dashCooldown <= 0) {
    player.speed = player.baseSpeed * 3;
    player.dashCooldown = 2000; // cooldown in ms
    setTimeout(() => {
      player.speed = player.baseSpeed;
    }, 300); // dash lasts 300ms
  }
}

function isColliding(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function getWave() {
  return Math.floor((Date.now() - startTime)/30000) + 1;
}

function update() {
  if (paused) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const wave = getWave();
  
  // Movement
  if (keys["a"] && player.x > 0) player.x -= player.speed;
  if (keys["d"] && player.x + player.width < canvas.width) player.x += player.speed;
  if (keys["w"] && player.y > 0) player.y -= player.speed;
  if (keys["s"] && player.y + player.height < canvas.height) player.y += player.speed;

  // Shooting
  if (keys[" "] && Date.now() - player.lastShot > 300) {
    shootBullet();
    player.lastShot = Date.now();
  }

  // Shield
  player.shieldActive = !!keys["q"];

  // Dash
  if (keys["e"]) dash();
  if (player.dashCooldown > 0) {
    player.dashCooldown -= 16;
  }

  // Update player bullets
  player.bullets.forEach((bullet, index) => {
    bullet.y -= bullet.speed;
    if (bullet.y < 0) player.bullets.splice(index, 1);
  });

  
   // Enemies
  enemies.forEach((enemy, eIndex) => {
    enemy.y += enemy.speed;
    // Remove if off-screen
    if (enemy.y > canvas.height) {
      enemies.splice(eIndex, 1);
      return;
    }
    // Enemy shooting
    if (Date.now() - enemy.lastShot > 2000) {
      enemy.lastShot = Date.now();
      enemyBullets.push({
        x: enemy.x + enemy.width / 2 - 5,
        y: enemy.y + enemy.height,
        width: 10,
        height: 10,
        speed: 4,
      });
    }
    // Collision with player
    if (isColliding(player, enemy)) {
      if (!player.shieldActive) player.health -= 10;
      enemies.splice(eIndex, 1);
      return;
    }
    // Collision with bullets
    player.bullets.forEach((bullet, bIndex) => {
      if (isColliding(bullet, enemy)) {
        enemy.health -= 20;
        player.bullets.splice(bIndex, 1);
        if (enemy.health <= 0) {
          player.score += 10;
          enemies.splice(eIndex, 1);
        }
      }
    });
  });

  // Enemy bullets
  enemyBullets.forEach((bullet, index) => {
    bullet.y += bullet.speed;
    if (bullet.y > canvas.height) {
      enemyBullets.splice(index, 1);
      return;
    }
    if (isColliding(bullet, player)) {
      if (!player.shieldActive) player.health -= 10;
      enemyBullets.splice(index, 1);
    }
  });



   // Power-ups & timed removal
  powerUps.forEach((pu,i) => {
    const elapsed = Date.now() - pu.spawnTime;
    if (elapsed > 5000) return powerUps.splice(i,1);
    if (isColliding(player, pu)) {
      switch(pu.type) {
        case 'health':  player.health = Math.min(100, player.health + 20); break;
        case 'shield':  player.shieldActive = true; break;
        case 'speed':   player.speed += 2; break;
        case 'bullet':  player.bullets.forEach(bl => { bl.vx *= 1.5; bl.vy *= 1.5; }); break;
      }
      powerUps.splice(i,1);
    }
  });

  
   // Draw Section
  ctx.fillStyle = 'blue';
  ctx.fillRect(player.x, player.y, player.width, player.height);
  if (player.shieldActive) {
    ctx.strokeStyle = 'cyan'; ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(player.x + player.width/2, player.y + player.height/2, player.width, 0, Math.PI*2);
    ctx.stroke();
  }

  ctx.fillStyle = 'red';    player.bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));
  ctx.fillStyle = 'green';  enemies.forEach(e => ctx.fillRect(e.x, e.y, e.width, e.height));
  ctx.fillStyle = 'orange'; enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));
   
// Power-ups with name & timer
  powerUps.forEach(pu => {
    ctx.fillStyle = 'yellow'; ctx.fillRect(pu.x, pu.y, pu.width, pu.height);
    ctx.fillStyle = 'white'; ctx.font = '12px Arial';
    ctx.fillText(pu.type, pu.x, pu.y - 5);
    const tLeft = Math.ceil((5000 - (Date.now() - pu.spawnTime)) / 1000);
    ctx.fillText(`(${tLeft})`, pu.x + pu.width - 12, pu.y + pu.height + 12);
  });


   // UI: Health, Score, Wave, Time
  ctx.fillStyle = 'white'; ctx.font = '20px Arial';
  ctx.fillText(`Health: ${player.health}`, 10, 30);
  ctx.fillText(`Score: ${player.score}`, 10, 60);
  ctx.fillText(`Wave: ${wave}`, 10, 90);
  ctx.fillText(`Time: ${Math.floor((Date.now() - startTime)/1000)}s`, 10, 120);
  
  // Player bullets
  ctx.fillStyle = "red";
  player.bullets.forEach((bullet) => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });

  // Enemies
  ctx.fillStyle = "green";
  enemies.forEach((enemy) => {
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  });

  // Enemy bullets
  ctx.fillStyle = "orange";
  enemyBullets.forEach((bullet) => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });

 
  // Check Game Over
  if (player.health <= 0) {
    gameOver();
    return;
  }

  requestAnimationFrame(update);
}

function gameOver() {
  gameOverState = true;
  ctx.fillStyle = "red";
  ctx.font = "40px Arial";
  ctx.fillText("Game Over", canvas.width / 2 - 100, canvas.height / 2);
  const gameOverScreen = document.getElementById("gameOverScreen");
  if (gameOverScreen) {
    gameOverScreen.classList.remove("hidden");
  }
}

// Called when Survival Mode starts
function survivalStartGame() {
  console.log("Survival mode starting...");

  // Get canvas & context
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");

  // Attach event listeners (only once if needed)
  attachEventListeners();

  // Reset player
  player.x = canvas.width / 2 - 25;
  player.y = canvas.height - 100;
  player.health = 100;
  player.score = 0;
  player.bullets = [];
  player.shieldActive = false;
  player.speed = player.baseSpeed;
  player.lastShot = 0;
  player.dashCooldown = 0;

  // Clear arrays
  enemies.length = 0;
  enemyBullets.length = 0;
  powerUps.length = 0;
  gameOverState = false;
  paused = false;

  // Start timers
  startTime = Date.now();
  enemySpawnInterval = setInterval(spawnEnemy, 2000);
  powerUpSpawnInterval = setInterval(spawnPowerUp, 10000);

  // Start the loop
  update();
}

/* ===== BUTTON FUNCTIONALITY ===== */
function togglePause() {
  paused = !paused;
  // Show or hide the pause overlay if you have one
  const pauseScreen = document.getElementById("pauseScreen");
  if (pauseScreen) {
    if (paused) pauseScreen.classList.remove("hidden");
    else pauseScreen.classList.add("hidden");
  }
  if (!paused && !gameOverState) {
    // Resume the update loop
    requestAnimationFrame(update);
  }
}

function restartGame() {
  // Simple approach: reload the page
  location.reload();
}

function playAgain() {
  clearInterval(enemySpawnInterval);
  clearInterval(powerUpSpawnInterval);
  const ov = document.getElementById('gameOverScreen');
  if (ov) ov.classList.add('hidden');
  survivalStartGame();
}

// Make sure these are exposed globally so the HTML buttons work
window.survivalStartGame = survivalStartGame;
window.togglePause = togglePause;
window.restartGame = restartGame;
window.playAgain = playAgain;
