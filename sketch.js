// 宣告全域變數來儲存多種狀態的精靈圖（Sprite Sheet）
let idleSheet; // 暫停動作
let walkSheet; // 走路動作
let attackSheet; // 發射招數動作

// 各精靈圖尺寸與張數設定
let idleTotalFrames = 9;
let idleSheetWidth = 1246;
let idleSheetHeight = 212;

let walkTotalFrames = 9;
let walkSheetWidth = 1246;
let walkSheetHeight = 198;

let attackTotalFrames = 9;
let attackSheetWidth = 2344;
let attackSheetHeight = 146;

// 動畫與狀態控制變數
let currentFrame = 0; // 目前角色的精靈影格索引
let animationSpeed = 6; // 動畫播放速度

let charX; // 角色 X 座標
let moveSpeed = 5; // 移動速度
let facing = 1; // 1 代表朝右，-1 代表朝左
let currentState = "idle"; // 角色目前狀態："idle"（暫停）, "walk"（走路）, "attack"（發射招數）

// 特效（發射出去的招數）相關變數
let effects = []; // 儲存畫面中所有存在中的特效陣列（支援同時發射多個）

// preload() 載入所有圖片精靈檔案
function preload() {
  idleSheet = loadImage('1/暫停動作/暫停動作.png');
  walkSheet = loadImage('1/走路/走路.png');
  attackSheet = loadImage('1/發射招數/發射招數.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  charX = width * (2 / 3);
  imageMode(CENTER);
}

function draw() {
  background(135, 206, 235); // 天空藍背景
  
  // 1. 根據目前狀態決定要使用的精靈圖與規格
  let currentSheet, totalFrames, sheetWidth, sheetHeight;
  
  if (currentState === "attack") {
    currentSheet = attackSheet;
    totalFrames = attackTotalFrames;
    sheetWidth = attackSheetWidth;
    sheetHeight = attackSheetHeight;
  } else if (currentState === "walk") {
    currentSheet = walkSheet;
    totalFrames = walkTotalFrames;
    sheetWidth = walkSheetWidth;
    sheetHeight = walkSheetHeight;
  } else {
    currentSheet = idleSheet;
    totalFrames = idleTotalFrames;
    sheetWidth = idleSheetWidth;
    sheetHeight = idleSheetHeight;
  }
  
  let frameWidth = sheetWidth / totalFrames;
  let frameHeight = sheetHeight;
  
  // 計算顯示尺寸（高度為畫布 1/3，等比例縮放）
  let displayHeight = height / 3;
  let scaleRatio = displayHeight / frameHeight;
  let displayWidth = frameWidth * scaleRatio;
  let charY = height - (displayHeight / 2);
  
  // 左右邊界限制
  let minX = displayWidth / 2;
  let maxX = width - (displayWidth / 2);
  
  // 2. 角色行為與按鍵偵測邏輯（若正在施放招數，則暫時不允許移動或切換一般狀態）
  if (currentState !== "attack") {
    if (keyIsDown(RIGHT_ARROW)) {
      currentState = "walk";
      facing = 1;
      charX += moveSpeed;
    } else if (keyIsDown(LEFT_ARROW)) {
      currentState = "walk";
      facing = -1;
      charX -= moveSpeed;
    } else {
      // 當使用者「不按左右鍵」且非攻擊中，回復到暫停狀態
      currentState = "idle";
    }
  }
  
  charX = constrain(charX, minX, maxX);
  
  // 3. 更新並繪製所有「特效圖片」（發射出去的招數）
  updateAndDrawEffects();
  
  // 4. 繪製角色本身
  let sourceX = currentFrame * frameWidth;
  let sourceY = 0;
  
  push();
  translate(charX, charY);
  scale(facing, 1);
  image(currentSheet, 0, 0, displayWidth, displayHeight, sourceX, sourceY, frameWidth, frameHeight);
  pop();
  
  // 5. 動畫影格與播放次數控制
  if (frameCount % animationSpeed === 0) {
    if (currentState === "attack") {
      // 攻擊動畫：只播放一次 (0 到 totalFrames - 1)
      currentFrame++;
      if (currentFrame >= totalFrames) {
        // 播放完畢一次後，在最後一影格觸發產生特效
        spawnEffect(charX, charY, displayHeight);
        
        // 恢復為預設暫停狀態，並將影格歸零
        currentState = "idle";
        currentFrame = 0;
      }
    } else {
      // 一般暫停或走路動畫：無限循環
      currentFrame = (currentFrame + 1) % totalFrames;
    }
  }
}

// 偵測按下「空白鍵」觸發招數
function keyPressed() {
  if (key === ' ' || keyCode === 32) {
    // 如果目前不是在攻擊中，才允許觸發新的一次招數
    if (currentState !== "attack") {
      currentState = "attack";
      currentFrame = 0; // 從攻擊動畫的第一張開始播放
    }
  }
}

// 產生特效函式：當攻擊動畫執行完畢時呼叫
function spawnEffect(x, y, charDisplayHeight) {
  let frameWidth = attackSheetWidth / attackTotalFrames;
  let frameHeight = attackSheetHeight;
  let scaleRatio = charDisplayHeight / frameHeight;
  let effectWidth = frameWidth * scaleRatio;
  let effectHeight = charDisplayHeight;
  
  // 建立特效物件，記錄其位置、方向、尺寸與當前動畫影格
  let newEffect = {
    x: x,
    y: y,
    vx: facing * 12, // 特效移動速度（朝右為正，朝左為負）
    facing: facing,
    width: effectWidth,
    height: effectHeight,
    frame: 0,
    frameTimer: 0
  };
  effects.push(newEffect);
}

// 更新與繪製畫面中所有特效的函式
function updateAndDrawEffects() {
  // 從後往前跑迴圈，方便在特效抵達邊界時從陣列中刪除
  for (let i = effects.length - 1; i >= 0; i--) {
    let ef = effects[i];
    
    // 特效往對應方向移動
    ef.x += ef.vx;
    
    // 檢查特效是否移動到畫布的最右端或最左端
    let hitRightEdge = (ef.vx > 0 && ef.x - ef.width / 2 >= width);
    let hitLeftEdge = (ef.vx < 0 && ef.x + ef.width / 2 <= 0);
    
    if (hitRightEdge || hitLeftEdge) {
      // 碰到邊界就從陣列中移除（消失不見）
      effects.splice(i, 1);
      continue;
    }
    
    // 計算特效目前要裁切的來源影格
    let frameWidth = attackSheetWidth / attackTotalFrames;
    let frameHeight = attackSheetHeight;
    let sourceX = ef.frame * frameWidth;
    
    // 繪製特效圖片
    push();
    translate(ef.x, ef.y);
    scale(ef.facing, 1);
    image(attackSheet, 0, 0, ef.width, ef.height, sourceX, 0, frameWidth, frameHeight);
    pop();
    
    // 特效自身的動畫循環播放控制
    ef.frameTimer++;
    if (ef.frameTimer >= animationSpeed) {
      ef.frame = (ef.frame + 1) % attackTotalFrames;
      ef.frameTimer = 0;
    }
  }
}

// 視窗大小改變時自適應調整
function windowResized() {
  let oldWidth = width;
  resizeCanvas(windowWidth, windowHeight);
  charX = (charX / oldWidth) * width;
}