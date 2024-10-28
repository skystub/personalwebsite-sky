class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupGame();
        this.setupSounds();
        this.setupControls();
        this.setupPlayAgainButton(); // Add this new line
        this.update();
    }

    // Add this new method
    setupPlayAgainButton() {
        const playAgainBtn = document.getElementById('playAgainBtn');
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                this.restart();
            });
        }
    }

    setupGame() {
        this.score = 0;
        this.gameSpeed = 2;
        this.isGameOver = false;
        
        // Player properties
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            width: 30,
            height: 30,
            speed: 15  // Faster initial speed
        };
        
        // Game objects
        this.stars = [];
        this.obstacles = [];
        this.starSpawnTimer = 0;
        this.obstacleSpawnTimer = 0;
        this.starSpawnInterval = 60;
        this.obstacleSpawnInterval = 120;
    }

    setupSounds() {
        let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        this.playCollectSound = () => {
            let oscillator = audioCtx.createOscillator();
            let gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.frequency.value = 800;
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.1);
        };

        this.playExplosionSound = () => {
            let oscillator = audioCtx.createOscillator();
            let gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.frequency.value = 100;
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.3);
        };
    }

    spawnStar() {
        this.stars.push({
            x: Math.random() * (this.canvas.width - 20),
            y: -20,
            width: 20,
            height: 20,
            speed: 1 + Math.random() * 2
        });
    }

    spawnObstacle() {
        const width = 30;
        this.obstacles.push({
            x: Math.random() * (this.canvas.width - width),
            y: -20,
            width: width,
            height: width,
            speed: 2 + Math.random() * 2
        });
    }

    drawStar(star) {
        this.ctx.save();
        this.ctx.translate(star.x + star.width/2, star.y + star.height/2);
        this.ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            this.ctx.rotate(Math.PI * 2/5);
            this.ctx.lineTo(0, star.width/2);
            this.ctx.lineTo(0, star.width/4);
        }
        this.ctx.closePath();
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fill();
        this.ctx.restore();
    }

    drawObstacle(obstacle) {
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }

    drawPlayer() {
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x, this.player.y);
        this.ctx.lineTo(this.player.x + this.player.width/2, this.player.y + this.player.height);
        this.ctx.lineTo(this.player.x - this.player.width/2, this.player.y + this.player.height);
        this.ctx.closePath();
        this.ctx.fillStyle = '#4169E1';
        this.ctx.fill();
    }

    drawScore() {
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${this.score}`, 10, 30);
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (this.isGameOver) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.player.x = Math.max(this.player.width/2, 
                        this.player.x - this.player.speed);
                    break;
                case 'ArrowRight':
                    this.player.x = Math.min(this.canvas.width - this.player.width/2, 
                        this.player.x + this.player.speed);
                    break;
            }
        });
    }

    checkCollisions() {
        // Check star collisions
        for (let i = this.stars.length - 1; i >= 0; i--) {
            const star = this.stars[i];
            if (this.checkCollision(this.player, star)) {
                this.stars.splice(i, 1);
                this.score += 10;
                this.gameSpeed += 0.1;
                this.playCollectSound();
            }
        }

        // Check obstacle collisions
        for (const obstacle of this.obstacles) {
            if (this.checkCollision(this.player, obstacle)) {
                this.gameOver();
                return;
            }
        }
    }

    checkCollision(obj1, obj2) {
        return obj1.x - obj1.width/2 < obj2.x + obj2.width &&
               obj1.x + obj1.width/2 > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }

    gameOver() {
        this.isGameOver = true;
        this.playExplosionSound();
        document.getElementById('gameOver').style.display = 'block';
        document.getElementById('finalScore').textContent = this.score;
    }

    restart() {
        document.getElementById('gameOver').style.display = 'none';
        this.setupGame();
        this.stars = [];
        this.obstacles = [];
        this.starSpawnTimer = 0;
        this.obstacleSpawnTimer = 0;
        this.gameSpeed = 2;
        this.isGameOver = false;
    }

    update() {
        if (this.isGameOver) {
            requestAnimationFrame(() => this.update());
            return;
        }

        // Clear canvas
        this.ctx.fillStyle = '#000033';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Spawn new objects
        this.starSpawnTimer++;
        this.obstacleSpawnTimer++;

        if (this.starSpawnTimer >= this.starSpawnInterval) {
            this.spawnStar();
            this.starSpawnTimer = 0;
        }

        if (this.obstacleSpawnTimer >= this.obstacleSpawnInterval) {
            this.spawnObstacle();
            this.obstacleSpawnTimer = 0;
            // Decrease spawn interval as game progresses
            this.obstacleSpawnInterval = Math.max(60, this.obstacleSpawnInterval - 1);
        }

        // Update and draw stars
        for (let i = this.stars.length - 1; i >= 0; i--) {
            const star = this.stars[i];
            star.y += star.speed * this.gameSpeed;
            
            if (star.y > this.canvas.height) {
                this.stars.splice(i, 1);
                continue;
            }
            
            this.drawStar(star);
        }

        // Update and draw obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.y += obstacle.speed * this.gameSpeed;
            
            if (obstacle.y > this.canvas.height) {
                this.obstacles.splice(i, 1);
                continue;
            }
            
            this.drawObstacle(obstacle);
        }

        this.checkCollisions();
        this.drawPlayer();
        this.drawScore();

        requestAnimationFrame(() => this.update());
    }
}

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    document.Game = new Game();
});