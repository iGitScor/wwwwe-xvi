class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.renderer = new Renderer(this.canvas);
    this.environment = new Environment();
    this.taskManager = new TaskManager();

    // Initialize character in the center of the map
    this.character = new Character(GAME_WIDTH / 2, GAME_HEIGHT / 2);

    // Game state
    this.isRunning = false;
    this.lastTime = 0;
    this.accumulator = 0;
    this.timeStep = 1000 / 60; // 60 FPS

    // Input state
    this.keys = new Set();
    this.isMobile = "ontouchstart" in window;

    this.setupInputHandlers();
  }

  setupInputHandlers() {
    // Prevent keyboard scrolling
    window.addEventListener("keydown", (e) => {
      if (
        ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
          e.code
        )
      ) {
        e.preventDefault();
      }
      this.keys.add(e.code);
      if (e.code === "Space") {
        this.handleAction();
      }
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));

    // Mouse/touch controls
    if (!this.isMobile) {
      this.canvas.addEventListener("click", (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.handleClick(x, y);
      });
    }

    // Mobile controls
    const buttons = {
      leftBtn: "ArrowLeft",
      rightBtn: "ArrowRight",
      upBtn: "ArrowUp",
      downBtn: "ArrowDown",
      actionBtn: "Space",
    };

    Object.entries(buttons).forEach(([btnId, keyCode]) => {
      const btn = document.getElementById(btnId);
      if (btn) {
        // Handle both touch and mouse events
        const startHandler = (e) => {
          e.preventDefault();
          this.keys.add(keyCode);
          if (keyCode === "Space") {
            this.handleAction();
          }
        };

        const endHandler = (e) => {
          e.preventDefault();
          this.keys.delete(keyCode);
        };

        btn.addEventListener("touchstart", startHandler);
        btn.addEventListener("mousedown", startHandler);
        btn.addEventListener("touchend", endHandler);
        btn.addEventListener("mouseup", endHandler);
        btn.addEventListener("mouseleave", endHandler);
      }
    });
  }

  handleClick(x, y) {
    // Convert screen coordinates to game coordinates
    const gameX =
      (x - this.renderer.camera.offsetX) / this.renderer.camera.scale;
    const gameY =
      (y - this.renderer.camera.offsetY) / this.renderer.camera.scale;

    // Ensure coordinates are within game bounds
    const boundedX = Math.max(0, Math.min(gameX, GAME_WIDTH));
    const boundedY = Math.max(0, Math.min(gameY, GAME_HEIGHT));

    this.character.setTarget(boundedX, boundedY);
  }

  handleAction() {
    // Check for nearby tasks
    for (const task of this.taskManager.tasks) {
      if (task.canInteract(this.character) && !task.completed) {
        const action = task.startInteraction(this.character);
        if (action) {
          this.character.startAction(action);
        }
        break;
      }
    }
  }

  update(deltaTime) {
    // Update character position based on input
    const moveSpeed = deltaTime * 0.2;
    let dx = 0;
    let dy = 0;

    if (this.keys.has("ArrowLeft")) dx -= moveSpeed;
    if (this.keys.has("ArrowRight")) dx += moveSpeed;
    if (this.keys.has("ArrowUp")) dy -= moveSpeed;
    if (this.keys.has("ArrowDown")) dy += moveSpeed;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      dx *= Math.SQRT1_2;
      dy *= Math.SQRT1_2;
    }

    // Update character
    if (!this.character.currentAction) {
      this.character.move(dx, dy);
    }
    this.character.update();

    // Update tasks
    this.taskManager.update(this.character);

    // Update environment
    this.environment.update(deltaTime);

    // Check win condition
    if (this.taskManager.areAllTasksComplete()) {
      this.handleWin();
    }
  }

  render() {
    this.renderer.begin();

    // Draw environment
    this.renderer.drawEnvironment(this.environment);

    // Draw tasks
    this.renderer.drawTasks(this.taskManager.tasks);

    // Draw character
    this.renderer.drawCharacter(this.character);

    this.renderer.end();
  }

  gameLoop(currentTime) {
    if (!this.isRunning) return;

    if (!this.lastTime) {
      this.lastTime = currentTime;
    }

    let deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Prevent large deltaTime when tab is inactive
    if (deltaTime > 1000) {
      deltaTime = this.timeStep;
    }

    this.accumulator += deltaTime;

    // Fixed time step update
    while (this.accumulator >= this.timeStep) {
      this.update(this.timeStep);
      this.accumulator -= this.timeStep;
    }

    // Render at screen refresh rate
    this.render();
    // this.showBedroomMap();

    requestAnimationFrame((time) => this.gameLoop(time));
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastTime = 0;
      this.accumulator = 0;
      requestAnimationFrame((time) => this.gameLoop(time));
    }
  }

  pause() {
    this.isRunning = false;
  }

  handleWin() {
    this.pause();

    // Quiz question
    const taskInfo = document.getElementById("taskInfo");
    if (taskInfo) {
      taskInfo.innerHTML = `
            <div class="p-4 max-w-md bg-white rounded-lg">
                <h3 class="text-xl font-bold mb-4">🎉 Félicitations !</h3>
                <p class="mb-4">Vous avez complété toutes les tâches du camp scout !</p>
                
                <div class="mt-4 mb-4">
                    <h4 class="font-bold mb-2">Question Bonus</h4>
                    <p class="mb-4">Je dors replié, attendant l’appel,
Mais au crépuscule, je prends vie sous les étoiles.
On me dresse d’un geste habile,
Ma peau tendue défie la brise.
Le matin, je disparais sans laisser de trace,
Car mon art est d’exister sans peser.
Certains me voient comme un simple abri,
Mais pour le voyageur, je suis un sanctuaire.
Trouve-moi, et je saurai te récompenser.</p>
                    
                    <div class="space-y-2">
                        <input type="text" id="answerInput" class="w-full p-2 border rounded" placeholder="Réponse">
                        <button id="answerenigma" class="w-full text-left p-2 border rounded hover:bg-gray-100">
                            Vérifier
                        </button>
                    </div>
                </div>
            </div>
        `;

      // Add click event listeners after DOM update
      document.getElementById(`answerenigma`).addEventListener("click", () => {
        if (
          document.getElementById("answerInput").value.toLowerCase() === "tente"
        ) {
          this.showBedroomMap();
        } else {
          alert("Ce n'est pas la bonne réponse, essaie encore !");
        }
      });
    }
  }

  showBedroomMap() {
    // Clear previous game canvas
    this.renderer.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Room data with adjusted bed positions
    this.rooms = [
      {
        id: 1,
        x: 300,
        y: 200,
        width: 240,
        height: 130,
        beds: [
          { x: 40, y: 10, scout: "Marie + Samuel", blanket: "#FAF0E6" },
          { x: 140, y: 10, scout: "Marion", blanket: "#FAF0E6" },
        ],
      },
      {
        id: 2,
        x: 300,
        y: 200 + 170 * 1,
        width: 240,
        height: 130,
        beds: [{ x: 90, y: 10, scout: "Esther + Fabien", blanket: "#FAF0E6" }],
      },
      {
        id: 3,
        x: 300,
        y: 200 + 170 * 2,
        width: 240,
        height: 130,
        beds: [
          { x: 40, y: 10, scout: "Agathe + Seb", blanket: "#FAF0E6" },
          { x: 140, y: 10, scout: "Juliette", blanket: "#FAF0E6" },
        ],
      },
      {
        id: 4,
        x: 300,
        y: 200 + 170 * 3,
        width: 240,
        height: 300,
        beds: [
          { x: 40, y: 10, scout: "Come", blanket: "#FAF0E6" },
          { x: 140, y: 10, scout: "Alban", blanket: "#FAF0E6" },
          { x: 90, y: 160, scout: "Anatole", blanket: "#FAF0E6" },
        ],
      },
      {
        id: 5,
        x: 300 + 300 * 1,
        y: 200,
        width: 240,
        height: 130,
        beds: [{ x: 90, y: 10, scout: "Elise + Aurelien", blanket: "#9683EC" }],
      },
      {
        id: 6,
        x: 300 + 300 * 1,
        y: 200 + 170 * 1,
        width: 240,
        height: 130,
        beds: [
          { x: 40, y: 10, scout: "Clemence + Nico", blanket: "#9683EC" },
          { x: 140, y: 10, scout: "Flore", blanket: "#9683EC" },
        ],
      },
      {
        id: 7,
        x: 300 + 300 * 1,
        y: 200 + 170 * 2,
        width: 330,
        height: 300,
        beds: [
          { x: 40, y: 10, scout: "Malo", blanket: "#9683EC" },
          { x: 140, y: 10, scout: "Adele", blanket: "#9683EC" },
          { x: 240, y: 10, scout: "Rose", blanket: "#9683EC" },
          { x: 40, y: 160, scout: "Emile", blanket: "#9683EC" },
          { x: 140, y: 160, scout: "Chacha", blanket: "#9683EC" },
        ],
      },
      {
        id: 8,
        x: 1000,
        y: 200,
        width: 240,
        height: 130,
        beds: [{ x: 90, y: 10, scout: "Clem + Fred", blanket: "#ff3800" }],
      },
      {
        id: 9,
        x: 1000,
        y: 200 + 170 * 1,
        width: 240,
        height: 130,
        beds: [
          { x: 40, y: 10, scout: "Coco + Lucie", blanket: "#ff3800" },
          { x: 140, y: 10, scout: "Louise", blanket: "#ff3800" },
        ],
      },
      {
        id: 10,
        x: 1000,
        y: 200 + 170 * 2,
        width: 330,
        height: 300,
        beds: [
          { x: 40, y: 10, scout: "Arthur", blanket: "#ff3800" },
          { x: 140, y: 10, scout: "Leopold", blanket: "#ff3800" },
          { x: 240, y: 10, scout: "Romane", blanket: "#ff3800" },
          { x: 40, y: 160, scout: "Victor", blanket: "#ff3800" },
          { x: 140, y: 160, scout: "Martin", blanket: "#ff3800" },
        ],
      },
      {
        id: 11,
        x: 1000,
        y: 200 + 170 * 2 + 350,
        width: 240,
        height: 130,
        beds: [{ x: 90, y: 10, scout: "Fix", blanket: "#ff3800" }],
      },
      {
        id: 12,
        x: 1400,
        y: 200,
        width: 240,
        height: 130,
        beds: [
          { x: 40, y: 10, scout: "Filou", blanket: "#deb8ce" },
          { x: 140, y: 10, scout: "Ismael", blanket: "#deb8ce" },
        ],
      },
      {
        id: 13,
        x: 1400,
        y: 200 + 170 * 1,
        width: 240,
        height: 130,
        beds: [
          { x: 40, y: 10, scout: "Sophie + Chmile", blanket: "#deb8ce" },
          { x: 140, y: 10, scout: "Milo", blanket: "#deb8ce" },
        ],
      },
      {
        id: 14,
        x: 1400,
        y: 200 + 170 * 2,
        width: 240,
        height: 130,
        beds: [
          { x: 40, y: 10, scout: "Oceane", blanket: "#deb8ce" },
          { x: 140, y: 10, scout: "Pablo", blanket: "#deb8ce" },
        ],
      },
    ];

    // Camera and navigation state
    this.mapCamera = { x: 0, y: 0 };
    this.mapScale = 1;

    const handleMove = (x, y) => {
      if (isDragging) {
        // Adjust movement speed based on zoom level
        const speedFactor = 1 / this.mapScale;
        const dx = (x - lastX) * speedFactor;
        const dy = (y - lastY) * speedFactor;

        this.mapCamera.x += dx;
        this.mapCamera.y += dy;
        lastX = x;
        lastY = y;
        this.drawMap();
      }
    };

    // Add navigation event listeners
    let isDragging = false;
    let lastX, lastY;

    this.canvas.addEventListener("mousedown", (e) => {
      e.preventDefault();
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    });

    this.canvas.addEventListener("mousemove", (e) => {
      e.preventDefault();
      handleMove(e.clientX, e.clientY);
    });

    window.addEventListener("mouseup", () => {
      isDragging = false;
    });

    // Touch support
    this.canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      isDragging = true;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
    });

    this.canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    });

    this.canvas.addEventListener("touchend", () => {
      isDragging = false;
    });

    // Zoom with mouse wheel
    this.canvas.addEventListener("wheel", (e) => {
      e.preventDefault();

      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const worldX = (mouseX - this.mapCamera.x) / this.mapScale;
      const worldY = (mouseY - this.mapCamera.y) / this.mapScale;

      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      this.mapScale = Math.max(0.5, Math.min(2, this.mapScale * zoomFactor));

      this.mapCamera.x = mouseX - worldX * this.mapScale;
      this.mapCamera.y = mouseY - worldY * this.mapScale;

      this.drawMap();
    });

    // Add UI controls
    const taskInfo = document.getElementById("taskInfo");
    if (taskInfo) {
      taskInfo.style.pointerEvents = "auto";
      taskInfo.innerHTML = `
            <div class="p-4 bg-white rounded-lg">
                <h3 class="text-xl font-bold mb-4">Plan des Chambres</h3>
                
                <div class="flex justify-center gap-2 mb-4">
                    <button id="zoomIn" class="p-2 bg-blue-500 text-white rounded">+</button>
                    <button id="zoomOut" class="p-2 bg-blue-500 text-white rounded">-</button>
                    <button id="resetView" class="p-2 bg-gray-500 text-white rounded">Reset</button>
                </div>

                <button id="replayButton" class="mt-4 bg-green-500 text-white px-4 py-2 rounded w-full">
                    Rejouer la mission
                </button>
            </div>
        `;

      // Add button listeners
      document.getElementById("zoomIn").addEventListener("click", () => {
        this.mapScale = Math.min(2, this.mapScale * 1.2);
        this.drawMap();
      });

      document.getElementById("zoomOut").addEventListener("click", () => {
        this.mapScale = Math.max(0.5, this.mapScale * 0.8);
        this.drawMap();
      });

      document.getElementById("resetView").addEventListener("click", () => {
        this.mapCamera = { x: 0, y: 0 };
        this.mapScale = 1;
        this.drawMap();
      });

      document.getElementById("replayButton").addEventListener("click", () => {
        location.reload();
      });
    }

    // Draw initial map
    this.drawMap();
  }

  drawBed(x, y, scoutName, blanketColor) {
    const ctx = this.renderer.ctx;

    // Bed dimensions
    const bedWidth = 60;
    const bedHeight = 90;

    // Draw bed
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(x, y, bedWidth, bedHeight);

    // Draw pillow
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(x + 5, y + 5, bedWidth - 10, 20);

    // Draw blanket
    ctx.fillStyle = blanketColor;
    ctx.fillRect(x + 5, y + 25, bedWidth - 10, 50);

    // Draw scout name
    ctx.fillStyle = "#000000";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(scoutName, x + bedWidth / 2, y + bedHeight + 20);
  }

  drawMap() {
    this.renderer.begin();

    // Clear and draw background
    this.renderer.ctx.fillStyle = "#F0F0F0";
    this.renderer.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Apply camera transform
    this.renderer.ctx.save();
    this.renderer.ctx.translate(this.mapCamera.x, this.mapCamera.y);
    this.renderer.ctx.scale(this.mapScale, this.mapScale);

    // Draw rooms
    this.rooms.forEach((room) => {
      // Room outline
      this.renderer.ctx.fillStyle = "#FFFFFF";
      this.renderer.ctx.strokeStyle = "#000000";
      this.renderer.ctx.lineWidth = 2;
      this.renderer.ctx.beginPath();
      this.renderer.ctx.rect(room.x, room.y, room.width, room.height);
      this.renderer.ctx.fill();
      this.renderer.ctx.stroke();

      // Draw beds
      room.beds.forEach((bed) => {
        this.drawBed(room.x + bed.x, room.y + bed.y, bed.scout, bed.blanket);
      });

      // Room number and capacity
      this.renderer.ctx.fillStyle = "#000000";
      this.renderer.ctx.font = "bold 20px Arial";
      this.renderer.ctx.textAlign = "center";
      this.renderer.ctx.fillText(
        `Chambre ${room.id} (${room.beds.length} lit${
          room.beds.length > 1 ? "s" : ""
        })`,
        room.x + room.width / 2,
        room.y - 10
      );
    });

    this.renderer.ctx.restore();
    this.renderer.end();
  }
}

// Start the game when the page loads
window.addEventListener("load", () => {
  const game = new Game();
  game.start();
});
