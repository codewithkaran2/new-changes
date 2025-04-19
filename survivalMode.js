// survivalMode.js
// ============================
// CHAOS KEYBOARD BATTLE - SURVIVAL MODE
// ============================

let canvas, ctx;
let paused = false;
let gameOverState = false;
let startTime = 0;
let enemySpawnInterval, powerUpSpawnInterval;
let pauseStartTime = 0;
let listenersAttached = false;
let playerName = '';

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

// Attach keydown and keyup listeners once
function attachEventListeners() {
  if (listenersAttached) return;
  listenersAttached = true;
  document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'p') togglePause();
  });
  document.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
  });
  // Volume slider
  const volumeSlider = document.getElementById('volumeSlider');
  const bgMusic = document.getElementById('bgMusic');
  if (volumeSlider && bgMusic) {
    volumeSlider.addEventListener('input', e => {
      bgMusic.volume = e.target.value;
    });
  }
}

// Spawn enemies at random positions
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

// Spawn power-ups
function spawnPowerUp() {
  const types = ['health', 'shield', 'speed', 'bullet'];
  const type = types[Math.floor(Math.random() * types.length)];
  powerUps.push({
    x: Math.random() * (canvas.width - 30),
    y: Math.random() * (canvas.height - 30),
    width: 30,
    height: 30,
    type,
    spawnTime: Date.now(),
  });
}

// Player shoots bullet
function shootBullet() {
  player.bullets.push({
    x: player.x + player.width / 2 - 5,
    y: player.y,
    vx: 0,
    vy: -6,
    width: 10,
    height: 10,
  });
  const shootSound = document.getElementById('shootSound');
  if (shootSound) shootSound.play();
}

// Dash mechanic
function dash() {
  if (player.dashCooldown <= 0) {
    player.speed = player.baseSpeed * 3;
    player.dashCooldown = 2000;
    setTimeout(() => {
      player.speed = player.baseSpeed;
    }, 300);
  }
}

// Collision detection
def function isColliding(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// Wave number based on time
function getWave() {
  return Math.floor((Date.now() - startTime) / 30000) + 1;
}

// Main update loop
function update() {
  if (paused) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const wave = getWave();

  // Player movement
  if (keys['a'] && player.x > 0) player.x -= player.speed;
  if (keys['d'] && player.x + player.width < canvas.width) player.x += player.speed;
  if (keys['w'] && player.y > 0) player.y -= player.speed;
  if (keys['s'] && player.y + player.height < canvas.height) player.y += player.speed;

  // Shooting
  if (keys[' '] && Date.now() - player.lastShot > 300) {
    shootBullet();
    player.lastShot = Date.now();
  }

  // Shield
  player.shieldActive = !!keys['q'];

  // Dash
  if (keys['e']) dash();
  if (player.dashCooldown > 0) player.dashCooldown -= 16;

  // Update player bullets
  player.bullets.forEach((bullet, i) => {
    bullet.y += bullet.vy;
    if (bullet.y < 0) player.bullets.splice(i, 1);
  });

  // Update enemies
  enemies.forEach((enemy, ei) => {
    enemy.y += enemy.speed;
    if (enemy.y > canvas.height) return enemies.splice(ei, 1);
    // AI shooting towards player
    if (Date.now() - enemy.lastShot > 2000) {
      enemy.lastShot = Date.now();
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const mag = Math.sqrt(dx * dx + dy * dy) || 1;
      const vx = (dx / mag) * 4;
      const vy = (dy / mag) * 4;
      enemyBullets.push({
        x: enemy.x + enemy.width / 2 - 5,
        y: enemy.y + enemy.height / 2 - 5,
        vx,
        vy,
        width: 10,
        height: 10,
      });
    }
    // Collision with player
    if (isColliding(player, enemy)) {
      if (!player.shieldActive) {
        player.health -= 10;
        const hitSound = document.getElementById('hitSound');
        if (hitSound) hitSound.play();
      } else {
        const shieldSound = document.getElementById('shieldBreakSound');
        if (shieldSound) shieldSound.play();
      }
      return enemies.splice(ei, 1);
    }
    // Bullets hitting enemy
    player.bullets.forEach((b, bi) => {
      if (isColliding(b, enemy)) {
        enemy.health -= 20;
        player.bullets.splice(bi, 1);
        if (enemy.health <= 0) {
          player.score += 10;
          enemies.splice(ei, 1);
        }
      }
    });
  });

  // Update enemy bullets
  enemyBullets.forEach((b, bi) => {
    b.x += b.vx;
    b.y += b.vy;
    if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) return enemyBullets.splice(bi, 1);
    if (isColliding(b, player)) {
      if (!player.shieldActive) {
        player.health -= 10;
        const hitSound = document.getElementById('hitSound');
        if (hitSound) hitSound.play();
      } else {
        const shieldSound = document.getElementById('shieldBreakSound');
        if (shieldSound) shieldSound.play();
      }
      enemyBullets.splice(bi, 1);
    }
  });

  // Power-ups
  powerUps.forEach((pu, pi) => {
    const elapsed = Date.now() - pu.spawnTime;
    if (elapsed > 5000) return powerUps.splice(pi, 1);
    if (isColliding(player, pu)) {
      switch (pu.type) {
        case 'health': player.health = Math.min(100, player.health + 20); break;
        case 'shield': player.shieldActive = true; break;
        case 'speed': player.speed += 2; break;
        case 'bullet': player.bullets.forEach(b => { b.vx *= 1.5; b.vy *= 1.5; }); break;
      }
      powerUps.splice(pi, 1);
    }
  });

  // Drawing
  ctx.fillStyle = 'blue';
  ctx.fillRect(player.x, player.y, player.width, player.height);
  if (player.shieldActive) {
    ctx.strokeStyle = 'cyan';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(player.x + player.width/2, player.y + player.height/2, player.width, 0, Math.PI*2);
    ctx.stroke();
  }
  ctx.fillStyle = 'red'; player.bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));
  ctx.fillStyle = 'green'; enemies.forEach(e => ctx.fillRect(e.x, e.y, e.width, e.height));
  ctx.fillStyle = 'orange'; enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));

  // Power-up labels & timers
  powerUps.forEach(pu => {
    ctx.fillStyle = 'yellow';
    ctx.fillRect(pu.x, pu.y, pu.width, pu.height);
    ctx.fillStyle = 'white'; ctx.font = '12px Arial';
    ctx.fillText(pu.type, pu.x, pu.y - 5);
    const tLeft = Math.ceil((5000 - (Date.now() - pu.spawnTime)) / 1000);
    ctx.fillText(`(${tLeft})`, pu.x + pu.width - 12, pu.y + pu.height + 12);
  });

  // UI
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText(`Health: ${player.health}`, 10, 30);
  ctx.fillText(`Score: ${player.score}`, 10, 60);
  ctx.fillText(`Wave: ${wave}`, 10, 90);
  ctx.fillText(`Time: ${Math.floor((Date.now() - startTime)/1000)}s`, 10, 120);

  // Check Game Over
  if (player.health <= 0) {
    return gameOver();
  }

  requestAnimationFrame(update);
}

