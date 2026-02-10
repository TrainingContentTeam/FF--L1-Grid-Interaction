const TIME_LIMIT_SECONDS = 45;
const GRID_SIZE = 3; // 3x3 grid
const TOTAL_SCENES = 18;

const timerDisplay = document.getElementById("timerDisplay");
const pauseButton = document.getElementById("pauseButton");
const gridContainer = document.getElementById("grid");
const pauseOverlay = document.getElementById("pauseOverlay");
const gridSection = document.querySelector(".grid");
const completionMessage = document.getElementById("completionMessage");
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxCaption = document.getElementById("lightboxCaption");
const lightboxCloseButtons = Array.from(document.querySelectorAll("[data-lightbox-close]"));

let remainingSeconds = TIME_LIMIT_SECONDS;
let timerId = null;
let isPaused = true;
let isStarted = false;
let isComplete = false;

const sceneData = [
  { stage: "Decay Stage", scene: 1 },
  { stage: "Decay Stage", scene: 2 },
  { stage: "Fully Developed Stage", scene: 3 },
  { stage: "Fully Developed Stage", scene: 4 },
  { stage: "Growth Stage", scene: 5 },
  { stage: "Fully Developed Stage", scene: 17 },
  { stage: "Growth Stage", scene: 18 },
  { stage: "Growth Stage", scene: 6 },
  { stage: "Growth Stage", scene: 7 },
  { stage: "Growth Stage", scene: 8 },
  { stage: "Growth Stage", scene: 9 },
  { stage: "Growth Stage", scene: 10 },
  { stage: "Incipient Stage", scene: 11 },
  { stage: "Incipient Stage", scene: 12 },
  { stage: "Incipient Stage", scene: 13 },
  { stage: "Incipient Stage", scene: 14 },
  { stage: "Incipient Stage", scene: 15 },
  { stage: "Incipient Stage", scene: 16 },
];

let cells = [];
const labels = Array.from(document.querySelectorAll(".label"));
let availableScenes = [...sceneData];
let usedScenes = [];
let completionQueue = [];
let points = 0;
let isReplacingCards = false;
let lastFocusedElement = null;
let completedScenesCount = 0;

const pointsDisplay = document.getElementById("pointsDisplay");

const sceneImages = {
  1: "images/grid _0000_Decay 2.jpg",
  2: "images/grid _0001_Decay 1.jpg",
  3: "images/grid _0002_Full 3.jpg",
  4: "images/grid _0003_Full 2.jpg",
  5: "images/grid _0004_Growth 6.jpg",
  6: "images/grid _0005_Growth 5.jpg",
  7: "images/grid _0006_Growth 4.jpg",
  8: "images/grid _0007_Growth 3.jpg",
  9: "images/grid _0008_Growth 2.jpg",
  10: "images/grid _0009_Growth 1.jpg",
  11: "images/grid _0010_Incipient 5.jpg",
  12: "images/grid _0011_Incipient 4.jpg",
  13: "images/grid _0012_Incipient 3.jpg",
  14: "images/grid _0013_Incipient 2.jpg",
  15: "images/grid _0014_Incipient 1.jpg",
  16: "images/grid_0015_Incipient 6.jpg",
  17: "images/grid_0016_Full 5.jpg",
  18: "images/grid_0017_Growth 7.jpg",
};

const getSceneImage = (sceneNumber) => sceneImages[sceneNumber] || "";

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const populateGrid = () => {
  gridContainer.innerHTML = "";
  const selectedScenes = shuffleArray(availableScenes).slice(0, GRID_SIZE * GRID_SIZE);
  
  selectedScenes.forEach((sceneInfo, index) => {
    const article = document.createElement("article");
    article.className = "grid__cell";
    article.dataset.stage = sceneInfo.stage;
    article.dataset.scene = sceneInfo.scene;
    article.dataset.answered = "false";
    article.dataset.active = "false";
    article.dataset.index = index;
    article.dataset.image = getSceneImage(sceneInfo.scene);
    
    const imageDiv = document.createElement("div");
    imageDiv.className = `grid__image scene-${sceneInfo.scene}`;
    
    const statusDiv = document.createElement("div");
    statusDiv.className = "grid__status";
    statusDiv.setAttribute("aria-live", "polite");
    
    article.appendChild(imageDiv);
    article.appendChild(statusDiv);
    gridContainer.appendChild(article);
    
    usedScenes.push(sceneInfo.scene);
  });
  
  // Remove used scenes from available
  availableScenes = availableScenes.filter(
    (scene) => !usedScenes.includes(scene.scene)
  );
  
  cells = Array.from(document.querySelectorAll(".grid__cell"));
  attachCellEventListeners();
};

const attachCellEventListeners = () => {
  cells.forEach((cell) => {
    cell.addEventListener("dragover", (event) => {
      if (cell.dataset.answered === "true" || isPaused || isComplete || !isStarted) {
        return;
      }
      event.preventDefault();
      cell.dataset.active = "true";
    });

    cell.addEventListener("dragleave", () => {
      cell.dataset.active = "false";
    });

    cell.addEventListener("drop", (event) => {
      cell.dataset.active = "false";
      handleDrop(event, cell);
    });
  });
};

