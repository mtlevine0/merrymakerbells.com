// The 12 bells the module drives, lowest first.
const NOTES = ['C6','D6','E6','F6','F♯6','G6','A6','A♯6','B6','C7','D7','E7'];
const FREQ = [1046.5,1174.66,1318.51,1396.91,1479.98,1567.98,1760,1864.66,1975.53,2093,2349.32,2637.02];
const BELL = 'M50 34C37.5 34 31 44 31 56.5C31 67 27 72.5 21.5 77.6C19.6 79.4 20.8 82 23.4 82H76.6C79.2 82 80.4 79.4 78.5 77.6C73 72.5 69 67 69 56.5C69 44 62.5 34 50 34ZM41.5 85.5H58.5A8.5 8.5 0 0 1 41.5 85.5Z';
const $ = id => document.getElementById(id);

// Simulated bell tone: a few inharmonic partials with fast decay. Only starts after a tap.
let audio = null;
function strike(index, volume = 0.26) {
  if (!audio) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audio = new Ctx();
  }
  if (audio.state === 'suspended') audio.resume();
  const now = audio.currentTime;
  [[1, 1, 1.1], [2.01, .42, .7], [2.76, .24, .42], [5.4, .08, .18]].forEach(([ratio, level, decay]) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.frequency.value = FREQ[index] * ratio;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume * level, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
    osc.connect(gain).connect(audio.destination);
    osc.start(now);
    osc.stop(now + decay + 0.05);
  });
}

// Restarting an animation means removing the class and forcing a reflow first.
function swing(el, ms = 640) {
  el.classList.remove('ring');
  void el.offsetWidth;
  el.classList.add('ring');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('ring'), ms);
}

// Garland: two draped swags of six, low bells biggest.
const ringers = [];
const garland = $('garland');
for (let swag = 0; swag < 2; swag++) {
  const wrap = document.createElement('div');
  wrap.className = 'swag';
  wrap.innerHTML = '<svg class="wire" viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0Q50 100 100 0" vector-effect="non-scaling-stroke"/></svg><div class="row"></div>';
  const row = wrap.querySelector('.row');
  for (let i = 0; i < 6; i++) {
    const index = swag * 6 + i;
    const t = (i + .5) / 6;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ringer';
    button.setAttribute('aria-label', `Ring bell ${index + 1} of 12, note ${NOTES[index].replace('♯', ' sharp ')}`);
    button.style.setProperty('--drop', `${(4 * 52 * t * (1 - t)).toFixed(1)}px`);
    button.style.setProperty('--size', `${Math.round(92 - index * 3.6)}px`);
    button.innerHTML = `<svg viewBox="15 30 70 66" aria-hidden="true"><path d="${BELL}"/></svg>`;
    button.addEventListener('pointerdown', () => { stopSong(); ring(index); });
    // Keyboards and screen readers send a click with no pointer behind it.
    button.addEventListener('click', event => { if (event.detail === 0) { stopSong(); ring(index); } });
    row.appendChild(button);
    ringers[index] = button;
  }
  garland.appendChild(wrap);
}
function ring(index) { strike(index); swing(ringers[index]); }

// One tune or preview at a time.
let timers = [];
let songButton = null;
function stopSong() {
  timers.forEach(clearTimeout);
  timers = [];
  document.querySelectorAll('.cell.now').forEach(c => c.classList.remove('now'));
  if (songButton) { songButton.textContent = songButton.dataset.idle; songButton = null; }
}
function schedule(fn, ms) { timers.push(setTimeout(fn, ms)); }

// Jingle Bells, as [bell index, beats]. C6=0 D6=1 E6=2 F6=3 G6=5.
const JINGLE = [[2,1],[2,1],[2,2],[2,1],[2,1],[2,2],[2,1],[5,1],[0,1.5],[1,.5],[2,4],
                [3,1],[3,1],[3,1.5],[3,.5],[3,1],[2,1],[2,1],[2,.5],[2,.5],[2,1],[1,1],[1,1],[2,1],[1,2],[5,2]];
