// ============================================
// FLAPPY BIRD CLONE - MAIN GAME ENGINE
// ============================================

class FlappyBird {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        // Game State
        this.gameState = 'START'; // START, PLAYING, GAME_OVER, PAUSED
        this.score = 0;
        this.highScore = localStorage.getItem('flappyHighScore') || 0;
        this.gameSpeed = 2;
        
        // Audio Context
        this.audioEnabled = true;
        this.sounds = {};
        this.initAudio();
        
        // Game Objects
        this.player = new Player(this);
        this.pipes = [];
        this.background = {
            clouds: [],
            hills: []
        };
        
        // Event Listeners
        this.initEventListeners();
        
        // Update UI
        this.updateUI();
        
        // Game Loop
        this.lastTime = 0;
        this.gameLoop(0);
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    resizeCanvas() {
        const rect = this.canvas.getParentNode().getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.W = this.canvas.width;
        this.H = this.canvas.height;
    }
    
    initAudio() {
        // Simple oscillator-based sound effects
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    playSound(type) {
        if (!this.audioEnabled || !this.audioCtx) return;
        
        const audioCtx = this.audioCtx;
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        switch(type) {
            case 'jump':
                oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
                break;
                
            case 'point':
                oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
                break;
                
            case 'hit':
                oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
                break;
        }
        
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.2);
    }
    