function gameOver() {
  gameOverState = true;
  clearInterval(enemySpawnInterval);
  clearInterval(powerUpSpawnInterval);
  const nameInput = document.getElementById('p1Name');
  playerName = nameInput && nameInput.value.trim() ? nameInput.value.trim() : 'Player';
  const winnerSpan = document.getElementById('winnerName');
  if (winnerSpan) winnerSpan.textContent = playerName;
  const gameOverScreen = document.getElementById('gameOverScreen');
  if (gameOverScreen) gameOverScreen.classList.remove('hidden');
  const bgMusic = document.getElementById('bgMusic');
  if (bgMusic) bgMusic.pause();
}

function survivalStartGame() {
  console.log('Survival mode starting...');
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  attachEventListeners();
  const nameInput = document.getElementById('p1Name');
  playerName = nameInput && nameInput.value.trim() ? nameInput.value.trim() : 'Player';

  // Reset player state
  player.x = canvas.width/2 - 25;
  player.y = canvas.height - 100;
  player.health = 100;
  player.score = 0;
  player.bullets = [];
  player.shieldActive = false;
  player.speed = player.baseSpeed;
  player.lastShot = 0;
  player.dashCooldown = 0;

  // Clear arrays & states
  enemies.length = 0;
  enemyBullets.length = 0;
  powerUps.length = 0;
  gameOverState = false;
  paused = false;

  // Hide overlays
  const ov = document.getElementById('gameOverScreen'); if (ov) ov.classList.add('hidden');
  const ps = document.getElementById('pauseScreen'); if (ps) ps.classList.add('hidden');

  // Play background music
  const bgMusic = document.getElementById('bgMusic');
  if (bgMusic) {
    bgMusic.currentTime = 0;
    bgMusic.volume = document.getElementById('volumeSlider').value;
    bgMusic.play();
  }

  // Start timers
  startTime = Date.now();
  enemySpawnInterval = setInterval(spawnEnemy, 2000);
  powerUpSpawnInterval = setInterval(spawnPowerUp, 10000);

  // Start loop
  update();
}

function togglePause() {
  paused = !paused;
  const pauseScreen = document.getElementById('pauseScreen');
  if (pauseScreen) {
    if (paused) pauseScreen.classList.remove('hidden');
    else pauseScreen.classList.add('hidden');
  }
  const bgMusic = document.getElementById('bgMusic');
  if (paused) {
    pauseStartTime = Date.now();
    clearInterval(enemySpawnInterval);
    clearInterval(powerUpSpawnInterval);
    if (bgMusic) bgMusic.pause();
  } else {
    const pausedDuration = Date.now() - pauseStartTime;
    startTime += pausedDuration;
    enemySpawnInterval = setInterval(spawnEnemy, 2000);
    powerUpSpawnInterval = setInterval(spawnPowerUp, 10000);
    if (bgMusic) bgMusic.play();
    if (!gameOverState) requestAnimationFrame(update);
  }
}

function restartGame() {
  location.reload();
}

function playAgain() {
  clearInterval(enemySpawnInterval);
  clearInterval(powerUpSpawnInterval);
  paused = false;
  gameOverState = false;
  survivalStartGame();
}

// Expose globals
window.survivalStartGame = survivalStartGame;
window.togglePause = togglePause;
window.restartGame = restartGame;
window.playAgain = playAgain;
