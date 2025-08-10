// script.js

document.addEventListener('DOMContentLoaded', () => {

    // --- DATA ---
    const cardData = [
        { name: 'DÓ', type: 'name', pairId: 1 }, { name: 'DÓ', type: 'key', pairId: 1, keyName: 'C', sound: 'sounds/do.mp3' },
        { name: 'RÉ', type: 'name', pairId: 2 }, { name: 'RÉ', type: 'key', pairId: 2, keyName: 'D', sound: 'sounds/re.mp3' },
        { name: 'MI', type: 'name', pairId: 3 }, { name: 'MI', type: 'key', pairId: 3, keyName: 'E', sound: 'sounds/mi.mp3' },
        { name: 'FÁ', type: 'name', pairId: 4 }, { name: 'FÁ', type: 'key', pairId: 4, keyName: 'F', sound: 'sounds/fa.mp3' },
        { name: 'SOL', type: 'name', pairId: 5 }, { name: 'SOL', type: 'key', pairId: 5, keyName: 'G', sound: 'sounds/sol.mp3' },
        { name: 'LÁ', type: 'name', pairId: 6 }, { name: 'LÁ', type: 'key', pairId: 6, keyName: 'A', sound: 'sounds/la.mp3' },
        { name: 'SI', type: 'name', pairId: 7 }, { name: 'SI', type: 'key', pairId: 7, keyName: 'B', sound: 'sounds/si.mp3' },
    ];

    // --- DOM ELEMENTS ---
    const gameBoard = document.getElementById('game-board');
    const movesCountSpan = document.getElementById('moves-count');
    const timerSpan = document.getElementById('timer');
    const restartBtn = document.getElementById('restart-btn');
    const winScreen = document.getElementById('win-screen');
    const finalTimeSpan = document.getElementById('final-time');
    const playerNameInput = document.getElementById('player-name');
    const saveScoreBtn = document.getElementById('save-score-btn');
    const showLeaderboardBtn = document.getElementById('show-leaderboard-btn');
    const leaderboardModal = document.getElementById('leaderboard-modal');
    const closeBtn = leaderboardModal.querySelector('.close-btn');

    // --- GAME STATE ---
    let flippedCards = []; let matchedPairs = 0; let moves = 0;
    let lockBoard = false; let gameStarted = false;
    let timerInterval; let seconds = 0;

    // --- LEADERBOARD FUNCTIONS ---
    function displayLeaderboard() {
        const listElement = leaderboardModal.querySelector('#leaderboard-list');
        const scores = JSON.parse(localStorage.getItem('musicalMemoryScores')) || [];
        listElement.innerHTML = '';
        if (scores.length === 0) {
            listElement.innerHTML = '<li>Ainda não há pontuações. Jogue uma partida!</li>';
        } else {
            scores.forEach(score => {
                const li = document.createElement('li');
                li.innerHTML = `<span class="player">${score.name}</span><div class="score-details"><span class="time">${score.time}</span><span class="moves">${score.moves} jogadas</span></div>`;
                listElement.appendChild(li);
            });
        }
    }

    function saveScore() {
        const playerName = playerNameInput.value.trim() || 'Anônimo';
        const finalTime = timerSpan.textContent;
        const scores = JSON.parse(localStorage.getItem('musicalMemoryScores')) || [];
        
        scores.push({ name: playerName, time: finalTime, seconds: seconds, moves: moves });
        scores.sort((a, b) => a.seconds - b.seconds || a.moves - b.moves);
        const topScores = scores.slice(0, 10);
        localStorage.setItem('musicalMemoryScores', JSON.stringify(topScores));
        
        winScreen.classList.remove('show');
        restartGame();
    }

    // --- TIMER FUNCTIONS ---
    function startTimer() {
        if (gameStarted) return;
        gameStarted = true;
        seconds = 0;
        timerInterval = setInterval(() => {
            seconds++;
            const min = Math.floor(seconds / 60).toString().padStart(2, '0');
            const sec = (seconds % 60).toString().padStart(2, '0');
            timerSpan.textContent = `${min}:${sec}`;
        }, 1000);
    }
    function stopTimer() { clearInterval(timerInterval); }
    function resetTimer() {
        stopTimer(); gameStarted = false; seconds = 0; timerSpan.textContent = '00:00';
    }

    // --- GAME LOGIC ---
    function restartGame() { createBoard(); }
    
    function createBoard() {
        gameBoard.innerHTML = ''; matchedPairs = 0; moves = 0;
        movesCountSpan.textContent = moves; lockBoard = false;
        resetTimer();

        const shuffledCards = [...cardData].sort(() => Math.random() - 0.5);
        shuffledCards.forEach(data => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.dataset.pairId = data.pairId;
            let cardContent = (data.type === 'name')
                ? data.name
                : `<div class="card-text">${data.name}</div><div class="keyboard">${generateKeyboardHTML(data.keyName)}</div>`;
            if (data.type === 'key') card.dataset.sound = data.sound;
            
            card.innerHTML = `<div class="card-inner"><div class="card-face card-front">♫</div><div class="card-face card-back">${cardContent}</div></div>`;
            card.addEventListener('click', handleCardFlip);
            card.addEventListener('touchstart', handleCardFlip, { passive: false });
            gameBoard.appendChild(card);
        });
    }

    function handleCardFlip(event) {
        event.preventDefault();
        if (!gameStarted) startTimer();
        const clickedCard = event.currentTarget;
        if (lockBoard || clickedCard.classList.contains('flipped') || clickedCard === flippedCards[0]) return;
        
        flipCard(clickedCard);
        flippedCards.push(clickedCard);
        
        if (flippedCards.length === 2) {
            updateMoves();
            checkForMatch();
        }
    }
    
    function flipCard(card) { 
        card.classList.add('flipped'); 
        if (card.dataset.sound) new Audio(card.dataset.sound).play().catch(e => console.error("Audio Error:", e));
    }

    function checkForMatch() { 
        lockBoard = true; 
        const [c1, c2] = flippedCards; 
        if (c1.dataset.pairId === c2.dataset.pairId) { 
            new Audio('sounds/success.mp3').play().catch(e => console.error("Audio Error:", e)); 
            disableCards(); matchedPairs++; checkWinCondition(); 
        } else { unflipCards(); } 
    }
    
    function disableCards() { 
        flippedCards.forEach(c => { 
            c.removeEventListener('click', handleCardFlip); 
            c.removeEventListener('touchstart', handleCardFlip); 
        }); resetBoardState(); 
    }
    function unflipCards() { setTimeout(() => { flippedCards.forEach(c => c.classList.remove('flipped')); resetBoardState(); }, 1200); }
    function resetBoardState() { flippedCards = []; lockBoard = false; }
    function updateMoves() { moves++; movesCountSpan.textContent = moves; }

    function checkWinCondition() {
        if (matchedPairs === cardData.length / 2) {
            stopTimer();
            finalTimeSpan.textContent = timerSpan.textContent;
            setTimeout(() => {
                new Audio('sounds/win.mp3').play().catch(e => console.error("Audio Error:", e));
                winScreen.classList.add('show');
            }, 500);
        }
    }
    
    function generateKeyboardHTML(noteToHighlight) {
        const octave = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        const notesWithBlackKey = ['C', 'D', 'F', 'G', 'A'];

        let html = '';
        for (const note of octave) {
            const isHighlighted = (note === noteToHighlight) ? 'highlight' : '';
            const hasBlackKey = notesWithBlackKey.includes(note) ? 'data-has-black-key="true"' : '';
            html += `<div class="key white ${isHighlighted}" ${hasBlackKey}></div>`;
        }
        return html;
    }

    // --- EVENT LISTENERS & INITIALIZATION ---
    restartBtn.addEventListener('click', restartGame);
    saveScoreBtn.addEventListener('click', saveScore);
    showLeaderboardBtn.addEventListener('click', () => { displayLeaderboard(); leaderboardModal.classList.add('show'); });
    closeBtn.addEventListener('click', () => { leaderboardModal.classList.remove('show'); });
    window.addEventListener('click', (event) => { if (event.target == leaderboardModal) leaderboardModal.classList.remove('show'); });

    createBoard();
});