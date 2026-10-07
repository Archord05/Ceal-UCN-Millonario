/**
 * Quien Quiere Ser Millonario? - Logica del Juego
 * Cada partida pide al servidor 15 preguntas randomizadas con dificultad creciente.
 */

// --- Estado del juego ---
let questions = [];
let prizes = [];
let currentQuestion = 0;
let selectedAnswer = null;
let gameOver = false;
let answeredCorrectly = 0;
let totalPool = 0;

// Estado de comodines
let lifeline5050Used = false;
let lifelinePhoneUsed = false;
let lifelineAudienceUsed = false;

// Letras para las opciones
const OPTION_LETTERS = ["A", "B", "C", "D"];

// --- Elementos DOM ---
const questionText = document.getElementById("question-text");
const optionBtns = document.querySelectorAll(".option-btn");
const prizeList = document.getElementById("prize-list");
const confirmBtn = document.getElementById("confirm-btn");
const nextBtn = document.getElementById("next-btn");
const retireBtn = document.getElementById("retire-btn");
const restartBtn = document.getElementById("restart-btn");
const messageOverlay = document.getElementById("message-overlay");
const messageTitle = document.getElementById("message-title");
const messageBody = document.getElementById("message-body");
const messageCloseBtn = document.getElementById("message-close-btn");
const questionCounter = document.getElementById("question-counter");

// Elementos de comodines
const btn5050 = document.getElementById("btn-5050");
const btnPhone = document.getElementById("btn-phone");
const btnAudience = document.getElementById("btn-audience");

// --- Cargar una nueva partida desde el servidor ---
async function fetchNewGame() {
    const res = await fetch("/api/game");
    const data = await res.json();
    questions = data.questions;
    prizes = data.prizes;
    totalPool = data.total_pool;
    return data;
}

// --- Inicializacion ---
async function initGame() {
    try {
        await fetchNewGame();

        if (questions.length === 0) {
            showMessage(
                "Sin Preguntas",
                "No se encontraron preguntas en el archivo Excel. Agrega preguntas y recarga."
            );
            return;
        }

        buildPrizeList();
        startGame();
    } catch (err) {
        showMessage(
            "Error",
            "No se pudo conectar con el servidor. Asegurate de que la app Python este corriendo."
        );
        console.error(err);
    }
}

// --- Iniciar/reiniciar partida ---
async function startGame() {
    // Pedir nuevas preguntas al servidor (randomizadas)
    try {
        await fetchNewGame();
    } catch (err) {
        console.error("Error al cargar nueva partida:", err);
    }

    currentQuestion = 0;
    selectedAnswer = null;
    gameOver = false;
    answeredCorrectly = 0;

    // Resetear comodines
    lifeline5050Used = false;
    lifelinePhoneUsed = false;
    lifelineAudienceUsed = false;
    [btn5050, btnPhone, btnAudience].forEach(btn => {
        btn.disabled = false;
        btn.classList.remove('used');
    });

    buildPrizeList();
    updatePrizeHighlight();
    loadQuestion();
    confirmBtn.style.display = "none";
    nextBtn.style.display = "none";
    restartBtn.style.display = "none";
    retireBtn.style.display = "inline-flex";
}

// --- Construir lista de premios ---
function buildPrizeList() {
    prizeList.innerHTML = "";
    const total = Math.min(prizes.length, questions.length);
    for (let i = total - 1; i >= 0; i--) {
        const li = document.createElement("li");
        li.dataset.level = i;
        const num = document.createElement("span");
        num.className = "prize-number";
        num.textContent = (i + 1).toString();
        const val = document.createElement("span");
        val.className = "prize-value";
        val.textContent = prizes[i];
        li.appendChild(num);
        li.appendChild(val);

        // Marcar hitos de seguridad (pregunta 5 y 10 -> indices 4 y 9)
        if (i === 4 || i === 9) {
            li.classList.add("milestone");
        }

        // Marcar la pregunta final (Premio Sorpresa Grande)
        if (i === total - 1) {
            li.classList.add("final-prize");
        }

        prizeList.appendChild(li);
    }
}

