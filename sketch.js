let player1, player2;
let p1Sprites = {};
let p2Sprites = {};
let bgImage;

// 在檔案開頭添加地面高度常數
const GROUND_Y = window.innerHeight / 1.25;
const SCALE_FACTOR = 2.5; // 整體放大倍數

// 在檔案開頭添加物理相關常數
const GRAVITY = 0.8;
const JUMP_FORCE = -20;
const MOVE_SPEED = 8;

// 添加新的常數
const MAX_HP = 100;
const SCREEN_PADDING = 50; // 螢幕邊界padding

// 在檔案開頭添加新常數
const PROJECTILE_SPEED = 15;
const PROJECTILE_DAMAGE = 10;

// 角色類別
class Fighter {
  constructor(x, y, sprites, config, isPlayer1) {
    this.x = x;
    this.y = y;
    this.sprites = sprites;
    this.config = config;
    this.currentAnimation = 'idle';
    this.frame = 0;
    this.frameCounter = 0;
    this.direction = 1;
    this.scale = SCALE_FACTOR;
    
    // 添加物理相關屬性
    this.velocityY = 0;
    this.isJumping = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.hp = MAX_HP;
    this.isPlayer1 = isPlayer1;
    this.isAttacking = false;
    this.attackBox = {
      width: 60,
      height: 50
    };
    this.projectiles = [];
  }

