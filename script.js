/**
 * Marjan Interactive Web - Complete JavaScript Engine (script.js)
 * Includes: Web Audio Synthesizer, Theme Engine, Pour Game, Bowling Game, & Bootstrap.
 */

/* ==========================================================================
   1. Sound Engine (Zero-dependency Web Audio API)
   ========================================================================== */
class MarjanSoundEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.isPouring = false;
        this.pourSource = null;
        this.pourGain = null;
        this.pourFilter = null;
        this.rollSource = null;
        this.rollGain = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) this.ctx = new AudioContext();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopPourSound();
            this.stopRollSound();
        }
        return this.isMuted;
    }

    playClick() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(850, this.ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    startPourSound() {
        if (this.isMuted || this.isPouring) return;
        this.init();
        if (!this.ctx) return;

        this.isPouring = true;
        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99 * b0 + white * 0.05;
            b1 = 0.96 * b1 + white * 0.11;
            b2 = 0.86 * b2 + white * 0.25;
            output[i] = (b0 + b1 + b2) * 0.3;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(550, now);
        filter.Q.setValueAtTime(2.2, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.22, now + 0.1);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
        this.pourSource = noise;
        this.pourGain = gain;
        this.pourFilter = filter;

        this.bubbleInterval = setInterval(() => {
            if (!this.isPouring || this.isMuted) return;
            this.playBubbleBlip();
        }, 110);
    }

    updatePourPitch(levelRatio) {
        if (!this.pourFilter || !this.ctx) return;
        const targetFreq = 480 + (levelRatio * 520);
        this.pourFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.08);
    }

    stopPourSound() {
        if (!this.isPouring) return;
        this.isPouring = false;
        if (this.bubbleInterval) {
            clearInterval(this.bubbleInterval);
            this.bubbleInterval = null;
        }
        if (this.pourGain && this.ctx) {
            const now = this.ctx.currentTime;
            this.pourGain.gain.cancelScheduledValues(now);
            this.pourGain.gain.setValueAtTime(this.pourGain.gain.value, now);
            this.pourGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
            setTimeout(() => {
                try { if (this.pourSource) this.pourSource.stop(); } catch (e) {}
                this.pourSource = null;
                this.pourGain = null;
                this.pourFilter = null;
            }, 130);
        }
    }

    playBubbleBlip() {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startFreq = 700 + Math.random() * 600;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(startFreq + 400, now + 0.045);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
    }

    playPerfectPour() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        const now = this.ctx.currentTime;
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.09);
            gain.gain.setValueAtTime(0, now + idx * 0.09);
            gain.linearRampToValueAtTime(0.2, now + idx * 0.09 + 0.02);
            gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.4);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.09);
            osc.stop(now + idx * 0.09 + 0.45);
        });
    }

    playGoodPour() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const notes = [523.25, 659.25, 783.99];
        const now = this.ctx.currentTime;
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            gain.gain.setValueAtTime(0.15, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.26);
        });
    }

    playMissPour() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.35);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.36);
    }

    startRollSound() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        this.stopRollSound();
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) output[i] = (Math.random() * 2 - 1) * 0.4;
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(180, this.ctx.currentTime);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + 0.15);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
        this.rollSource = noise;
        this.rollGain = gain;
    }

    stopRollSound() {
        if (this.rollGain && this.ctx) {
            const now = this.ctx.currentTime;
            this.rollGain.gain.cancelScheduledValues(now);
            this.rollGain.gain.setValueAtTime(this.rollGain.gain.value, now);
            this.rollGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
            setTimeout(() => {
                try { if (this.rollSource) this.rollSource.stop(); } catch (e) {}
                this.rollSource = null;
                this.rollGain = null;
            }, 90);
        }
    }

    playPinHit(intensity = 1.0) {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const power = Math.min(1.0, Math.max(0.2, intensity));

        const thumpOsc = this.ctx.createOscillator();
        const thumpGain = this.ctx.createGain();
        thumpOsc.type = 'sine';
        thumpOsc.frequency.setValueAtTime(160, now);
        thumpOsc.frequency.exponentialRampToValueAtTime(45, now + 0.12);
        thumpGain.gain.setValueAtTime(0.4 * power, now);
        thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        thumpOsc.connect(thumpGain);
        thumpGain.connect(this.ctx.destination);
        thumpOsc.start(now);
        thumpOsc.stop(now + 0.13);

        [1850, 2400, 3100, 4200].forEach(freq => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq + (Math.random() * 200 - 100), now);
            gain.gain.setValueAtTime(0.12 * power, now);
            gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.22);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.24);
        });
    }

    playStrikeFanfare() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const chords = [
            [523.25, 659.25, 783.99],
            [659.25, 830.61, 987.77],
            [783.99, 987.77, 1174.66],
            [1046.50, 1318.51, 1567.98, 2093]
        ];
        chords.forEach((chord, chordIdx) => {
            const startTime = now + chordIdx * 0.16;
            const duration = chordIdx === 3 ? 0.7 : 0.22;
            chord.forEach(freq => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, startTime);
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(0.15, startTime + 0.04);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(startTime);
                osc.stop(startTime + duration + 0.05);
            });
        });
    }

    playGutterSound() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.4);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.42);
    }
}
window.marjanAudio = new MarjanSoundEngine();

/* ==========================================================================
   2. Theme Engine & Flavor Database
   ========================================================================== */
