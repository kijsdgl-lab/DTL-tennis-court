// Basic elements
const waitingList = document.getElementById('waitingList');
const courtsContainer = document.getElementById('courtsContainer');
const checkInBtn = document.getElementById('checkIn');

// State
let nextId = 1;
let waitingPlayers = []; // players waiting for a court
let courts = []; // array of courts with players currently playing
const MAX_COURTS = 4;

// Initialize courts
for (let i = 1; i <= MAX_COURTS; i++) {
  courts.push({ id: i, players: [] });
}

// Utilities
function minutesSince(ts) {
  if (!ts) return 0;
  return Math.floor((Date.now() - ts) / 60000);
}

function formatPlayMinutes(ts) {
  const m = minutesSince(ts);
  return `${m}분째`;
}

// Rendering
function renderCourts() {
  courtsContainer.innerHTML = '';
  courts.forEach(court => {
    const courtDiv = document.createElement('div');
    courtDiv.className = 'court';
    const nowMinutes = court.players.length > 0 && court.players[0].playStart
      ? minutesSince(court.players[0].playStart)
      : 0;
    const headerExtra = court.players.length > 0 ? ` (진행 ${nowMinutes}분)` : '';
    courtDiv.innerHTML = `<h3>코트 ${court.id}${headerExtra}</h3>`;

    if (court.players.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = '비어 있음';
      courtDiv.appendChild(empty);
    } else {
      court.players.forEach(p => {
        const pDiv = document.createElement('div');
        pDiv.className = 'player';

        const info = document.createElement('span');
        info.textContent = `${p.name} (${p.gender}, ${p.career}년차) - 총 ${p.games}게임 / ${formatPlayMinutes(p.playStart)}`;

        const doneBtn = document.createElement('button');
        doneBtn.textContent = '게임 종료';
        doneBtn.onclick = () => finishGame(court.id, p);

        pDiv.appendChild(info);
        pDiv.appendChild(doneBtn);
        courtDiv.appendChild(pDiv);
      });
    }
    courtsContainer.appendChild(courtDiv);
  });
}

function renderWaiting() {
  waitingList.innerHTML = '';
  const withWait = waitingPlayers
    .map(p => ({ ...p, waitMins: minutesSince(p.waitStart) }))
    .sort((a, b) => b.waitMins - a.waitMins);

  withWait.forEach(p => {
    const li = document.createElement('li');
    li.className = 'waiting-item';

    const emoji = p.waitMins >= 60 ? '🔥' : p.waitMins >= 30 ? '⏳' : '🙂';
    const left = document.createElement('span');
    left.innerHTML = `<span class='emoji'>${emoji}</span> ${p.name} (${p.gender}, ${p.career}년차) - 대기 ${p.waitMins}분`;

    const courtSelect = document.createElement('select');
    for (let i = 1; i <= MAX_COURTS; i++) {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = `코트 ${i}`;
      courtSelect.appendChild(opt);
    }

    const joinBtn = document.createElement('button');
    joinBtn.textContent = '입장';
    joinBtn.onclick = () => joinCourt(p.id, parseInt(courtSelect.value, 10));

    const removeBtn = document.createElement('button');
    removeBtn.textContent = '삭제';
    removeBtn.onclick = () => removeFromWaiting(p.id);

    li.appendChild(left);
    li.appendChild(courtSelect);
    li.appendChild(joinBtn);
    li.appendChild(removeBtn);
    waitingList.appendChild(li);
  });
}

// Actions
function removeFromWaiting(pid) {
  const idx = waitingPlayers.findIndex(p => p.id === pid);
  if (idx !== -1) {
    waitingPlayers.splice(idx, 1);
    renderWaiting();
  }
}

function joinCourt(pid, courtId) {
  const idx = waitingPlayers.findIndex(p => p.id === pid);
  if (idx === -1) return;
  const player = waitingPlayers[idx];
  waitingPlayers.splice(idx, 1);

  player.playStart = Date.now();
  const court = courts.find(c => c.id === courtId);
  if (!court) return;
  court.players.push(player);

  renderCourts();
  renderWaiting();
}

function finishGame(courtId, player) {
  const court = courts.find(c => c.id === courtId);
  if (!court) return;

  // increment total games played
  player.games = (player.games || 0) + 1;

  // Move back to waiting list
  player.playStart = null;
  player.waitStart = Date.now();
  court.players = court.players.filter(p => p.id !== player.id);
  waitingPlayers.push(player);

  renderCourts();
  renderWaiting();
}

// Check-in
checkInBtn.onclick = () => {
  const name = document.getElementById('name').value.trim();
  const gender = document.getElementById('gender').value;
  const career = parseInt(document.getElementById('career').value, 10);

  if (!name || !gender || Number.isNaN(career)) {
    alert('이름/성별/구력을 입력해주세요.');
    return;
  }

  const player = {
    id: nextId++,
    name,
    gender,
    career,
    games: 0,
    waitStart: Date.now(),
    playStart: null,
  };

  waitingPlayers.push(player);
  renderWaiting();
};

// Timers: refresh displays periodically to update minutes
setInterval(() => {
  renderWaiting();
  renderCourts();
}, 15000);

// Initial draw
renderCourts();
renderWaiting();

