// Game constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const TILE_SIZE = 32;

// Isometric constants
const ISO_ANGLE = Math.PI / 4; // 45 degrees for isometric view
const ISO_SCALE_X = Math.cos(ISO_ANGLE);
const ISO_SCALE_Y = Math.sin(ISO_ANGLE);

// Math utilities
function distance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  add(v) {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  subtract(v) {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  multiply(scalar) {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize() {
    const len = this.length();
    if (len === 0) return new Vector2();
    return new Vector2(this.x / len, this.y / len);
  }

  static distance(a, b) {
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
  }
}

// Coordinate conversion
function cartesianToIso(x, y, z = 0) {
  return {
    x: (x - y) * ISO_SCALE_X,
    y: (x + y) * ISO_SCALE_Y - z,
  };
}

function isoToCartesian(x, y) {
  const isoX = x / ISO_SCALE_X;
  const isoY = y / ISO_SCALE_Y;
  return {
    x: (isoX + isoY) / 2,
    y: (isoY - isoX) / 2,
  };
}

// Collision detection
function pointInRect(px, py, rx, ry, rw, rh) {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

function rectIntersect(r1x, r1y, r1w, r1h, r2x, r2y, r2w, r2h) {
  return !(
    r2x > r1x + r1w ||
    r2x + r2w < r1x ||
    r2y > r1y + r1h ||
    r2y + r2h < r1y
  );
}

function circleIntersect(c1x, c1y, c1r, c2x, c2y, c2r) {
  const distance = Math.sqrt(Math.pow(c2x - c1x, 2) + Math.pow(c2y - c1y, 2));
  return distance < c1r + c2r;
}

// Animation utilities
function lerp(start, end, t) {
  return start * (1 - t) + end * t;
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// Random utilities
function random(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(random(min, max + 1));
}

function choose(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Asset loading
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function loadAudio(src) {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.oncanplaythrough = () => resolve(audio);
    audio.onerror = reject;
    audio.src = src;
  });
}

// Input handling
const keys = new Set();
const previousKeys = new Set();

function updateInput() {
  previousKeys.clear();
  keys.forEach((key) => previousKeys.add(key));
}

function isKeyDown(key) {
  return keys.has(key);
}

function isKeyPressed(key) {
  return keys.has(key) && !previousKeys.has(key);
}

function isKeyReleased(key) {
  return !keys.has(key) && previousKeys.has(key);
}

// Event listeners for input
window.addEventListener("keydown", (e) => keys.add(e.code));
window.addEventListener("keyup", (e) => keys.delete(e.code));

// Touch input state
const touch = {
  active: false,
  x: 0,
  y: 0,
  startX: 0,
  startY: 0,
};

// Mobile detection
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

// Debug utilities
function drawDebugPoint(ctx, x, y, color = "red", size = 4) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDebugRect(ctx, x, y, width, height, color = "red") {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);
  ctx.restore();
}

// Path finding on isometric grid
function getNeighbors(x, y, grid) {
  const neighbors = [];
  const directions = [
    { x: 1, y: 0 }, // right
    { x: -1, y: 0 }, // left
    { x: 0, y: 1 }, // down
    { x: 0, y: -1 }, // up
  ];

  for (const dir of directions) {
    const newX = x + dir.x;
    const newY = y + dir.y;

    if (
      newX >= 0 &&
      newX < grid.length &&
      newY >= 0 &&
      newY < grid[0].length &&
      !grid[newX][newY].blocked
    ) {
      neighbors.push({ x: newX, y: newY });
    }
  }

  return neighbors;
}

// Time utilities
function formatTime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

// Storage utilities
function saveToLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error("Failed to save to localStorage:", e);
    return false;
  }
}

function loadFromLocalStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error("Failed to load from localStorage:", e);
    return defaultValue;
  }
}

// Export all utilities
window.GameUtils = {
  distance,
  cartesianToIso,
  isoToCartesian,
  Vector2,
  cartesianToIso,
  isoToCartesian,
  pointInRect,
  rectIntersect,
  circleIntersect,
  lerp,
  easeInOut,
  easeOutBack,
  random,
  randomInt,
  choose,
  loadImage,
  loadAudio,
  isKeyDown,
  isKeyPressed,
  isKeyReleased,
  updateInput,
  isMobile,
  touch,
  drawDebugPoint,
  drawDebugRect,
  getNeighbors,
  formatTime,
  saveToLocalStorage,
  loadFromLocalStorage,
};