const MARJAN_FLAVORS = [
    {
        id: 'cocopandan',
        name: 'Cocopandan',
        subname: 'Marjan Boudoin',
        tagline: 'Manis Gurih Khas Kelapa Pandan Asli',
        description: 'Varian legendaris paling dicintai keluarga Indonesia dengan aroma wangi pandan dan kesegaran kelapa alami yang manis memikat.',
        primaryColor: '#e11d48',
        secondaryColor: '#be123c',
        accentColor: '#fecdd3',
        glowColor: 'rgba(225, 29, 72, 0.45)',
        bgGradient: 'radial-gradient(circle at 50% 20%, #4a0418 0%, #1a0208 60%, #0d0104 100%)',
        liquidColor: '#e11d48',
        liquidLight: '#ff4d6d',
        recipe: {
            title: 'Es Timun Suri Marjan Cocopandan',
            description: 'Campurkan serutan timun suri, biji selasih, es batu kristal, dan tuang sirup Marjan Cocopandan. Segarnya tak tertandingi!'
        }
    },
    {
        id: 'melon',
        name: 'Melon',
        subname: 'Marjan Boudoin',
        tagline: 'Kesegaran Alami Buah Melon Matang',
        description: 'Sensasi aroma melon manis segar yang menyejukkan dahaga seketika. Pilihan favorit untuk hidangan buka puasa dan pesta keluarga.',
        primaryColor: '#10b981',
        secondaryColor: '#047857',
        accentColor: '#a7f3d0',
        glowColor: 'rgba(16, 185, 129, 0.45)',
        bgGradient: 'radial-gradient(circle at 50% 20%, #023826 0%, #021a12 60%, #010d09 100%)',
        liquidColor: '#10b981',
        liquidLight: '#34d399',
        recipe: {
            title: 'Es Blewah Marjan Melon Selasih',
            description: 'Paduan blewah serut dingin, nata de coco, perasan jeruk nipis, dan sirup Marjan Melon beraroma manis semerbak.'
        }
    },
    {
        id: 'pisang-susu',
        name: 'Pisang Susu',
        subname: 'Marjan Boudoin',
        tagline: 'Sensasi Lembut Manis Pisang Ambon & Susu',
        description: 'Cita rasa unik pisang susu yang legit, creamy, dan harum semerbak. Sangat lezat dipadukan dengan es serut atau susu kental manis.',
        primaryColor: '#f59e0b',
        secondaryColor: '#b45309',
        accentColor: '#fef3c7',
        glowColor: 'rgba(245, 158, 11, 0.45)',
        bgGradient: 'radial-gradient(circle at 50% 20%, #452404 0%, #211102 60%, #0f0801 100%)',
        liquidColor: '#f59e0b',
        liquidLight: '#fbbf24',
        recipe: {
            title: 'Es Pisang Ijo Marjan Pisang Susu',
            description: 'Kudapan khas Makassar berbalut kulit pandan lembut disiram bubur sumsum gurih dan sirup Marjan Pisang Susu.'
        }
    },
    {
        id: 'ros',
        name: 'Ros (Mawar)',
        subname: 'Marjan Boudoin',
        tagline: 'Harum Semerbak Kelopak Bunga Mawar Merah',
        description: 'Varian klasik beraroma mawar yang eksotis dan anggun. Menghadirkan nostalgia kehangatan perayaan istimewa.',
        primaryColor: '#ec4899',
        secondaryColor: '#be185d',
        accentColor: '#fbcfe8',
        glowColor: 'rgba(236, 72, 153, 0.45)',
        bgGradient: 'radial-gradient(circle at 50% 20%, #470629 0%, #240214 60%, #12010a 100%)',
        liquidColor: '#ec4899',
        liquidLight: '#f472b6',
        recipe: {
            title: 'Soda Gembira Marjan Ros',
            description: 'Perpaduan klasik air soda berkarbonasi, susu kental manis putih, es batu, dan aroma wangi sirup Marjan Ros.'
        }
    },
    {
        id: 'lychee',
        name: 'Lychee (Leci)',
        subname: 'Marjan Boudoin',
        tagline: 'Manis Elegan dengan Kesegaran Buah Leci Tropis',
        description: 'Rasa buah leci manis alami yang jernih dan menyegarkan. Sempurna untuk mocktail segar berkarbonasi atau es buah tropis.',
        primaryColor: '#db2777',
        secondaryColor: '#9d174d',
        accentColor: '#fce7f3',
        glowColor: 'rgba(219, 39, 119, 0.40)',
        bgGradient: 'radial-gradient(circle at 50% 20%, #3d0820 0%, #1e030f 60%, #0d0107 100%)',
        liquidColor: '#f472b6',
        liquidLight: '#fbcfe8',
        recipe: {
            title: 'Sparkling Lychee Mint Marjan',
            description: 'Buah leci utuh, daun mint tumbuk segar, es batu, air sparkling soda, dan tuangan sirup Marjan Leci dingin.'
        }
    },
    {
        id: 'kopi-moka',
        name: 'Kopi Moka',
        subname: 'Marjan Boudoin',
        tagline: 'Perpaduan Kopi Pilihan & Cokelat Moka Mewah',
        description: 'Aroma kopi robusta dan kelembutan cokelat moka berkelas. Memberikan kenikmatan manis berkarakter untuk pecinta rasa autentik.',
        primaryColor: '#b45309',
        secondaryColor: '#78350f',
        accentColor: '#fde68a',
        glowColor: 'rgba(180, 83, 9, 0.45)',
        bgGradient: 'radial-gradient(circle at 50% 20%, #361703 0%, #1b0a01 60%, #0a0400 100%)',
        liquidColor: '#854d0e',
        liquidLight: '#a16207',
        recipe: {
            title: 'Es Kopi Susu Moka Marjan',
            description: 'Espresso dingin dicampur susu oat creamy, es batu, dan sirup Marjan Kopi Moka sebagai pemanis alami aromatik.'
        }
    },
    {
        id: 'lemon-squash',
        name: 'Lemon Squash',
        subname: 'Marjan Squash',
        tagline: 'Asam Manis Menggigit Jeruk Lemon Asli',
        description: 'Kategori Marjan Squash dengan kesegaran sari buah jeruk lemon murni yang menyengat segar di lidah, membangkitkan semangat seketika.',
        primaryColor: '#84cc16',
        secondaryColor: '#4d7c0f',
        accentColor: '#ecfccb',
        glowColor: 'rgba(132, 204, 22, 0.45)',
        bgGradient: 'radial-gradient(circle at 50% 20%, #203504 0%, #0f1c01 60%, #060d00 100%)',
        liquidColor: '#84cc16',
        liquidLight: '#a3e635',
        recipe: {
            title: 'Marjan Squash Lemon Breeze',
            description: 'Campuran sirup Marjan Lemon Squash, irisan lemon tipis, selasih mengembang, dan daun mint dingin.'
        }
    }
];