    initEventListeners() {
        // Resize handler
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Input handlers
        const inputs = ['click', 'keydown', 'touchstart'];
        inputs.forEach(event => {
            this.canvas.addEventListener(event, (e) => {
                e.preventDefault();
                this.handleInput();
            });
        });
        
        // Sound toggle
        document.getElementById('soundToggle').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSound();
        });
        
        // Restart button
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restart();
        });
    }
    
    // ============================================
    // GAME LOGIC
    // ============================================
    
    handleInput() {
        switch(this.gameState) {
            case 'START':
                this.startGame();
                break;
            case 'PLAYING':
                this.player.jump();
                this.playSound('jump');
                break;
            case 'PAUSED':
                this.resumeGame();
                break;
            case 'GAME_OVER':
                this.restart();
                break;
        }
    }
    
    startGame() {
        this.gameState = 'PLAYING';
        this.score = 0;
        this.gameSpeed = 2;
        this.player.reset();
        this.pipes = [];
        this.updateUI();
        this.hideScreen('startScreen');
    }
    
    pauseGame() {
        this.gameState = 'PAUSED';
        this.showScreen('pauseScreen');
    }
    
    resumeGame() {
        this.gameState = 'PLAYING';
        this.hideScreen('pauseScreen');
    }
    
    gameOver() {
        this.gameState = 'GAME_OVER';
        this.playSound('hit');
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('flappyHighScore', this.highScore);
        }
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalHighScore').textContent = this.highScore;
        this.showScreen('gameOverScreen');
        this.updateUI();
    }
    
    restart() {
        this.startGame();
        this.hideScreen('gameOverScreen');
    }
    
    toggleSound() {
        this.audioEnabled = !this.audioEnabled;
        const btn = document.getElementById('soundToggle');
        btn.textContent = this.audioEnabled ? '🔊' : '🔇';
        btn.classList.toggle('muted', !this.audioEnabled);
    }
    
    // ============================================
    // UI CONTROL
    // ============================================
    
    updateUI() {
        document.querySelector('.current-score').textContent = this.score;
        document.querySelector('.high-score').textContent = `HIGH: ${this.highScore}`;
    }
    
    showScreen(screenId) {
        document.getElementById(screenId).classList.add('active');
    }
    
    hideScreen(screenId) {
        document.getElementById(screenId).classList.remove('active');
    }
    
    // ============================================
    // UPDATE & RENDER
    // ============================================
    
    update(deltaTime) {
        if (this.gameState !== 'PLAYING') return;
        
        // Update player
        this.player.update(deltaTime);
        
        // Update pipes
        this.updatePipes();
        
        // Update background
        this.updateBackground();
        
        // Check collisions
        this.checkCollisions();
        
        // Update score
        this.updateScore();
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.W, this.H);
        
        // Render background
        this.renderBackground();
        
        // Render pipes
        this.pipes.forEach(pipe => pipe.render(this.ctx));
        
        // Render player
        this.player.render(this.ctx);
    }
    
    gameLoop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    // ============================================
    // PIPES SYSTEM
    // ============================================
    
    updatePipes() {
        // Add new pipes
        if (this.pipes.length === 0 || this.pipes[this.pipes.length - 1].x < this.W - 200) {
            this.pipes.push(new Pipe(this));
        }
        
        // Update existing pipes
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            this.pipes[i].update(this.gameSpeed);
            
            // Remove off-screen pipes
            if (this.pipes[i].x + this.pipes[i].width < 0) {
                this.pipes.splice(i, 1);
            }
        }
    }
    
    updateScore() {
        this.pipes.forEach(pipe => {
            if (!pipe.scored && pipe.x + pipe.width < this.player.x) {
                pipe.scored = true;
                this.score++;
                this.gameSpeed += 0.1;
                this.playSound('point');
                this.updateUI();
            }
        });
    }
    
    checkCollisions() {
        // Ground collision
        if (this.player.y + this.player.size > this.H - 50) {
            this.gameOver();
            return;
        }
        
        // Pipe collision
        for (let pipe of this.pipes) {
            if (this.player.x < pipe.x + pipe.width &&
                this.player.x + this.player.size > pipe.x &&
                (this.player.y < pipe.topHeight || 
                 this.player.y + this.player.size > this.H - 50 - pipe.bottomHeight)) {
                this.gameOver();
                return;
            }
        }
    }
    
    // ============================================
    // BACKGROUND SYSTEM
    // ============================================
    
    updateBackground() {
        // Animate clouds
        this.background.clouds.forEach(cloud => {
            cloud.x -= 0.5;
            if (cloud.x + cloud.width < 0) {
                cloud.x = this.W;
            }
        });
    }
    
    renderBackground() {
        // Sky gradient (handled in CSS)
        
        // Clouds
        this.background.clouds.forEach(cloud => {
            this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.radius, cloud.y, cloud.radius, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.radius * 2, cloud.y, cloud.radius, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.radius, cloud.y + cloud.radius, cloud.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Ground
        this.ctx.fillStyle = '#8BC34A';
        this.ctx.fillRect(0, this.H - 50, this.W, 50);
        
        // Ground pattern
        this.ctx.fillStyle = '#689F38';
        for (let x = 0; x < this.W; x += 35) {
            this.ctx.fillRect(x, this.H - 50, 20, 50);
        }
    }
}

// ============================================
// PLAYER CLASS
// ============================================

class Player {
    constructor(game) {
        this.game = game;
        this.reset();
    }
    
    reset() {
        this.x = 80;
        this.y = this.game.H / 2 - 20;
        this.size = 34;
        this.velocity = 0;
        this.gravity = 0.5;
        this.jumpPower = -10;
        this.rotation = 0;
        this.bobOffset = 0;
    }
    
    update(deltaTime) {
        // Apply gravity
        this.velocity += this.gravity;
        this.y += this.velocity;
        
        // Rotation based on velocity
        this.rotation = Math.min(Math.max(this.velocity * 0.1, -0.5), 0.3);
        
        // Wing flap animation
        this.bobOffset = Math.sin(Date.now() * 0.01) * 2;
    }
    
    jump() {
        this.velocity = this.jumpPower;
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x + this.size/2, this.y + this.size/2);
        ctx.rotate(this.rotation);
        
        // Bird body (gradient yellow)
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size/2);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.7, '#FFA500');
        gradient.addColorStop(1, '#FF8C00');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.size/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Wing (animated)
        ctx.fillStyle = '#FF4500';
        ctx.beginPath();
        ctx.ellipse(-8, this.bobOffset * 0.5, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(8, -5, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(10, -5, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Beak
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.moveTo(18, -2);
        ctx.lineTo(28, 0);
        ctx.lineTo(18, 3);
        ctx.fill();
        
        ctx.restore();
    }
}

// ============================================
// PIPE CLASS
// ============================================

class Pipe {
    constructor(game) {
        this.game = game;
        this.width = 60;
        this.gap = 160;
        this.speed = 2;
        
        // Random gap position
        const minHeight = 50;
        const maxHeight = game.H - 50 - this.gap - minHeight;
        this.topHeight = minHeight + Math.random() * (maxHeight - minHeight);
        this.bottomHeight = game.H - 50 - this.topHeight - this.gap;
        
        this.x = game.W;
        this.scored = false;
    }
    
    update(speed) {
        this.x -= speed;
    }
    
    render(ctx) {
        // Top pipe
        ctx.fillStyle = '#4CAF50';
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;
        
        ctx.fillRect(this.x, 0, this.width, this.topHeight);
        
        // Top pipe cap
        ctx.fillRect(this.x - 5, this.topHeight - 30, this.width + 10, 30);
        
        // Bottom pipe
        ctx.fillRect(this.x, this.game.H - 50 - this.bottomHeight, this.width, this.bottomHeight);
        ctx.fillRect(this.x - 5, this.game.H - 50 - this.bottomHeight, this.width + 10, 30);
        
        ctx.shadowBlur = 0;
    }
}

// ============================================
// INITIALIZE GAME
// ============================================

// Initialize clouds
const game = new FlappyBird();
game.background.clouds = [
    {x: 100, y: 100, radius: 30, width: 90},
    {x: 300, y: 150, radius: 25, width: 75},
    {x: 500, y: 80, radius: 35, width: 105},
    {x: 700, y: 120, radius: 28, width: 84}
];

// Prevent context menu on long press
document.addEventListener('contextmenu', e => e.preventDefault());
