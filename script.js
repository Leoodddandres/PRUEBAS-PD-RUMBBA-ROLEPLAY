import confetti from 'confetti-js';
import anime from 'anime';

// Configuración de validación y puntuación
const evaluationConfig = {
    correctAnswerPatterns: {
        // Sección 1
        'events-availability': {values: ['Sí'], type: 'radio'},
        
        // Sección 2
        'metagaming': {patterns: ['información fuera del juego', 'conocimiento externo', 'separar personaje'], type: 'text'},
        'powergaming': {patterns: ['forzar acciones', 'imponer reacciones', 'acciones irrealistas'], type: 'text'},
        
        // Sección 3
        'shock-victim': {patterns: ['calma', 'tranquilizar', 'espacio', 'tiempo', 'respetar'], type: 'text'},
        'private-property': {patterns: ['orden judicial', 'permiso', 'autorización', 'sospecha razonable'], type: 'text'},
        
        // Sección 4
        'character-coherence': {values: ['Sí'], type: 'radio'},
        'out-of-rp': {patterns: ['rechazar', 'reportar', 'informar', 'no participar'], type: 'text'},
        
        // Sección 5
        'administrative-tasks': {values: ['Sí'], type: 'radio'},
        'rules-commitment': {values: ['Sí'], type: 'radio'},
        'bribe': {patterns: ['rechazar', 'denunciar', 'reportar', 'arrestar'], type: 'text'},
        
        // Sección 6
        'learning-commitment': {values: ['Sí'], type: 'radio'},
        'weapons-usage': {patterns: ['último recurso', 'peligro', 'amenaza', 'autorización'], type: 'text'}
    },
    
    sectionWeights: {
        'section-1': 0.15,
        'section-2': 0.2,
        'section-3': 0.2,
        'section-4': 0.15,
        'section-5': 0.15,
        'section-6': 0.15
    },
    
    feedbackMessages: {
        excellent: "¡Excelente trabajo! Has demostrado un profundo entendimiento del rol de policía. Tu compromiso con el rol y conocimiento de las normas te convierten en un candidato ideal.",
        good: "Buen trabajo. Tienes un sólido entendimiento de lo que implica ser policía en el servidor. Con un poco más de experiencia serás un gran activo para la fuerza.",
        average: "Has completado el formulario con un desempeño satisfactorio. Recomendamos revisar las áreas donde has tenido dificultades para mejorar tu comprensión del rol.",
        poor: "Gracias por tu interés, pero parece que necesitas más familiaridad con los conceptos de roleplay y las responsabilidades policiales. Te animamos a aprender más sobre el servidor antes de volver a aplicar."
    }
};

// Variables globales
let currentSection = 1;
const totalSections = 6;
let formResponses = {};
let evaluationResults = {
    correctAnswers: 0,
    incorrectAnswers: 0,
    totalQuestions: 0,
    sectionScores: {},
    totalScore: 0
};

// Elementos DOM
const form = document.getElementById('application-form');
const progressFill = document.querySelector('.progress-fill');
const sectionIndicator = document.querySelector('.section-indicator');
const formContainer = document.querySelector('.form-container');
const resultsContainer = document.querySelector('.results-container');
const loadingOverlay = document.querySelector('.loading-overlay');
const successOverlay = document.querySelector('.success-overlay');

// Referencias a las secciones
const sections = {
    1: document.getElementById('section-1'),
    2: document.getElementById('section-2'),
    3: document.getElementById('section-3'),
    4: document.getElementById('section-4'),
    5: document.getElementById('section-5'),
    6: document.getElementById('section-6')
};

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupFormAnimation();
});

// Configurar animaciones
function setupFormAnimation() {
    const inputs = document.querySelectorAll('input, textarea');
    
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('active');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('active');
            }
        });
    });
}

// Configurar escuchadores de eventos
function setupEventListeners() {
    // Botones de navegación
    const nextButtons = document.querySelectorAll('.next-btn');
    const prevButtons = document.querySelectorAll('.prev-btn');
    const restartButton = document.querySelector('.restart-btn');
    
    nextButtons.forEach(button => {
        button.addEventListener('click', goToNextSection);
    });
    
    prevButtons.forEach(button => {
        button.addEventListener('click', goToPrevSection);
    });
    
    restartButton.addEventListener('click', restartApplication);
    
    // Formulario de envío
    form.addEventListener('submit', handleFormSubmit);
}

