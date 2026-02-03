const TIME_LIMIT_SECONDS = 90;

const timerDisplay = document.getElementById("timerDisplay");
const scoreDisplay = document.getElementById("scoreDisplay");
const pauseButton = document.getElementById("pauseButton");
const grid = document.getElementById("grid");
const pauseOverlay = document.getElementById("pauseOverlay");
const completionMessage = document.getElementById("completionMessage");

let remainingSeconds = TIME_LIMIT_SECONDS;
let timerId = null;
let isPaused = false;
let isComplete = false;
let score = 0;

const cells = Array.from(document.querySelectorAll(".grid__cell"));
const labels = Array.from(document.querySelectorAll(".label"));

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
};

const updateTimerDisplay = () => {
  timerDisplay.textContent = formatTime(remainingSeconds);
};

const updateScoreDisplay = () => {
  scoreDisplay.textContent = `${score} / ${cells.length}`;
};

const endInteraction = (message) => {
  if (isComplete) {
    return;
  }
  isComplete = true;
  clearInterval(timerId);
  completionMessage.textContent = message;
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

const handleDrop = (event, cell) => {
  event.preventDefault();
  if (isComplete || isPaused) {
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

  if (droppedStage === correctStage) {
    status.classList.add("is-visible");
    cell.classList.add("is-locked");
    cell.dataset.answered = "true";
    score += 1;
    updateScoreDisplay();
  } else {
    const note = document.createElement("span");
    note.textContent = `Incorrect. Correct stage: ${correctStage}.`;
    status.appendChild(note);
    status.classList.add("is-visible");
    cell.classList.add("is-locked");
    cell.dataset.answered = "true";
  }

  checkCompletion();
};

const checkCompletion = () => {
  const answeredCount = cells.filter((cell) => cell.dataset.answered === "true").length;
  if (answeredCount === cells.length) {
    endInteraction("All scenes reviewed. Interaction complete.");
  }
};

const startTimer = () => {
  updateScoreDisplay();
  updateTimerDisplay();
  timerId = setInterval(() => {
    if (isPaused || isComplete) {
      return;
    }
    remainingSeconds -= 1;
    updateTimerDisplay();
    if (remainingSeconds <= 0) {
      remainingSeconds = 0;
      updateTimerDisplay();
      endInteraction("Time is up. Correct stages are now shown.");
    }
  }, 1000);
};

pauseButton.addEventListener("click", () => {
  if (isComplete) {
    return;
  }
  isPaused = !isPaused;
  pauseButton.classList.toggle("is-paused", isPaused);
  pauseButton.textContent = isPaused ? "Resume" : "Pause";
  pauseOverlay.setAttribute("aria-hidden", String(!isPaused));
  grid.classList.toggle("is-paused", isPaused);
});

labels.forEach((label) => {
  label.addEventListener("dragstart", (event) => {
    if (isComplete || isPaused) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData("text/plain", label.dataset.stage);
  });
});

cells.forEach((cell) => {
  cell.addEventListener("dragover", (event) => {
    if (cell.dataset.answered === "true" || isPaused || isComplete) {
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

startTimer();
