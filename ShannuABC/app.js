(function () {
    const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const LETTER_WORDS = {
        A: 'Apple', B: 'Ball', C: 'Cat', D: 'Dog', E: 'Elephant', F: 'Fish',
        G: 'Grape', H: 'Horse', I: 'Ice cream', J: 'Juice', K: 'Kite', L: 'Lion',
        M: 'Moon', N: 'Nest', O: 'Orange', P: 'Penguin', Q: 'Queen', R: 'Rabbit',
        S: 'Star', T: 'Tiger', U: 'Umbrella', V: 'Violin', W: 'Watermelon',
        X: 'Xylophone', Y: 'Yo-yo', Z: 'Zebra'
    };
    const LETTER_EMOJIS = {
        A: '🍎', B: '⚽', C: '🐱', D: '🐕', E: '🐘', F: '🐟',
        G: '🍇', H: '🐴', I: '🍦', J: '🧃', K: '🪁', L: '🦁',
        M: '🌙', N: '🪺', O: '🍊', P: '🐧', Q: '👸', R: '🐰',
        S: '⭐', T: '🐯', U: '☂️', V: '🎻', W: '🍉',
        X: '🎵', Y: '🪀', Z: '🦓'
    };
    const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const NUMBER_NAMES = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
    const NUMBER_ITEMS = {
        1: { word: 'Pencil', emoji: '✏️' },
        2: { word: 'Apples', emoji: '🍎' },
        3: { word: 'Balls', emoji: '⚽' },
        4: { word: 'Cats', emoji: '🐱' },
        5: { word: 'Stars', emoji: '⭐' },
        6: { word: 'Flowers', emoji: '🌸' },
        7: { word: 'Hearts', emoji: '❤️' },
        8: { word: 'Bees', emoji: '🐝' },
        9: { word: 'Ducks', emoji: '🦆' },
        10: { word: 'Cars', emoji: '🚗' }
    };

    let currentTraceChar = null;
    let currentTraceType = 'letter';

    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const id = tab.dataset.tab;
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(id).classList.add('active');
            if (id === 'alphabets') buildLetterGrid();
            if (id === 'numbers') buildNumberGrid();
            if (id === 'trace') showTracePicker();
            if (id === 'puzzles') showPuzzlePicker();
        });
    });

    // Home cards
    document.querySelectorAll('.home-card').forEach(card => {
        card.addEventListener('click', () => {
            const go = card.dataset.go;
            document.querySelector(`[data-tab="${go}"]`).click();
        });
    });

    document.querySelectorAll('[data-back]').forEach(btn => {
        btn.addEventListener('click', () => {
            const puzzleArea = document.getElementById('puzzle-area');
            const puzzlePicker = document.querySelector('.puzzle-picker');
            if (puzzleArea && !puzzleArea.classList.contains('hidden')) {
                puzzleArea.classList.add('hidden');
                if (puzzlePicker) puzzlePicker.classList.remove('hidden');
            } else {
                document.querySelector('[data-tab="home"]').click();
            }
        });
    });

    function buildLetterGrid() {
        const grid = document.getElementById('letter-grid');
        grid.innerHTML = '';
        LETTERS.forEach(letter => {
            const btn = document.createElement('button');
            btn.className = 'letter-btn';
            const emoji = LETTER_EMOJIS[letter] || '';
            btn.innerHTML = `<span class="letter-btn-emoji">${emoji}</span><span class="letter-btn-char">${letter}</span>`;
            btn.addEventListener('click', () => showBigLetter(letter));
            grid.appendChild(btn);
        });
    }

    function showBigLetter(letter) {
        const view = document.getElementById('big-letter-view');
        const word = LETTER_WORDS[letter] || letter;
        const emoji = LETTER_EMOJIS[letter] || '';
        document.getElementById('letter-picture').textContent = emoji;
        document.getElementById('big-letter').textContent = letter;
        document.getElementById('letter-name').textContent = `${letter} for ${word}`;
        view.classList.remove('hidden');
        view.onclick = (e) => { if (e.target === view) view.classList.add('hidden'); };
    }

    function buildNumberGrid() {
        const grid = document.getElementById('number-grid');
        grid.innerHTML = '';
        NUMBERS.forEach((num) => {
            const btn = document.createElement('button');
            btn.className = 'number-btn';
            const item = NUMBER_ITEMS[num];
            const emojiDisplay = item ? item.emoji : '';
            btn.innerHTML = `<span class="number-btn-emoji">${emojiDisplay}</span><span class="number-btn-num">${num}</span>`;
            btn.addEventListener('click', () => showBigNumber(num));
            grid.appendChild(btn);
        });
    }

    function showBigNumber(num) {
        const view = document.getElementById('big-number-view');
        const item = NUMBER_ITEMS[num];
        const emoji = item ? item.emoji.repeat(num) : '';
        const word = item ? item.word : NUMBER_NAMES[num - 1];
        const label = item ? `${num} for ${num} ${word}` : NUMBER_NAMES[num - 1];
        document.getElementById('number-pictures').textContent = emoji;
        document.getElementById('big-number').textContent = num;
        document.getElementById('number-name').textContent = label;
        view.classList.remove('hidden');
        view.onclick = (e) => { if (e.target === view) view.classList.add('hidden'); };
    }

    // Trace
    function showTracePicker() {
        document.getElementById('trace-area').classList.add('hidden');
        document.getElementById('trace-choose-letter').classList.add('hidden');
        document.getElementById('trace-choose-number').classList.add('hidden');
        document.querySelectorAll('.trace-opt').forEach(o => o.classList.remove('active'));

        const letterGrid = document.getElementById('trace-letter-grid');
        letterGrid.innerHTML = '';
        LETTERS.forEach(letter => {
            const btn = document.createElement('button');
            const emoji = LETTER_EMOJIS[letter] || '';
            btn.innerHTML = `<span class="trace-btn-emoji">${emoji}</span><span>${letter}</span>`;
            btn.addEventListener('click', () => startTracing('letter', letter));
            letterGrid.appendChild(btn);
        });

        const numberGrid = document.getElementById('trace-number-grid');
        numberGrid.innerHTML = '';
        NUMBERS.forEach((num) => {
            const btn = document.createElement('button');
            btn.className = 'number-btn-trace';
            const item = NUMBER_ITEMS[num];
            const emojiDisplay = item ? item.emoji : '';
            btn.innerHTML = `<span class="trace-num-emoji">${emojiDisplay}</span><span>${num}</span>`;
            btn.addEventListener('click', () => startTracing('number', num));
            numberGrid.appendChild(btn);
        });
    }

    document.querySelectorAll('.trace-opt').forEach(opt => {
        opt.addEventListener('click', () => {
            currentTraceType = opt.dataset.traceType;
            document.querySelectorAll('.trace-opt').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            document.getElementById('trace-choose-letter').classList.toggle('hidden', currentTraceType !== 'letter');
            document.getElementById('trace-choose-number').classList.toggle('hidden', currentTraceType !== 'number');
        });
    });

    function startTracing(type, char) {
        currentTraceChar = char;
        currentTraceType = type;
        let label;
        if (type === 'letter' && LETTER_WORDS[char]) {
            const emoji = LETTER_EMOJIS[char] ? LETTER_EMOJIS[char] + ' ' : '';
            label = `${emoji}${char} for ${LETTER_WORDS[char]}`;
        } else if (type === 'number' && NUMBER_ITEMS[char]) {
            const item = NUMBER_ITEMS[char];
            const emoji = item.emoji.repeat(char) + ' ';
            label = `${emoji}${char} for ${char} ${item.word}`;
        } else {
            label = 'Trace: ' + char;
        }
        document.getElementById('trace-label').innerHTML = label;
        document.getElementById('trace-choose-letter').classList.add('hidden');
        document.getElementById('trace-choose-number').classList.add('hidden');
        document.getElementById('trace-area').classList.remove('hidden');
        initTraceCanvas(type, char);
    }

    document.getElementById('trace-clear').addEventListener('click', () => {
        const canvas = document.getElementById('trace-canvas');
        if (currentTraceChar !== null && canvas.width && traceCtx) {
            drawTraceOutline(traceCtx, canvas.width, canvas.height, currentTraceChar);
        }
    });

    document.getElementById('trace-done').addEventListener('click', () => {
        document.getElementById('trace-area').classList.add('hidden');
        showTracePicker();
    });

    let traceCtx = null;
    let traceDrawing = false;

    function drawTraceOutline(ctx, width, height, char) {
        ctx.fillStyle = '#fafafa';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = 'rgba(123, 104, 238, 0.5)';
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.font = 'bold 200px Fredoka One, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText(String(char), width / 2, height / 2);
    }

    function initTraceCanvas(type, char) {
        const wrap = document.querySelector('.trace-canvas-wrap');
        const width = wrap.clientWidth;
        const height = 320;

        const canvas = document.getElementById('trace-canvas');
        if (canvas.width !== width) canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        traceCtx = ctx;
        drawTraceOutline(ctx, width, height, char);

        if (canvas._traceInitialized) return;
        canvas._traceInitialized = true;

        function getPos(e) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            if (e.touches) {
                return {
                    x: (e.touches[0].clientX - rect.left) * scaleX,
                    y: (e.touches[0].clientY - rect.top) * scaleY
                };
            }
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY
            };
        }

        function start(e) {
            e.preventDefault();
            traceDrawing = true;
            const pos = getPos(e);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.strokeStyle = '#FF6B9D';
            ctx.lineWidth = 22;
        }

        function move(e) {
            e.preventDefault();
            if (!traceDrawing) return;
            const pos = getPos(e);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        }

        function end() {
            traceDrawing = false;
        }

        canvas.addEventListener('mousedown', start);
        canvas.addEventListener('mousemove', move);
        canvas.addEventListener('mouseup', end);
        canvas.addEventListener('mouseleave', end);
        canvas.addEventListener('touchstart', start, { passive: false });
        canvas.addEventListener('touchmove', move, { passive: false });
        canvas.addEventListener('touchend', end);
    }

    // Puzzles
    function showPuzzlePicker() {
        document.getElementById('puzzle-area').classList.add('hidden');
        const picker = document.querySelector('.puzzle-picker');
        if (picker) picker.classList.remove('hidden');
    }

    document.querySelectorAll('.puzzle-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.puzzle;
            document.querySelector('.puzzle-picker').classList.add('hidden');
            document.getElementById('puzzle-area').classList.remove('hidden');
            startPuzzle(type);
        });
    });

    let puzzleScore = 0;
    let puzzleTotal = 0;
    let currentPuzzleType = null;

    function startPuzzle(type) {
        currentPuzzleType = type;
        puzzleScore = 0;
        puzzleTotal = 0;
        document.getElementById('puzzle-next').classList.add('hidden');
        document.getElementById('puzzle-feedback').classList.add('hidden');
        showNextPuzzle(type);
    }

    function showNextPuzzle(type) {
        document.getElementById('puzzle-feedback').classList.add('hidden');
        document.getElementById('puzzle-next').classList.add('hidden');
        document.getElementById('puzzle-options').innerHTML = '';

        if (type === 'letter-match') {
            const letters = LETTERS.filter(l => LETTER_WORDS[l]);
            const correctLetter = letters[Math.floor(Math.random() * letters.length)];
            const options = [correctLetter];
            while (options.length < 4) {
                const r = letters[Math.floor(Math.random() * letters.length)];
                if (!options.includes(r)) options.push(r);
            }
            options.sort(() => Math.random() - 0.5);

            const emoji = LETTER_EMOJIS[correctLetter] || '';
            document.getElementById('puzzle-question').innerHTML = `Which letter goes with ${emoji}?`;
            document.getElementById('puzzle-options').className = 'puzzle-options letter-options';

            options.forEach(letter => {
                const btn = document.createElement('button');
                btn.className = 'puzzle-opt-btn';
                btn.textContent = letter;
                btn.addEventListener('click', () => checkPuzzleAnswer(letter === correctLetter, type));
                document.getElementById('puzzle-options').appendChild(btn);
            });
        } else if (type === 'count-match') {
            const num = 1 + Math.floor(Math.random() * 10);
            const item = NUMBER_ITEMS[num];
            const emoji = item ? item.emoji.repeat(num) : '';
            const options = [num];
            while (options.length < 4) {
                const r = 1 + Math.floor(Math.random() * 10);
                if (!options.includes(r)) options.push(r);
            }
            options.sort(() => Math.random() - 0.5);

            document.getElementById('puzzle-question').innerHTML = `How many? ${emoji}`;
            document.getElementById('puzzle-options').className = 'puzzle-options number-options';

            options.forEach(n => {
                const btn = document.createElement('button');
                btn.className = 'puzzle-opt-btn';
                btn.textContent = n;
                btn.addEventListener('click', () => checkPuzzleAnswer(n === num, type));
                document.getElementById('puzzle-options').appendChild(btn);
            });
        }

        puzzleTotal++;
        updatePuzzleScore();
    }

    function checkPuzzleAnswer(correct, type) {
        document.querySelectorAll('.puzzle-opt-btn').forEach(b => {
            b.disabled = true;
            b.style.pointerEvents = 'none';
        });
        if (correct) puzzleScore++;
        const feedback = document.getElementById('puzzle-feedback');
        feedback.textContent = correct ? '🌟 Correct! Great job!' : '💪 Try again next time!';
        feedback.className = 'puzzle-feedback ' + (correct ? 'correct' : 'wrong');
        feedback.classList.remove('hidden');
        document.getElementById('puzzle-next').classList.remove('hidden');
        document.getElementById('puzzle-next').onclick = () => {
            document.getElementById('puzzle-options').innerHTML = '';
            showNextPuzzle(type);
        };
    }

    function updatePuzzleScore() {
        document.getElementById('puzzle-score').textContent = `Score: ${puzzleScore}${puzzleTotal ? ' / ' + puzzleTotal : ''}`;
    }

    // Init
    buildLetterGrid();
    buildNumberGrid();
})();
