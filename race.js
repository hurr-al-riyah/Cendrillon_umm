const canvas = document.getElementById("raceCanvas");
const ctx = canvas.getContext("2d");

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
  "밀밭아씨": "#b3de70",
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
  "피어스 더 퓨쳐": "#ddcfff"
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

// visualization
function drawFrame(positions) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const left_margin = 15;
  const right_margin = 130;
  // const margin = 120;
  const max = Math.max(...segments.flat());
  // const max = Math.max(...segments.slice(0, segments.length - 1).flat());  // 최종 구간 -1에서 표시하는 부분
  const scale = (canvas.width - (left_margin + right_margin)) / max;

  window.tooltipRegions = [];
  positions.forEach((pos, i) => {
    let x;
    if (dir === 1) {
      x = left_margin + pos * scale;
    } else {
      x = left_margin + (max - pos) * scale;
    }
    
    const y = 40 + i * 26;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, 2 * Math.PI);
    ctx.fillStyle = horseColorsMap[horseNames[i]] || "#CCCCCC";
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#000";
    ctx.fillText(`[${i + 1}] ${horseNames[i]}`, x + 15, y + 5);

    window.tooltipRegions.push({
      x: x, y: y, radius: 10, // 원 영역
      text: selectedRace.race_type?.[i] || "각질 정보 없음" // 해당 우마무스메의 각질
    });
  });

  ctx.fillStyle = "#666";
  ctx.fillText(`구간 ${currentIndex} / ${segments.length - 1}`, 10, canvas.height - 10);

  updateCommentary(currentIndex);
}

// 초기화
function selectRace(index) {
  currentRaceIndex = index;
  selectedRace = allRaces[index];
  horseNames = selectedRace.horse_names;
  segments = selectedRace.positions;
  currentPositions = new Array(horseNames.length).fill(0);
  startPositions = [...currentPositions];
  targetPositions = segments[0];
  currentIndex = 0;
  dir = selectedRace.direction ?? 1;
  document.querySelector("h1").textContent = selectedRace.race_title;
  drawFrame(currentPositions);
}

function loadAllRaces() {
  fetch("data.json?version=v1.05")
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
    startTransition();
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
    startPositions = [...currentPositions];
    targetPositions = [...segments[currentIndex]];

    transitionDuration = 1000 / baseSpeed;
    transitionStartTime = performance.now();

    if (!playing) {
      requestAnimationFrame(singleAnimate);
    }
  }
};

document.getElementById("nextBtn").onclick = () => {
  if (currentIndex < segments.length - 1) {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    // currentPositions = [...segments[currentIndex]];
    currentIndex++;
    startPositions = [...currentPositions];
    targetPositions = [...segments[currentIndex]];

    transitionDuration = 1000 / baseSpeed;
    transitionStartTime = performance.now();

    if (!playing) {
      requestAnimationFrame(singleAnimate);
    }
  }
};



document.getElementById("resetBtn").onclick = () => {
  currentIndex = 0;
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

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
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

canvas.addEventListener("mouseleave", () => {
  tooltip.style.display = "none";
});


loadAllRaces();