  update() {
    // 處理跳躍物理
    if (this.isJumping) {
      this.velocityY += GRAVITY;
      this.y += this.velocityY;

      // 著地檢測
      if (this.y >= GROUND_Y) {
        this.y = GROUND_Y;
        this.velocityY = 0;
        this.isJumping = false;
        if (!this.moveLeft && !this.moveRight) {
          this.currentAnimation = 'idle';
        }
      }
    }

    // 處理左右移動
    if (this.moveLeft) {
      const nextX = this.x - MOVE_SPEED;
      if (nextX > SCREEN_PADDING) {  // 檢查左邊界
        this.x = nextX;
      }
      this.direction = 1;
      if (!this.isJumping) this.currentAnimation = 'idle';
    }
    if (this.moveRight) {
      const nextX = this.x + MOVE_SPEED;
      if (nextX < windowWidth - SCREEN_PADDING) {  // 檢查右邊界
        this.x = nextX;
      }
      this.direction = -1;
      if (!this.isJumping) this.currentAnimation = 'idle';
    }

    // 檢查攻擊碰撞
    if (this.isAttacking) {
      this.checkAttackHit();
    }

    // 更新所有投射物
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      projectile.update();
      
      // 檢查是否擊中對手
      const opponent = this.isPlayer1 ? player2 : player1;
      if (projectile.checkHit(opponent)) {
        opponent.takeDamage(PROJECTILE_DAMAGE);
        projectile.active = false;
        
        // 擊退效果
        const knockbackForce = 10;
        opponent.x += knockbackForce * projectile.direction;
        opponent.x = Math.max(SCREEN_PADDING, Math.min(windowWidth - SCREEN_PADDING, opponent.x));
      }
      
      // 移除無效的投射物
      if (!projectile.active) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  checkAttackHit() {
    const opponent = this.isPlayer1 ? player2 : player1;
    
    // 計算當前角色的碰撞箱
    const myBox = {
      x: this.x - (this.config[this.currentAnimation].width * this.scale) / 2,
      y: this.y - this.config[this.currentAnimation].height * this.scale,
      width: this.config[this.currentAnimation].width * this.scale,
      height: this.config[this.currentAnimation].height * this.scale
    };

    // 計算對手的碰撞箱
    const opponentBox = {
      x: opponent.x - (opponent.config[opponent.currentAnimation].width * opponent.scale) / 2,
      y: opponent.y - opponent.config[opponent.currentAnimation].height * opponent.scale,
      width: opponent.config[opponent.currentAnimation].width * opponent.scale,
      height: opponent.config[opponent.currentAnimation].height * opponent.scale
    };

    // 檢查碰撞
    if (this.checkCollision(myBox, opponentBox)) {
      if (!opponent.isHit && this.isAttacking) {
        opponent.takeDamage(10);
        opponent.isHit = true;
        
        // 擊退效果
        const knockbackForce = 20;
        const direction = this.direction;
        opponent.x += knockbackForce * direction;
        
        // 確保擊退不會超出螢幕邊界
        opponent.x = Math.max(SCREEN_PADDING, Math.min(windowWidth - SCREEN_PADDING, opponent.x));
      }
    }
  }

  // 添加碰撞檢測輔助方法
  checkCollision(box1, box2) {
    return box1.x < box2.x + box2.width &&
           box1.x + box1.width > box2.x &&
           box1.y < box2.y + box2.height &&
           box1.y + box1.height > box2.y;
  }

  takeDamage(damage) {
    this.hp = Math.max(0, this.hp - damage);
    
    // 受傷閃爍效果
    this.isHit = true;
    setTimeout(() => {
      this.isHit = false;
    }, 200);

    // 如果血量歸零
    if (this.hp <= 0) {
      this.handleDeath();
    }
  }

  attack() {
    if (!this.isAttacking) {
      this.currentAnimation = 'attack';
      this.isAttacking = true;
      this.frame = 0;
      
      // 修改發射位置的計算，根據方向調整
      const projectileX = this.x + (this.direction === 1 ? -50 : 50); // 修改這行
      const projectileY = this.y - 50;
      this.projectiles.push(new Projectile(projectileX, projectileY, -this.direction, this.isPlayer1)); // 修改這行，加上負號
      
      // 重置攻擊狀態
      setTimeout(() => {
        this.isAttacking = false;
        if (!this.isJumping) {
          this.currentAnimation = 'idle';
        }
      }, 500);
    }
  }

  drawHP() {
    push();
    const hpBarWidth = 200;
    const hpBarHeight = 25;
    const x = this.isPlayer1 ? 50 : windowWidth - 250;
    const y = 30;
    
    // 血條外框陰影
    fill(0, 100);
    rect(x + 3, y + 3, hpBarWidth, hpBarHeight, 5);
    
    // 血條外框
    stroke(200);
    strokeWeight(2);
    fill(40);
    rect(x, y, hpBarWidth, hpBarHeight, 5);
    
    // 血量
    noStroke();
    const hpWidth = (this.hp / MAX_HP) * (hpBarWidth - 4);
    const hpColor = this.hp > 70 ? color(50, 255, 50) :
                    this.hp > 30 ? color(255, 165, 0) :
                    color(255, 50, 50);
    
    // 血量條漸層效果
    const gradient = drawingContext.createLinearGradient(x, y, x, y + hpBarHeight);
    gradient.addColorStop(0, color(255, 255, 255, 100));
    gradient.addColorStop(1, color(0, 0, 0, 50));
    
    fill(hpColor);
    rect(x + 2, y + 2, hpWidth, hpBarHeight - 4, 3);
    drawingContext.fillStyle = gradient;
    rect(x + 2, y + 2, hpWidth, hpBarHeight - 4, 3);
    
    // 血量數字
    fill(255);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(16);
    text(this.hp + '%', x + hpBarWidth/2, y + hpBarHeight/2);
    
    // 玩家標籤
    textAlign(this.isPlayer1 ? LEFT : RIGHT);
    textSize(20);
    fill(this.isPlayer1 ? color(255, 100, 100) : color(100, 100, 255));
    text(this.isPlayer1 ? 'PLAYER 1' : 'PLAYER 2', 
         this.isPlayer1 ? x : x + hpBarWidth, y - 25);
    pop();
  }

  jump() {
    if (!this.isJumping) {
      this.velocityY = JUMP_FORCE;
      this.isJumping = true;
      this.currentAnimation = 'jump';
    }
  }

  animate() {
    const currentConfig = this.config[this.currentAnimation];
    this.frameCounter++;
    
    if (this.frameCounter >= currentConfig.frameDelay) {
      this.frame = (this.frame + 1) % currentConfig.frames;
      this.frameCounter = 0;
    }

    push();
    translate(this.x, this.y);
    
    // 修改受傷閃爍效果
    if (this.isHit) {
      // 改為暗紅色調
      tint(139, 0, 0, 200);  // RGB(139, 0, 0) 是暗紅色，200是透明度
    }
    
    scale(this.direction * this.scale, this.scale);
    
    const frameWidth = this.sprites[this.currentAnimation].width / currentConfig.frames;
    const offsetY = currentConfig.offsetY || 0;
    
    image(
      this.sprites[this.currentAnimation],
      -currentConfig.width/2,
      -currentConfig.height + offsetY,
      currentConfig.width,
      currentConfig.height,
      frameWidth * this.frame,
      0,
      frameWidth,
      this.sprites[this.currentAnimation].height
    );
    pop();

    // 繪製所有投射物
    this.projectiles.forEach(projectile => {
      projectile.draw();
    });
  }

  // 添加死亡處理方法
  handleDeath() {
    // 遊戲結束，顯示獲勝者
    const winner = this.isPlayer1 ? "Player 2" : "Player 1";
    this.showGameOver(winner);
  }

  // 添加遊戲結束顯示方法
  showGameOver(winner) {
    push();
    textAlign(CENTER, CENTER);
    textSize(64);
    fill(255);
    text(winner + " Wins!", windowWidth/2, windowHeight/2);
    
    textSize(32);
    text("Press R to restart", windowWidth/2, windowHeight/2 + 50);
    pop();
    
    noLoop(); // 停止遊戲循環
  }
}

class Projectile {
  constructor(x, y, direction, isPlayer1) {
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.width = 30;
    this.height = 20;
    this.isPlayer1 = isPlayer1;
    this.active = true;
  }

