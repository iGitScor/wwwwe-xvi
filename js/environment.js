class Environment {
  constructor() {
    this.trees = [];
    this.rocks = [];
    this.lake = { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2, radius: 80 };
    this.paths = [];

    // Initialize textures
    this.textures = {
      grass: null,
    };

    this.generateTextures();
    this.generateElements();
  }

  generateTextures() {
    // Create grass texture
    const grassCanvas = document.createElement("canvas");
    grassCanvas.width = 64;
    grassCanvas.height = 64;
    const grassCtx = grassCanvas.getContext("2d");

    // Base color
    const gradient = grassCtx.createLinearGradient(0, 0, 64, 64);
    gradient.addColorStop(0, "#90A955");
    gradient.addColorStop(1, "#6B8E23");
    grassCtx.fillStyle = gradient;
    grassCtx.fillRect(0, 0, 64, 64);

    // Add grass details
    grassCtx.fillStyle = "#7C9043";
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 64;
      const y = Math.random() * 64;
      const height = 3 + Math.random() * 4;
      grassCtx.fillRect(x, y, 2, height);
    }

    this.textures.grass = grassCanvas;
  }

  generateElements() {
    // Generate trees avoiding the lake and paths
    for (let i = 0; i < 15; i++) {
      let x, y;
      do {
        x = GameUtils.random(50, GAME_WIDTH - 50);
        y = GameUtils.random(50, GAME_HEIGHT - 50);
      } while (this.isPositionOccupied(x, y));

      this.trees.push({
        x,
        y,
        height: GameUtils.random(60, 100),
        width: GameUtils.random(40, 60),
        variant: Math.floor(GameUtils.random(0, 3)),
      });
    }

    // Generate rocks
    for (let i = 0; i < 8; i++) {
      let x, y;
      do {
        x = GameUtils.random(30, GAME_WIDTH - 30);
        y = GameUtils.random(30, GAME_HEIGHT - 30);
      } while (this.isPositionOccupied(x, y));

      this.rocks.push({
        x,
        y,
        size: GameUtils.random(15, 25),
        rotation: GameUtils.random(0, Math.PI * 2),
      });
    }

    // Generate paths
    this.generatePaths();
  }

  generatePaths() {
    // Main path
    let points = [
      { x: 0, y: GAME_HEIGHT / 2 },
      { x: GAME_WIDTH / 4, y: GAME_HEIGHT / 2 + 50 },
      { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 },
      { x: (GAME_WIDTH * 3) / 4, y: GAME_HEIGHT / 2 - 50 },
      { x: GAME_WIDTH, y: GAME_HEIGHT / 2 },
    ];

    this.paths.push({
      points,
      width: 30,
      type: "main",
    });

    // Secondary paths
    this.paths.push({
      points: [
        { x: GAME_WIDTH / 2, y: 0 },
        { x: GAME_WIDTH / 2, y: GAME_HEIGHT },
      ],
      width: 20,
      type: "secondary",
    });
  }

  isPositionOccupied(x, y) {
    // Check lake
    if (
      GameUtils.distance(x, y, this.lake.x, this.lake.y) <
      this.lake.radius + 30
    ) {
      return true;
    }

    // Check trees
    for (const tree of this.trees) {
      if (GameUtils.distance(x, y, tree.x, tree.y) < 40) {
        return true;
      }
    }

    // Check rocks
    for (const rock of this.rocks) {
      if (GameUtils.distance(x, y, rock.x, rock.y) < 20) {
        return true;
      }
    }

    // Check paths
    for (const path of this.paths) {
      for (let i = 0; i < path.points.length - 1; i++) {
        const d = this.distanceToLineSegment(
          x,
          y,
          path.points[i].x,
          path.points[i].y,
          path.points[i + 1].x,
          path.points[i + 1].y
        );
        if (d < path.width + 20) {
          return true;
        }
      }
    }

    return false;
  }

  distanceToLineSegment(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;

    if (len_sq !== 0) {
      param = dot / len_sq;
    }

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  update(deltaTime) {
    // Add any environment animations or updates here
  }

  checkCollision(x, y, width, height) {
    // Check collision with environment elements
    const bounds = { x, y, width, height };

    // Lake collision
    if (
      GameUtils.distance(
        x + width / 2,
        y + height / 2,
        this.lake.x,
        this.lake.y
      ) < this.lake.radius
    ) {
      return true;
    }

    // Tree collision
    for (const tree of this.trees) {
      if (
        GameUtils.rectIntersect(
          x,
          y,
          width,
          height,
          tree.x - tree.width / 2,
          tree.y - tree.height / 2,
          tree.width,
          tree.height
        )
      ) {
        return true;
      }
    }

    // Rock collision
    for (const rock of this.rocks) {
      if (
        GameUtils.distance(x + width / 2, y + height / 2, rock.x, rock.y) <
        rock.size + width / 2
      ) {
        return true;
      }
    }

    return false;
  }
}