const songBtn = $('play-song');
songBtn.dataset.idle = songBtn.textContent;
songBtn.addEventListener('click', () => {
  if (songButton === songBtn) { stopSong(); return; }
  stopSong();
  songButton = songBtn;
  songBtn.textContent = 'Stop';
  let at = 0;
  JINGLE.forEach(([index, beats]) => { schedule(() => ring(index), at); at += beats * 235; });
  schedule(stopSong, at + 400);
});

// Choir: all three rooms swing on the same chord.
$('ring-all').addEventListener('click', () => {
  stopSong();
  [0, 2, 5].forEach(index => strike(index, .17));
  document.querySelectorAll('#rooms .room').forEach(room => swing(room, 900));
});

// Compose grid, highest bell on top, starting with 16 frames of the published O Come All Ye
// Faithful (recomposed ROM, frames 438-453): the run up to E7 and back over D6/F#6 chords,
// landing on D7+G6. Same as eBay graphic 04. Steps are the ROM's 120 ms sixteenths, and
// the song's quarter notes fall on steps 2, 6, 10 and 14.
const STEPS = 16;
const START = {1:[2,6,10], 2:[0], 4:[1,6,10], 5:[2,14], 6:[3,11], 8:[4,10,12], 9:[5,9,13], 10:[6,8,14], 11:[7]};
const roll = $('roll');
const cells = [];
for (let visualRow = 0; visualRow < 12; visualRow++) {
  const index = 11 - visualRow;
  const label = document.createElement('span');
  label.textContent = NOTES[index];
  label.setAttribute('aria-hidden', 'true');
  roll.appendChild(label);
  for (let step = 0; step < STEPS; step++) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell' + (step % 4 === 2 ? ' beat' : '');
    cell.tabIndex = visualRow === 0 && step === 0 ? 0 : -1;
    cell.dataset.index = index;
    cell.dataset.step = step;
    cell.setAttribute('aria-pressed', String((START[index] || []).includes(step)));
    cell.setAttribute('aria-label', `Bell ${NOTES[index].replace('♯', ' sharp ')}, beat ${step + 1}`);
    cell.addEventListener('click', () => {
      const on = cell.getAttribute('aria-pressed') !== 'true';
      cell.setAttribute('aria-pressed', String(on));
      if (on) strike(index, .2);
    });
    cells.push(cell);
    roll.appendChild(cell);
  }
}
// Arrow keys move around the grid, so it's a single tab stop.
roll.addEventListener('keydown', event => {
  const moves = {ArrowLeft: -1, ArrowRight: 1, ArrowUp: -STEPS, ArrowDown: STEPS};
  const move = moves[event.key];
  const at = cells.indexOf(document.activeElement);
  if (!move || at < 0) return;
  const next = cells[at + move];
  event.preventDefault();
  if (next) { cells[at].tabIndex = -1; next.tabIndex = 0; next.focus(); }
});
const hearBtn = $('hear');
hearBtn.dataset.idle = hearBtn.textContent;
hearBtn.addEventListener('click', () => {
  if (songButton === hearBtn) { stopSong(); return; }
  stopSong();
  songButton = hearBtn;
  hearBtn.textContent = 'Stop';
  const beat = 120;
  for (let step = 0; step < STEPS; step++) {
    schedule(() => {
      cells.forEach(cell => {
        const here = +cell.dataset.step === step;
        cell.classList.toggle('now', here);
        if (here && cell.getAttribute('aria-pressed') === 'true') strike(+cell.dataset.index, .22);
      });
    }, step * beat);
  }
  schedule(stopSong, STEPS * beat + 200);
});
$('clear').addEventListener('click', () => {
  stopSong();
  cells.forEach(cell => cell.setAttribute('aria-pressed', 'false'));
});