// --- Cargar pregunta ---
function loadQuestion() {
    const totalAvailable = Math.min(prizes.length, questions.length);
    if (currentQuestion >= totalAvailable) {
        winGame();
        return;
    }

    const q = questions[currentQuestion];
    selectedAnswer = null;

    // Animacion del texto de pregunta
    questionText.classList.remove("fade-in");
    void questionText.offsetWidth; // trigger reflow
    questionText.classList.add("fade-in");
    questionText.textContent = q.question;

    // Actualizar contador
    questionCounter.textContent = `Pregunta ${currentQuestion + 1} de ${totalAvailable}`;

    // Actualizar opciones
    optionBtns.forEach((btn, i) => {
        btn.className = "option-btn";
        btn.style.visibility = "visible"; 
        btn.style.opacity = "1";           // Asegurar que sea visible (reset de 50:50)
        btn.style.pointerEvents = "auto";  // Asegurar que sea clickeable (reset de 50:50)
        btn.classList.remove("fade-in");
        void btn.offsetWidth;
        btn.classList.add("fade-in");
        btn.style.animationDelay = `${i * 0.1}s`;
        btn.disabled = false;

        const letterSpan = btn.querySelector(".option-letter");
        const textSpan = btn.querySelector(".option-text");
        letterSpan.textContent = OPTION_LETTERS[i] + ":";
        textSpan.textContent = q.options[i];
    });

    confirmBtn.style.display = "none";
    nextBtn.style.display = "none";

    // --- LOG DEBUG POR CONSOLA ---
    debugCurrentQuestion();
}

// --- Debug info en consola ---
function debugCurrentQuestion() {
    if (currentQuestion >= questions.length) return;
    const q = questions[currentQuestion];
    console.group(`%c--- DEBUG: Pregunta ${currentQuestion + 1} de ${questions.length} ---`, "color: #3b82f6; font-weight: bold; font-size: 1.1em;");
    console.log(`Fila en Excel: ${q.id}`);
    console.log(`Dificultad:    Nivel ${q.difficulty}`);
    console.log(`Pregunta:    ${q.question}`);
    console.log(`Opciones:    A) ${q.options[0]} | B) ${q.options[1]} | C) ${q.options[2]} | D) ${q.options[3]}`);
    console.log(`Respuesta:   %c${OPTION_LETTERS[q.correct]} (Indice ${q.correct})`, "color: #22c55e; font-weight: bold;");
    console.groupEnd();

    // Enviar info de debug al backend para que se imprima en la terminal de Python
    fetch("/api/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            current: currentQuestion + 1,
            total: questions.length,
            id: q.id,
            difficulty: q.difficulty,
            question: q.question,
            options: q.options,
            correct_letter: OPTION_LETTERS[q.correct],
            correct_index: q.correct
        })
    }).catch(e => console.error("Error enviando log al backend", e));
}

// --- Seleccionar opcion ---
function selectOption(index) {
    if (gameOver || selectedAnswer === index) return;

    // Limpiar seleccion previa
    optionBtns.forEach((btn) => btn.classList.remove("selected"));

    selectedAnswer = index;
    optionBtns[index].classList.add("selected");
    confirmBtn.style.display = "inline-flex";
}

// --- Confirmar respuesta ---
function confirmAnswer() {
    if (selectedAnswer === null || gameOver) return;

    const q = questions[currentQuestion];
    const correct = q.correct;

    // Deshabilitar opciones
    optionBtns.forEach((btn) => (btn.disabled = true));
    confirmBtn.style.display = "none";

    // Marcar la pregunta como usada en el backend
    fetch("/api/mark_used", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: q.id })
    }).catch(e => console.error("Error marcando pregunta usada", e));

    // Mostrar resultado
    if (selectedAnswer === correct) {
        optionBtns[selectedAnswer].classList.add("correct");
        answeredCorrectly++;
        updatePrizeHighlight();

        const totalAvailable = Math.min(prizes.length, questions.length);
        if (currentQuestion + 1 >= totalAvailable) {
            setTimeout(() => winGame(), 1500);
        } else {
            nextBtn.style.display = "inline-flex";
        }
    } else {
        optionBtns[selectedAnswer].classList.add("incorrect");
        optionBtns[correct].classList.add("correct");
        gameOver = true;

        // Calcular premio de seguridad (hitos en pregunta 5 y 10)
        let safePrize = "0 pts";
        if (currentQuestion >= 10) safePrize = prizes[9];
        else if (currentQuestion >= 5) safePrize = prizes[4];

        setTimeout(() => {
            showMessage(
                "Respuesta Incorrecta!",
                `La respuesta correcta era: <strong>${OPTION_LETTERS[correct]}: ${q.options[correct]}</strong><br><br>
                 Te retiras con: <strong>${safePrize}</strong>`
            );
            retireBtn.style.display = "none";
            restartBtn.style.display = "inline-flex";
        }, 2000);
    }
}

// --- Siguiente pregunta ---
function nextQuestion() {
    currentQuestion++;
    nextBtn.style.display = "none";
    loadQuestion();
}

// --- Retirarse ---
function retireGame() {
    gameOver = true;
    const prize = answeredCorrectly > 0 ? prizes[answeredCorrectly - 1] : "0 pts";
    showMessage(
        "Te Retiras!",
        `Decides retirarte con: <strong>${prize}</strong><br><br>
         Bien jugado!`
    );
    retireBtn.style.display = "none";
    restartBtn.style.display = "inline-flex";
}