class ThemeManager {
    constructor() {
        this.currentFlavor = MARJAN_FLAVORS[0];
        this.listeners = [];
        this.bgCanvas = null;
        this.bgCtx = null;
        this.particles = [];
    }

    init() {
        this.setupFlavorBar();
        this.setupBackgroundCanvas();
        this.applyTheme(this.currentFlavor);
        this.setupCustomMixer();
    }

    onFlavorChange(callback) {
        this.listeners.push(callback);
    }

    applyTheme(flavor) {
        this.currentFlavor = flavor;
        const root = document.documentElement;

        root.style.setProperty('--flavor-primary', flavor.primaryColor);
        root.style.setProperty('--flavor-secondary', flavor.secondaryColor);
        root.style.setProperty('--flavor-accent', flavor.accentColor);
        root.style.setProperty('--flavor-glow', flavor.glowColor);
        root.style.setProperty('--flavor-liquid', flavor.liquidColor);
        root.style.setProperty('--flavor-liquid-light', flavor.liquidLight);

        document.body.style.background = flavor.bgGradient;

        document.querySelectorAll('.active-flavor-name').forEach(el => el.textContent = flavor.name);
        const tagEl = document.getElementById('hero-flavor-tagline');
        if (tagEl) tagEl.textContent = flavor.tagline;
        const descEl = document.getElementById('hero-flavor-desc');
        if (descEl) descEl.textContent = flavor.description;

        const recipeTitle = document.getElementById('recipe-feature-title');
        const recipeDesc = document.getElementById('recipe-feature-desc');
        if (recipeTitle && flavor.recipe) recipeTitle.textContent = flavor.recipe.title;
        if (recipeDesc && flavor.recipe) recipeDesc.textContent = flavor.recipe.description;

        document.querySelectorAll('.flavor-pill').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.flavorId === flavor.id);
        });

        const bottleLiquid = document.querySelector('.hero-bottle-liquid');
        if (bottleLiquid) bottleLiquid.style.fill = flavor.liquidColor;
        const bottleLabelVariant = document.querySelector('.hero-bottle-label-variant');
        if (bottleLabelVariant) bottleLabelVariant.textContent = flavor.name.toUpperCase();
        const heroBottleGlow = document.querySelector('.hero-bottle-aura');
        if (heroBottleGlow) heroBottleGlow.style.boxShadow = `0 0 90px 30px ${flavor.glowColor}`;

        this.listeners.forEach(cb => { try { cb(flavor); } catch (e) {} });
    }

    setupFlavorBar() {
        const container = document.getElementById('flavor-bar-container');
        if (!container) return;
        container.innerHTML = '';
        MARJAN_FLAVORS.forEach(flavor => {
            const btn = document.createElement('button');
            btn.className = `flavor-pill ${flavor.id === this.currentFlavor.id ? 'active' : ''}`;
            btn.dataset.flavorId = flavor.id;
            btn.innerHTML = `
                <span class="pill-dot" style="background-color: ${flavor.primaryColor}; box-shadow: 0 0 10px ${flavor.glowColor}"></span>
                <span class="pill-text">${flavor.name}</span>
            `;
            btn.addEventListener('click', () => {
                window.marjanAudio?.playClick();
                this.applyTheme(flavor);
            });
            container.appendChild(btn);
        });
    }

    setupCustomMixer() {
        const colorInput = document.getElementById('custom-color-picker');
        if (!colorInput) return;
        colorInput.addEventListener('input', (e) => {
            const hex = e.target.value;
            const customFlavor = {
                id: 'custom',
                name: 'Kreasi Spesial',
                subname: 'Custom Edition',
                tagline: 'Perpaduan Warna & Rasa Impian Kamu Sendiri!',
                description: 'Kombinasi eksklusif Marjan dengan sentuhan warna kreasi unik yang memukau.',
                primaryColor: hex,
                secondaryColor: hex,
                accentColor: '#ffffff',
                glowColor: hex + '66',
                bgGradient: `radial-gradient(circle at 50% 20%, ${hex}44 0%, #0a0508 70%, #000000 100%)`,
                liquidColor: hex,
                liquidLight: hex,
                recipe: {
                    title: 'Mocktail Marjan Spesial Kreasi Sendiri',
                    description: 'Padukan sirup Marjan warna pilihanmu dengan air kelapa muda dan es batu melimpah!'
                }
            };
            this.applyTheme(customFlavor);
        });
    }

    setupBackgroundCanvas() {
        this.bgCanvas = document.getElementById('bg-ambient-canvas');
        if (!this.bgCanvas) return;
        this.bgCtx = this.bgCanvas.getContext('2d');

        const resize = () => {
            this.bgCanvas.width = window.innerWidth;
            this.bgCanvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        this.particles = [];
        const count = Math.min(45, Math.floor(window.innerWidth / 35));
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                radius: Math.random() * 5 + 2,
                speedY: -(Math.random() * 0.7 + 0.3),
                speedX: (Math.random() - 0.5) * 0.4,
                opacity: Math.random() * 0.5 + 0.15,
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: Math.random() * 0.03 + 0.01,
                isSparkle: Math.random() > 0.6
            });
        }

        const render = () => {
            if (this.bgCtx && this.bgCanvas) {
                const ctx = this.bgCtx;
                const w = this.bgCanvas.width;
                const h = this.bgCanvas.height;
                ctx.clearRect(0, 0, w, h);
                const color = this.currentFlavor.primaryColor;

                this.particles.forEach(p => {
                    p.y += p.speedY;
                    p.wobble += p.wobbleSpeed;
                    p.x += Math.sin(p.wobble) * 0.5 + p.speedX;

                    if (p.y < -20) { p.y = h + 20; p.x = Math.random() * w; }
                    if (p.x < -20) p.x = w + 20;
                    if (p.x > w + 20) p.x = -20;

                    ctx.save();
                    ctx.globalAlpha = p.opacity;
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                });
            }
            requestAnimationFrame(render);
        };
        render();
    }
}
window.marjanTheme = new ThemeManager();

/* ==========================================================================
   3. Pour Game Engine (Takar Manis Pas)
   ========================================================================== */
class PourGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isPouring = false;
        this.bottleAngle = 0;
        this.targetAngle = 0;
        this.liquidLevel = 0;
        this.targetLevel = 55;
        this.tolerance = 4.5;
        this.toleranceGood = 9.0;
        this.pourSpeed = 0.42;
        this.isRoundOver = false;
        this.score = 0;
        this.highScore = 0;
        this.streak = 0;
        this.currentRound = 1;
        this.currentColor = '#e11d48';
        this.currentLight = '#ff4d6d';
        this.iceCubes = [
            { xOffset: -22, size: 26, rot: 0.15, floatOffset: 0 },
            { xOffset: 12, size: 28, rot: -0.25, floatOffset: -4 },
            { xOffset: -2, size: 22, rot: 0.35, floatOffset: 6 }
        ];
        this.streamParticles = [];
        this.confetti = [];
    }

    init() {
        this.canvas = document.getElementById('pour-game-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.setupDimensions();
        window.addEventListener('resize', () => this.setupDimensions());
        this.setupControls();

        if (window.marjanTheme) {
            this.currentColor = window.marjanTheme.currentFlavor.liquidColor;
            this.currentLight = window.marjanTheme.currentFlavor.liquidLight;
            window.marjanTheme.onFlavorChange(flavor => {
                this.currentColor = flavor.liquidColor;
                this.currentLight = flavor.liquidLight;
            });
        }

        this.startNewRound(true);

        const loop = () => {
            this.update();
            this.render();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    setupDimensions() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.width = rect.width;
        this.height = rect.height;
        this.ctx.scale(dpr, dpr);
    }

    setupControls() {
        const pourBtn = document.getElementById('btn-pour-hold');
        const resetBtn = document.getElementById('btn-pour-reset');

        const startPour = (e) => {
            if (e) e.preventDefault();
            if (this.isRoundOver) return;
            this.isPouring = true;
            this.targetAngle = 55;
            window.marjanAudio?.startPourSound();
        };

        const stopPour = (e) => {
            if (e) e.preventDefault();
            if (!this.isPouring) return;
            this.isPouring = false;
            this.targetAngle = 0;
            window.marjanAudio?.stopPourSound();
            if (!this.isRoundOver && this.liquidLevel > 2) {
                this.evaluateResult();
            }
        };

        if (pourBtn) {
            pourBtn.addEventListener('mousedown', startPour);
            window.addEventListener('mouseup', stopPour);
            pourBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startPour(e); }, { passive: false });
            window.addEventListener('touchend', stopPour);
        }

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.repeat && document.activeElement.tagName !== 'INPUT') {
                e.preventDefault();
                startPour();
            }
        });
        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space' && this.isPouring) {
                e.preventDefault();
                stopPour();
            }
        });

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                window.marjanAudio?.playClick();
                this.startNewRound();
            });
        }
    }

    startNewRound(isResetScore = false) {
        this.isPouring = false;
        this.bottleAngle = 0;
        this.targetAngle = 0;
        this.liquidLevel = 0;
        this.isRoundOver = false;
        this.streamParticles = [];
        this.confetti = [];

        if (isResetScore) {
            this.score = 0;
            this.streak = 0;
            this.currentRound = 1;
        }

        this.targetLevel = Math.round(35 + Math.random() * 40);
        const targetValEl = document.getElementById('target-ml-display');
        if (targetValEl) targetValEl.textContent = `${this.targetLevel} ml`;

        const feedbackEl = document.getElementById('pour-feedback-msg');
        if (feedbackEl) {
            feedbackEl.className = 'feedback-text';
            feedbackEl.innerHTML = 'Tekan & tahan tombol <strong>"TUANG SIRUP"</strong> sampai pas di garis emas!';
        }
        this.updateScoreUI();
    }

    evaluateResult() {
        this.isRoundOver = true;
        const diff = Math.abs(this.liquidLevel - this.targetLevel);
        const feedbackEl = document.getElementById('pour-feedback-msg');
        let roundScore = 0;
        let title = '';
        let badgeClass = '';

        if (diff <= this.tolerance) {
            this.streak++;
            roundScore = 100 + (this.streak * 20);
            title = `🎉 SEMPURNA! Manisnya Pas Juara! (+${roundScore} PTS)`;
            badgeClass = 'perfect';
            window.marjanAudio?.playPerfectPour();
            this.spawnConfetti();
        } else if (diff <= this.toleranceGood) {
            this.streak = Math.max(1, this.streak);
            roundScore = 70 + (this.streak * 10);
            title = `✨ Segar Mantap! Manisnya Pas (+${roundScore} PTS)`;
            badgeClass = 'good';
            window.marjanAudio?.playGoodPour();
        } else if (this.liquidLevel < this.targetLevel) {
            this.streak = 0;
            roundScore = Math.max(10, Math.round(40 - diff));
            title = `💧 Kurang Manis! Sirupnya kurang banyak (+${roundScore} PTS)`;
            badgeClass = 'warn';
            window.marjanAudio?.playMissPour();
        } else {
            this.streak = 0;
            roundScore = this.liquidLevel >= 96 ? 0 : Math.max(5, Math.round(30 - diff));
            title = this.liquidLevel >= 96 ? '⚠️ Kemanisan & Tumpah! (0 PTS)' : `🍬 Waduh Kemanisan! (+${roundScore} PTS)`;
            badgeClass = 'danger';
            window.marjanAudio?.playMissPour();
        }

        this.score += roundScore;
        if (this.score > this.highScore) this.highScore = this.score;
        this.currentRound++;

        if (feedbackEl) {
            feedbackEl.className = `feedback-text ${badgeClass}`;
            feedbackEl.innerHTML = `${title} <br><small>Tingkat Akurasi: ${Math.max(0, Math.round(100 - (diff * 2.2)))}% (Isi: ${Math.round(this.liquidLevel)} ml / Target: ${this.targetLevel} ml)</small>`;
        }
        this.updateScoreUI();
    }

    updateScoreUI() {
        const scoreEl = document.getElementById('pour-score');
        const highEl = document.getElementById('pour-highscore');
        const streakEl = document.getElementById('pour-streak');
        const roundEl = document.getElementById('pour-round');
        if (scoreEl) scoreEl.textContent = this.score;
        if (highEl) highEl.textContent = this.highScore;
        if (streakEl) streakEl.textContent = `${this.streak}x`;
        if (roundEl) roundEl.textContent = this.currentRound;
    }

    spawnConfetti() {
        const colors = [this.currentColor, '#ffd700', '#ffffff', '#10b981', '#f43f5e'];
        for (let i = 0; i < 40; i++) {
            this.confetti.push({
                x: this.width * 0.5 + (Math.random() - 0.5) * 100,
                y: this.height * 0.65,
                vx: (Math.random() - 0.5) * 12,
                vy: -(Math.random() * 9 + 4),
                size: Math.random() * 7 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                opacity: 1
            });
        }
    }

    update() {
        this.bottleAngle += (this.targetAngle - this.bottleAngle) * 0.14;
        if (this.isPouring && this.bottleAngle > 20) {
            if (this.liquidLevel < 100) {
                this.liquidLevel += this.pourSpeed;
                if (this.liquidLevel > 100) this.liquidLevel = 100;
                window.marjanAudio?.updatePourPitch(this.liquidLevel / 100);
            }
            for (let i = 0; i < 2; i++) {
                this.streamParticles.push({
                    x: (Math.random() - 0.5) * 4,
                    progress: 0,
                    speed: 0.05 + Math.random() * 0.03,
                    size: Math.random() * 3 + 2.5
                });
            }
        }

        for (let i = this.streamParticles.length - 1; i >= 0; i--) {
            const p = this.streamParticles[i];
            p.progress += p.speed;
            if (p.progress >= 1) this.streamParticles.splice(i, 1);
        }

        for (let i = this.confetti.length - 1; i >= 0; i--) {
            const c = this.confetti[i];
            c.x += c.vx;
            c.y += c.vy;
            c.vy += 0.35;
            c.opacity -= 0.016;
            if (c.opacity <= 0 || c.y > this.height) {
                this.confetti.splice(i, 1);
            }
        }
    }

    render() {
        if (!this.ctx || !this.width) return;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        const cx = this.width * 0.5;
        const glassBottom = this.height * 0.88;
        const glassHeight = this.height * 0.44;
        const glassWidth = Math.min(130, this.width * 0.36);

        // Target Line
        const targetY = glassBottom - (glassHeight * (this.targetLevel / 100));
        ctx.save();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(cx - glassWidth/2 - 24, targetY);
        ctx.lineTo(cx + glassWidth/2 + 24, targetY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`TARGET: ${this.targetLevel} ml`, cx + glassWidth/2 + 30, targetY + 4);
        ctx.restore();

        // Glass Liquid
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx - glassWidth/2, glassBottom - glassHeight);
        ctx.lineTo(cx - glassWidth*0.4, glassBottom);
        ctx.quadraticCurveTo(cx, glassBottom + 12, cx + glassWidth*0.4, glassBottom);
        ctx.lineTo(cx + glassWidth/2, glassBottom - glassHeight);
        ctx.closePath();
        ctx.clip();

        if (this.liquidLevel > 0) {
            const currentLiquidY = glassBottom - (glassHeight * (this.liquidLevel / 100));
            ctx.fillStyle = this.currentColor;
            ctx.fillRect(cx - glassWidth, currentLiquidY, glassWidth * 2, glassHeight);

            // Floating ice cubes
            this.iceCubes.forEach((ice, idx) => {
                const iceY = Math.min(glassBottom - 20, currentLiquidY + 14 + ice.floatOffset + Math.sin(Date.now() * 0.003 + idx) * 3);
                ctx.save();
                ctx.translate(cx + ice.xOffset, iceY);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.lineWidth = 1.5;
                ctx.fillRect(-ice.size/2, -ice.size/2, ice.size, ice.size);
                ctx.strokeRect(-ice.size/2, -ice.size/2, ice.size, ice.size);
                ctx.restore();
            });
        }
        ctx.restore();

        // Glass Outline
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx - glassWidth/2, glassBottom - glassHeight);
        ctx.lineTo(cx - glassWidth*0.4, glassBottom);
        ctx.quadraticCurveTo(cx, glassBottom + 12, cx + glassWidth*0.4, glassBottom);
        ctx.lineTo(cx + glassWidth/2, glassBottom - glassHeight);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 3.5;
        ctx.stroke();
        ctx.restore();

        // Liquid Stream
        const pivotX = cx - 110;
        const pivotY = glassBottom - glassHeight - 120;
        const rad = (this.bottleAngle * Math.PI) / 180;

        if (this.bottleAngle > 15) {
            const spoutX = pivotX + Math.cos(rad) * 90 + Math.sin(rad) * 40;
            const spoutY = pivotY + Math.sin(rad) * 90 - Math.cos(rad) * 40;
            const targetImpactY = glassBottom - (glassHeight * (this.liquidLevel / 100));
            ctx.strokeStyle = this.currentLight;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(spoutX, spoutY);
            ctx.quadraticCurveTo(cx - 15, (spoutY + targetImpactY) * 0.5, cx, targetImpactY);
            ctx.stroke();
        }

        // Render Bottle
        ctx.save();
        ctx.translate(pivotX, pivotY);
        ctx.rotate(rad);
        const bw = 54, bh = 180, neckW = 20, neckH = 60;
        ctx.fillStyle = this.currentColor;
        ctx.roundRect(-bw/2, -bh/2 + neckH, bw, bh - neckH, [0, 0, 10, 10]);
        ctx.fill();

        ctx.fillStyle = '#fffdf0';
        ctx.strokeRect(-bw/2 + 4, -bh/2 + neckH + 25, bw - 8, 65);
        ctx.fillRect(-bw/2 + 4, -bh/2 + neckH + 25, bw - 8, 65);
        ctx.fillStyle = '#b91c1c';
        ctx.font = 'bold 10px serif';
        ctx.textAlign = 'center';
        ctx.fillText('MARJAN', 0, -bh/2 + neckH + 45);

        ctx.fillStyle = '#d4af37';
        ctx.fillRect(-neckW/2, -bh/2 - 10, neckW, 14);
        ctx.restore();

        // Render Confetti
        this.confetti.forEach(c => {
            ctx.fillStyle = c.color;
            ctx.globalAlpha = c.opacity;
            ctx.fillRect(c.x, c.y, c.size, c.size);
        });
        ctx.globalAlpha = 1.0;
    }
}
window.marjanPourGame = new PourGame();

