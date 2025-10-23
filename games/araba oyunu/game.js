const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let roadOffset = 0;
let player, enemies = [], powerups = [], score = 0, gameSpeed = 2;
let gameRunning = false;
let isPaused = false;
let keys = {};
let difficulty = 'medium';

let lastEnemyTime = 0;
let lastPowerupTime = 0;
let lastScoreTime = 0;

const playerImage = new Image();
playerImage.src = 'assets/player.png';

const enemyImages = ['assets/enemy1.png', 'assets/enemy2.png', 'assets/enemy3.png'].map(src => {
  const img = new Image();
  img.src = src;
  return img;
});

const powerupImage = new Image();
powerupImage.src = 'assets/powerup.png';

function startGame(selectedDifficulty) {
  difficulty = selectedDifficulty;
  document.getElementById('startScreen').style.display = 'none';
  canvas.style.display = 'block';
  document.getElementById('scoreDisplay').style.display = 'block';

  resetGame();
  gameRunning = true;
  requestAnimationFrame(gameLoop);
}

function resetGame() {
  enemies = [];
  powerups = [];
  score = 0;
  isPaused = false;

  gameSpeed = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 5;

  player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 100,
    width: 50,
    height: 80,
    speed: 5
  };

  lastEnemyTime = performance.now();
  lastPowerupTime = performance.now();
  lastScoreTime = performance.now();

  document.getElementById('scoreDisplay').textContent = 'Skor: 0';
}

function spawnEnemy() {
  const width = 50, height = 80;
  const x = Math.random() * (canvas.width - width);
  const y = -height;
  const image = enemyImages[Math.floor(Math.random() * enemyImages.length)];
  enemies.push({ x, y, width, height, speed: gameSpeed, image });
}

function spawnPowerup() {
  if (Math.random() < 0.4) return;
  const width = 30, height = 30;
  const x = Math.random() * (canvas.width - width);
  const y = -height;
  powerups.push({ x, y, width, height, speed: gameSpeed });
}

function update(currentTime) {
  if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
  if (keys['ArrowRight'] && player.x + player.width < canvas.width) player.x += player.speed;
  if (keys['ArrowUp'] && player.y > 0) player.y -= player.speed;
  if (keys['ArrowDown'] && player.y + player.height < canvas.height) player.y += player.speed;

  // Zaman tabanlı düşman üretimi
  if (currentTime - lastEnemyTime > 500) {
    spawnEnemy();
    lastEnemyTime = currentTime;
  }

  // Zaman tabanlı power-up üretimi
  if (currentTime - lastPowerupTime > 15000) {
    spawnPowerup();
    lastPowerupTime = currentTime;
  }

  // Zaman tabanlı skor artışı
  if (currentTime - lastScoreTime > 1000) {
    score++;
    document.getElementById('scoreDisplay').textContent = `Skor: ${score}`;
    lastScoreTime = currentTime;

    if (score % 10 === 0) {
      gameSpeed += 0.5;
      enemies.forEach(e => e.speed = gameSpeed);
      powerups.forEach(p => p.speed = gameSpeed);
    }
  }

  enemies.forEach(enemy => enemy.y += enemy.speed);
  enemies = enemies.filter(e => e.y < canvas.height + e.height);

  enemies.forEach(enemy => {
    if (checkCollision(player, enemy)) gameOver();
  });

  powerups.forEach(p => p.y += p.speed);
  powerups = powerups.filter(p => {
    if (checkCollision(player, p)) {
      score += 5;
      document.getElementById('scoreDisplay').textContent = `Skor: ${score}`;
      return false;
    }
    return p.y < canvas.height;
  });

  roadOffset += gameSpeed;
  if (roadOffset > 60) roadOffset = 0;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#444';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'white';
  ctx.lineWidth = 5;
  ctx.setLineDash([40, 20]);
  ctx.lineDashOffset = -roadOffset;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);

  enemies.forEach(enemy => {
    ctx.drawImage(enemy.image, enemy.x, enemy.y, enemy.width, enemy.height);
  });

  powerups.forEach(p => {
    ctx.drawImage(powerupImage, p.x, p.y, p.width, p.height);
  });

  if (isPaused) drawPauseScreen();
}

function drawPauseScreen() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'white';
  ctx.font = '40px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Oyun Duraklatıldı', canvas.width / 2, canvas.height / 2);
  ctx.font = '20px Arial';
  ctx.fillText('Devam etmek için Boşluk (Space) tuşuna bas', canvas.width / 2, canvas.height / 2 + 40);
}

function gameLoop(currentTime) {
  if (!gameRunning) return;
  if (!isPaused) {
    update(currentTime);
    draw();
    requestAnimationFrame(gameLoop);
  } else {
    draw(); // Son durumu çiz
  }
}

function gameOver() {
  gameRunning = false;
  document.getElementById('gameOverScreen').style.display = 'flex';
  document.getElementById('finalScore').textContent = `Skorun: ${score}`;
}

function restartGame() {
  document.getElementById('gameOverScreen').style.display = 'none';
  startGame(difficulty);
}

function checkCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

document.addEventListener('keydown', e => {
  keys[e.key] = true;

  if (e.code === 'Space') {
    isPaused = !isPaused;
    if (!isPaused && gameRunning) {
      requestAnimationFrame(gameLoop);
    }
  }
});

document.addEventListener('keyup', e => {
  keys[e.key] = false;
});
