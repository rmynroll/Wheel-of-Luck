const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const updateBtn = document.getElementById('updateBtn');
const choicesInput = document.getElementById('choicesInput');
const winnerModal = document.getElementById('winnerModal');
const winnerText = document.getElementById('winnerText');
const closeModalBtn = document.getElementById('closeModalBtn');

// State
let choices = [];
let currentAngle = 0; // In radians
let isSpinning = false;
let spinVelocity = 0;
let spinDeceleration = 0.985;
let animationFrameId;

// Colors (Vivid Gemstone Palette)
const colors = [
    '#ff0055', // Ruby Red
    '#00ddff', // Cyan Diamond
    '#aa00ff', // Amethyst
    '#ffbb00', // Gold Topaz
    '#00ff99', // Emerald
    '#ff00cc', // Hot Pink Sapphire
    '#3366ff', // Royal Blue
    '#ff3300'  // Sunset Garnet
];

function init() {
    updateChoices();
    resizeCanvas();
    drawWheel();

    // Event Listeners
    spinBtn.addEventListener('click', spinWheel);
    updateBtn.addEventListener('click', () => {
        updateChoices();
        drawWheel();
    });
    closeModalBtn.addEventListener('click', () => {
        winnerModal.classList.add('hidden');
    });
    window.addEventListener('resize', () => {
        resizeCanvas();
        drawWheel();
    });

    // 3D Tilt Effect
    const container = document.querySelector('.container');
    document.addEventListener('mousemove', (e) => {
        const xAxis = (window.innerWidth / 2 - e.pageX) / 25;
        const yAxis = (window.innerHeight / 2 - e.pageY) / 25;
        container.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
    });
}

// --- SOUND ENGINE (No external files needed!) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTickSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

function playWinSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();

    // Simple arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major chord
    notes.forEach((freq, i) => {
        setTimeout(() => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            osc.start();
            osc.stop(audioCtx.currentTime + 0.5);
        }, i * 100);
    });
}

function resizeCanvas() {
    // Make canvas sharp on high DPI screens
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // Set actual size in memory (scaled to account for extra pixel density)
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Normalize coordinate system to use css pixels.
    ctx.scale(dpr, dpr);
}

function updateChoices() {
    const text = choicesInput.value;
    choices = text.split('\n').filter(line => line.trim() !== '');
    if (choices.length === 0) {
        choices = ['Şans', 'Kader', 'Kısmet']; // Safe defaults
    }
}

function drawWheel() {
    if (!ctx) return;

    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;

    ctx.clearRect(0, 0, width, height);

    const sliceAngle = (2 * Math.PI) / choices.length;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(currentAngle);

    // Shadow for depth (Softer)
    ctx.shadowBlur = 15;
    ctx.shadowColor = "rgba(0,0,0,0.3)";

    for (let i = 0; i < choices.length; i++) {
        const startAngle = i * sliceAngle;
        const endAngle = (i + 1) * sliceAngle;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, startAngle, endAngle);
        ctx.closePath();

        // 1. Base Gradient (Vivid & Deep)
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        const baseColor = colors[i % colors.length];

        // Brighter center, darker edge for jewel effect
        gradient.addColorStop(0, baseColor);
        gradient.addColorStop(0.5, baseColor);
        gradient.addColorStop(1, shadeColor(baseColor, -30));

        ctx.fillStyle = gradient;
        ctx.fill();

        // 2. Crystal Gloss (High Contrast)
        ctx.save();
        // Stronger shimmer
        const glossGrad = ctx.createLinearGradient(0, -radius, 0, radius);
        glossGrad.addColorStop(0, "rgba(255, 255, 255, 0.5)");
        glossGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.0)");
        glossGrad.addColorStop(1, "rgba(255, 255, 255, 0.2)");

        ctx.fillStyle = glossGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();

        // Sharp highlight edge
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        // 3. Highlighting edge (Shiny rim)
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, startAngle, endAngle);
        // We only want the outer arc stroke, but this path includes lines to center.
        // Simplified: Just stroke everything with a light overlay or use a specific arc.
        ctx.restore();

        // Stroke between segments (Thinner, cleaner)
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.stroke();

        // Text
        ctx.save();
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#fff";
        ctx.font = "bold 20px Outfit, sans-serif";
        ctx.shadowBlur = 4;
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.fillText(choices[i].substring(0, 20), radius - 30, 0);
        ctx.restore();
    }

    // Center cap (Premium look with reflection)
    ctx.restore(); // Undo rotation

    // Outer Ring of Center
    ctx.beginPath();
    ctx.arc(centerX, centerY, 35, 0, 2 * Math.PI);
    const centerGradient = ctx.createLinearGradient(centerX - 35, centerY - 35, centerX + 35, centerY + 35);
    centerGradient.addColorStop(0, "#334155");
    centerGradient.addColorStop(1, "#0f172a");
    ctx.fillStyle = centerGradient;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.fill();

    // Inner Button
    ctx.beginPath();
    ctx.arc(centerX, centerY, 28, 0, 2 * Math.PI);
    const btnGradient = ctx.createLinearGradient(centerX - 28, centerY - 28, centerX + 28, centerY + 28);
    btnGradient.addColorStop(0, "#a78bfa"); // Light violet
    btnGradient.addColorStop(1, "#7c3aed"); // Dark violet
    ctx.fillStyle = btnGradient;
    ctx.fill();

    // Shine on button
    ctx.beginPath();
    ctx.arc(centerX, centerY - 10, 15, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.fill();

    // Star icon
    ctx.fillStyle = "#fff";
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("★", centerX, centerY + 2);

    // Draw Sparks
    drawSparks();
}