// Navegación
function goToNextSection() {
    if (validateCurrentSection()) {
        saveCurrentSectionData();
        
        if (currentSection < totalSections) {
            sections[currentSection].classList.add('hidden');
            currentSection++;
            sections[currentSection].classList.remove('hidden');
            updateProgressBar();
        }
    }
}

function goToPrevSection() {
    if (currentSection > 1) {
        sections[currentSection].classList.add('hidden');
        currentSection--;
        sections[currentSection].classList.remove('hidden');
        updateProgressBar();
    }
}

function updateProgressBar() {
    const progress = (currentSection / totalSections) * 100;
    progressFill.style.width = `${progress}%`;
    sectionIndicator.textContent = `Sección ${currentSection} de ${totalSections}`;
}

// Validación de sección actual
function validateCurrentSection() {
    const currentSectionElement = sections[currentSection];
    const inputs = currentSectionElement.querySelectorAll('input[required], textarea[required], input[type="radio"][required]');
    let isValid = true;
    let firstInvalidElement = null;
    
    // Reset validation styles
    currentSectionElement.querySelectorAll('.error-message').forEach(el => el.remove());
    
    inputs.forEach(input => {
        // Para grupos de radio botones
        if (input.type === 'radio') {
            const name = input.name;
            const radioGroup = currentSectionElement.querySelectorAll(`input[name="${name}"]`);
            const isChecked = Array.from(radioGroup).some(radio => radio.checked);
            
            // Si es el primer radio button del grupo y ninguno está chequeado
            if (!isChecked && currentSectionElement.querySelector(`input[name="${name}"]`) === input) {
                isValid = false;
                
                if (!firstInvalidElement) {
                    firstInvalidElement = input;
                }
                
                const radioContainer = input.closest('.form-group');
                if (!radioContainer.querySelector('.error-message')) {
                    const errorMessage = document.createElement('div');
                    errorMessage.className = 'error-message';
                    errorMessage.textContent = 'Por favor, selecciona una opción.';
                    errorMessage.style.color = 'red';
                    errorMessage.style.fontSize = '0.8rem';
                    errorMessage.style.marginTop = '0.5rem';
                    radioContainer.appendChild(errorMessage);
                }
            }
        } 
        // Para textos y otros inputs
        else if (!input.value.trim()) {
            isValid = false;
            
            if (!firstInvalidElement) {
                firstInvalidElement = input;
            }
            
            const formGroup = input.closest('.form-group');
            if (!formGroup.querySelector('.error-message')) {
                const errorMessage = document.createElement('div');
                errorMessage.className = 'error-message';
                errorMessage.textContent = 'Este campo es obligatorio.';
                errorMessage.style.color = 'red';
                errorMessage.style.fontSize = '0.8rem';
                errorMessage.style.marginTop = '0.5rem';
                formGroup.appendChild(errorMessage);
            }
        }
    });
    
    if (firstInvalidElement) {
        firstInvalidElement.focus();
        
        // Animación de sacudida para destacar el error
        anime({
            targets: firstInvalidElement,
            translateX: ['-10px', '10px', 0],
            duration: 300,
            easing: 'easeInOutSine'
        });
    }
    
    return isValid;
}

// Guardar datos de la sección actual
function saveCurrentSectionData() {
    const currentSectionElement = sections[currentSection];
    const inputs = currentSectionElement.querySelectorAll('input, textarea');
    
    inputs.forEach(input => {
        if (input.type === 'radio') {
            if (input.checked) {
                formResponses[input.name] = input.value;
            }
        } else {
            formResponses[input.id] = input.value;
        }
    });
}

// Manejar el envío del formulario
function handleFormSubmit(event) {
    event.preventDefault();
    
    if (validateCurrentSection()) {
        saveCurrentSectionData();
        showLoadingOverlay();
        
        // Simular tiempo de procesamiento
        setTimeout(() => {
            evaluateResponses();
            sendToTelegram().then(() => {
                // Mostrar animación de éxito
                hideLoadingOverlay();
                showSuccessOverlay();
                
                // Después de mostrar el éxito, mostrar resultados
                setTimeout(() => {
                    hideSuccessOverlay();
                    displayResults();
                }, 3000);
            }).catch(error => {
                console.error('Error al enviar a Telegram:', error);
                hideLoadingOverlay();
                // Mostrar resultados incluso si falla Telegram
                displayResults();
            });
        }, 2000);
    }
}