const openLightbox = (cell) => {
  if (!cell || !lightbox || !lightboxImage || !lightboxCaption) {
    return;
  }
  const imageSource = cell.dataset.image;
  if (!imageSource) {
    return;
  }
  lastFocusedElement = document.activeElement;
  lightboxImage.src = imageSource;
  const isAnswered = cell.dataset.answered === "true";
  lightboxImage.alt = isAnswered ? `Fire scene. Correct answer: ${cell.dataset.stage}.` : "Fire scene.";
  lightboxCaption.textContent = isAnswered ? `Correct answer: ${cell.dataset.stage}` : "";
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-lightbox-open");
  const closeButton = lightbox.querySelector(".lightbox__close");
  if (closeButton) {
    closeButton.focus();
  }
};

const closeLightbox = () => {
  if (!lightbox) {
    return;
  }
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-lightbox-open");
  if (lightboxImage) {
    lightboxImage.src = "";
  }
  if (lightboxCaption) {
    lightboxCaption.textContent = "";
  }
  if (lastFocusedElement) {
    lastFocusedElement.focus();
    lastFocusedElement = null;
  }
};

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
};

const updateTimerDisplay = () => {
  timerDisplay.textContent = formatTime(remainingSeconds);
};

const updatePointsDisplay = () => {
  if (pointsDisplay) {
    pointsDisplay.textContent = points;
  }
};

const updateOverlayMessage = (message, subMessage) => {
  if (!pauseOverlay) {
    return;
  }
  const title = pauseOverlay.querySelector("p");
  const subtitle = pauseOverlay.querySelector("span");
  if (title) {
    title.textContent = message;
  }
  if (subtitle) {
    subtitle.textContent = subMessage || "";
  }
};

const setPausedState = (paused) => {
  isPaused = paused;
  pauseButton.classList.toggle("is-paused", isPaused && isStarted);
  if (isStarted) {
    pauseButton.textContent = isPaused ? "Resume" : "Pause";
  }
  pauseOverlay.setAttribute("aria-hidden", String(!isPaused));
  gridSection?.classList.toggle("is-paused", isPaused);
  if (isPaused && isStarted) {
    updateOverlayMessage("Paused", "Click the grid to resume.");
  }
};

const startInteraction = () => {
  if (isComplete || isStarted) {
    return;
  }
  isStarted = true;
  pauseButton.textContent = "Pause";
  setPausedState(false);
  startTimer();
};

const resetGame = () => {
  // Reset all game state variables
  remainingSeconds = TIME_LIMIT_SECONDS;
  points = 0;
  isStarted = false;
  isComplete = false;
  isPaused = true;
  isReplacingCards = false;
  usedScenes = [];
  completionQueue = [];
  completedScenesCount = 0;
  availableScenes = [...sceneData];
  
  // Reset UI
  pauseButton.textContent = "Begin";
  updateTimerDisplay();
  updatePointsDisplay();
  completionMessage.textContent = "";
  
  // Re-enable labels
  labels.forEach((label) => {
    label.setAttribute("draggable", "true");
    label.disabled = false;
  });
  
  // Reset overlay
  updateOverlayMessage("Ready to begin", "Click anywhere on the grid to start.");
  setPausedState(true);
  
  // Repopulate grid
  populateGrid();
};

const endInteraction = (message) => {
  if (isComplete) {
    return;
  }
  isComplete = true;
  clearInterval(timerId);
  completionMessage.textContent = message;
  pauseButton.textContent = "Reset";
  labels.forEach((label) => {
    label.setAttribute("draggable", "false");
    label.disabled = true;
  });
  cells.forEach((cell) => {
    if (cell.dataset.answered !== "true") {
      revealCorrectStage(cell, true);
    }
    cell.dataset.answered = "true";
  });
};

const endInteractionForCompletion = () => {
  const remainingTime = formatTime(remainingSeconds);
  try {
    window.parent.postMessage({ type: "complete" }, "*");
  } catch (error) {
    console.warn("[TIMER] postMessage failed", error);
  }
  endInteraction(`All scenes completed with ${remainingTime} remaining. Final score: ${points} points.`);
};

const revealCorrectStage = (cell, timedOut = false) => {
  const correctStage = cell.dataset.stage;
  const status = cell.querySelector(".grid__status");
  status.innerHTML = "";

  const message = document.createElement("div");
  message.textContent = correctStage;
  status.appendChild(message);

  if (timedOut) {
    const note = document.createElement("span");
    note.textContent = "Time expired";
    status.appendChild(note);
  }

  status.classList.add("is-visible");
  cell.classList.add("is-locked");
};

