class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.camera = {
      x: 0,
      y: 0,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    };

    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    // Get the actual viewport dimensions
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;

    // Set canvas to full viewport size
    this.canvas.width = containerWidth;
    this.canvas.height = containerHeight;

    // Calculate scale to fit game world
    const scaleX = containerWidth / GAME_WIDTH;
    const scaleY = containerHeight / GAME_HEIGHT;
    this.camera.scale = Math.min(scaleX, scaleY);

    // Center the game in the viewport
    this.camera.offsetX = (containerWidth - GAME_WIDTH * this.camera.scale) / 2;
    this.camera.offsetY =
      (containerHeight - GAME_HEIGHT * this.camera.scale) / 2;

    this.ctx.imageSmoothingEnabled = false;
  }

  begin() {
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply transforms for centered, scaled rendering
    this.ctx.translate(this.camera.offsetX, this.camera.offsetY);
    this.ctx.scale(this.camera.scale, this.camera.scale);
  }

  end() {
    this.ctx.restore();
  }

  drawEnvironment(environment) {
    // Draw background
    this.ctx.fillStyle = "#90A955";
    this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw grid for reference (can be removed in production)
    this.drawGrid();

    // Draw paths
    environment.paths.forEach((path) => {
      this.ctx.beginPath();
      this.ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) {
        this.ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      this.ctx.strokeStyle = path.type === "main" ? "#B8916C" : "#C4A484";
      this.ctx.lineWidth = path.width;
      this.ctx.stroke();
    });

    // Draw lake
    const { lake } = environment;
    const gradient = this.ctx.createRadialGradient(
      lake.x,
      lake.y,
      0,
      lake.x,
      lake.y,
      lake.radius
    );
    gradient.addColorStop(0, "#4F90CD");
    gradient.addColorStop(1, "#2E5984");

    this.ctx.beginPath();
    this.ctx.arc(lake.x, lake.y, lake.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    // Draw all environment objects sorted by Y position
    const objects = [
      ...environment.rocks.map((rock) => ({ type: "rock", ...rock })),
      ...environment.trees.map((tree) => ({ type: "tree", ...tree })),
    ].sort((a, b) => a.y - b.y);

    // Draw objects with shadows
    objects.forEach((obj) => {
      // Draw shadow
      this.ctx.beginPath();
      this.ctx.ellipse(
        obj.x,
        obj.y + 5,
        obj.width ? obj.width / 3 : obj.size,
        obj.width ? obj.width / 6 : obj.size / 2,
        0,
        0,
        Math.PI * 2
      );
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      this.ctx.fill();

      if (obj.type === "rock") {
        this.drawRock(obj);
      } else {
        this.drawTree(obj);
      }
    });
  }

  drawGrid() {
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    this.ctx.lineWidth = 1;

    for (let x = 0; x < GAME_WIDTH; x += TILE_SIZE) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, GAME_HEIGHT);
      this.ctx.stroke();
    }

    for (let y = 0; y < GAME_HEIGHT; y += TILE_SIZE) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(GAME_WIDTH, y);
      this.ctx.stroke();
    }
  }

  drawTree(tree) {
    // Tree trunk
    this.ctx.fillStyle = "#8B4513";
    this.ctx.fillRect(
      tree.x - tree.width / 6,
      tree.y - tree.height / 2,
      tree.width / 3,
      tree.height / 2
    );

    // Tree foliage (layered circles for better appearance)
    const layers = 3;
    for (let i = 0; i < layers; i++) {
      const size = tree.width * (1 - i * 0.2);
      this.ctx.beginPath();
      this.ctx.arc(
        tree.x,
        tree.y - tree.height / 2 - i * (tree.height / 8),
        size / 2,
        0,
        Math.PI * 2
      );
      this.ctx.fillStyle = `rgb(${47 - i * 10}, ${79 - i * 10}, ${
        47 - i * 10
      })`;
      this.ctx.fill();
    }
  }

  drawRock(rock) {
    this.ctx.save();
    this.ctx.translate(rock.x, rock.y);
    this.ctx.rotate(rock.rotation);

    const gradient = this.ctx.createLinearGradient(
      -rock.size,
      -rock.size,
      rock.size,
      rock.size
    );
    gradient.addColorStop(0, "#808080");
    gradient.addColorStop(1, "#4F4F4F");

    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, rock.size, rock.size / 2, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    this.ctx.restore();
  }

  drawCharacter(character) {
    // Draw shadow
    this.ctx.beginPath();
    this.ctx.ellipse(
      character.x,
      character.y + 5,
      character.width / 3,
      character.width / 6,
      0,
      0,
      Math.PI * 2
    );
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    this.ctx.fill();

    // Draw character
    this.ctx.save();
    this.ctx.translate(character.x, character.y);

    if (character.direction === "left") {
      this.ctx.scale(-1, 1);
    }

    if (!character.spritesheetLoaded) {
      this.drawCharacterPlaceholder(character);
    } else {
      this.drawCharacterSprite(character);
    }

    this.ctx.restore();
  }

  drawCharacterPlaceholder(character) {
    // Head
    this.ctx.fillStyle = "#4B5563";
    this.ctx.beginPath();
    this.ctx.arc(0, -character.height / 3, character.width / 3, 0, Math.PI * 2);
    this.ctx.fill();

    // Body
    this.ctx.fillRect(
      -character.width / 4,
      -character.height / 3,
      character.width / 2,
      character.height / 2
    );

    // Legs (with walking animation)
    if (character.isMoving) {
      const legOffset = Math.sin(Date.now() / 100) * 5;
      this.ctx.fillRect(
        -character.width / 4,
        character.height / 6,
        character.width / 6,
        character.height / 3 + legOffset
      );
      this.ctx.fillRect(
        character.width / 12,
        character.height / 6,
        character.width / 6,
        character.height / 3 - legOffset
      );
    } else {
      this.ctx.fillRect(
        -character.width / 4,
        character.height / 6,
        character.width / 6,
        character.height / 3
      );
      this.ctx.fillRect(
        character.width / 12,
        character.height / 6,
        character.width / 6,
        character.height / 3
      );
    }
  }

  drawCharacterSprite(character) {
    const frame = Math.floor(character.frame);
    const sourceX = frame * character.width;
    const sourceY = character.currentAction
      ? character.sprites.action.row * character.height
      : character.isMoving
      ? character.sprites.walk.row * character.height
      : character.sprites.idle.row * character.height;

    this.ctx.drawImage(
      character.spritesheet,
      sourceX,
      sourceY,
      character.width,
      character.height,
      -character.width / 2,
      -character.height / 2,
      character.width,
      character.height
    );
  }

  drawTasks(tasks) {
    tasks.forEach((task) => {
      if (!task.completed) {
        // Draw interaction zone
        this.ctx.beginPath();
        this.ctx.arc(task.x, task.y, task.interactionRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = task.inProgress
          ? "rgba(250, 204, 21, 0.2)"
          : "rgba(255, 255, 255, 0.2)";
        this.ctx.fill();

        // Draw pulsing effect for active tasks
        const pulseSize = Math.sin(Date.now() / 500) * 5;
        this.ctx.beginPath();
        this.ctx.arc(
          task.x,
          task.y,
          task.interactionRadius + pulseSize,
          0,
          Math.PI * 2
        );
        this.ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        this.ctx.stroke();
      }

      // Draw task icon
      this.ctx.font = "48px Arial";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillStyle = task.completed ? "#22C55E" : "#000000";
      this.ctx.fillText(task.emoji, task.x, task.y);

      // Draw progress bar if in progress
      if (task.inProgress) {
        const barWidth = 80;
        const barHeight = 12;
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        this.ctx.fillRect(
          task.x - barWidth / 2,
          task.y + 40,
          barWidth,
          barHeight
        );
        this.ctx.fillStyle = "#FFDD00";
        this.ctx.fillRect(
          task.x - barWidth / 2,
          task.y + 40,
          barWidth * task.progress,
          barHeight
        );
      }

      // Draw completion checkmark
      if (task.completed) {
        this.ctx.font = "32px Arial";
        this.ctx.fillStyle = "#22C55E";
        this.ctx.fillText("✓", task.x, task.y - 40);
      }
    });
  }
}
