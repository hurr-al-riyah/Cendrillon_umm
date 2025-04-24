const canvas = document.getElementById('raceCanvas');
const ctx = canvas.getContext('2d');

const playButton = document.getElementById('playButton');
const speedSelect = document.getElementById('speedSelect');

let raceTitle = "";
let horseNames = [];
let positions = [];

let currentSegment = 0;
let playing = false;
let playbackSpeed = 500;

const horseColors = [
  "#c70c60", "#5ABEFF", "#283DA1", "#fac802", "#ff94bc",
  "#FFDA73", "#3C3C3C", "#0d7a65", "#DC143C"
];

// 캔버스에 현재 구간 표시
function drawFrame(segmentIndex) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const currentPositions = positions[segmentIndex];
  const marginX = 50;
  const maxPosition = Math.max(...currentPositions);
  const scale = (canvas.width - 2 * marginX) / maxPosition;

  currentPositions.forEach((pos, idx) => {
    const x = marginX + pos * scale;
    const y = 40 + idx * 26;

    // 우무무
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, 2 * Math.PI);
    ctx.fillStyle = horseColors[idx % horseColors.length];
    ctx.fill();
    ctx.strokeStyle = "#333";
    ctx.stroke();

    // 이름 라벨
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#000";
    ctx.fillText(`[${idx + 1}번] ${horseNames[idx]}`, x + 15, y + 4);
  });

  // 구간 정보
  ctx.fillStyle = "#666";
  ctx.font = "13px sans-serif";
  ctx.fillText(`구간 ${segmentIndex + 1} / ${positions.length}`, 10, canvas.height - 10);
}

// 애니메이션 재생
function playReplay() {
  if (currentSegment >= positions.length) {
    playing = false;
    playButton.textContent = "▶ 재생";
    return;
  }

  drawFrame(currentSegment);
  currentSegment++;

  if (playing) {
    setTimeout(playReplay, playbackSpeed);
  }
}

// 버튼/속도 제어
playButton.addEventListener("click", () => {
  if (!playing) {
    playing = true;
    playButton.textContent = "⏸ 일시정지";
    playReplay();
  } else {
    playing = false;
    playButton.textContent = "▶ 재생";
  }
});

speedSelect.addEventListener("change", (e) => {
  playbackSpeed = parseInt(e.target.value, 10);
});

// 데이터 불러오기
fetch("data.json")
  .then(res => res.json())
  .then(json => {
    raceTitle = json.race_title;
    horseNames = json.horse_names;
    positions = json.positions;

    document.querySelector("h1").textContent = raceTitle;
    drawFrame(0); // 첫 구간 미리 표시
  })
  .catch(err => {
    console.error("데이터를 불러오지 못했습니다:", err);
    alert("data.json 파일을 불러오는 데 실패했습니다.");
  });