let sparks = [];
function drawSparks() {
    if (!ctx) return;
    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);
    // Pointer pos relative to canvas (Right middle)
    const px = width - 45; // Approx pointer tip
    const py = height / 2;

    sparks.forEach((s, i) => {
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.05;
        if (s.life <= 0) sparks.splice(i, 1);

        ctx.fillStyle = `rgba(255, 200, 50, ${s.life})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

function addSpark() {
    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);
    const px = width - 25;
    const py = height / 2;

    for (let i = 0; i < 3; i++) {
        sparks.push({
            x: px,
            y: py,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 1.0,
            size: Math.random() * 3
        });
    }
}

// Helper to darken colors for gradient
function shadeColor(color, percent) {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;

    R = Math.round(R);
    G = Math.round(G);
    B = Math.round(B);

    const RR = ((R.toString(16).length == 1) ? "0" + R.toString(16) : R.toString(16));
    const GG = ((G.toString(16).length == 1) ? "0" + G.toString(16) : G.toString(16));
    const BB = ((B.toString(16).length == 1) ? "0" + B.toString(16) : B.toString(16));

    return "#" + RR + GG + BB;
}

function spinWheel() {
    if (isSpinning) return;

    // Resume audio context on user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();

    isSpinning = true;
    spinBtn.disabled = true;

    // Random initial velocity between 0.3 and 0.6 radians/frame
    spinVelocity = Math.random() * 0.3 + 0.3;
    spinDeceleration = 0.990 + (Math.random() * 0.005); // Random friction for unpredictability

    animate();
}

let lastSliceIndex = -1;

function animate() {
    if (spinVelocity < 0.002) {
        // Stopped
        isSpinning = false;
        spinBtn.disabled = false;
        determineWinner();
        return;
    }

    currentAngle += spinVelocity;
    spinVelocity *= spinDeceleration; // Friction

    // Ticking Effect & Sound
    const sliceAngle = (2 * Math.PI) / choices.length;
    const norm = currentAngle % (2 * Math.PI);

    // Determine current slice under pointer
    // Pointer is at 0 degrees. Slice i is at (start, end).
    // Angle 0 is at (2PI - norm).
    const currentRot = (2 * Math.PI - norm) % (2 * Math.PI);
    const activeIndex = Math.floor(currentRot / sliceAngle);

    // If index changed, tick!
    if (activeIndex !== lastSliceIndex) {
        lastSliceIndex = activeIndex;
        playTickSound();
        addSpark(); // Visual friction

        // Flick pointer
        const pointer = document.querySelector('.pointer');
        pointer.style.transform = `translateY(-50%) rotate(-25deg)`;
        setTimeout(() => {
            pointer.style.transform = `translateY(-50%) rotate(0deg)`;
        }, 50);
    }

    drawWheel();
    animationFrameId = requestAnimationFrame(animate);
}

function determineWinner() {
    playWinSound();
    const sliceAngle = (2 * Math.PI) / choices.length;

    // Normalize angle to 0 - 2PI
    const normalizedAngle = currentAngle % (2 * Math.PI);

    // The pointer is at 0 (Right, 0 radians).
    // The wheel rotates clockwise (positive angle).
    // So the effective angle at the pointer is (2PI - normalizedAngle).

    let winningIndex = Math.floor(((2 * Math.PI - normalizedAngle) % (2 * Math.PI)) / sliceAngle);

    // winningIndex can be choices.length sometimes due to float precision, clamp it
    winningIndex = winningIndex % choices.length;

    const winner = choices[winningIndex];
    showWinner(winner);
}

function showWinner(winner) {
    winnerText.textContent = winner;
    winnerModal.classList.remove('hidden');
    fireConfetti();
}

function fireConfetti() {
    // Simple Confetti Implementation
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
        // Use a library-like simple approach or just rely on a new visual overlay?
        // Since we don't have a library, let's do a simple canvas burst on the modal or main canvas?
        // Modifying main canvas is tricky because modal is on top.
        // Let's create a temporary canvas for confetti on top of everything.

        let confettiCanvas = document.getElementById('confetti-canvas');
        if (!confettiCanvas) {
            confettiCanvas = document.createElement('canvas');
            confettiCanvas.id = 'confetti-canvas';
            confettiCanvas.style.position = 'fixed';
            confettiCanvas.style.top = '0';
            confettiCanvas.style.left = '0';
            confettiCanvas.style.width = '100%';
            confettiCanvas.style.height = '100%';
            confettiCanvas.style.pointerEvents = 'none';
            confettiCanvas.style.zIndex = '9999';
            document.body.appendChild(confettiCanvas);

            // Simple confetti particle logic
            const particles = [];
            const colors = ['#f43f5e', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b'];

            for (let i = 0; i < 100; i++) {
                particles.push({
                    x: Math.random() * window.innerWidth,
                    y: Math.random() * window.innerHeight - window.innerHeight,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    size: Math.random() * 10 + 5,
                    speed: Math.random() * 5 + 2,
                    angle: Math.random() * 360
                });
            }

            const ctx = confettiCanvas.getContext('2d');
            confettiCanvas.width = window.innerWidth;
            confettiCanvas.height = window.innerHeight;

            function renderConfetti() {
                ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
                let active = false;

                particles.forEach(p => {
                    p.y += p.speed;
                    p.angle += 2;
                    if (p.y < window.innerHeight) active = true;

                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.angle * Math.PI / 180);
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                    ctx.restore();
                });

                if (Date.now() < end || active) {
                    requestAnimationFrame(renderConfetti);
                } else {
                    confettiCanvas.remove();
                }
            }
            renderConfetti();
        }
    }());
}

init();
