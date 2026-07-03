const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hud = document.getElementById('hud');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');

const W = canvas.width, H = canvas.height;

// Game state
let state = 'ready'; // ready, playing, paused, gameover
let score = 0;
let best = Number(localStorage.getItem('flappyBest') || 0);

// Bird
const bird = {
  x: 90,
  y: H / 2,
  r: 14,
  vy: 0,
  gravity: 0.43,
  flapPower: -8,
  rotation: 0
};

// Pipes
const pipeWidth = 60;
const pipeGap = 150;
const pipeSpeed = 2.6;
let pipes = [];
let frame = 0;
let spawnInterval = 100;

// Ground
const groundHeight = 60;
let groundOffset = 0;

function resetGame() {
  bird.y = H / 2;
  bird.vy = 0;
  pipes = [];
  score = 0;
  frame = 0;
  hud.textContent = '0';
}

function spawnPipe() {
  const minTop = 50;
  const maxTop = H - groundHeight - pipeGap - 50;
  const topHeight = Math.random() * (maxTop - minTop) + minTop;
  pipes.push({
    x: W,
    top: topHeight,
    bottom: topHeight + pipeGap,
    passed: false
  });
}

function flap() {
  if (state === 'playing') {
    bird.vy = bird.flapPower;
  } else if (state === 'ready') {
    startGame();
    bird.vy = bird.flapPower;
  }
}

function startGame() {
  resetGame();
  state = 'playing';
  overlay.classList.add('hidden');
}

function gameOver() {
  state = 'gameover';
  if (score > best) {
    best = score;
    localStorage.setItem('flappyBest', best);
  }
  overlayTitle.textContent = 'Game Over';
  overlayText.innerHTML = `Score: ${score}<br>Best: ${best}`;
  startBtn.textContent = 'Play Again';
  overlay.classList.remove('hidden');
}

function togglePause() {
  if (state === 'playing') {
    state = 'paused';
    overlayTitle.textContent = 'Paused';
    overlayText.innerHTML = `Score: ${score}`;
    startBtn.textContent = 'Resume';
    overlay.classList.remove('hidden');
    pauseBtn.textContent = '▶ Resume';
  } else if (state === 'paused') {
    resumeGame();
  }
}

function resumeGame() {
  state = 'playing';
  overlay.classList.add('hidden');
  pauseBtn.textContent = '⏸ Pause';
}

function update() {
  if (state !== 'playing') return;

  frame++;

  // Bird physics
  bird.vy += bird.gravity;
  bird.y += bird.vy;
  bird.rotation = Math.max(-25, Math.min(90, bird.vy * 4));

  // Spawn pipes
  if (frame % spawnInterval === 0) spawnPipe();

  // Move pipes
  for (const p of pipes) {
    p.x -= pipeSpeed;

    // Scoring
    if (!p.passed && p.x + pipeWidth < bird.x) {
      p.passed = true;
      score++;
      hud.textContent = score;
    }

    // Collision
    if (
      bird.x + bird.r > p.x &&
      bird.x - bird.r < p.x + pipeWidth &&
      (bird.y - bird.r < p.top || bird.y + bird.r > p.bottom)
    ) {
      gameOver();
    }
  }

  // Remove offscreen pipes
  pipes = pipes.filter(p => p.x + pipeWidth > -10);

  // Ground / ceiling collision
  if (bird.y + bird.r > H - groundHeight) {
    bird.y = H - groundHeight - bird.r;
    gameOver();
  }
  if (bird.y - bird.r < 0) {
    bird.y = bird.r;
    bird.vy = 0;
  }

  groundOffset = (groundOffset - pipeSpeed) % 24;
}

function drawBackground() {
  // Sky blue background
  ctx.fillStyle = '#4EC0FF';
  ctx.fillRect(0, 0, W, H);

  // Simple clouds for depth
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  drawCloud(60, 90);
  drawCloud(250, 150);
  drawCloud(150, 60);
}

function drawCloud(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 16, 0, Math.PI * 2);
  ctx.arc(x + 18, y + 4, 20, 0, Math.PI * 2);
  ctx.arc(x + 36, y, 16, 0, Math.PI * 2);
  ctx.fill();
}

function drawPipes() {
  for (const p of pipes) {
    // Green pipes
    const grad = ctx.createLinearGradient(p.x, 0, p.x + pipeWidth, 0);
    grad.addColorStop(0, '#4CAF50');
    grad.addColorStop(0.5, '#7ED957');
    grad.addColorStop(1, '#4CAF50');
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#2E7D32';
    ctx.lineWidth = 3;

    // Top pipe
    ctx.fillRect(p.x, 0, pipeWidth, p.top);
    ctx.strokeRect(p.x, 0, pipeWidth, p.top);
    ctx.fillRect(p.x - 5, p.top - 20, pipeWidth + 10, 20);
    ctx.strokeRect(p.x - 5, p.top - 20, pipeWidth + 10, 20);

    // Bottom pipe
    ctx.fillRect(p.x, p.bottom, pipeWidth, H - groundHeight - p.bottom);
    ctx.strokeRect(p.x, p.bottom, pipeWidth, H - groundHeight - p.bottom);
    ctx.fillRect(p.x - 5, p.bottom, pipeWidth + 10, 20);
    ctx.strokeRect(p.x - 5, p.bottom, pipeWidth + 10, 20);
  }
}

function drawGround() {
  ctx.fillStyle = '#DEB887';
  ctx.fillRect(0, H - groundHeight, W, groundHeight);
  ctx.fillStyle = '#8B6F47';
  ctx.fillRect(0, H - groundHeight, W, 8);

  // Moving stripes for motion effect
  ctx.fillStyle = 'rgba(139,111,71,0.4)';
  for (let x = groundOffset; x < W; x += 24) {
    ctx.fillRect(x, H - groundHeight + 12, 12, 6);
  }
}

function drawBird() {
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rotation * Math.PI / 180);

  // Body
  ctx.fillStyle = '#FFD93D';
  ctx.beginPath();
  ctx.arc(0, 0, bird.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#E8A800';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Wing
  ctx.fillStyle = '#FFB800';
  ctx.beginPath();
  ctx.ellipse(-2, 2, 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(6, -4, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(7, -4, 2, 0, Math.PI * 2);
  ctx.fill();

  // Beak
  ctx.fillStyle = '#FF8C00';
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(20, -2);
  ctx.lineTo(20, 4);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function draw() {
  drawBackground();
  drawPipes();
  drawGround();
  drawBird();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// Input handlers
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    if (state === 'paused') { resumeGame(); return; }
    flap();
  }
  if (e.code === 'KeyP') togglePause();
});

canvas.addEventListener('mousedown', () => {
  if (state === 'playing' || state === 'ready') flap();
});

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (state === 'playing' || state === 'ready') flap();
});

startBtn.addEventListener('click', () => {
  if (state === 'paused') {
    resumeGame();
  } else {
    startGame();
  }
});

pauseBtn.addEventListener('click', togglePause);

// Init
overlayTitle.textContent = 'Flappy Bird';
overlayText.innerHTML = 'Press Space, Click, or Tap to flap.<br>Avoid the green pipes!';
startBtn.textContent = 'Start Game';
loop();