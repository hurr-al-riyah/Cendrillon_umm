const backgroundCanvas = document.getElementById("backgroundCanvas");
const backgroundCtx = backgroundCanvas.getContext("2d");

const raceCanvas = document.getElementById("raceCanvas");
const raceCtx = raceCanvas.getContext("2d");


let allRaces = [];
let selectedRace = null;
let currentRaceIndex = 0;
let horseNames = [];
let segments = [];
let currentPositions = [];
let startPositions = [];
let targetPositions = [];
let currentIndex = 0;
let transitionStartTime = null;
let transitionDuration = 1000; // 구간별 기본 지속시간
let animationFrame = null;
let playing = false;
let baseSpeed = 2.0; // 기본 속도 배율
let baseSpeedTmp = 2.0;
let directionMode = "auto"; // 기본은 자동
let dir = 1;

// 전역변수 초기화
function restGlobalVariables() {
  currentPositions = [];
  startPositions = [];
  targetPositions = [];
  currentIndex = 0;
  transitionStartTime = null;
  transitionDuration = 1000;
  animationFrame = null;
  playing = false;
  baseSpeedTmp = 2.0;
  directionMode = "auto";
  dir = 1;
  currentHorseIndex = 0;
  runwayProgress = 0;
  pauseDuration = 0;
  pauseStartTime = null;
}

// 날씨: ☀️☁️💧🌧️
// 혹시 몰라서 날씨 가져오는 함수 미리 만들어 둠 (미사용)
function getWeatherEmoji(weather) {
  switch (weather) {
    case "맑음": return "☀️";
    case "흐림": return "☁️";
    case "다습": return "💧";
    case "비": return "🌧️";
    default: return "";
  }
}

const horseColorsMap = {
  "XV : 더 데빌": "#38761d",
  "스윗 헤븐즈": "#674ea7",
  "네뷸라 크레센트": "#cc0000",
  "시로키바 바리아": "#ff6d01",
  "5번 참가자": "#b3de70",
  "애쉬 서클": "#ffd966",
  "폴라리스 블룸": "#f4cccc",
  "PH-4649": "#cc4125",
  "기어 블리츠": "#ff94bc",
  "리버댄스 레터": "#b7b7b7",
  "아마노 테리온": "#f1c232",
  "카고미야 마수드 와르다": "#1c4587",
  "크로노 가스펠": "#434343",
  "기요르기스": "#4d351c",
  "뉴 페인터": "#ff68bb",
  "″-9": "#ffe2f2",
  "브라이트 샤워": "#f3f3f3",
  "피어스 더 퓨처": "#ddcfff"
};


// 기본 함수
function lerp(a, b, t) {
  return a + (b - a) * t;
}

function updateCommentary(index) {
  const commentary = selectedRace.commentary?.[index] || "";
  document.getElementById("commentaryArea").innerHTML = commentary;
}

// 이동 관련
function prepareNextTransition() {
  startPositions = [...currentPositions];
  targetPositions = segments[currentIndex];

  const diffs = currentPositions.map((curr, i) => Math.abs(targetPositions[i] - curr));
  const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  transitionDuration = Math.max(300, Math.min(1500, (avgDiff / 10) * 1000)) / baseSpeed;
}

function startTransition(timestamp) {
  prepareNextTransition();
  transitionStartTime = timestamp || performance.now();
  animationFrame = requestAnimationFrame(animate);
}

let pauseDuration = 0; // 멈출 시간(ms)
let pauseStartTime = null; // 멈추기 시작한 시간

