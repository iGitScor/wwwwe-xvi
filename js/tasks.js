class Task {
  constructor(x, y, type, requirements) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.requirements = requirements;
    this.completed = false;
    this.inProgress = false;
    this.progress = 0;
    this.interactionRadius = 50;

    // Task-specific properties
    switch (type) {
      case "fire":
        this.emoji = "🔥";
        this.label = "Allumer un feu";
        this.steps = [
          "Rassembler du bois",
          "Préparer le foyer",
          "Allumer le feu",
        ];
        break;
      case "tent":
        this.emoji = "⛺";
        this.label = "Monter une tente";
        this.steps = [
          "Déplier la tente",
          "Planter les piquets",
          "Tendre les cordes",
        ];
        break;
      case "footprints":
        this.emoji = "🐾";
        this.label = "Identifier les traces";
        this.steps = [
          "Observer les empreintes",
          "Mesurer la taille",
          "Comparer au guide",
        ];
        break;
      case "water":
        this.emoji = "💧";
        this.label = "Remplir la gourde";
        this.steps = [
          "Trouver une source",
          "Filtrer l'eau",
          "Remplir la gourde",
        ];
        break;
    }
  }

  canInteract(character) {
    // Calculate character's center position
    const charCenterX = character.x + character.width / 2;
    const charCenterY = character.y + character.height / 2;

    // Calculate distance from character's center to task's center
    const distance = Math.sqrt(
      Math.pow(charCenterX - this.x, 2) + Math.pow(charCenterY - this.y, 2)
    );

    // Check if character is within interaction radius
    return distance < this.interactionRadius * 1.2;
  }

  startInteraction(character) {
    if (this.completed || this.inProgress) return false;
    if (!this.canInteract(character)) return false;

    this.inProgress = true;
    this.progress = 0;

    // Create action for character
    return {
      duration: 3000,
      onProgress: (progress) => {
        this.progress = progress;
      },
      onComplete: () => {
        this.completed = true;
        this.inProgress = false;
        this.progress = 1;
      },
    };
  }

  draw(ctx) {
    // Draw interaction zone
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.interactionRadius, 0, Math.PI * 2);
    ctx.fillStyle = this.completed
      ? "rgba(74, 222, 128, 0.2)"
      : this.inProgress
      ? "rgba(250, 204, 21, 0.2)"
      : "rgba(255, 255, 255, 0.2)";
    ctx.fill();

    // Draw task icon
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.emoji, this.x, this.y);

    // Draw progress bar if in progress
    if (this.inProgress) {
      const barWidth = 40;
      const barHeight = 6;
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(this.x - barWidth / 2, this.y + 20, barWidth, barHeight);
      ctx.fillStyle = "#FFDD00";
      ctx.fillRect(
        this.x - barWidth / 2,
        this.y + 20,
        barWidth * this.progress,
        barHeight
      );
    }

    // Draw completion checkmark
    if (this.completed) {
      ctx.font = "16px Arial";
      ctx.fillStyle = "#22C55E";
      ctx.fillText("✓", this.x, this.y - 20);
    }
  }
}

class TaskManager {
  constructor() {
    this.tasks = [
      new Task(100, 150, "fire"),
      new Task(300, 100, "tent"),
      new Task(500, 200, "footprints"),
      new Task(200, 400, "water"),
    ];
  }

  areAllTasksComplete() {
    return this.tasks.every((task) => task.completed);
  }

  update(character) {
    this.tasks.forEach((task) => {
      if (task.canInteract(character)) {
        document.getElementById("taskInfo").innerHTML = `
                  <h3>${task.label}</h3>
                  <p>${
                    task.completed
                      ? "Terminé ✓"
                      : task.inProgress
                      ? `En cours... ${Math.floor(task.progress * 100)}%`
                      : "Appuyez sur ESPACE ou ⚡️ pour commencer"
                  }</p>
              `;
      }
    });
  }

  draw(ctx) {
    this.tasks.forEach((task) => task.draw(ctx));
  }
}