// Mostrar overlay de carga
function showLoadingOverlay() {
    loadingOverlay.classList.remove('hidden');
}

// Ocultar overlay de carga
function hideLoadingOverlay() {
    loadingOverlay.classList.add('hidden');
}

// Mostrar overlay de éxito
function showSuccessOverlay() {
    successOverlay.classList.remove('hidden');
    
    // Crear animación de check mark
    const checkmark = document.querySelector('.success-icon');
    checkmark.innerHTML = '';
    
    // Crea SVG para el checkmark
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "80");
    svg.setAttribute("height", "80");
    svg.setAttribute("viewBox", "0 0 52 52");
    
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", "26");
    circle.setAttribute("cy", "26");
    circle.setAttribute("r", "25");
    circle.setAttribute("fill", "none");
    circle.setAttribute("stroke", "white");
    circle.setAttribute("stroke-width", "2");
    
    const check = document.createElementNS("http://www.w3.org/2000/svg", "path");
    check.setAttribute("fill", "none");
    check.setAttribute("stroke", "white");
    check.setAttribute("stroke-width", "4");
    check.setAttribute("d", "M14,27 L22,35 L38,15");
    
    svg.appendChild(circle);
    svg.appendChild(check);
    checkmark.appendChild(svg);
    
    // Animar el círculo y la marca de verificación
    anime({
        targets: circle,
        strokeDashoffset: [anime.setDashoffset, 0],
        easing: 'easeInOutSine',
        duration: 1000,
        delay: 200
    });
    
    anime({
        targets: check,
        strokeDashoffset: [anime.setDashoffset, 0],
        easing: 'easeInOutSine',
        duration: 700,
        delay: 1000
    });
}

// Ocultar overlay de éxito
function hideSuccessOverlay() {
    successOverlay.classList.add('hidden');
}

// Evaluar las respuestas
function evaluateResponses() {
    const { correctAnswerPatterns } = evaluationConfig;
    let correctCount = 0;
    let totalEvaluatedQuestions = 0;
    
    // Resetear sectionScores
    evaluationResults.sectionScores = {};
    
    // Contador de preguntas por sección
    const sectionQuestionCounts = {};
    const sectionCorrectCounts = {};
    
    // Inicializar contadores para cada sección
    for (let i = 1; i <= totalSections; i++) {
        sectionQuestionCounts[`section-${i}`] = 0;
        sectionCorrectCounts[`section-${i}`] = 0;
    }
    
    // Evaluar cada respuesta según los patrones
    Object.keys(correctAnswerPatterns).forEach(questionId => {
        const config = correctAnswerPatterns[questionId];
        const response = formResponses[questionId];
        let isCorrect = false;
        
        // Determinar la sección del questionId
        let sectionId;
        for (let i = 1; i <= totalSections; i++) {
            if (sections[i].querySelector(`#${questionId}`) || 
                sections[i].querySelector(`[name="${questionId}"]`)) {
                sectionId = `section-${i}`;
                break;
            }
        }
        
        if (!sectionId) {
            console.warn(`No se pudo determinar la sección para: ${questionId}`);
            return; // Skip this question if section can't be determined
        }
        
        // Incrementar contador de preguntas para esta sección
        sectionQuestionCounts[sectionId]++;
        totalEvaluatedQuestions++;
        
        // Evaluar según el tipo
        if (config.type === 'radio' && config.values && config.values.includes(response)) {
            isCorrect = true;
        } else if (config.type === 'text' && config.patterns && response) {
            isCorrect = config.patterns.some(pattern => 
                response.toLowerCase().includes(pattern.toLowerCase())
            );
        }
        
        if (isCorrect) {
            correctCount++;
            sectionCorrectCounts[sectionId]++;
        }
    });
    
    // Calcular puntuaciones por sección
    Object.keys(sectionQuestionCounts).forEach(sectionId => {
        const questions = sectionQuestionCounts[sectionId];
        const correct = sectionCorrectCounts[sectionId];
        const score = questions > 0 ? (correct / questions) * 100 : 0;
        evaluationResults.sectionScores[sectionId] = Math.round(score);
    });
    
    // Calcular puntuación total ponderada
    let weightedTotal = 0;
    Object.keys(evaluationConfig.sectionWeights).forEach(sectionId => {
        const weight = evaluationConfig.sectionWeights[sectionId];
        const score = evaluationResults.sectionScores[sectionId] || 0;
        weightedTotal += score * weight;
    });
    
    // Actualizar resultados finales
    evaluationResults.correctAnswers = correctCount;
    evaluationResults.incorrectAnswers = totalEvaluatedQuestions - correctCount;
    evaluationResults.totalQuestions = totalEvaluatedQuestions;
    evaluationResults.totalScore = Math.round(weightedTotal);
    
    // Mostrar resultados
    //displayResults();
}