/* ==========================================================================
   4. Bowling Game Engine (Marjan Bottle Bowling)
   ========================================================================== */
class BowlingGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 600;
        this.height = 700;
        this.laneLeft = 80;
        this.laneRight = 520;
        this.laneTop = 80;
        this.laneBottom = 640;
        this.pins = [];
        this.pinFlavors = ['#e11d48', '#10b981', '#f59e0b', '#ec4899', '#db2777', '#854d0e', '#84cc16', '#e11d48', '#10b981', '#ec4899'];
        this.ball = { x: 300, y: 600, radius: 20, vx: 0, vy: 0, spin: 0, isRolling: false, inGutter: false, rotation: 0 };
        this.aimX = 300;
        this.power = 75;
        this.powerDirection = 1;
        this.spinChoice = 0;
        this.currentFrame = 1;
        this.maxFrames = 5;
        this.currentRoll = 1;
        this.pinsStandingBeforeRoll = 10;
        this.frameScores = [
            { roll1: null, roll2: null, total: null },
            { roll1: null, roll2: null, total: null },
            { roll1: null, roll2: null, total: null },
            { roll1: null, roll2: null, total: null },
            { roll1: null, roll2: null, total: null }
        ];
        this.totalScore = 0;
        this.isGameOver = false;
        this.celebrationText = '';
        this.celebrationTimer = 0;
        this.confetti = [];
    }

    init() {
        this.canvas = document.getElementById('bowling-game-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.setupDimensions();
        window.addEventListener('resize', () => this.setupDimensions());
        this.setupPins();
        this.setupControls();
        this.updateScoreboardUI();

        const loop = () => {
            this.update();
            this.render();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    setupDimensions() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.width = rect.width;
        this.height = rect.height;
        this.ctx.scale(dpr, dpr);

        this.laneLeft = this.width * 0.12;
        this.laneRight = this.width * 0.88;
        this.laneTop = this.height * 0.11;
        this.laneBottom = this.height * 0.88;

        if (!this.ball.isRolling) {
            this.ball.x = this.width * 0.5;
            this.ball.y = this.laneBottom;
            this.aimX = this.ball.x;
        }
    }

    setupPins() {
        this.pins = [];
        const cx = this.width * 0.5;
        const topY = this.laneTop + 50;
        const spacingX = 36;
        const spacingY = 32;

        const pinPositions = [
            { x: cx, y: topY },
            { x: cx - spacingX * 0.5, y: topY + spacingY },
            { x: cx + spacingX * 0.5, y: topY + spacingY },
            { x: cx - spacingX, y: topY + spacingY * 2 },
            { x: cx, y: topY + spacingY * 2 },
            { x: cx + spacingX, y: topY + spacingY * 2 },
            { x: cx - spacingX * 1.5, y: topY + spacingY * 3 },
            { x: cx - spacingX * 0.5, y: topY + spacingY * 3 },
            { x: cx + spacingX * 0.5, y: topY + spacingY * 3 },
            { x: cx + spacingX * 1.5, y: topY + spacingY * 3 }
        ];

        pinPositions.forEach((pos, index) => {
            this.pins.push({
                id: index + 1,
                x: pos.x,
                y: pos.y,
                width: 22,
                height: 52,
                radius: 12,
                vx: 0,
                vy: 0,
                angle: 0,
                angularVelocity: 0,
                isKnocked: false,
                color: this.pinFlavors[index % this.pinFlavors.length]
            });
        });
        this.pinsStandingBeforeRoll = 10;
    }

    setupControls() {
        const throwBtn = document.getElementById('btn-bowling-throw');
        const resetBtn = document.getElementById('btn-bowling-reset');
        const aimSlider = document.getElementById('bowling-aim-slider');
        const spinBtns = document.querySelectorAll('.spin-btn');

        if (aimSlider) {
            aimSlider.addEventListener('input', (e) => {
                if (this.ball.isRolling) return;
                const val = parseFloat(e.target.value);
                const laneW = this.laneRight - this.laneLeft - 80;
                this.aimX = (this.width * 0.5) + (val / 100) * (laneW * 0.45);
                this.ball.x = this.aimX;
            });
        }

        spinBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                window.marjanAudio?.playClick();
                spinBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.spinChoice = parseFloat(btn.dataset.spin || '0');
            });
        });

        if (throwBtn) {
            throwBtn.addEventListener('click', () => {
                if (this.ball.isRolling || this.isGameOver) return;
                this.launchBall();
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                window.marjanAudio?.playClick();
                this.resetFullGame();
            });
        }
    }

    launchBall() {
        this.ball.isRolling = true;
        this.ball.inGutter = false;
        const targetX = this.width * 0.5 + (this.spinChoice * 25);
        const dx = targetX - this.ball.x;
        const dy = (this.laneTop + 50) - this.ball.y;
        const dist = Math.hypot(dx, dy);
        const speed = 11 + (this.power / 100) * 8.5;

        this.ball.vx = (dx / dist) * speed * 0.55;
        this.ball.vy = (dy / dist) * speed;
        this.ball.spin = this.spinChoice * 0.18;
        window.marjanAudio?.startRollSound();
    }

    update() {
        if (!this.ball.isRolling) {
            this.power += 0.8 * this.powerDirection;
            if (this.power >= 98) { this.power = 98; this.powerDirection = -1; }
            else if (this.power <= 35) { this.power = 35; this.powerDirection = 1; }
            const meterEl = document.getElementById('bowling-power-fill');
            if (meterEl) meterEl.style.width = `${this.power}%`;
        }

        if (this.celebrationTimer > 0) {
            this.celebrationTimer--;
            if (this.celebrationTimer === 0) this.celebrationText = '';
        }

        for (let i = this.confetti.length - 1; i >= 0; i--) {
            const c = this.confetti[i];
            c.x += c.vx; c.y += c.vy; c.vy += 0.3; c.opacity -= 0.018;
            if (c.opacity <= 0 || c.y > this.height) {
                this.confetti.splice(i, 1);
            }
        }

        if (this.ball.isRolling) {
            this.ball.vx += this.ball.spin * 0.22;
            this.ball.x += this.ball.vx;
            this.ball.y += this.ball.vy;
            this.ball.rotation += 0.2;

            if (this.ball.x <= this.laneLeft + 15 || this.ball.x >= this.laneRight - 15) {
                if (!this.ball.inGutter) {
                    this.ball.inGutter = true;
                    this.ball.vx = 0;
                    window.marjanAudio?.playGutterSound();
                }
            }

            this.pins.forEach(pin => {
                if (pin.isKnocked) return;
                const dx = this.ball.x - pin.x;
                const dy = this.ball.y - pin.y;
                if (Math.hypot(dx, dy) < this.ball.radius + pin.radius) {
                    pin.isKnocked = true;
                    const angle = Math.atan2(pin.y - this.ball.y, pin.x - this.ball.x);
                    const force = Math.hypot(this.ball.vx, this.ball.vy) * 0.75;
                    pin.vx = Math.cos(angle) * force;
                    pin.vy = Math.sin(angle) * force - 2;
                    pin.angularVelocity = (Math.random() - 0.5) * 0.45;
                    this.ball.vx *= 0.85;
                    this.ball.vy *= 0.88;
                    window.marjanAudio?.playPinHit(force / 10);
                }
            });

            if (this.ball.y < this.laneTop - 40) {
                window.marjanAudio?.stopRollSound();
                setTimeout(() => this.evaluateRoll(), 850);
                this.ball.isRolling = false;
            }
        }

        this.pins.forEach((pin, i) => {
            if (pin.isKnocked) {
                pin.x += pin.vx; pin.y += pin.vy; pin.angle += pin.angularVelocity;
                pin.vx *= 0.94; pin.vy *= 0.94; pin.angularVelocity *= 0.96;

                this.pins.forEach((otherPin, j) => {
                    if (i === j) return;
                    const dist = Math.hypot(pin.x - otherPin.x, pin.y - otherPin.y);
                    if (dist < pin.radius * 2.2 && !otherPin.isKnocked) {
                        otherPin.isKnocked = true;
                        const hitAngle = Math.atan2(otherPin.y - pin.y, otherPin.x - pin.x);
                        otherPin.vx = Math.cos(hitAngle) * 5;
                        otherPin.vy = Math.sin(hitAngle) * 5 - 1.5;
                        otherPin.angularVelocity = (Math.random() - 0.5) * 0.4;
                        window.marjanAudio?.playPinHit(0.5);
                    }
                });
            }
        });
    }

    evaluateRoll() {
        const knockedPinsCount = this.pins.filter(p => p.isKnocked).length;
        const pinsKnockedThisRoll = knockedPinsCount - (10 - this.pinsStandingBeforeRoll);
        const currentFrameData = this.frameScores[this.currentFrame - 1];

        if (this.currentRoll === 1) {
            currentFrameData.roll1 = pinsKnockedThisRoll;
            if (pinsKnockedThisRoll === 10) {
                currentFrameData.roll2 = 0;
                currentFrameData.total = 30;
                this.celebrationText = '💥 STRIKE! MARJAN BLAST!';
                this.celebrationTimer = 110;
                window.marjanAudio?.playStrikeFanfare();
                this.spawnConfetti();
                this.advanceFrame();
            } else {
                this.currentRoll = 2;
                this.pinsStandingBeforeRoll = 10 - knockedPinsCount;
                this.resetBall();
                this.pins = this.pins.filter(p => !p.isKnocked);
            }
        } else {
            currentFrameData.roll2 = pinsKnockedThisRoll;
            const frameTotal = (currentFrameData.roll1 || 0) + pinsKnockedThisRoll;
            if (frameTotal === 10) {
                currentFrameData.total = 20;
                this.celebrationText = '🎯 SPARE! MANTAP!';
                this.celebrationTimer = 100;
                window.marjanAudio?.playPerfectPour();
                this.spawnConfetti();
            } else {
                currentFrameData.total = frameTotal;
                this.celebrationText = frameTotal === 0 ? '💧 Gutter!' : `✨ ${frameTotal} Botol Tumbang!`;
                this.celebrationTimer = 80;
            }
            this.advanceFrame();
        }

        this.calculateTotalScore();
        this.updateScoreboardUI();
    }

    advanceFrame() {
        if (this.currentFrame < this.maxFrames) {
            this.currentFrame++;
            this.currentRoll = 1;
            this.resetBall();
            this.setupPins();
        } else {
            this.isGameOver = true;
            this.celebrationText = `🏆 SELESAI! Skor: ${this.totalScore}`;
            this.celebrationTimer = 250;
            window.marjanAudio?.playStrikeFanfare();
            this.spawnConfetti();
        }
    }

    resetBall() {
        this.ball.isRolling = false;
        this.ball.inGutter = false;
        this.ball.vx = 0; this.ball.vy = 0;
        this.ball.x = this.aimX;
        this.ball.y = this.laneBottom;
    }

    resetFullGame() {
        this.currentFrame = 1;
        this.currentRoll = 1;
        this.isGameOver = false;
        this.celebrationText = '';
        this.celebrationTimer = 0;
        this.totalScore = 0;
        this.frameScores = [
            { roll1: null, roll2: null, total: null },
            { roll1: null, roll2: null, total: null },
            { roll1: null, roll2: null, total: null },
            { roll1: null, roll2: null, total: null },
            { roll1: null, roll2: null, total: null }
        ];
        this.setupPins();
        this.resetBall();
        this.updateScoreboardUI();
    }

    calculateTotalScore() {
        let sum = 0;
        this.frameScores.forEach(f => { if (f.total !== null) sum += f.total; });
        this.totalScore = sum;
    }

    updateScoreboardUI() {
        const totalEl = document.getElementById('bowling-total-score');
        const frameEl = document.getElementById('bowling-current-frame');
        if (totalEl) totalEl.textContent = this.totalScore;
        if (frameEl) frameEl.textContent = `${this.currentFrame}/${this.maxFrames}`;

        this.frameScores.forEach((frame, idx) => {
            const r1El = document.getElementById(`f${idx+1}-r1`);
            const r2El = document.getElementById(`f${idx+1}-r2`);
            const totEl = document.getElementById(`f${idx+1}-tot`);
            if (r1El) r1El.textContent = frame.roll1 !== null ? (frame.roll1 === 10 ? 'X' : frame.roll1) : '-';
            if (r2El) {
                if (frame.roll1 === 10) r2El.textContent = '-';
                else if (frame.roll2 !== null) r2El.textContent = (frame.roll1 + frame.roll2 === 10) ? '/' : frame.roll2;
                else r2El.textContent = '-';
            }
            if (totEl) totEl.textContent = frame.total !== null ? frame.total : '-';
        });
    }

    spawnConfetti() {
        const colors = ['#ffd700', '#e11d48', '#10b981', '#ffffff', '#ec4899', '#38bdf8'];
        for (let i = 0; i < 45; i++) {
            this.confetti.push({
                x: this.width * 0.5 + (Math.random() - 0.5) * 160,
                y: this.laneTop + 80,
                vx: (Math.random() - 0.5) * 14,
                vy: -(Math.random() * 8 + 3),
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                opacity: 1
            });
        }
    }

    render() {
        if (!this.ctx || !this.width) return;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        // Lane
        ctx.fillStyle = '#0f050b';
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(this.laneLeft, this.laneTop);
        ctx.lineTo(this.laneRight, this.laneTop);
        ctx.lineTo(this.laneRight + 20, this.laneBottom + 40);
        ctx.lineTo(this.laneLeft - 20, this.laneBottom + 40);
        ctx.closePath();
        ctx.fillStyle = '#854d0e';
        ctx.fill();

        // Gutters
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(this.laneLeft - 30, this.laneTop, 30, this.laneBottom - this.laneTop + 40);
        ctx.fillRect(this.laneRight, this.laneTop, 30, this.laneBottom - this.laneTop + 40);

        // Foul Line
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.laneLeft - 18, this.laneBottom + 8);
        ctx.lineTo(this.laneRight + 18, this.laneBottom + 8);
        ctx.stroke();
        ctx.restore();

        // Pins (Marjan Bottles)
        this.pins.forEach(pin => {
            ctx.save();
            ctx.translate(pin.x, pin.y);
            ctx.rotate(pin.angle);
            ctx.fillStyle = pin.color;
            ctx.roundRect(-pin.width/2, -pin.height/2 + 16, pin.width, pin.height - 16, [0, 0, 4, 4]);
            ctx.fill();

            // Neck & Cap
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fillRect(-5, -pin.height/2 + 4, 10, 16);
            ctx.fillStyle = '#d4af37';
            ctx.fillRect(-6, -pin.height/2, 12, 6);

            // Label
            ctx.fillStyle = '#fffdf0';
            ctx.fillRect(-pin.width/2 + 2, -pin.height/2 + 22, pin.width - 4, 18);
            ctx.fillStyle = '#b91c1c';
            ctx.font = 'bold 6px serif';
            ctx.textAlign = 'center';
            ctx.fillText('MARJAN', 0, -pin.height/2 + 30);
            ctx.restore();
        });

        // Ball
        const b = this.ball;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.fillStyle = window.marjanTheme?.currentFlavor?.primaryColor || '#e11d48';
        ctx.beginPath();
        ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        // Celebration
        if (this.celebrationText) {
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            const bw = Math.min(360, this.width * 0.85);
            ctx.strokeRect(this.width * 0.5 - bw/2, this.height * 0.42 - 32, bw, 64);
            ctx.fillRect(this.width * 0.5 - bw/2, this.height * 0.42 - 32, bw, 64);
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 20px sans-serif';
            ctx.fillText(this.celebrationText, this.width * 0.5, this.height * 0.42);
            ctx.restore();
        }

        // Confetti
        this.confetti.forEach(c => {
            ctx.fillStyle = c.color;
            ctx.globalAlpha = c.opacity;
            ctx.fillRect(c.x, c.y, c.size, c.size);
        });
        ctx.globalAlpha = 1.0;
    }
}
window.marjanBowlingGame = new BowlingGame();