  update() {
    this.x += PROJECTILE_SPEED * this.direction;
    
    // 如果超出螢幕範圍則移除
    if (this.x < 0 || this.x > windowWidth) {
      this.active = false;
    }
  }

  draw() {
    push();
    // 根據不同玩家繪製不同顏色的特效
    fill(this.isPlayer1 ? color(255, 0, 0, 200) : color(0, 0, 255, 200));
    noStroke();
    // 繪製橢圓形特效
    ellipse(this.x, this.y, this.width, this.height);
    pop();
  }

  checkHit(opponent) {
    if (!this.active) return false;
    
    // 計算對手的碰撞箱
    const opponentBox = {
      x: opponent.x - (opponent.config[opponent.currentAnimation].width * opponent.scale) / 2,
      y: opponent.y - opponent.config[opponent.currentAnimation].height * opponent.scale,
      width: opponent.config[opponent.currentAnimation].width * opponent.scale,
      height: opponent.config[opponent.currentAnimation].height * opponent.scale
    };

    // 檢查碰撞
    if (this.x + this.width/2 > opponentBox.x &&
        this.x - this.width/2 < opponentBox.x + opponentBox.width &&
        this.y + this.height/2 > opponentBox.y &&
        this.y - this.height/2 < opponentBox.y + opponentBox.height) {
      return true;
    }
    return false;
  }
}

// 角色動作配置
const player1Config = {
  idle: {
    frames: 3,          // 動畫幀數
    frameDelay: 8,      // 動畫速度（數字越大越慢）
    width: 43,         // 顯示寬度
    height: 42         // 顯示高度
  },
  attack: {
    frames: 3,
    frameDelay: 4,
    width: 54,
    height: 47
  },
  jump: {
    frames: 3,
    frameDelay: 6,
    width: 46,
    height: 43
  }
};

const player2Config = {
  idle: {
    frames: 3,
    frameDelay: 8,
    width: 45,
    height: 36,
    offsetY: 0
  },
  attack: {
    frames: 3,            // 改為7幀，根據實際精靈圖的幀數
    frameDelay: 4,
    width: 45,
    height: 36,
    offsetY: 0
  },
  jump: {
    frames: 3,
    frameDelay: 6,
    width: 46,
    height: 43,
    offsetY: 0
  }
};

function preload() {
  // 載入背景圖片
  bgImage = loadImage('Backgrounds.png');
  
  // 載入角色1的圖片
  p1Sprites = {
    idle: loadImage('run1.png'),      // 水平排列的精靈圖
    attack: loadImage('attack1.png'),  // 水平排列的精靈圖
    jump: loadImage('jump1.png')       // 水平排列的精靈圖
  };
  
  // 載入角色2的圖片
  p2Sprites = {
    idle: loadImage('run2.png'),    // 水平排列的精靈圖
    attack: loadImage('attack2.png'), // 水平排列的精靈圖
    jump: loadImage('jump2.png')     // 水平排列的精靈圖
  };
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // 創建兩個角色實例，加入 isPlayer1 參數
  player1 = new Fighter(windowWidth * 0.3, GROUND_Y, p1Sprites, player1Config, true);
  player2 = new Fighter(windowWidth * 0.7, GROUND_Y, p2Sprites, player2Config, false);
}

function draw() {
  image(bgImage, 0, 0, windowWidth, windowHeight);
  
  // 繪製操作說明
  drawControls();
  
  // 更新和繪製角色
  player1.update();
  player2.update();
  player1.animate();
  player2.animate();
  
  // 繪製血條
  player1.drawHP();
  player2.drawHP();
  
  // 添加常駐字幕
  drawTitle();
}

// 添加繪製標題的函數
function drawTitle() {
  push();
  const title = '淡江教育科技';
  textAlign(CENTER, TOP);
  textStyle(BOLD);
  textSize(32);
  
  // 外發光效果
  for(let i = 10; i > 0; i--) {
    fill(255, 255, 255, i * 2);
    text(title, windowWidth/2, 10 + i/2);
  }
  
  // 主標題
  fill(255);
  stroke(100, 150, 255);
  strokeWeight(2);
  text(title, windowWidth/2, 15);
  
  // 副標題
  textSize(16);
  noStroke();
  fill(200);
  text('- FIGHTING GAME -', windowWidth/2, 50);
  pop();
}

// 新增繪製操作說明的函數
function drawControls() {
  push();
  const padding = 15;
  const boxWidth = 180;
  const boxHeight = 120;
  
  // Player 1 控制說明
  drawControlBox(50, 70, boxWidth, boxHeight, 
                'Player 1 Controls', 
                [
                  'A / D - Move',
                  'W - Jump',
                  'F - Attack'
                ],
                color(255, 100, 100, 50));
  
  // Player 2 控制說明
  drawControlBox(windowWidth - 50 - boxWidth, 70, boxWidth, boxHeight,
                'Player 2 Controls',
                [
                  '←/→ - Move',
                  '↑ - Jump',
                  '/ - Attack'
                ],
                color(100, 100, 255, 50));
  pop();
}

// 新增輔助函數來繪製控制說明框
function drawControlBox(x, y, width, height, title, controls, boxColor) {
  push();
  // 繪製半透明背景
  fill(boxColor);
  stroke(255, 100);
  strokeWeight(2);
  rect(x, y, width, height, 10);
  
  // 繪製標題
  fill(255);
  noStroke();
  textSize(18);
  textStyle(BOLD);
  textAlign(LEFT);
  text(title, x + 15, y + 25);
  
  // 繪製分隔線
  stroke(255, 100);
  line(x + 15, y + 35, x + width - 15, y + 35);
  
  // 繪製控制說明
  noStroke();
  textSize(16);
  textStyle(NORMAL);
  controls.forEach((control, index) => {
    text(control, x + 15, y + 60 + index * 25);
  });
  pop();
}

// 修改按鍵控制
function keyPressed() {
  // 角色1控制
  switch (keyCode) {
    case 65: // A
      player1.moveLeft = true;
      break;
    case 68: // D
      player1.moveRight = true;
      break;
    case 87: // W
      player1.jump();
      break;
    case 70: // F
      player1.attack();
      break;
  }
  
  // 角色2控制
  switch (keyCode) {
    case LEFT_ARROW:
      player2.moveLeft = true;
      break;
    case RIGHT_ARROW:
      player2.moveRight = true;
      break;
    case UP_ARROW:
      player2.jump();
      break;
    case 191: // /
      player2.attack();
      break;
  }

  // 重新開始遊戲
  if (keyCode === 82) { // R鍵
    resetGame();
  }
}

function keyReleased() {
  // 角色1控制
  switch (keyCode) {
    case 65: // A
      player1.moveLeft = false;
      if (!player1.moveRight && !player1.isJumping) player1.currentAnimation = 'idle';
      break;
    case 68: // D
      player1.moveRight = false;
      if (!player1.moveLeft && !player1.isJumping) player1.currentAnimation = 'idle';
      break;
    case 70: // F
      if (!player1.isJumping) player1.currentAnimation = 'idle';
      break;
  }
  
  // 角色2控制
  switch (keyCode) {
    case LEFT_ARROW:
      player2.moveLeft = false;
      if (!player2.moveRight && !player2.isJumping) player2.currentAnimation = 'idle';
      break;
    case RIGHT_ARROW:
      player2.moveRight = false;
      if (!player2.moveLeft && !player2.isJumping) player2.currentAnimation = 'idle';
      break;
    case 191: // /
      if (!player2.isJumping) player2.currentAnimation = 'idle';
      break;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // 更新地面高度
  GROUND_Y = window.innerHeight / 1;
  // 更新角色位置
  player1.y = GROUND_Y;
  player2.y = GROUND_Y;
}

// 添加重置遊戲函數
function resetGame() {
  player1 = new Fighter(windowWidth * 0.3, GROUND_Y, p1Sprites, player1Config, true);
  player2 = new Fighter(windowWidth * 0.7, GROUND_Y, p2Sprites, player2Config, false);
  loop(); // 重新開始遊戲循環
}