function animate(timestamp) {
  if (!transitionStartTime) transitionStartTime = timestamp;

  if (pauseDuration > 0) {
    if (!pauseStartTime) pauseStartTime = timestamp;
    const pauseElapsed = timestamp - pauseStartTime;
    if (pauseElapsed < pauseDuration) {
      animationFrame = requestAnimationFrame(animate);
      return; // 멈춘 상태 유지
    } else {
      // 멈춤 완료
      pauseDuration = 0;
      pauseStartTime = null;
      transitionStartTime = timestamp;
    }
  }

  const elapsed = timestamp - transitionStartTime;
  const progress = Math.min(elapsed / transitionDuration, 1);

  currentPositions = startPositions.map((start, i) =>
    start + (targetPositions[i] - start) * progress
  );

  drawFrame(currentPositions);

  if (progress >= 1) {
    if (playing && currentIndex < segments.length - 1) {
      currentIndex++;
      backgroundCtxUpdate();

      if (currentRaceIndex === 2 && currentIndex === 13) {
        pauseDuration = 3000;
      }
      if (currentRaceIndex === 2 && currentIndex === 14) {
        pauseDuration = 2000;
      }
      if (currentRaceIndex === 2 && currentIndex === 15) {
        pauseDuration = 5000;
      }
      if (currentRaceIndex === 3 && currentIndex >= 11 && currentIndex <= 13) {
        pauseDuration = 1000;
        baseSpeedTmp = baseSpeed;
        baseSpeed = 4.0
      }
      if (currentRaceIndex === 5 && (currentIndex === 6 || currentIndex === 8)) {
        pauseDuration = 3000;
      }

      prepareNextTransition();

      if (currentRaceIndex === 3 && currentIndex >= 11 && currentIndex <= 13) {
        pauseDuration = 1000;
        baseSpeed = baseSpeedTmp;
      }

      transitionStartTime = timestamp;
    } else {
      playing = false;
      document.getElementById("playButton").textContent = "▶ 재생";
      return;
    }
  }

  if (playing) {
    animationFrame = requestAnimationFrame(animate);
  }
}

function singleAnimate(timestamp) {
  if (!transitionStartTime) transitionStartTime = timestamp;
  const elapsed = timestamp - transitionStartTime;
  const progress = Math.min(elapsed / transitionDuration, 1);

  currentPositions = startPositions.map((start, i) =>
    start + (targetPositions[i] - start) * progress
  );

  drawFrame(currentPositions);

  if (progress < 1) {
    requestAnimationFrame(singleAnimate);
  }
}

function backgroundCtxUpdate()
{
  backgroundCtx.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
  
  const highlightText = selectedRace.highlight?.[currentIndex];
  if (highlightText && highlightText.trim() !== "") {
    backgroundCtx.font = "bold 20px sans-serif";
    backgroundCtx.fillStyle = "#000000";
    backgroundCtx.textAlign = "center";
    backgroundCtx.fillText(highlightText, backgroundCanvas.width / 2, 30);
    backgroundCtx.textAlign = "start";
  }

  backgroundCtx.font = "12px sans-serif";
  backgroundCtx.fillStyle = "#666";
  backgroundCtx.fillText(`구간 ${currentIndex} / ${segments.length - 1}`, 10, backgroundCanvas.height - 10);
}

// visualization
function drawFrame(positions, alone=false) {
  raceCtx.clearRect(0, 0, raceCanvas.width, raceCanvas.height);
  const left_margin = 15;
  const right_margin = 130;
  // const margin = 120;
  // const max = Math.max(...segments.slice(0, segments.length - 1).flat());  // 최종 구간 -1에서 표시하는 부분
  max = Math.max(...segments.flat());
  if (alone == true) {
    max = 1000;
  }
  const scale = (raceCanvas.width - (left_margin + right_margin)) / max;
  const highlightIndices = selectedRace.highlight_speaker?.[currentIndex] || [];

  window.tooltipRegions = [];
  positions.forEach((pos, i) => {
    if (pos < 0) return;

    let x;
    if (dir === 1) {
      x = left_margin + pos * scale;
    } else {
      x = left_margin + (max - pos) * scale;
    }
    
    y = 30 + (9 - positions.length) * 10 + i * 26;
    if (alone === true) {
      y = raceCanvas.height / 2;
    }
    raceCtx.font = currentRaceIndex === 7 ? "24px sans-serif" : "12px sans-serif";
    raceCtx.beginPath();
    raceCtx.arc(x, y, 10, 0, 2 * Math.PI);
    raceCtx.fillStyle = horseColorsMap[horseNames[i]] || "#CCCCCC";
    raceCtx.fill();

    if (highlightIndices.includes(i + 1)) {
      raceCtx.strokeStyle = "#ff5050"; // 붉은색
      raceCtx.lineWidth = 3;
    } else {
      raceCtx.strokeStyle = "#000"; // 기본 검은색
      raceCtx.lineWidth = 1;
    }
    raceCtx.stroke();

    raceCtx.fillStyle = "#000";
    raceCtx.fillText(`[${i + 1}] ${horseNames[i]}`, x + 15, y + 5);

    window.tooltipRegions.push({
      x: x, y: y, radius: 10, // 원 영역
      text: selectedRace.race_type?.[i] || "각질 정보 없음" // 해당 우마무스메의 각질
    });
  });
  updateCommentary(currentIndex);
}