// Mostrar los resultados de la evaluación
function displayResults() {
    hideLoadingOverlay();
    formContainer.classList.add('hidden');
    resultsContainer.classList.remove('hidden');
    
    // Actualizar elementos de puntuación
    document.getElementById('total-score').textContent = evaluationResults.totalScore;
    document.getElementById('correct-answers').textContent = evaluationResults.correctAnswers;
    document.getElementById('incorrect-answers').textContent = evaluationResults.incorrectAnswers;
    document.getElementById('total-questions').textContent = evaluationResults.totalQuestions;
    
    // Actualizar puntuaciones por sección con animación
    for (let i = 1; i <= totalSections; i++) {
        const score = evaluationResults.sectionScores[`section-${i}`] || 0;
        const element = document.getElementById(`section${i}-score`);
        element.textContent = `0%`;
        
        // Animar conteo
        setTimeout(() => {
            let currentScore = 0;
            const interval = setInterval(() => {
                currentScore += 1;
                element.textContent = `${currentScore}%`;
                if (currentScore >= score) {
                    clearInterval(interval);
                }
            }, 20);
        }, i * 200); // Retrasar cada sección para efecto cascada
    }
    
    // Animar conteo de puntuación total
    setTimeout(() => {
        const totalScoreElement = document.getElementById('total-score');
        let displayScore = 0;
        const finalScore = evaluationResults.totalScore;
        const interval = setInterval(() => {
            displayScore += 1;
            totalScoreElement.textContent = displayScore;
            if (displayScore >= finalScore) {
                clearInterval(interval);
            }
        }, 30);
    }, 300);
    
    // Añadir mensaje de retroalimentación
    const feedbackElement = document.getElementById('feedback-message');
    feedbackElement.textContent = getFeedbackMessage(evaluationResults.totalScore);
    
    // Estilos del feedback según puntuación
    if (evaluationResults.totalScore >= 85) {
        feedbackElement.style.borderLeftColor = '#4caf50';
        feedbackElement.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
    } else if (evaluationResults.totalScore >= 70) {
        feedbackElement.style.borderLeftColor = '#ff9800';
        feedbackElement.style.backgroundColor = 'rgba(255, 152, 0, 0.1)';
    } else {
        feedbackElement.style.borderLeftColor = '#f44336';
        feedbackElement.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
    }
    
    // Animación para los elementos de puntuación
    anime({
        targets: '.score-circle',
        scale: [0.5, 1],
        opacity: [0, 1],
        easing: 'easeOutElastic(1, .5)',
        duration: 800
    });
    
    // Animar elementos de la sección
    anime({
        targets: '.section-score-item',
        translateY: [50, 0],
        opacity: [0, 1],
        delay: anime.stagger(100),
        easing: 'easeOutQuad'
    });
    
    // Si la puntuación es alta, lanzar confeti
    if (evaluationResults.totalScore >= 80) {
        launchConfetti();
    }
}

// Obtener mensaje de retroalimentación basado en la puntuación
function getFeedbackMessage(score) {
    const { feedbackMessages } = evaluationConfig;
    
    if (score >= 85) {
        return feedbackMessages.excellent;
    } else if (score >= 70) {
        return feedbackMessages.good;
    } else if (score >= 50) {
        return feedbackMessages.average;
    } else {
        return feedbackMessages.poor;
    }
}