// --- Ganar el juego ---
function winGame() {
    gameOver = true;
    showMessage(
        "FELICITACIONES!",
        `Has respondido las 15 preguntas correctamente!<br><br>
         Te llevas el: <strong>${prizes[prizes.length - 1]}</strong>!<br><br>
         Eres un verdadero CAMPEON!`
    );
    retireBtn.style.display = "none";
    restartBtn.style.display = "inline-flex";
}

// --- Actualizar resaltado de premios ---
function updatePrizeHighlight() {
    const items = prizeList.querySelectorAll("li");
    items.forEach((li) => {
        const level = parseInt(li.dataset.level);
        li.classList.remove("active", "passed");
        if (level === answeredCorrectly) {
            li.classList.add("active");
        } else if (level < answeredCorrectly) {
            li.classList.add("passed");
        }
    });
}

// --- Mostrar mensaje modal ---
function showMessage(title, body) {
    messageTitle.textContent = title;
    messageBody.innerHTML = body;
    messageOverlay.classList.add("visible");
    
    // Si el juego termino, el boton de cerrar invita a jugar de nuevo
    if (gameOver) {
        messageCloseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; vertical-align: middle;"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg> Jugar de Nuevo';
    } else {
        messageCloseBtn.innerHTML = 'Cerrar';
    }
}

function closeMessage() {
    messageOverlay.classList.remove("visible");
}

// --- Comodines ---

function use5050() {
    if (lifeline5050Used || gameOver) return;
    lifeline5050Used = true;
    btn5050.disabled = true;
    btn5050.classList.add('used');

    const q = questions[currentQuestion];
    const correctIdx = q.correct;
    
    // Obtener las 3 incorrectas
    let incorrectIndices = [0, 1, 2, 3].filter(i => i !== correctIdx);
    
    // Elegir 2 al azar para eliminar
    incorrectIndices = shuffleArray(incorrectIndices).slice(0, 2);
    
    incorrectIndices.forEach(idx => {
        const btn = optionBtns[idx];
        btn.classList.add("eliminated");
        
        // Borrado extremo en JS para evitar problemas de caché CSS:
        btn.querySelector(".option-letter").textContent = "";
        btn.querySelector(".option-text").textContent = "";
        btn.style.opacity = "0"; 
        btn.style.visibility = "hidden";
        btn.style.pointerEvents = "none";
    });
}

function usePhone() {
    if (lifelinePhoneUsed || gameOver) return;
    lifelinePhoneUsed = true;
    btnPhone.disabled = true;
    btnPhone.classList.add('used');

    // Solo prop visual segun requerimiento
    showMessage("Llamada Telefónica", "<p style='text-align:center; font-size:1.4rem; margin:2rem 0;'>Se esta realizando una llamada...</p>");
}

function useAudience() {
    if (lifelineAudienceUsed || gameOver) return;
    lifelineAudienceUsed = true;
    btnAudience.disabled = true;
    btnAudience.classList.add('used');

    // Solo prop visual segun requerimiento
    showMessage("Consultar al Público", "<p style='text-align:center; font-size:1.4rem; margin:2rem 0;'>El publico esta votando...</p>");
}

// --- Event Listeners ---
optionBtns.forEach((btn, i) => {
    btn.addEventListener("click", () => selectOption(i));
});

btn5050.addEventListener("click", use5050);
btnPhone.addEventListener("click", usePhone);
btnAudience.addEventListener("click", useAudience);

confirmBtn.addEventListener("click", confirmAnswer);
nextBtn.addEventListener("click", nextQuestion);
retireBtn.addEventListener("click", retireGame);
restartBtn.addEventListener("click", () => {
    closeMessage();
    startGame(); // Pide nuevas preguntas randomizadas al servidor
});
messageCloseBtn.addEventListener("click", () => {
    closeMessage();
    if (gameOver) {
        startGame(); // Reinicia el juego automaticamente al cerrar el modal de fin de juego
    }
});

// Teclas rapidas
document.addEventListener("keydown", (e) => {
    if (gameOver) return;
    const key = e.key.toUpperCase();
    
    // Si la opcion esta eliminada, no se puede seleccionar con teclado
    if (key === "A" && !optionBtns[0].classList.contains("eliminated")) selectOption(0);
    else if (key === "B" && !optionBtns[1].classList.contains("eliminated")) selectOption(1);
    else if (key === "C" && !optionBtns[2].classList.contains("eliminated")) selectOption(2);
    else if (key === "D" && !optionBtns[3].classList.contains("eliminated")) selectOption(3);
    else if (key === "ENTER") {
        if (nextBtn.style.display !== "none") nextQuestion();
        else if (confirmBtn.style.display !== "none") confirmAnswer();
    }
});

// --- Utilidades ---
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// --- Iniciar ---
initGame();