let currentHorseIndex = 0;
let runwayProgress = 0;

// 승부복 공개 무대 전용 함수
function animateRunway(timestamp) {
  if (!transitionStartTime) transitionStartTime = timestamp;
  const elapsed = timestamp - transitionStartTime;
  const progress = Math.min(elapsed / (transitionDuration * 10 / baseSpeed) + runwayProgress, 1);

  // 현재 구간에서 0인 말만 선택
  const currentRunnerIndex = segments[currentIndex].findIndex(v => v === 0);

  // 주자 이동
  currentPositions = horseNames.map((_, i) =>
    i === currentRunnerIndex ? transitionDuration * progress : -1
  );

  drawFrame(currentPositions, true);

  if (progress >= 1) {
    runwayProgress = 0;
    if (currentIndex < segments.length - 1) {
      currentIndex++;
      backgroundCtxUpdate();
      transitionStartTime = null;
      updateCommentary(currentIndex);
    } else {
      playing = false;
      document.getElementById("playButton").textContent = "▶ 재생";
      return;
    }
  }

  if (playing) {
    requestAnimationFrame(animateRunway);
  }else{
    runwayProgress = progress;
  }
}

// 초기화
function selectRace(index) {
  restGlobalVariables();
  document.getElementById("playButton").textContent = "▶ 재생";
  if (index !== 7) {
    requestAnimationFrame(singleAnimate);
  }

  currentRaceIndex = index;
  selectedRace = allRaces[index];
  horseNames = selectedRace.horse_names;
  segments = selectedRace.positions;
  currentPositions = new Array(horseNames.length).fill(0);
  startPositions = [...currentPositions];
  targetPositions = segments[0];
  currentIndex = 0;
  backgroundCtxUpdate();
  dir = selectedRace.direction ?? 1;
  
  document.querySelector("h1").textContent = selectedRace.race_title;
  if (currentRaceIndex === 7) {
    currentHorseIndex = 0;
    transitionStartTime = null;
    updateCommentary(currentHorseIndex);
    requestAnimationFrame(animateRunway);
  } else {
    drawFrame(currentPositions);
  }
}

function loadAllRaces() {
  fetch("data.json?version=v1.11")
    .then(res => res.json())
    .then(json => {
      allRaces = json.races;
      const select = document.getElementById("raceSelect");
      select.innerHTML = "";

      [...allRaces].reverse().forEach((race, idx) => {
        const option = document.createElement("option");
        option.value = allRaces.length - 1 - idx; // value는 원본 배열 기준
        option.textContent = race.race_title;
        select.appendChild(option);
      });

      select.addEventListener("change", (e) => {
        selectRace(parseInt(e.target.value));
      });

      selectRace(allRaces.length - 1); // 마지막 레이스 선택
      backgroundCtxUpdate();
    });
}