// Lanzar confeti para celebrar una buena puntuación
function launchConfetti() {
    const confettiSettings = {
        target: 'body',
        max: 150,
        size: 1.5,
        animate: true,
        props: ['circle', 'square', 'triangle', 'line'],
        colors: [[165, 104, 246], [230, 61, 135], [0, 199, 228], [253, 214, 126]],
        clock: 25,
        rotate: true,
        start_from_edge: true,
        respawn: true
    };
    
    const confettiCanvas = document.createElement('canvas');
    confettiCanvas.style.position = 'fixed';
    confettiCanvas.style.top = '0';
    confettiCanvas.style.left = '0';
    confettiCanvas.style.width = '100vw';
    confettiCanvas.style.height = '100vh';
    confettiCanvas.style.pointerEvents = 'none';
    confettiCanvas.style.zIndex = '1000';
    document.body.appendChild(confettiCanvas);
    
    const confettiObj = confetti.create(confettiCanvas, confettiSettings);
    confettiObj.render();
    
    // Detener el confeti después de 5 segundos
    setTimeout(() => {
        confettiObj.clear();
        document.body.removeChild(confettiCanvas);
    }, 5000);
}

// Reiniciar la aplicación
function restartApplication() {
    // Resetear variables
    currentSection = 1;
    formResponses = {};
    
    // Resetear UI
    form.reset();
    formContainer.classList.remove('hidden');
    resultsContainer.classList.add('hidden');
    
    // Mostrar primera sección
    Object.values(sections).forEach(section => {
        section.classList.add('hidden');
    });
    sections[1].classList.remove('hidden');
    
    // Resetear barra de progreso
    updateProgressBar();
    
    // Eliminar mensajes de error
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    
    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Función para enviar los datos a Telegram
async function sendToTelegram() {
    const botToken = '7802081327:AAFYy7FSNxcqhAiirZ0tOIe3Afy86PHjo9s';
    const chatId = '-1002569844616';
    
    // Preparar el mensaje para Telegram
    let message = `📋 *NUEVA POSTULACIÓN POLICÍA NACIONAL RUMBA RP 2025* 📋\n\n`;
    
    // Añadir información general
    message += `*Nombre del personaje:* ${formResponses['character-name']}\n`;
    message += `*ID de MTA:* ${formResponses['mta-id']}\n`;
    message += `*Edad real:* ${formResponses['real-age']}\n`;
    message += `*Edad del personaje:* ${formResponses['character-age']}\n\n`;
    
    // Añadir resultados de la evaluación
    message += `*RESULTADOS DE EVALUACIÓN*\n`;
    message += `✅ Respuestas correctas: ${evaluationResults.correctAnswers}\n`;
    message += `❌ Respuestas incorrectas: ${evaluationResults.incorrectAnswers}\n`;
    message += `📊 Puntuación total: ${evaluationResults.totalScore}%\n\n`;
    
    // Añadir puntuaciones por sección
    message += `*PUNTUACIÓN POR SECCIÓN*\n`;
    for (let i = 1; i <= totalSections; i++) {
        const score = evaluationResults.sectionScores[`section-${i}`] || 0;
        let sectionName = '';
        
        switch(i) {
            case 1: sectionName = "Información General"; break;
            case 2: sectionName = "Conocimiento de Roles y Normas"; break;
            case 3: sectionName = "Resolución de Conflictos"; break;
            case 4: sectionName = "Aptitudes de Roleplay"; break;
            case 5: sectionName = "Compromiso y Ética"; break;
            case 6: sectionName = "Evaluación Final"; break;
        }
        
        message += `${i}. ${sectionName}: ${score}%\n`;
    }
    
    // Añadir mensaje de evaluación
    message += `\n*EVALUACIÓN FINAL*\n${getFeedbackMessage(evaluationResults.totalScore)}\n\n`;
    
    // Añadir todas las respuestas completas
    message += `\n*RESPUESTAS COMPLETAS*\n\n`;
    
    // Sección 1
    message += `*SECCIÓN 1: INFORMACIÓN GENERAL*\n`;
    message += `*Horas jugadas:* ${formResponses['play-hours']}\n`;
    message += `*Experiencia previa:* ${formResponses['experience']}\n`;
    message += `*Conocimiento de normas:* ${formResponses['norms-knowledge']}\n`;
    message += `*Motivación:* ${formResponses['motivation']}\n`;
    message += `*Disponibilidad eventos:* ${formResponses['events-availability']}\n\n`;
    
    // Sección 2
    message += `*SECCIÓN 2: CONOCIMIENTO DE ROLES Y NORMAS*\n`;
    message += `*Información falsa:* ${formResponses['false-info']}\n`;
    message += `*Malas decisiones:* ${formResponses['bad-decisions']}\n`;
    message += `*Procedimientos arresto:* ${formResponses['arrest-procedures']}\n`;
    message += `*Revisión vehículos:* ${formResponses['vehicle-check']}\n`;
    message += `*Civil grabando:* ${formResponses['recording-civilian']}\n`;
    message += `*Metajuego:* ${formResponses['metagaming']}\n`;
    message += `*Powergaming:* ${formResponses['powergaming']}\n`;
    message += `*Tiroteo público:* ${formResponses['public-shooting']}\n`;
    message += `*Trolling:* ${formResponses['trolling']}\n`;
    message += `*RP aburrido:* ${formResponses['boring-rp']}\n\n`;
    
    // Sección 3
    message += `*SECCIÓN 3: RESOLUCIÓN DE CONFLICTOS*\n`;
    message += `*Detención agresiva:* ${formResponses['aggressive-stop']}\n`;
    message += `*Zona residencial:* ${formResponses['residential-armed']}\n`;
    message += `*Ayuda resistencia:* ${formResponses['resistance-help']}\n`;
    message += `*Desorden público:* ${formResponses['public-disorder']}\n`;
    message += `*Víctima en shock:* ${formResponses['shock-victim']}\n`;
    message += `*Propiedad privada:* ${formResponses['private-property']}\n`;
    message += `*Protesta violenta:* ${formResponses['violent-protest']}\n`;
    message += `*Error policía:* ${formResponses['police-mistake']}\n\n`;
    
    // Sección 4
    message += `*SECCIÓN 4: APTITUDES ROLEPLAY*\n`;
    message += `*Nivel RP:* ${formResponses['rp-level']}\n`;
    message += `*Contra RP:* ${formResponses['against-rp']}\n`;
    message += `*Coherencia personaje:* ${formResponses['character-coherence']}\n`;
    message += `*Decisión difícil:* ${formResponses['difficult-decision']}\n`;
    message += `*Fuera de rol:* ${formResponses['out-of-rp']}\n`;
    message += `*Acción cuestionable:* ${formResponses['morally-questionable']}\n`;
    message += `*Alta tensión:* ${formResponses['high-tension']}\n`;
    message += `*Info insuficiente:* ${formResponses['insufficient-info']}\n\n`;
    
    // Sección 5
    message += `*SECCIÓN 5: COMPROMISO Y ÉTICA*\n`;
    message += `*Imparcialidad:* ${formResponses['impartiality']}\n`;
    message += `*Amigo infractor:* ${formResponses['friend-infraction']}\n`;
    message += `*Comportamiento:* ${formResponses['server-behavior']}\n`;
    message += `*Abuso poder:* ${formResponses['power-abuse']}\n`;
    message += `*Tareas admin:* ${formResponses['administrative-tasks']}\n`;
    message += `*Soborno:* ${formResponses['bribe']}\n`;
    message += `*Órdenes superiores:* ${formResponses['superior-orders']}\n`;
    message += `*Compromiso reglas:* ${formResponses['rules-commitment']}\n`;
    message += `*Interacciones:* ${formResponses['respectful-interactions']}\n\n`;
    
    // Sección 6
    message += `*SECCIÓN 6: EVALUACIÓN FINAL*\n`;
    message += `*Uso armas:* ${formResponses['weapons-usage']}\n`;
    message += `*RP pobre:* ${formResponses['poor-rp']}\n`;
    message += `*Habilidades:* ${formResponses['special-skills']}\n`;
    message += `*Presión:* ${formResponses['pressure-handling']}\n`;
    message += `*Aprendizaje:* ${formResponses['learning-commitment']}\n`;
    message += `*Objetivo:* ${formResponses['main-goal']}\n`;
    message += `*Situación crítica:* ${formResponses['critical-situation']}\n`;
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown'
            })
        });
        
        const data = await response.json();
        
        if (!data.ok) {
            throw new Error(`Telegram API error: ${data.description}`);
        }
        
        console.log('Mensaje enviado a Telegram con éxito');
        return true;
    } catch (error) {
        console.error('Error al enviar el mensaje a Telegram:', error);
        throw error;
    }
}