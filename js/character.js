class Character {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.z = 0;
    this.width = 64; // Bigger character
    this.height = 96; // Taller character
    this.speed = 0.5; // Adjusted speed for bigger map
    this.direction = "down";
    this.isMoving = false;
    this.frame = 0;
    this.animationSpeed = 0.15;
    this.currentAction = null;

    // Sprite states
    this.sprites = {
      idle: { frames: 4, row: 0 },
      walk: { frames: 4, row: 1 },
      action: { frames: 6, row: 2 },
    };

    // Create sprite sheet programmatically
    const canvas = document.createElement("canvas");
    canvas.width = this.width * 4; // 4 frames
    canvas.height = this.height * 3; // 3 rows
    const ctx = canvas.getContext("2d");

    // Colors for the scout
    const colors = {
      shirt: "#2B7A0B", // Scout green
      pants: "#4B5563", // Dark grey
      skin: "#FFB385", // Skin tone
      scarf: "#DC2626", // Red scarf
    };

    // Draw frames for each state
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        const x = col * this.width;
        const y = row * this.height;

        // Body bounce offset based on frame
        const bounceOffset = row === 1 ? Math.sin((col * Math.PI) / 2) * 2 : 0;

        // Scout body
        ctx.fillStyle = colors.pants;
        ctx.fillRect(
          x + this.width / 4,
          y + this.height / 2 - bounceOffset,
          this.width / 2,
          this.height / 2
        );

        // Neck scarf
        ctx.fillStyle = colors.scarf;
        ctx.beginPath();
        ctx.moveTo(x + this.width / 2, y + this.height / 3);
        ctx.lineTo(x + this.width / 3, y + this.height / 2);
        ctx.lineTo(x + (this.width * 2) / 3, y + this.height / 2);
        ctx.closePath();
        ctx.fill();

        // Head
        ctx.fillStyle = colors.skin;
        ctx.beginPath();
        ctx.arc(
          x + this.width / 2,
          y + this.height / 3 - bounceOffset,
          this.width / 4,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Eyes
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(
          x + this.width / 2 - 5,
          y + this.height / 3 - bounceOffset,
          2,
          0,
          Math.PI * 2
        );
        ctx.arc(
          x + this.width / 2 + 5,
          y + this.height / 3 - bounceOffset,
          2,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Add action animation for row 2
        if (row === 2) {
          // Arms raised for action
          ctx.fillStyle = colors.shirt;
          const actionPhase = (col / 3) * Math.PI;
          const armOffset = Math.sin(actionPhase) * 10;

          // Left arm
          ctx.fillRect(
            x + this.width / 6,
            y + this.height / 2 - armOffset,
            this.width / 6,
            this.height / 3
          );

          // Right arm
          ctx.fillRect(
            x + (this.width * 2) / 3,
            y + this.height / 2 + armOffset,
            this.width / 6,
            this.height / 3
          );
        }
      }
    }

    this.spritesheet = canvas;
    this.spritesheetLoaded = true;
  }

  async loadSpritesheet() {
    try {
      const image = await GameUtils.loadImage("assets/scout-sprite.png");
      this.spritesheet = image;
      this.spritesheetLoaded = true;
    } catch (error) {
      console.error("Failed to load character spritesheet:", error);
      // Create a fallback canvas with a simple character representation
      const canvas = document.createElement("canvas");
      canvas.width = this.width * 4; // 4 frames
      canvas.height = this.height * 3; // 3 rows
      const ctx = canvas.getContext("2d");

      // Draw simple character shapes for each state
      const colors = ["#4B5563", "#64748B", "#94A3B8"];
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
          const x = col * this.width;
          const y = row * this.height;

          // Body
          ctx.fillStyle = colors[row];
          ctx.fillRect(
            x + this.width / 4,
            y + this.height / 3,
            this.width / 2,
            this.height / 2
          );

          // Head
          ctx.beginPath();
          ctx.arc(
            x + this.width / 2,
            y + this.height / 4,
            this.width / 4,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }

      this.spritesheet = canvas;
      this.spritesheetLoaded = true;
    }
  }

  setTarget(targetX, targetY) {
    this.targetX = targetX;
    this.targetY = targetY;
    this.isMoving = true;

    // Calculate direction to target
    const dx = targetX - this.x;
    const dy = targetY - this.y;

    // Update character direction based on movement
    if (Math.abs(dx) > Math.abs(dy)) {
      this.direction = dx > 0 ? "right" : "left";
    } else if (dy !== 0) {
      this.direction = dy > 0 ? "down" : "up";
    }
  }

  update() {
    if (
      this.isMoving &&
      this.targetX !== undefined &&
      this.targetY !== undefined
    ) {
      // Calculate distance to target
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > this.speed) {
        // Normalize movement vector
        const moveX = (dx / distance) * this.speed;
        const moveY = (dy / distance) * this.speed;

        // Update position
        this.x += moveX;
        this.y += moveY;
      } else {
        // Reached target
        this.x = this.targetX;
        this.y = this.targetY;
        this.isMoving = false;
        this.targetX = undefined;
        this.targetY = undefined;
      }
    }

    // Update animation
    if (this.isMoving || this.currentAction) {
      this.frame += this.animationSpeed;
      if (
        this.frame >=
        (this.currentAction
          ? this.sprites.action.frames
          : this.sprites.walk.frames)
      ) {
        this.frame = 0;
        if (this.currentAction) {
          this.currentAction.onComplete();
          this.currentAction = null;
        }
      }
    }

    // Apply gravity and jumping
    if (this.z > 0) {
      this.z += this.zVelocity;
      this.zVelocity -= 0.5;
      if (this.z <= 0) {
        this.z = 0;
        this.zVelocity = 0;
      }
    }
  }

  move(dx, dy) {
    if (this.currentAction) return;

    const newX = this.x + dx * this.speed;
    const newY = this.y + dy * this.speed;

    // Update direction
    if (Math.abs(dx) > Math.abs(dy)) {
      this.direction = dx > 0 ? "right" : "left";
    } else if (dy !== 0) {
      this.direction = dy > 0 ? "down" : "up";
    }

    // Check boundaries and collisions
    if (this.canMoveTo(newX, newY)) {
      this.x = newX;
      this.y = newY;
      this.isMoving = true;
    }
  }

  startAction(action) {
    if (this.currentAction) return;

    this.currentAction = action;
    this.frame = 0;
    this.isMoving = false;
  }

  canMoveTo(x, y) {
    // Add collision detection with environment
    return (
      x >= 0 &&
      x <= GAME_WIDTH - this.width &&
      y >= 0 &&
      y <= GAME_HEIGHT - this.height
    );
  }

  draw(ctx) {
    const spriteRow = this.currentAction
      ? this.sprites.action.row
      : this.isMoving
      ? this.sprites.walk.row
      : this.sprites.idle.row;

    const frameCount = this.currentAction
      ? this.sprites.action.frames
      : this.isMoving
      ? this.sprites.walk.frames
      : this.sprites.idle.frames;

    const currentFrame = Math.floor(this.frame) % frameCount;

    // Draw shadow
    ctx.beginPath();
    ctx.ellipse(
      this.x + this.width / 2,
      this.y + this.height - 5,
      20,
      10,
      0,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fill();

    // Draw character sprite
    ctx.save();
    if (this.direction === "left") {
      ctx.scale(-1, 1);
      ctx.translate(-this.x - this.width, this.y - this.z);
    } else {
      ctx.translate(this.x, this.y - this.z);
    }

    ctx.drawImage(
      this.spritesheet,
      currentFrame * this.width,
      spriteRow * this.height,
      this.width,
      this.height,
      0,
      0,
      this.width,
      this.height
    );
    ctx.restore();
  }
}