/* ==========================================================================
   5. Application Bootstrap
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    window.marjanTheme.init();
    window.marjanPourGame.init();
    window.marjanBowlingGame.init();

    const soundBtn = document.getElementById('btn-sound-toggle');
    const soundIcon = document.getElementById('sound-icon');
    if (soundBtn && soundIcon) {
        soundBtn.addEventListener('click', () => {
            const isMuted = window.marjanAudio.toggleMute();
            soundIcon.textContent = isMuted ? '🔇' : '🔊';
        });
    }

    // Catalog Rendering
    const container = document.getElementById('catalog-flavor-grid');
    if (container) {
        const emojis = { 'cocopandan':'🥥', 'melon':'🍈', 'pisang-susu':'🍌', 'ros':'🌹', 'lychee':'🍒', 'kopi-moka':'☕', 'lemon-squash':'🍋' };
        MARJAN_FLAVORS.forEach(flavor => {
            const card = document.createElement('div');
            card.className = 'flavor-card';
            card.innerHTML = `
                <div>
                    <div class="flavor-card-top">
                        <div class="flavor-badge-circle" style="background: ${flavor.primaryColor};">${emojis[flavor.id] || '✨'}</div>
                        <div class="flavor-card-info">
                            <h3>${flavor.name}</h3>
                            <span>${flavor.subname}</span>
                        </div>
                    </div>
                    <p class="flavor-card-desc">${flavor.description}</p>
                    <div class="recipe-callout">
                        <strong>Resep: ${flavor.recipe.title}</strong>
                        <p>${flavor.recipe.description}</p>
                    </div>
                </div>
                <button class="btn-card-apply">
                    <span style="color: ${flavor.primaryColor}">●</span> Terapkan Tema & Warna Ini
                </button>
            `;
            card.querySelector('.btn-card-apply').addEventListener('click', () => {
                window.marjanAudio?.playClick();
                window.marjanTheme.applyTheme(flavor);
                document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' });
            });
            container.appendChild(card);
        });
    }

    document.body.addEventListener('click', () => window.marjanAudio?.init(), { once: true });
});