const replaceCellsSequentially = async () => {
  // Only replace if time remains and there are available scenes
  if (remainingSeconds <= 0 || availableScenes.length === 0 || completionQueue.length === 0 || isComplete) {
    isReplacingCards = false;
    return;
  }

  isReplacingCards = true;

  // Replace each completed cell one at a time
  while (completionQueue.length > 0 && availableScenes.length > 0 && remainingSeconds > 0 && !isComplete) {
    const cellToReplace = completionQueue.shift();
    const newScene = availableScenes.shift();

    // Add exit animation
    cellToReplace.classList.add("is-exiting");

    // Wait for exit animation
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Update the cell
    cellToReplace.dataset.stage = newScene.stage;
    cellToReplace.dataset.scene = newScene.scene;
    cellToReplace.dataset.answered = "false";
    cellToReplace.dataset.image = getSceneImage(newScene.scene);
    cellToReplace.classList.remove("is-exiting");
    cellToReplace.classList.add("is-entering");

    // Update image
    const imageDiv = cellToReplace.querySelector(".grid__image");
    imageDiv.className = `grid__image scene-${newScene.scene}`;

    // Clear status
    const statusDiv = cellToReplace.querySelector(".grid__status");
    statusDiv.innerHTML = "";
    statusDiv.classList.remove("is-visible");
    cellToReplace.classList.remove("is-locked");

    usedScenes.push(newScene.scene);

    // Wait for enter animation
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Remove animation class
    cellToReplace.classList.remove("is-entering");
  }

  isReplacingCards = false;
};

const handleDrop = (event, cell) => {
  event.preventDefault();
  if (isComplete || isPaused || !isStarted) {
    return;
  }

  if (cell.dataset.answered === "true") {
    return;
  }

  const droppedStage = event.dataTransfer.getData("text/plain");
  const correctStage = cell.dataset.stage;
  const status = cell.querySelector(".grid__status");
  status.innerHTML = "";

  const stageLabel = document.createElement("div");
  stageLabel.textContent = correctStage;
  status.appendChild(stageLabel);

  let isCorrect = false;
  if (droppedStage === correctStage) {
    status.classList.add("is-visible");
    cell.classList.add("is-locked");
    cell.dataset.answered = "true";
    isCorrect = true;
    points += 10;
    updatePointsDisplay();
  } else {
    const note = document.createElement("span");
    note.textContent = `Incorrect. Correct stage: ${correctStage}.`;
    status.appendChild(note);
    status.classList.add("is-visible");
    cell.classList.add("is-locked");
    cell.dataset.answered = "true";
  }

  completedScenesCount += 1;

  // Add cell to completion queue
  completionQueue.push(cell);

  if (completedScenesCount >= TOTAL_SCENES) {
    endInteractionForCompletion();
    return;
  }

  // Check if all 9 cards are completed
  const answeredCount = cells.filter(
    (c) => c.dataset.answered === "true"
  ).length;
  if (answeredCount === GRID_SIZE * GRID_SIZE && !isReplacingCards) {
    replaceCellsSequentially();
  }
};

const startTimer = () => {
  console.log("[TIMER] startTimer called", {
    remainingSeconds,
    isPaused,
    isComplete,
    points
  });

  updateTimerDisplay();
  updatePointsDisplay();

  timerId = setInterval(() => {
    if (isPaused || isComplete) {
      console.log("[TIMER] Tick skipped", {
        isPaused,
        isComplete
      });
      return;
    }

    remainingSeconds -= 1;
    console.log("[TIMER] Tick", { remainingSeconds });

    updateTimerDisplay();

    if (remainingSeconds <= 0) {
      remainingSeconds = 0;
      updateTimerDisplay();

      console.log("[TIMER] Time expired — completing interaction", {
        finalPoints: points
      });

      try {
        window.parent.postMessage({ type: "complete" }, "*");
        console.log("[TIMER] postMessage sent to parent");
      } catch (error) {
        console.warn("[TIMER] postMessage failed", error);
      }

      endInteraction(`Time is up. Final score: ${points} points.`);
    }
  }, 1000);
};


pauseButton.addEventListener("click", () => {
  if (isComplete) {
    resetGame();
    return;
  }
  
  if (!isStarted) {
    startInteraction();
    return;
  }
  
  // Toggle pause/resume
  setPausedState(!isPaused);
});

labels.forEach((label) => {
  label.addEventListener("dragstart", (event) => {
    if (isComplete || isPaused || !isStarted) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData("text/plain", label.dataset.stage);
  });
});

gridContainer.addEventListener("click", (event) => {
  if (!isStarted) {
    startInteraction();
    return;
  }
  if (isPaused) {
    setPausedState(false);
    return;
  }
  const cell = event.target.closest(".grid__cell");
  if (!cell || !gridContainer.contains(cell)) {
    return;
  }
  openLightbox(cell);
});

pauseOverlay.addEventListener("click", () => {
  if (!isStarted) {
    startInteraction();
    return;
  }
  if (isPaused) {
    setPausedState(false);
  }
});

lightboxCloseButtons.forEach((button) => {
  button.addEventListener("click", () => {
    closeLightbox();
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox?.classList.contains("is-open")) {
    closeLightbox();
  }
});

updateOverlayMessage("Ready to begin", "Click anywhere on the grid to start.");
setPausedState(true);
updateTimerDisplay();
updatePointsDisplay();
populateGrid();
