// ============================================
// FLAPPY BIRD CLONE - FULLY FUNCTIONAL
// ============================================

class FlappyBird {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Canvas dimensions
        this.W = 0;
        this.H = 0;
        this.resizeCanvas();
        
        // Game State
        this.gameState = 'START'; // START, PLAYING, PAUSED, GAME_OVER
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('flappyHighScore')) || 0;
        this.gameSpeed = 2;
        
        // Audio
        this.audioEnabled = true;
        this.audioCtx = null;
        this.initAudio();
        
        // Game Objects
        this.player = new Player(this);
        this.pipes = [];
        this.background = {
            clouds: []
        };
        
        // Timing
        this.lastTime = 0;
        this.pipeTimer = 0;
        
        // Event Listeners
        this.initEventListeners();
        
        // Initialize clouds
        this.initBackground();
        
        // Update UI
        this.updateUI();
        
        // Start game loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.W = this.canvas.width;
        this.H = this.canvas.height;
    }
    
    initAudio() {
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) {
            console.log('Audio not supported');
        }
    }
    
    playSound(type) {
        if (!this.audioEnabled || !this.audioCtx) return;
        
        try {
            const audioCtx = this.audioCtx;
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.type = 'sine';
            
            let freq, duration;
            switch(type) {
                case 'jump':
                    freq = 600;
                    duration = 0.1;
                    break;
                case 'point':
                    freq = 1000;
                    duration = 0.15;
                    break;
                case 'hit':
                    freq = 250;
                    duration = 0.2;
                    break;
            }
            
            oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
            
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + duration);
        } catch(e) {}
    }
    
    initEventListeners() {
        // Resize
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Game inputs
        const inputEvents = ['click', 'touchstart'];
        inputEvents.forEach(event => {
            this.canvas.addEventListener(event, (e) => {
                e.preventDefault();
                this.handleInput();
            }, { passive: false });
        });
        
        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleInput();
            }
        });
        
        // Sound toggle
        document.getElementById('soundToggle').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSound();
        });
        
        // Restart
        document.getElementById('restartBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.restart();
        });
    }
    
    initBackground() {
        for (let i = 0; i < 5; i++) {
            this.background.clouds.push({
                x: Math.random() * this.W,
                y: 50 + Math.random() * 100,
                radius: 20 + Math.random() * 20,
                speed: 0.3 + Math.random() * 0.3
            });
        }
    }
    
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
        this.pipeTimer = 0;
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
    
    updateUI() {
        document.querySelector('.current-score').textContent = this.score;
        document.querySelector('.high-score').textContent = `HIGH: ${this.highScore}`;
    }
    
    showScreen(id) {
        document.getElementById(id).classList.add('active');
    }
    
    hideScreen(id) {
        document.getElementById(id).classList.remove('active');
    }
    
    update(deltaTime) {
        if (this.gameState !== 'PLAYING') return;
        
        // Update player
        this.player.update();
        
        // Update pipes
        this.pipeTimer += deltaTime;
        if (this.pipeTimer > 1500) { // 1.5 seconds between pipes
            this.pipes.push(new Pipe(this));
            this.pipeTimer = 0;
        }
        
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            this.pipes[i].update(this.gameSpeed);
            if (this.pipes[i].x + this.pipes[i].width < -50) {
                this.pipes.splice(i, 1);
            }
        }
        
        // Update background
        this.background.clouds.forEach(cloud => {
            cloud.x -= cloud.speed;
            if (cloud.x + cloud.radius * 4 < 0) {
                cloud.x = this.W;
            }
        });
        
        // Check collisions
        this.checkCollisions();
        
        // Update score
        this.checkScore();
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.W, this.H);
        
        // Background
        this.renderBackground();
        
        // Pipes
        this.pipes.forEach(pipe => pipe.render(this.ctx));
        
        // Player
        this.player.render(this.ctx);
        
        // Ground
        this.renderGround();
    }
    
    renderBackground() {
        // Clouds
        this.background.clouds.forEach(cloud => {
            this.ctx.fillStyle = 'rgba(255,255,255,0.85)';
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.radius * 0.7, cloud.y, cloud.radius * 0.8, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.radius * 1.4, cloud.y, cloud.radius * 1.1, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.radius * 0.7, cloud.y + cloud.radius * 0.5, cloud.radius * 0.9, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    renderGround() {
        const groundY = this.H - 60;
        
        // Grass
        this.ctx.fillStyle = '#8BC34A';
        this.ctx.fillRect(0, groundY, this.W, 60);
        
        // Grass pattern
        this.ctx.fillStyle = '#689F38';
        for (let x = 0; x < this.W; x += 35) {
            this.ctx.fillRect(x, groundY, 25, 60);
        }
    }
    
    checkCollisions() {
        const player = this.player;
        const playerBox = {
            left: player.x,
            right: player.x + player.size,
            top: player.y,
            bottom: player.y + player.size
        };
        
        // Ground collision
        if (player.y + player.size > this.H - 60) {
            this.gameOver();
            return;
        }
        
        // Pipe collision
        for (let pipe of this.pipes) {
            const pipeBox = {
                left: pipe.x,
                right: pipe.x + pipe.width,
                topHeight: pipe.topHeight,
                bottomTop: this.H - 60 - pipe.bottomHeight
            };
            
            if (playerBox.right > pipeBox.left && 
                playerBox.left < pipeBox.right &&
                (playerBox.bottom < pipeBox.topHeight || 
                 playerBox.top > pipeBox.bottomTop)) {
                this.gameOver();
                return;
            }
        }
    }
    
    checkScore() {
        for (let pipe of this.pipes) {
            if (!pipe.scored && pipe.x + pipe.width < this.player.x) {
                pipe.scored = true;
                this.score++;
                this.gameSpeed = Math.min(this.gameSpeed + 0.05, 4);
                this.playSound('point');
                this.updateUI();
            }
        }
    }
    
    gameLoop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

class Player {
    constructor(game) {
        this.game = game;
        this.x = 80;
        this.y = 200;
        this.size = 32;
        this.velocity = 0;
        this.gravity = 0.4;
        this.jumpPower = -9;
        this.rotation = 0;
        this.wingFlap = 0;
        this.reset();
    }
    
    reset() {
        this.y = this.game.H * 0.4;
        this.velocity = 0;
        this.rotation = 0;
    }
    
    update() {
        this.velocity += this.gravity;
        this.y += this.velocity;
        this.rotation = Math.max(Math.min(this.velocity * 0.08, 0.4), -0.2);
        this.wingFlap = Math.sin(Date.now() * 0.015) * 3;
    }
    
    jump() {
        this.velocity = this.jumpPower;
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x + this.size/2, this.y + this.size/2);
        ctx.rotate(this.rotation);
        
        // Body
        const gradient = ctx.createRadialGradient(0, -2, 0, 0, 0, this.size/2);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.6, '#FFA500');
        gradient.addColorStop(1, '#FF8C00');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.size/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Wing
        ctx.fillStyle = '#FF6347';
        ctx.beginPath();
        ctx.ellipse(-5, this.wingFlap * 0.3, 14, 8, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(8, -4, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(10, -4, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Beak
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.moveTo(16, -1);
        ctx.lineTo(25, 0);
        ctx.lineTo(16, 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class Pipe {
    constructor(game) {
        this.game = game;
        this.width = 55;
        this.gap = 150;
        this.x = game.W;
        this.scored = false;
        
        // Random gap position
        const minGapTop = 80;
        const maxGapTop = game.H - 200;
        this.topHeight = minGapTop + Math.random() * (maxGapTop - minGapTop);
        this.bottomHeight = game.H - 60 - this.topHeight - this.gap;
    }
    
    update(speed) {
        this.x -= speed;
    }
    
    render(ctx) {
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 4;
        
        const gradientTop = ctx.createLinearGradient(this.x, 0, this.x + this.width, 0);
        gradientTop.addColorStop(0, '#56ab2f');
        gradientTop.addColorStop(1, '#4CAF50');
        
        const gradientBottom = ctx.createLinearGradient(this.x, this.game.H, this.x + this.width, this.game.H);
        gradientBottom.addColorStop(0, '#4CAF50');
        gradientBottom.addColorStop(1, '#56ab2f');
        
        // Top pipe
        ctx.fillStyle = gradientTop;
        ctx.fillRect(this.x, 0, this.width, this.topHeight);
        ctx.fillRect(this.x - 8, this.topHeight - 25, this.width + 16, 25);
        
        // Bottom pipe
        ctx.fillStyle = gradientBottom;
        ctx.fillRect(this.x, this.game.H - 60 - this.bottomHeight, this.width, this.bottomHeight);
        ctx.fillRect(this.x - 8, this.game.H - 60 - this.bottomHeight, this.width + 16, 25);
        
        ctx.restore();
    }
}

// ============================================
// START GAME
// ============================================

window.addEventListener('load', () => {
    new FlappyBird();
});

// Prevent zoom on double tap (mobile)
let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);