// 버튼 처리
document.getElementById("playButton").onclick = () => {
  if (!playing) {
    playing = true;
    document.getElementById("playButton").textContent = "⏸ 일시정지";
    if (currentIndex >= segments.length) {
      currentIndex = 0;
      currentPositions = new Array(horseNames.length).fill(0);
    }
    if (currentRaceIndex === 7) { // 런웨이 모드
      transitionStartTime = null;
      updateCommentary(currentIndex);
      requestAnimationFrame(animateRunway);
    } else {
      startTransition();
    }
    backgroundCtxUpdate();
  } else {
    playing = false;
    document.getElementById("playButton").textContent = "▶ 재생";
    if (animationFrame) cancelAnimationFrame(animationFrame);
  }
};

document.getElementById("prevBtn").onclick = () => {
  if (currentIndex > 0) {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    // currentPositions = [...segments[currentIndex]];
    currentIndex--;
    backgroundCtxUpdate();
    startPositions = [...currentPositions];
    targetPositions = [...segments[currentIndex]];

    transitionDuration = 1000 / baseSpeed;
    if (currentRaceIndex === 7) {
      transitionStartTime = null;
      runwayProgress = 0;
      transitionDuration = 1000;
    }else{
      transitionStartTime = performance.now();
    }
    if (!playing) {
      if (currentRaceIndex === 7){
        updateCommentary(currentHorseIndex);
        requestAnimationFrame(animateRunway);
      }else{
        requestAnimationFrame(singleAnimate);
      }
    }
  }
};

document.getElementById("nextBtn").onclick = () => {
  if (currentIndex < segments.length - 1) {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    // currentPositions = [...segments[currentIndex]];
    currentIndex++;
    backgroundCtxUpdate();
    startPositions = [...currentPositions];
    targetPositions = [...segments[currentIndex]];

    transitionDuration = 1000 / baseSpeed;
    if (currentRaceIndex === 7) {
      transitionStartTime = null;
      runwayProgress = 0;
      transitionDuration = 1000;
    }else{
      transitionStartTime = performance.now();
    }
    if (!playing) {
      if (currentRaceIndex === 7){
        updateCommentary(currentHorseIndex);
        requestAnimationFrame(animateRunway);
      }else{
        requestAnimationFrame(singleAnimate);
      }
    }
  }
};

document.getElementById("resetBtn").onclick = () => {
  currentIndex = 0;
  backgroundCtxUpdate();
  playing = false;
  document.getElementById("playButton").textContent = "▶ 재생";
  if (animationFrame) cancelAnimationFrame(animationFrame);
  selectRace(currentRaceIndex);
};

document.getElementById("speedSelect").onchange = (e) => {
  const selected = e.target.value;
  if (selected === "very_slow") baseSpeed = 0.5;
  else if (selected === "slow") baseSpeed = 1.0;
  else if (selected === "normal") baseSpeed = 2.0;
  else if (selected === "fast") baseSpeed = 3.0;
  else if (selected === "very_fast") baseSpeed = 4.0;
};

document.querySelectorAll('input[name="direction"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    directionMode = e.target.value;
    applyDirection();
    drawFrame(currentPositions);
  });
});

function applyDirection() {
  if (directionMode === "auto") {
    dir = selectedRace.direction ?? 1;
  } else if (directionMode === "leftToRight") {
    dir = 1;
  } else if (directionMode === "rightToLeft") {
    dir = 0;
  }
}

const tooltip = document.getElementById('tooltip');

raceCanvas.addEventListener("mousemove", (e) => {
  const rect = raceCanvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  tooltip.style.display = "none"; // 기본은 숨김

  if (window.tooltipRegions) {
    for (const region of tooltipRegions) {
      const dx = mouseX - region.x;
      const dy = mouseY - region.y;
      if (Math.sqrt(dx * dx + dy * dy) <= region.radius) {
        tooltip.style.display = "block";
        tooltip.textContent = region.text;
        tooltip.style.left = `${e.pageX + 10}px`; // 커서 오른쪽 살짝 띄우기
        tooltip.style.top = `${e.pageY + 10}px`;
        break;
      }
    }
  }
});

raceCanvas.addEventListener("mouseleave", () => {
  tooltip.style.display = "none";
});

loadAllRaces();
