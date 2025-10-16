// Word Battle — Bookworm-like
(() => {
  const gridSize = 4;
  const playerMaxHearts = 6; // in hearts
  const enemyMaxHearts = 6;  // in hearts
  const HALF = 2;            // store health in half-heart units

  // DOM
  const gridEl = document.getElementById('grid');
  const playerHeartsEl = document.getElementById('playerHearts');
  const enemyHeartsEl = document.getElementById('enemyHearts');
  const dictStatusEl = document.getElementById('dictStatus');
  const messageEl = document.getElementById('message');
  const currentWordEl = document.getElementById('currentWord');
  const letterCountEl = document.getElementById('letterCount');
  const attackValEl = document.getElementById('attackVal');
  const attackDisplayEl = document.getElementById('attackDisplay');
  const submitBtn = document.getElementById('submitBtn');
  const clearBtn = document.getElementById('clearBtn');
  const shuffleBtn = document.getElementById('shuffleBtn');
  const newGameBtn = document.getElementById('newGameBtn');
  const logEl = document.getElementById('log');
  const mainEl = document.querySelector('main');

  // State
  let playerHP = playerMaxHearts * HALF; // half-hearts
  let enemyHP = enemyMaxHearts * HALF;   // half-hearts
  let grid = [];
  let selected = [];         // array of {r, c}
  let selectedSet = new Set();
  let gameOver = false;

  // Dictionary
  let dictionarySet = null;
  let dictLoaded = false;
  const fallbackDictionary = new Set([
    'at','to','of','in','on','it','is','as','be','by','do','go','he','me','my','no','or','so','up','we',
    'add','age','and','ant','any','are','art','bad','bag','bar','bat','bed','bee','bet','big','bit','box','boy','can','car','cat','cow','cut','day','did','dig','dog','dot','dry','ear','eat','far','few','fix','fox','fun','gap','get','got','gum','gun','had','has','hat','hen','her','hey','him','his','hot','ice','jam','jar','jet','job','key','kid','kin','lab','lad','leg','let','lid','lip','log','man','map','mat','mix','nap','net','new','now','nut','oak','old','one','owl','pad','pan','pen','pet','pie','pig','pin','pot','put','rag','ram','ran','rat','red','rip','rug','run','sad','sat','saw','say','sea','see','set','she','shy','sip','six','sir','sky','son','sun','tap','tea','ten','the','tie','tin','toy','try','two','use','war','was','wax','way','web','win','wow','yes','you',
    'able','acid','ally','also','arch','area','bake','ball','bank','base','bear','beat','beef','beep','belt','bend','bill','bird','blue','bold','bomb','book','boot','born','both','bowl','bulk','burn','bury','busy','cake','calm','camp','card','care','cart','case','cash','cast','cell','chap','chat','chef','city','club','coat','code','cold','come','cook','cool','cope','copy','corn','cost','crab','crib','crop','dark','data','date','dawn','deal','desk','dial','dine','dish','dive','dock','does','done','door','dove','draw','drop','drum','duck','duty','each','easy','edge','else','even','ever','evil','exit','face','fact','fade','fail','fair','fall','farm','fast','fate','fear','feed','feel','file','film','find','fine','fire','fish','five','flag','flat','flee','fley','flex','flip','flow','fold','food','fool','foot','fork','form','fort','four','free','from','fuel','full','fund','gain','game','gate','gear','germ','gift','girl','give','glad','glow','goal','goat','gold','golf','gone','good','grab','gray','grew','grow','gulf','hair','half','hall','hand','hang','hard','harm','hate','have','hawk','head','heal','hear','heat','help','hero','hill','hold','hole','home','hood','hook','hope','horn','host','hour','huge','idea','inch','into','iron','item','jack','jail','join','jump','jury','just','keep','kept','kick','kill','kind','king','kiss','knee','knew','know','lack','lady','land','lane','last','late','lawn','lazy','lead','leaf','leak','lean','left','lend','less','life','lift','like','limb','line','lion','list','live','load','loan','lock','logo','long','look','lord','lose','loss','lost','love','luck','made','mail','main','make','male','many','mark','mass','meal','mean','meat','meet','menu','milk','mind','mine','miss','mode','mood','moon','more','most','move','much','must','name','near','neat','neck','need','news','next','nice','nine','none','nose','note','okay','once','only','open','oral','over','pace','pack','page','pain','pair','palm','park','part','pass','past','path','peak','pick','pile','pill','pink','plan','play','plot','plug','plus','poem','poet','pool','port','pose','post','pull','pure','push','quit','race','rain','rank','rare','read','real','rear','rent','rest','rice','rich','ride','ring','rise','risk','road','rock','role','roll','roof','room','root','rose','rule','rush','safe','said','sail','salt','sand','save','seat','seed','seek','seem','seen','sell','send','ship','shoe','shop','shot','show','shut','sick','side','sign','site','size','skin','slip','slow','snow','soap','soft','soil','sold','song','soon','soul','soup','sour','speak','spin','spot','star','stay','step','stop','such','suit','sure','swim','tall','tank','task','team','tech','tend','term','test','text','than','that','them','then','they','thin','this','thus','tide','till','time','tiny','told','toll','tone','tool','tour','town','tree','trip','true','tune','turn','type','unit','upon','used','user','vast','vein','very','view','visa','vote','wait','wake','walk','wall','want','ward','warm','warn','wash','wave','wear','week','well','went','were','west','what','when','whom','wide','wife','wild','will','wind','wine','wing','wire','wise','wish','with','wood','word','work','yard','yeah','year','your'
  ]);
  // We'll load a large dictionary from the web; fallback above works offline.
  const DICT_URLS = [
    'https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt',
    'https://raw.githubusercontent.com/wordset/english-wordset/master/words.txt'
  ];

  // Letter distribution (approx Scrabble)
  const weightedLetters = (() => {
    const dist = [
      ['E',12], ['A',9], ['I',9], ['O',8], ['N',6], ['R',6], ['T',6], ['L',4], ['S',4], ['U',4],
      ['D',4], ['G',3], ['B',2], ['C',2], ['M',2], ['P',2], ['F',2], ['H',2], ['V',2], ['W',2], ['Y',2],
      ['K',1], ['J',1], ['X',1], ['Q',1], ['Z',1]
    ];
    const arr = [];
    for (const [ch, n] of dist) for (let i=0;i<n;i++) arr.push(ch);
    return arr;
  })();

  function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randomLetter() { return randChoice(weightedLetters); }

  function initGrid() {
    grid = Array.from({length: gridSize}, () =>
      Array.from({length: gridSize}, () => randomLetter())
    );
  }

  function renderGrid() {
    gridEl.innerHTML = '';
    for (let r=0; r<gridSize; r++) {
      for (let c=0; c<gridSize; c++) {
        const tile = document.createElement('button');
        tile.className = 'tile';
        tile.type = 'button';
        tile.setAttribute('data-pos', `${r},${c}`);
        tile.setAttribute('aria-label', `Letter ${grid[r][c]}`);
        tile.innerHTML = `<span class="ch">${grid[r][c]}</span>`;
        if (selectedSet.has(`${r},${c}`)) tile.classList.add('selected');
        tile.addEventListener('click', () => onTileClick(r, c));
        gridEl.appendChild(tile);
      }
    }
  }

  function onTileClick(r, c) {
    if (gameOver) return;
    const key = `${r},${c}`;
    if (selectedSet.has(key)) {
      // unselect
      selectedSet.delete(key);
      selected = selected.filter(p => !(p.r === r && p.c === c));
    } else {
      selectedSet.add(key);
      selected.push({r, c});
    }
    updateWordUI();
    renderGridSelectionOnly();
  }

  function renderGridSelectionOnly() {
    // Fast toggle classes without rebuilding whole grid
    const children = gridEl.children;
    for (let i=0;i<children.length;i++) {
      const el = children[i];
      const key = el.getAttribute('data-pos');
      if (selectedSet.has(key)) el.classList.add('selected');
      else el.classList.remove('selected');
    }
  }

  function getCurrentWord() {
    return selected.map(p => grid[p.r][p.c]).join('');
  }

  function updateWordUI() {
    const w = getCurrentWord();
    currentWordEl.textContent = w || '(none)';
    const letters = w.length;
    letterCountEl.textContent = String(letters);
    const attack = letters; // each letter adds 1 to attack
    attackValEl.textContent = String(attack);
    attackDisplayEl.textContent = String(attack);
    submitBtn.disabled = gameOver || letters < 2; // require at least 2 letters
  }

  function clearSelection() {
    selected = [];
    selectedSet.clear();
    updateWordUI();
    renderGridSelectionOnly();
    message('');
  }

  function shuffleGrid() {
    if (gameOver) return;
    for (let r=0;r<gridSize;r++) {
      for (let c=0;c<gridSize;c++) {
        grid[r][c] = randomLetter();
      }
    }
    clearSelection();
    renderGrid();
    log('Shuffled letters.');
  }

  function refillUsedTiles(used) {
    for (const {r, c} of used) grid[r][c] = randomLetter();
    renderGrid();
  }

  function heartsString(currentHalves, maxHearts) {
    let s = '';
    const full = Math.floor(currentHalves / 2);
    const half = currentHalves % 2;
    for (let i=0; i<maxHearts; i++) {
      if (i < full) s += '❤️';
      else if (i === full && half) s += '💔';
      else s += '🤍';
    }
    return s;
  }

  function renderHearts() {
    playerHeartsEl.textContent = heartsString(playerHP, playerMaxHearts);
    enemyHeartsEl.textContent = heartsString(enemyHP, enemyMaxHearts);
  }

  function message(text, kind='') {
    messageEl.textContent = text || '';
    messageEl.style.color = kind === 'bad' ? '#b91c1c' : '#374151';
  }

  function floatDamage(targetEl, txt, kind='enemy') {
    const span = document.createElement('span');
    span.className = `damage-float ${kind}`;
    span.textContent = txt;
    const rect = targetEl.getBoundingClientRect();
    const hostRect = mainEl.getBoundingClientRect();
    span.style.left = `${rect.left - hostRect.left + rect.width/2 - 8}px`;
    span.style.top = `${rect.top - hostRect.top + 8}px`;
    mainEl.appendChild(span);
    setTimeout(() => span.remove(), 1000);
  }

  function log(line) {
    const p = document.createElement('div');
    p.textContent = line;
    logEl.prepend(p);
  }

  function gameWon() {
    gameOver = true;
    message('You win! Enemy defeated.', '');
    log('🏆 Victory! You defeated the enemy.');
    submitBtn.disabled = true;
    shuffleBtn.disabled = true;
    newGameBtn.style.display = 'inline-block';
  }

  function gameLost() {
    gameOver = true;
    message('You were defeated. Try again.', 'bad');
    log('💀 Defeat. The enemy outlasted you.');
    submitBtn.disabled = true;
    shuffleBtn.disabled = true;
    newGameBtn.style.display = 'inline-block';
  }

  function enemyAttack() {
    if (gameOver) return;
    const dmg = 1; // in half-hearts (½ heart)
    playerHP = Math.max(0, playerHP - dmg);
    renderHearts();
    floatDamage(playerHeartsEl, '−½', 'player');
    log(`Enemy strikes for ½ heart.`);
    if (playerHP <= 0) gameLost();
  }

  function playerAttack(word) {
    const attack = word.length;  // attack value = letters selected
    const dmgHalves = attack;    // 1 letter = ½ heart
    const before = enemyHP;
    enemyHP = Math.max(0, enemyHP - dmgHalves);
    const heartsDealt = (before - enemyHP) / 2;
    renderHearts();
    floatDamage(enemyHeartsEl, `−${heartsDealt}${heartsDealt % 1 ? '' : ''}`, 'enemy');
    log(`You played “${word.toUpperCase()}” for attack ${attack}. Enemy took ${heartsDealt} heart${heartsDealt===1? '':'s'}.`);
    if (enemyHP <= 0) {
      gameWon();
      return true;
    }
    return false;
  }

  function submitWord() {
    if (gameOver) return;
    const w = getCurrentWord().toLowerCase();
    if (w.length < 2) {
      message('Select at least 2 letters.', 'bad');
      return;
    }
    if (!isValidWord(w)) {
      message(`“${w.toUpperCase()}” is not in the dictionary.`, 'bad');
      return;
    }
    message('');
    const used = [...selected];
    clearSelection();
    const ended = playerAttack(w);
    refillUsedTiles(used);
    if (!ended) enemyAttack();
  }

  function isValidWord(w) {
    if (!w || w.length < 2) return false;
    if (dictLoaded && dictionarySet) return dictionarySet.has(w);
    return fallbackDictionary.has(w);
  }

  async function loadDictionary() {
    // Indicate we can play with fallback while loading
    dictStatusEl.textContent = 'Loading dictionary… fallback active';
    dictStatusEl.classList.add('pill');
    submitBtn.disabled = false; // enable with fallback
    for (const url of DICT_URLS) {
      try {
        const res = await fetch(url, {cache: 'force-cache'});
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        // files are newline separated words; filter short ones
        const words = text.split(/\r?\n/).map(s => s.trim().toLowerCase()).filter(w => w.length >= 2 && /^[a-z]+$/.test(w));
        dictionarySet = new Set(words);
        dictLoaded = true;
        dictStatusEl.textContent = `Dictionary loaded (${dictionarySet.size.toLocaleString()} words)`;
        dictStatusEl.style.background = '#dcfce7';
        dictStatusEl.style.color = '#14532d';
        log(`Dictionary loaded: ${dictionarySet.size.toLocaleString()} words.`);
        return;
      } catch (e) {
        // try next
      }
    }
    // failed
    dictStatusEl.textContent = 'Offline mode: small fallback dictionary';
    dictStatusEl.style.background = '#fee2e2';
    dictStatusEl.style.color = '#7f1d1d';
    log('Dictionary fetch failed. Using small built-in fallback list.');
  }

  function resetGame() {
    gameOver = false;
    playerHP = playerMaxHearts * HALF;
    enemyHP = enemyMaxHearts * HALF;
    renderHearts();
    selected = [];
    selectedSet.clear();
    initGrid();
    renderGrid();
    updateWordUI();
    message('');
    submitBtn.disabled = false;
    shuffleBtn.disabled = false;
    newGameBtn.style.display = 'none';
    logEl.innerHTML = '';
    log('New game started.');
  }

  // Events
  submitBtn.addEventListener('click', submitWord);
  clearBtn.addEventListener('click', clearSelection);
  shuffleBtn.addEventListener('click', shuffleGrid);
  newGameBtn.addEventListener('click', resetGame);

  // Kick off
  initGrid();
  renderGrid();
  renderHearts();
  updateWordUI();
  loadDictionary();

  // Accessibility keyboard helpers (optional)
  gridEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const pos = e.target.getAttribute('data-pos');
      if (pos) {
        const [r, c] = pos.split(',').map(Number);
        onTileClick(r, c);
      }
    }
  });
})();