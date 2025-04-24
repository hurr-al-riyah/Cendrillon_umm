const canvas = document.getElementById("raceCanvas");
const ctx = canvas.getContext("2d");

let allRaces = [];
let selectedRace = null;
let horseNames = [];
let segments = [];
let currentPositions = [];
let targetPositions = [];
let currentIndex = 0;
let transitionStartTime = null;
let animationFrame = null;
let playing = false;
let speed = 500;

const horseColors = [
  "#c70c60", "#5ABEFF", "#283DA1", "#fac802", "#ff94bc",
  "#FFDA73", "#3C3C3C", "#0d7a65", "#DC143C"
];

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function updateCommentary(index) {
  const commentary = selectedRace.commentary?.[index] || "";
  document.getElementById("commentaryArea").innerHTML = commentary;
}



function animate(timestamp) {
  if (!transitionStartTime) transitionStartTime = timestamp;
  const progress = Math.min((timestamp - transitionStartTime) / speed, 1);

  currentPositions = currentPositions.map((curr, i) =>
    lerp(curr, targetPositions[i], progress)
  );

  drawFrame(currentPositions);

  if (progress < 1) {
    animationFrame = requestAnimationFrame(animate);
  } else {
    currentPositions = [...targetPositions];
    transitionStartTime = null;
    if (playing && currentIndex < segments.length - 1) {
      currentIndex++;
      startTransition();
    } else {
      playing = false;
      document.getElementById("playButton").textContent = "▶ 재생";
    }
  }
}

function startTransition() {
  targetPositions = segments[currentIndex];
  animationFrame = requestAnimationFrame(animate);
}

function drawFrame(positions) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const margin = 120;
  const max = Math.max(...segments.flat());
  const scale = (canvas.width - 2 * margin) / max;

  positions.forEach((pos, i) => {
    const x = margin + pos * scale;
    const y = 40 + i * 26;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, 2 * Math.PI);
    ctx.fillStyle = horseColors[i % horseColors.length];
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#000";
    ctx.fillText(`[${i + 1}] ${horseNames[i]}`, x + 15, y + 5);
  });

  ctx.fillStyle = "#666";
  ctx.fillText(`구간 ${currentIndex} / ${segments.length - 1}`, 10, canvas.height - 10);

  updateCommentary(currentIndex);
}

function selectRace(index) {
  selectedRace = allRaces[index];
  horseNames = selectedRace.horse_names;
  segments = selectedRace.positions;
  currentPositions = new Array(horseNames.length).fill(0);
  currentIndex = 0;
  document.querySelector("h1").textContent = selectedRace.race_title;
  drawFrame(currentPositions);
}

function loadAllRaces() {
  fetch("data.json")
    .then(res => res.json())
    .then(json => {
      allRaces = json.races;
      const select = document.getElementById("raceSelect");
      select.innerHTML = "";

      allRaces.forEach((race, idx) => {
        const option = document.createElement("option");
        option.value = idx;
        option.textContent = race.race_title;
        select.appendChild(option);
      });

      select.addEventListener("change", (e) => {
        selectRace(parseInt(e.target.value));
      });

      selectRace(0);
    });
}

document.getElementById("playButton").onclick = () => {
  if (!playing) {
    playing = true;
    document.getElementById("playButton").textContent = "⏸ 일시정지";
    if (currentIndex >= segments.length) {
      currentIndex = 0;
      currentPositions = new Array(horseNames.length).fill(0);
    }
    startTransition();
  } else {
    playing = false;
    document.getElementById("playButton").textContent = "▶ 재생";
    if (animationFrame) cancelAnimationFrame(animationFrame);
  }
};

document.getElementById("speedSelect").onchange = (e) => {
  speed = parseInt(e.target.value);
};

document.getElementById("prevBtn").onclick = () => {
  if (currentIndex > 0) {
    currentIndex--;
    targetPositions = segments[currentIndex];
    transitionStartTime = null;
    animationFrame = requestAnimationFrame(animate);
  }
};

document.getElementById("nextBtn").onclick = () => {
  if (currentIndex < segments.length - 1) {
    currentIndex++;
    targetPositions = segments[currentIndex];
    transitionStartTime = null;
    animationFrame = requestAnimationFrame(animate);
  }
};


loadAllRaces();