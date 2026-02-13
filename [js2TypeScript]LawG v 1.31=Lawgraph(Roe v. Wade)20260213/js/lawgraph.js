/**
 * LawG v1.31 - Lawgraph Visualization Engine
 * Roe v. Wade (1973) → Dobbs v. Jackson Women's Health Organization (2022)
 * 
 * v1.31 Changes:
 * - Initial screen shows Stage 2 (Dobbs) final result statically
 * - Play button starts from Stage 1 (Roe) and runs through Stage 2 (Dobbs)
 * - Stage 2: X/Y graph positions swap (X=top/Pink/Plaintiff wins, Y=bottom/Blue/Defendant)
 * - Black arc arrow points upward toward X(Pink) winner
 * - Ground Truth on winning X(Pink) graph
 * 
 * Features:
 * - Crossing X/Y graphs with dynamic angles and lengths
 * - Two-stage continuous animation (1 click plays both)
 * - Color swap between stages (Blue/Pink → Pink/Blue)
 * - Position swap in Stage 2 (X goes up, Y goes down)
 * - Thick black arc with arrow pointing upward to winner
 * - Excel-style yellow balloon tooltips
 * - Null Hypothesis / Alternative Hypothesis axis labels
 * - Ground Truth marking on winning graph
 */

// ============================================================
// CONSTANTS
// ============================================================
const CONFIG = {
    STAGE1_DURATION: 28000,
    STAGE2_DURATION: 28000,
    TRANSITION_DURATION: 3000,

    COLORS: {
        BLUE: '#2563EB',
        BLUE_DARK: '#1D4ED8',
        PINK: '#DB2777',
        PINK_DARK: '#BE185D',
        GREEN: '#16A34A',
        GREEN_DARK: '#15803D',
        ARC_BLACK: '#111111',
        BATTLE_POINT: '#EF4444',
        GRID_LINE: '#e8e8e8',
        GRID_AXIS: '#9CA3AF',
        GROUND_TRUTH: '#16A34A',
        TOOLTIP_BG: '#FFFDE7',
        TOOLTIP_BORDER: '#FBC02D',
    },

    GRAPH: {
        LINE_WIDTH: 2.5,
        ARROW_SIZE: 14,
        ARROW_ANGLE: Math.PI / 6,
        SCALE_FACTOR: 22,
    },

    ARC: {
        LINE_WIDTH: 4.5,
        ARROW_SIZE: 14,
    },

    BALLOON: {
        MAJOR_WIDTH: 220,
        MAJOR_HEIGHT: 90,
        MINOR_WIDTH: 170,
        MINOR_HEIGHT: 70,
        RADIUS: 3,
        TAIL_SIZE: 8,
    },

    GRID: { SPACING: 50 },

    BATTLE_POINT: {
        RADIUS: 6,
        PULSE_AMPLITUDE: 3,
        PULSE_SPEED: 250,
    },
};

// ============================================================
// EASING HELPERS
// ============================================================
const Ease = {
    inOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    },
    lerp(a, b, t) {
        return a + (b - a) * t;
    },
    clamp01(t) {
        return Math.max(0, Math.min(1, t));
    }
};

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// ============================================================
// CASE DATA
// ============================================================
const CASE_DATA = {
    roeVWade: {
        title: 'Roe v. Wade (1973)',
        subtitle: 'Legal Battle Timeline Visualization',
        info: 'Supreme Court Decision: 7-2 Majority Opinion',
        url: 'https://www.oyez.org/cases/1971/70-18',
        majority: {
            justices: 7,
            label: 'Majority (7)',
            arguments: [
                '14th Amdt Due Process → privacy rights',
                "Woman's right to choose is constitutional",
                'Trimester framework balances rights & state interest',
                '1st tri: No regulation; 2nd: Health; 3rd: May prohibit',
            ],
            ground: '14th Amdt. Due Process / Privacy',
        },
        dissent: {
            justices: 2,
            label: 'Dissent (2)',
            arguments: [
                'No constitutional basis for abortion rights',
                '"Raw Judicial Power" — exceeded authority',
                'State legislatures should decide democratically',
            ],
            ground: 'Legislative authority / States rights',
        },
    },
    dobbsVJackson: {
        title: 'Dobbs v. Jackson (2022)',
        subtitle: 'Overruling Roe v. Wade',
        info: 'Supreme Court Decision: 6-3 — Roe Overruled',
        url: 'https://www.oyez.org/cases/2021/19-1392',
        majority: {
            justices: 6,
            label: 'Majority (6)',
            arguments: [
                'Constitution does not confer right to abortion',
                'Roe was "egregiously wrong from the start"',
                'Authority returned to people & elected representatives',
                'No basis in text, history, or structure of Constitution',
            ],
            ground: 'Constitutional textualism / Stare decisis reexamined',
        },
        dissent: {
            justices: 3,
            label: 'Dissent (3)',
            arguments: [
                'Overruling Roe undermines Court legitimacy',
                'Women lose fundamental constitutional protection',
                'Stare decisis abandoned without justification',
            ],
            ground: 'Precedent / Substantive due process',
        },
    },
};

// ============================================================
// ANIMATION PHASES
// ============================================================
// Stage 1: Roe v. Wade — X(Blue/Plaintiff) at bottom-right, Y(Pink/Defendant) at top-left
const STAGE1_PHASES = [
    { time: 0,     xStr: 3, yStr: 3, xAng: 25,  yAng: -20,  desc: 'Case Filed: Texas abortion law challenged' },
    { time: 5000,  xStr: 5, yStr: 4, xAng: 32,  yAng: -28,  desc: 'Initial Arguments: Privacy vs. State Authority' },
    { time: 10000, xStr: 7, yStr: 5, xAng: 40,  yAng: -35,  desc: '14th Amendment Debate: Due Process scope' },
    { time: 16000, xStr: 8, yStr: 5, xAng: 48,  yAng: -32,  desc: 'Trimester Framework Proposed' },
    { time: 21000, xStr: 6, yStr: 6, xAng: 42,  yAng: -38,  desc: 'Dissent Objects: Judicial overreach claimed' },
    { time: 26000, xStr: 10,yStr: 4, xAng: 55,  yAng: -25,  desc: 'DECISION: Majority prevails 7-2 — X(Blue) WINS' },
];

// Stage 2: Dobbs — Positions SWAPPED: X(Pink) goes UP (positive Y angle), Y(Blue) goes DOWN (negative angle)
// X = Pink = Plaintiff (Dobbs majority) — WINS — arrow points UP
// Y = Blue = Defendant (Dobbs dissent)
const STAGE2_PHASES = [
    { time: 0,     xStr: 3, yStr: 3, xAng: -22, yAng: 22,   desc: 'New Case: Mississippi 15-week ban challenged' },
    { time: 5000,  xStr: 5, yStr: 5, xAng: -30, yAng: 30,   desc: 'Stare Decisis Debate: Should Roe be overturned?' },
    { time: 10000, xStr: 7, yStr: 6, xAng: -42, yAng: 35,   desc: 'Constitutional Textualism: No explicit right found' },
    { time: 16000, xStr: 8, yStr: 5, xAng: -48, yAng: 30,   desc: '"Roe was egregiously wrong from the start"' },
    { time: 21000, xStr: 6, yStr: 6, xAng: -38, yAng: 38,   desc: 'Fierce Dissent: Legitimacy of Court questioned' },
    { time: 26000, xStr: 10,yStr: 4, xAng: -55, yAng: 22,   desc: 'DECISION: Roe OVERRULED 6-3 — X(Pink) WINS' },
];

// ============================================================
// MAIN VISUALIZATION CLASS
// ============================================================
class LawGraphVisualization {
    constructor() {
        this.canvas = document.getElementById('battleCanvas');
        if (!this.canvas) throw new Error('Canvas not found');
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) throw new Error('Could not get 2D context');

        this.dim = { w: 0, h: 0, cx: 0, cy: 0, originX: 0, originY: 0 };

        // state.stage meanings:
        // 'preview' = initial static preview of Stage2 (Dobbs) final result
        // 1 = Stage 1 animating (Roe v. Wade)
        // 2 = Transition (color/position swap)
        // 3 = Stage 2 animating (Dobbs v. Jackson)
        // 'done' = animation complete
        this.state = {
            stage: 'preview',
            isPlaying: false,
            currentTime: 0,
            lastTimestamp: 0,
            animFrameId: null,
        };

        // Default for preview: Stage 2 final state (Dobbs) — X=Pink(up) wins, Y=Blue(down)
        this.xGraph = { strength: 10, angle: -55, color: CONFIG.COLORS.PINK, label: 'X' };
        this.yGraph = { strength: 4, angle: 22, color: CONFIG.COLORS.BLUE, label: 'Y' };

        this.currentCase = CASE_DATA.dobbsVJackson;
        this.currentPhases = STAGE2_PHASES;
        this.winnerSide = 'x';       // X(Pink) wins in preview (Dobbs)
        this.showGroundTruth = true;  // Show ground truth in preview
        this.balloons = [];
        this.xGraphEnd = null;
        this.yGraphEnd = null;

        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.setupControls();
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.onClick(e));

        // Set UI for preview (Dobbs final)
        this.setStageUI('preview');
        // Build balloons for preview
        this.updateBalloonsForPreview();
        this.draw();
        console.log('✅ LawG v1.31 Visualization initialized (Preview: Dobbs v. Jackson final)');
    }

    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.dim.w = rect.width;
        this.dim.h = rect.height;
        this.dim.originX = rect.width * 0.38;
        this.dim.originY = rect.height * 0.50;
        this.dim.cx = rect.width / 2;
        this.dim.cy = rect.height / 2;
        if (!this.state.isPlaying) {
            if (this.state.stage === 'preview') this.updateBalloonsForPreview();
            this.draw();
        }
    }

    setupControls() {
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const resetBtn = document.getElementById('resetBtn');
        const closeBtn = document.getElementById('closeModalBtn');

        if (playBtn) playBtn.addEventListener('click', () => this.play());
        if (pauseBtn) pauseBtn.addEventListener('click', () => this.pause());
        if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());

        const modal = document.getElementById('detailModal');
        if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) this.closeModal(); });
    }

    // ======================== PREVIEW STATE ========================
    updateBalloonsForPreview() {
        // Show all balloons as if Stage 2 (Dobbs) animation completed
        // X=Pink(up) wins 6-3, Y=Blue(down)
        this.balloons = [];
        const cd = CASE_DATA.dobbsVJackson;
        const ox = this.dim.originX, oy = this.dim.originY;

        // Majority balloons (X=Pink, goes UP in Stage 2)
        this.balloons.push({
            x: ox - 80, y: oy - 140,
            type: 'majority', title: cd.majority.label,
            lines: cd.majority.arguments.slice(0, 2), isMajority: true,
        });
        this.balloons.push({
            x: ox - 160, y: oy - 40,
            type: 'majority', title: 'Key Argument',
            lines: cd.majority.arguments.slice(2, 4), isMajority: true,
        });

        // Dissent balloons (Y=Blue, goes DOWN in Stage 2)
        this.balloons.push({
            x: ox + 200, y: oy + 120,
            type: 'dissent', title: cd.dissent.label,
            lines: cd.dissent.arguments.slice(0, 2), isMajority: false,
        });
        this.balloons.push({
            x: ox + 120, y: oy + 200,
            type: 'dissent', title: 'Rebuttal',
            lines: cd.dissent.arguments.slice(2, 3), isMajority: false,
        });
    }

    // ======================== PLAYBACK ========================
    play() {
        if (this.state.isPlaying) return;

        // If preview or done, start from Stage 1
        if (this.state.stage === 'preview' || this.state.stage === 'done' || this.state.stage === 0) {
            this.state.stage = 1;
            this.state.currentTime = 0;
            this.winnerSide = null;
            this.showGroundTruth = false;
            this.balloons = [];
            this.xGraphEnd = null;
            this.yGraphEnd = null;

            // Stage 1: X=Blue(bottom-right), Y=Pink(top-left)
            this.currentCase = CASE_DATA.roeVWade;
            this.currentPhases = STAGE1_PHASES;
            this.xGraph = { strength: 3, angle: 25, color: CONFIG.COLORS.BLUE, label: 'X' };
            this.yGraph = { strength: 3, angle: -20, color: CONFIG.COLORS.PINK, label: 'Y' };
            this.setStageUI(1);
        }

        this.state.isPlaying = true;
        this.state.lastTimestamp = performance.now();
        this.updateButtons(true);
        this.animate();
    }

    pause() {
        this.state.isPlaying = false;
        this.updateButtons(false);
        if (this.state.animFrameId) {
            cancelAnimationFrame(this.state.animFrameId);
            this.state.animFrameId = null;
        }
    }

    reset() {
        this.pause();
        // Go back to preview state (Dobbs final)
        this.state.stage = 'preview';
        this.state.currentTime = 0;
        this.winnerSide = 'x';
        this.showGroundTruth = true;
        this.xGraphEnd = null;
        this.yGraphEnd = null;
        this.currentCase = CASE_DATA.dobbsVJackson;
        this.currentPhases = STAGE2_PHASES;
        // Stage 2 final: X=Pink(up), Y=Blue(down)
        this.xGraph = { strength: 10, angle: -55, color: CONFIG.COLORS.PINK, label: 'X' };
        this.yGraph = { strength: 4, angle: 22, color: CONFIG.COLORS.BLUE, label: 'Y' };
        this.setStageUI('preview');
        this.updateButtons(false);
        const playBtn = document.getElementById('playBtn');
        if (playBtn) playBtn.disabled = false;
        this.updateBalloonsForPreview();
        this.draw();
    }

    updateButtons(playing) {
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        if (playBtn) playBtn.disabled = playing;
        if (pauseBtn) pauseBtn.disabled = !playing;
    }

    setStageUI(stage) {
        const titleEl = document.getElementById('caseTitle');
        const subEl = document.getElementById('caseSubtitle');
        const infoEl = document.getElementById('caseInfo');
        const dot1 = document.getElementById('stage1Dot');
        const dot2 = document.getElementById('stage2Dot');

        if (stage === 1) {
            // Roe display
            if (titleEl) titleEl.textContent = '⚖️ Roe v. Wade (1973)';
            if (subEl) subEl.textContent = 'Legal Battle Timeline Visualization';
            if (infoEl) infoEl.textContent = 'Supreme Court Decision: 7-2 Majority Opinion';
            if (dot1) dot1.classList.add('active');
            if (dot2) dot2.classList.remove('active');
        } else {
            // Dobbs display (preview, stage 2, 3, done)
            if (titleEl) titleEl.textContent = '⚖️ Dobbs v. Jackson (2022)';
            if (subEl) subEl.textContent = 'Overruling Roe v. Wade';
            if (infoEl) infoEl.textContent = 'Supreme Court Decision: 6-3 — Roe Overruled';
            if (dot1) dot1.classList.remove('active');
            if (dot2) dot2.classList.add('active');
        }
    }

    // ======================== ANIMATION LOOP ========================
    animate(timestamp) {
        if (!this.state.isPlaying) return;
        if (!timestamp) timestamp = performance.now();

        const dt = timestamp - this.state.lastTimestamp;
        this.state.lastTimestamp = timestamp;
        this.state.currentTime += dt;

        if (this.state.stage === 1) {
            // ---- STAGE 1: Roe v. Wade ----
            this.currentCase = CASE_DATA.roeVWade;
            this.currentPhases = STAGE1_PHASES;
            this.xGraph.color = CONFIG.COLORS.BLUE;
            this.yGraph.color = CONFIG.COLORS.PINK;

            if (this.state.currentTime >= CONFIG.STAGE1_DURATION) {
                // Stage 1 complete — snap to final
                this.state.currentTime = CONFIG.STAGE1_DURATION;
                this.winnerSide = 'x';
                this.showGroundTruth = true;
                this.interpolatePhases(STAGE1_PHASES, CONFIG.STAGE1_DURATION);

                // Move to transition
                this.state.stage = 2;
                this.state.currentTime = 0;
            } else {
                this.interpolatePhases(STAGE1_PHASES, this.state.currentTime);
                const prog = this.state.currentTime / CONFIG.STAGE1_DURATION;
                this.winnerSide = prog > 0.85 ? 'x' : null;
                this.showGroundTruth = prog > 0.9;
            }
        } else if (this.state.stage === 2) {
            // ---- TRANSITION: Color swap + Position swap ----
            const t = Ease.clamp01(this.state.currentTime / CONFIG.TRANSITION_DURATION);
            const et = Ease.inOutCubic(t);

            // Color transition: X Blue→Pink, Y Pink→Blue
            this.xGraph.color = this.lerpColor(CONFIG.COLORS.BLUE, CONFIG.COLORS.PINK, et);
            this.yGraph.color = this.lerpColor(CONFIG.COLORS.PINK, CONFIG.COLORS.BLUE, et);

            // Position transition: angles swap
            // Stage 1 final: xAng=55 (bottom-right), yAng=-25 (top-left)
            // Stage 2 start: xAng=-22 (top-left), yAng=22 (bottom-right)
            this.xGraph.strength = Ease.lerp(10, 3, et);
            this.xGraph.angle = Ease.lerp(55, -22, et);
            this.yGraph.strength = Ease.lerp(4, 3, et);
            this.yGraph.angle = Ease.lerp(-25, 22, et);

            // Fade out winner/ground truth during transition
            this.winnerSide = et < 0.5 ? 'x' : null;
            this.showGroundTruth = et < 0.3;

            if (this.state.currentTime >= CONFIG.TRANSITION_DURATION) {
                // Transition complete → start Stage 2
                this.state.stage = 3;
                this.state.currentTime = 0;
                this.winnerSide = null;
                this.showGroundTruth = false;
                this.balloons = [];

                // Stage 2: X=Pink(UP), Y=Blue(DOWN) — positions swapped
                this.xGraph.color = CONFIG.COLORS.PINK;
                this.yGraph.color = CONFIG.COLORS.BLUE;
                this.currentCase = CASE_DATA.dobbsVJackson;
                this.currentPhases = STAGE2_PHASES;
                this.xGraph.strength = STAGE2_PHASES[0].xStr;
                this.xGraph.angle = STAGE2_PHASES[0].xAng;
                this.yGraph.strength = STAGE2_PHASES[0].yStr;
                this.yGraph.angle = STAGE2_PHASES[0].yAng;
                this.setStageUI(3);
            }
        } else if (this.state.stage === 3) {
            // ---- STAGE 2: Dobbs v. Jackson ----
            this.currentCase = CASE_DATA.dobbsVJackson;
            this.currentPhases = STAGE2_PHASES;
            this.xGraph.color = CONFIG.COLORS.PINK;
            this.yGraph.color = CONFIG.COLORS.BLUE;

            if (this.state.currentTime >= CONFIG.STAGE2_DURATION) {
                // Stage 2 complete
                this.state.currentTime = CONFIG.STAGE2_DURATION;
                this.interpolatePhases(STAGE2_PHASES, CONFIG.STAGE2_DURATION);
                // X(Pink) wins — Dobbs majority overrules Roe
                this.winnerSide = 'x';
                this.showGroundTruth = true;
                this.state.stage = 'done';
                this.pause();
                const playBtn = document.getElementById('playBtn');
                if (playBtn) playBtn.disabled = true;
            } else {
                this.interpolatePhases(STAGE2_PHASES, this.state.currentTime);
                const prog = this.state.currentTime / CONFIG.STAGE2_DURATION;
                this.winnerSide = prog > 0.85 ? 'x' : null;
                this.showGroundTruth = prog > 0.9;
            }
        }

        this.updateBalloons();
        this.draw();

        if (this.state.isPlaying) {
            this.state.animFrameId = requestAnimationFrame((t) => this.animate(t));
        }
    }

    interpolatePhases(phases, time) {
        let cur = phases[0], nxt = phases[1] || phases[0];
        for (let i = 0; i < phases.length - 1; i++) {
            if (time >= phases[i].time && time < phases[i + 1].time) {
                cur = phases[i]; nxt = phases[i + 1]; break;
            }
        }
        if (time >= phases[phases.length - 1].time) { cur = nxt = phases[phases.length - 1]; }

        const dur = nxt.time - cur.time;
        const t = dur > 0 ? Ease.clamp01((time - cur.time) / dur) : 1;
        const e = Ease.inOutCubic(t);

        this.xGraph.strength = Ease.lerp(cur.xStr, nxt.xStr, e);
        this.xGraph.angle = Ease.lerp(cur.xAng, nxt.xAng, e);
        this.yGraph.strength = Ease.lerp(cur.yStr, nxt.yStr, e);
        this.yGraph.angle = Ease.lerp(cur.yAng, nxt.yAng, e);
    }

    // ======================== DRAWING ========================
    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.dim.w, this.dim.h);
        this.drawGrid();
        this.drawAxes();
        this.drawCrossingGraphs();
        this.drawArc();
        this.drawBalloons();
        this.drawLegend();
        this.drawProgressBar();
        this.drawPhaseDescription();
        if (this.showGroundTruth) this.drawGroundTruth();
        if (this.state.stage === 'preview') this.drawPreviewBadge();
    }

    drawPreviewBadge() {
        const ctx = this.ctx;
        const text = '▶ Press Play to animate: Stage 1 (Roe) → Stage 2 (Dobbs)';
        const bw = 380, bh = 32;
        const bx = (this.dim.w - bw) / 2, by = this.dim.h - 55;

        ctx.fillStyle = 'rgba(37, 99, 235, 0.9)';
        this.roundRect(ctx, bx, by, bw, bh, 16);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = '600 13px Inter, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(text, this.dim.w / 2, by + 21);
    }

    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = CONFIG.COLORS.GRID_LINE;
        ctx.lineWidth = 0.5;
        for (let x = 0; x < this.dim.w; x += CONFIG.GRID.SPACING) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.dim.h); ctx.stroke();
        }
        for (let y = 0; y < this.dim.h; y += CONFIG.GRID.SPACING) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.dim.w, y); ctx.stroke();
        }
    }

    drawAxes() {
        const ctx = this.ctx;
        const ox = this.dim.originX, oy = this.dim.originY;

        // Dashed axes
        ctx.strokeStyle = CONFIG.COLORS.GRID_AXIS;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([6, 4]);
        // Vertical
        ctx.beginPath(); ctx.moveTo(ox, 25); ctx.lineTo(ox, this.dim.h - 25); ctx.stroke();
        // Horizontal
        ctx.beginPath(); ctx.moveTo(25, oy); ctx.lineTo(this.dim.w - 25, oy); ctx.stroke();
        ctx.setLineDash([]);

        // Axis arrows
        this.drawAxisArrow(ctx, ox, 25, 'up');
        this.drawAxisArrow(ctx, this.dim.w - 25, oy, 'right');

        // Determine which graph is on top (Y-axis direction) vs bottom (X-axis direction)
        const isStage2 = (this.state.stage === 3 || this.state.stage === 'preview' || this.state.stage === 'done');

        // Y-axis top label
        if (isStage2) {
            // Stage 2: X(Pink) is at top
            ctx.fillStyle = this.xGraph.color;
            ctx.font = 'bold 13px Inter, Arial';
            ctx.textAlign = 'left';
            ctx.fillText('X (Π = Plaintiff)', ox + 10, 20);
        } else {
            // Stage 1: Y(Pink) is at top
            ctx.fillStyle = this.yGraph.color;
            ctx.font = 'bold 13px Inter, Arial';
            ctx.textAlign = 'left';
            ctx.fillText('Y (Δ = Defendant)', ox + 10, 20);
        }

        // Null Hypothesis label on vertical axis
        ctx.save();
        ctx.fillStyle = '#777';
        ctx.font = 'italic 11px Inter, Arial';
        ctx.translate(ox - 20, this.dim.h * 0.28);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText('Null Hypothesis (H₀)', 0, 0);
        ctx.restore();

        // X-axis right label
        if (isStage2) {
            // Stage 2: Y(Blue) is at right
            ctx.fillStyle = this.yGraph.color;
            ctx.font = 'bold 13px Inter, Arial';
            ctx.textAlign = 'right';
            ctx.fillText('Y (Δ = Defendant)', this.dim.w - 30, oy - 10);
        } else {
            // Stage 1: X(Blue) is at right
            ctx.fillStyle = this.xGraph.color;
            ctx.font = 'bold 13px Inter, Arial';
            ctx.textAlign = 'right';
            ctx.fillText('X (Π = Plaintiff)', this.dim.w - 30, oy - 10);
        }

        // Alternative Hypothesis label on horizontal axis
        ctx.fillStyle = '#777';
        ctx.font = 'italic 11px Inter, Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Alternative Hypothesis (H₁)', this.dim.w * 0.7, oy + 22);

        // "ratio" labels
        ctx.fillStyle = '#aaa';
        ctx.font = '10px Inter, Arial';
        ctx.textAlign = 'right';
        ctx.fillText('ratio', ox - 6, oy - 10);

        // Origin point
        ctx.fillStyle = CONFIG.COLORS.BATTLE_POINT;
        ctx.beginPath();
        ctx.arc(ox, oy, CONFIG.BATTLE_POINT.RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Pulse
        const pulse = CONFIG.BATTLE_POINT.RADIUS +
            Math.sin(Date.now() / CONFIG.BATTLE_POINT.PULSE_SPEED) * CONFIG.BATTLE_POINT.PULSE_AMPLITUDE;
        ctx.strokeStyle = 'rgba(239,68,68,0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ox, oy, pulse, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawAxisArrow(ctx, x, y, dir) {
        ctx.fillStyle = CONFIG.COLORS.GRID_AXIS;
        ctx.beginPath();
        const s = 7;
        if (dir === 'up') {
            ctx.moveTo(x, y); ctx.lineTo(x - s, y + s * 1.5); ctx.lineTo(x + s, y + s * 1.5);
        } else {
            ctx.moveTo(x, y); ctx.lineTo(x - s * 1.5, y - s); ctx.lineTo(x - s * 1.5, y + s);
        }
        ctx.closePath();
        ctx.fill();
    }

    // ---- Crossing Graphs ----
    drawCrossingGraphs() {
        const ctx = this.ctx;
        const ox = this.dim.originX, oy = this.dim.originY;

        const xAngRad = (this.xGraph.angle * Math.PI) / 180;
        const yAngRad = (this.yGraph.angle * Math.PI) / 180;

        // Compute lengths (scaled by justices)
        const xJust = this.getJustices('x');
        const yJust = this.getJustices('y');
        const xLen = this.xGraph.strength * CONFIG.GRAPH.SCALE_FACTOR * (xJust / 4.5);
        const yLen = this.yGraph.strength * CONFIG.GRAPH.SCALE_FACTOR * (yJust / 4.5);

        // X graph extends in both directions through origin (crossing pattern)
        const xSx = ox - Math.cos(xAngRad) * xLen * 0.45;
        const xSy = oy - Math.sin(xAngRad) * xLen * 0.45;
        const xEx = ox + Math.cos(xAngRad) * xLen;
        const xEy = oy + Math.sin(xAngRad) * xLen;

        // Y graph extends in both directions through origin
        const ySx = ox - Math.cos(yAngRad) * yLen * 0.4;
        const ySy = oy - Math.sin(yAngRad) * yLen * 0.4;
        const yEx = ox + Math.cos(yAngRad) * yLen;
        const yEy = oy + Math.sin(yAngRad) * yLen;

        this.xGraphEnd = { x: xEx, y: xEy, sx: xSx, sy: xSy };
        this.yGraphEnd = { x: yEx, y: yEy, sx: ySx, sy: ySy };

        // Draw X graph
        ctx.strokeStyle = this.xGraph.color;
        ctx.lineWidth = CONFIG.GRAPH.LINE_WIDTH;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(xSx, xSy);
        ctx.lineTo(xEx, xEy);
        ctx.stroke();
        this.drawArrowHead(ctx, xEx, xEy, xAngRad, this.xGraph.color);

        // Draw Y graph
        ctx.strokeStyle = this.yGraph.color;
        ctx.lineWidth = CONFIG.GRAPH.LINE_WIDTH;
        ctx.beginPath();
        ctx.moveTo(ySx, ySy);
        ctx.lineTo(yEx, yEy);
        ctx.stroke();
        this.drawArrowHead(ctx, yEx, yEy, yAngRad, this.yGraph.color);

        // Endpoint labels
        ctx.font = 'bold 14px Inter, Arial';
        ctx.textAlign = 'left';

        const xLx = xEx + Math.cos(xAngRad) * 16;
        const xLy = xEy + Math.sin(xAngRad) * 16;
        ctx.fillStyle = this.xGraph.color;
        ctx.fillText('X (Π)', xLx, xLy);
        ctx.font = '10px Inter, Arial';
        ctx.fillText(`${xJust} Justices | str: ${this.xGraph.strength.toFixed(1)}`, xLx, xLy + 14);

        const yLx = yEx + Math.cos(yAngRad) * 16;
        const yLy = yEy + Math.sin(yAngRad) * 16;
        ctx.fillStyle = this.yGraph.color;
        ctx.font = 'bold 14px Inter, Arial';
        ctx.fillText('Y (Δ)', yLx, yLy);
        ctx.font = '10px Inter, Arial';
        ctx.fillText(`${yJust} Justices | str: ${this.yGraph.strength.toFixed(1)}`, yLx, yLy + 14);

        // Start-side tiny labels
        ctx.globalAlpha = 0.4;
        ctx.font = '9px Inter, Arial';
        ctx.textAlign = 'right';
        ctx.fillStyle = this.xGraph.color;
        ctx.fillText('X₀', xSx - 4, xSy - 2);
        ctx.fillStyle = this.yGraph.color;
        ctx.fillText('Y₀', ySx - 4, ySy - 2);
        ctx.globalAlpha = 1;
    }

    getJustices(side) {
        const isStage2 = (this.state.stage === 3 || this.state.stage === 'preview' || this.state.stage === 'done');
        if (!isStage2) {
            // Stage 1 / transition: Roe data
            return side === 'x' ? CASE_DATA.roeVWade.majority.justices : CASE_DATA.roeVWade.dissent.justices;
        }
        // Stage 2: Dobbs data — X is majority, Y is dissent
        return side === 'x' ? CASE_DATA.dobbsVJackson.majority.justices : CASE_DATA.dobbsVJackson.dissent.justices;
    }

    drawArrowHead(ctx, x, y, angle, color) {
        const s = CONFIG.GRAPH.ARROW_SIZE;
        const a = CONFIG.GRAPH.ARROW_ANGLE;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - s * Math.cos(angle - a), y - s * Math.sin(angle - a));
        ctx.lineTo(x - s * Math.cos(angle + a), y - s * Math.sin(angle + a));
        ctx.closePath();
        ctx.fill();
    }

    // ---- Black Arc with Arrow (pointing to winner = X, upward in Stage 2) ----
    drawArc() {
        if (!this.winnerSide || !this.xGraphEnd || !this.yGraphEnd) return;
        const ctx = this.ctx;
        const ox = this.dim.originX, oy = this.dim.originY;
        const xAngRad = (this.xGraph.angle * Math.PI) / 180;
        const yAngRad = (this.yGraph.angle * Math.PI) / 180;
        const arcRadius = 60;

        // Arc goes FROM loser TO winner
        // Winner is always 'x' in our logic
        let startAng = yAngRad;  // Start from Y (loser)
        let endAng = xAngRad;    // End at X (winner)

        // Determine sweep direction — we want the arc to go the shorter way
        let diff = endAng - startAng;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        const ccw = diff < 0;

        // Draw thick black arc
        ctx.strokeStyle = CONFIG.COLORS.ARC_BLACK;
        ctx.lineWidth = CONFIG.ARC.LINE_WIDTH;
        ctx.beginPath();
        ctx.arc(ox, oy, arcRadius, startAng, endAng, ccw);
        ctx.stroke();

        // Arrowhead at endpoint (tangent direction) pointing toward winner
        const arrowX = ox + Math.cos(endAng) * arcRadius;
        const arrowY = oy + Math.sin(endAng) * arcRadius;
        const tangent = endAng + (ccw ? -Math.PI / 2 : Math.PI / 2);

        ctx.fillStyle = CONFIG.COLORS.ARC_BLACK;
        const as = CONFIG.ARC.ARROW_SIZE;
        const aa = Math.PI / 5;
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX - as * Math.cos(tangent - aa), arrowY - as * Math.sin(tangent - aa));
        ctx.lineTo(arrowX - as * Math.cos(tangent + aa), arrowY - as * Math.sin(tangent + aa));
        ctx.closePath();
        ctx.fill();

        // "Winner" label on arc
        const midAng = startAng + diff / 2;
        const lr = arcRadius + 22;
        ctx.fillStyle = CONFIG.COLORS.ARC_BLACK;
        ctx.font = 'bold 12px Inter, Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⬅ WIN', ox + Math.cos(midAng) * lr, oy + Math.sin(midAng) * lr);
    }

    // ---- Ground Truth Marker ----
    drawGroundTruth() {
        if (!this.xGraphEnd || !this.yGraphEnd) return;
        const ctx = this.ctx;
        const end = this.winnerSide === 'x' ? this.xGraphEnd : this.yGraphEnd;
        const gx = end.x, gy = end.y;

        const bw = 135, bh = 24;
        const bx = gx - bw / 2, by = gy - 48;

        ctx.fillStyle = CONFIG.COLORS.GROUND_TRUTH;
        this.roundRect(ctx, bx, by, bw, bh, 12);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px Inter, Arial';
        ctx.textAlign = 'center';
        ctx.fillText('✓ Ground Truth', gx, by + 16);

        ctx.strokeStyle = CONFIG.COLORS.GROUND_TRUTH;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(gx, by + bh);
        ctx.lineTo(gx, gy - 12);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // ---- Yellow Balloon Tooltips ----
    updateBalloons() {
        this.balloons = [];
        if (this.state.stage === 'preview') { this.updateBalloonsForPreview(); return; }
        if (this.state.stage === 0 || this.state.stage === 2) return;

        const duration = this.state.stage === 1 ? CONFIG.STAGE1_DURATION : CONFIG.STAGE2_DURATION;
        const progress = Ease.clamp01(this.state.currentTime / duration);
        const cd = this.currentCase;
        const ox = this.dim.originX, oy = this.dim.originY;

        const isStage2 = (this.state.stage === 3 || this.state.stage === 'done');

        if (isStage2) {
            // Stage 2: X(Pink) goes UP, Y(Blue) goes DOWN
            // Majority balloons near X (upper area)
            if (progress > 0.12) {
                this.balloons.push({
                    x: ox - 80, y: oy - 140,
                    type: 'majority', title: cd.majority.label,
                    lines: cd.majority.arguments.slice(0, 2), isMajority: true,
                });
            }
            if (progress > 0.5) {
                this.balloons.push({
                    x: ox - 160, y: oy - 40,
                    type: 'majority', title: 'Key Argument',
                    lines: cd.majority.arguments.slice(2, 4), isMajority: true,
                });
            }
            // Dissent balloons near Y (lower area)
            if (progress > 0.18) {
                this.balloons.push({
                    x: ox + 200, y: oy + 120,
                    type: 'dissent', title: cd.dissent.label,
                    lines: cd.dissent.arguments.slice(0, 2), isMajority: false,
                });
            }
            if (progress > 0.65) {
                this.balloons.push({
                    x: ox + 120, y: oy + 200,
                    type: 'dissent', title: 'Rebuttal',
                    lines: cd.dissent.arguments.slice(2, 3), isMajority: false,
                });
            }
        } else {
            // Stage 1: X(Blue) at bottom-right, Y(Pink) at top-left
            if (progress > 0.12) {
                this.balloons.push({
                    x: ox + 190, y: oy - 120,
                    type: 'majority', title: cd.majority.label,
                    lines: cd.majority.arguments.slice(0, 2), isMajority: true,
                });
            }
            if (progress > 0.5) {
                this.balloons.push({
                    x: ox + 260, y: oy - 30,
                    type: 'majority', title: 'Key Argument',
                    lines: cd.majority.arguments.slice(2, 4), isMajority: true,
                });
            }
            if (progress > 0.18) {
                this.balloons.push({
                    x: ox - 20, y: oy + 140,
                    type: 'dissent', title: cd.dissent.label,
                    lines: cd.dissent.arguments.slice(0, 2), isMajority: false,
                });
            }
            if (progress > 0.65) {
                this.balloons.push({
                    x: ox + 80, y: oy + 210,
                    type: 'dissent', title: 'Rebuttal',
                    lines: cd.dissent.arguments.slice(2, 3), isMajority: false,
                });
            }
        }
    }

    drawBalloons() {
        const ctx = this.ctx;
        this.balloons.forEach(b => {
            const isMaj = b.isMajority;
            const w = isMaj ? CONFIG.BALLOON.MAJOR_WIDTH : CONFIG.BALLOON.MINOR_WIDTH;
            const lineH = 15;
            const pad = 10;
            const titleH = 20;
            const h = titleH + b.lines.length * lineH + pad * 2;
            const bx = b.x - w / 2, by = b.y - h;
            const ts = CONFIG.BALLOON.TAIL_SIZE;

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.08)';
            this.roundRect(ctx, bx + 2, by + 2, w, h, CONFIG.BALLOON.RADIUS);
            ctx.fill();

            // Background
            ctx.fillStyle = CONFIG.COLORS.TOOLTIP_BG;
            ctx.strokeStyle = CONFIG.COLORS.TOOLTIP_BORDER;
            ctx.lineWidth = 1;
            this.roundRect(ctx, bx, by, w, h, CONFIG.BALLOON.RADIUS);
            ctx.fill();
            ctx.stroke();

            // Tail
            ctx.fillStyle = CONFIG.COLORS.TOOLTIP_BG;
            ctx.strokeStyle = CONFIG.COLORS.TOOLTIP_BORDER;
            ctx.beginPath();
            ctx.moveTo(b.x, b.y);
            ctx.lineTo(b.x - ts, by + h);
            ctx.lineTo(b.x + ts, by + h);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            // Cover overlap
            ctx.fillStyle = CONFIG.COLORS.TOOLTIP_BG;
            ctx.fillRect(b.x - ts + 1, by + h - 1, ts * 2 - 2, 2);

            // Colored left bar
            const barColor = isMaj ? this.xGraph.color : this.yGraph.color;
            ctx.fillStyle = barColor;
            ctx.fillRect(bx + 3, by + 4, 3, titleH - 2);

            // Title
            ctx.fillStyle = '#222';
            ctx.font = `bold ${isMaj ? 12 : 11}px Inter, Arial`;
            ctx.textAlign = 'left';
            ctx.fillText(b.title, bx + 11, by + 16);

            // Separator
            ctx.strokeStyle = '#FDD835';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(bx + 5, by + titleH + 2);
            ctx.lineTo(bx + w - 5, by + titleH + 2);
            ctx.stroke();

            // Lines
            ctx.fillStyle = '#555';
            ctx.font = `${isMaj ? 11 : 10}px Inter, Arial`;
            b.lines.forEach((line, i) => {
                let txt = line;
                while (ctx.measureText(txt).width > w - 16 && txt.length > 5) {
                    txt = txt.slice(0, -4) + '…';
                }
                ctx.fillText(txt, bx + 9, by + titleH + pad + i * lineH + 6);
            });

            b.bounds = { x: bx, y: by, w, h: h + ts };
        });
    }

    // ---- Legend ----
    drawLegend() {
        const ctx = this.ctx;
        const lx = 14, ly = 14, lw = 260, lh = 108;

        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        this.roundRect(ctx, lx, ly, lw, lh, 8);
        ctx.fill();
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        this.roundRect(ctx, lx, ly, lw, lh, 8);
        ctx.stroke();

        ctx.fillStyle = '#222';
        ctx.font = 'bold 13px Inter, Arial';
        ctx.textAlign = 'left';

        const isStage2 = (this.state.stage === 3 || this.state.stage === 'preview' || this.state.stage === 'done');
        const label = isStage2 ? 'Stage 2: Dobbs v. Jackson' : 'Stage 1: Roe v. Wade';
        ctx.fillText(label, lx + 10, ly + 20);

        ctx.font = '10px Inter, Arial';
        ctx.fillStyle = '#888';
        ctx.fillText(this.currentCase.title, lx + 10, ly + 34);

        // X line
        ctx.strokeStyle = this.xGraph.color;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(lx + 10, ly + 52); ctx.lineTo(lx + 32, ly + 52); ctx.stroke();
        ctx.fillStyle = '#333';
        ctx.font = '11px Inter, Arial';
        const showWin = this.winnerSide === 'x' && (this.state.stage === 'preview' || this.state.stage === 'done' || this.state.stage === 3);
        const xLabel = showWin
            ? `X (Plaintiff) — ${this.currentCase.majority.label} ✓WIN`
            : `X (Plaintiff) — ${this.currentCase.majority.label}`;
        ctx.fillText(xLabel, lx + 38, ly + 56);

        // Y line
        ctx.strokeStyle = this.yGraph.color;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(lx + 10, ly + 72); ctx.lineTo(lx + 32, ly + 72); ctx.stroke();
        ctx.fillStyle = '#333';
        ctx.font = '11px Inter, Arial';
        ctx.fillText(`Y (Defendant) — ${this.currentCase.dissent.label}`, lx + 38, ly + 76);

        ctx.fillStyle = '#aaa';
        ctx.font = 'italic 9px Inter, Arial';
        ctx.fillText('Source: Oyez.org | LawG v1.31', lx + 10, ly + 98);
    }

    // ---- Progress Bar ----
    drawProgressBar() {
        const ctx = this.ctx;
        const barW = 260, barH = 6;
        const barX = this.dim.w - barW - 18, barY = this.dim.h - 28;

        const total = CONFIG.STAGE1_DURATION + CONFIG.TRANSITION_DURATION + CONFIG.STAGE2_DURATION;
        let elapsed = 0;

        if (this.state.stage === 'preview') {
            elapsed = total; // Full bar in preview (Dobbs final)
        } else if (this.state.stage === 'done') {
            elapsed = total;
        } else if (this.state.stage === 1) {
            elapsed = this.state.currentTime;
        } else if (this.state.stage === 2) {
            elapsed = CONFIG.STAGE1_DURATION + this.state.currentTime;
        } else if (this.state.stage === 3) {
            elapsed = CONFIG.STAGE1_DURATION + CONFIG.TRANSITION_DURATION + this.state.currentTime;
        }
        const prog = Math.min(1, elapsed / total);

        ctx.fillStyle = 'rgba(200,200,200,0.5)';
        this.roundRect(ctx, barX, barY, barW, barH, 3); ctx.fill();

        if (prog > 0) {
            const s1r = CONFIG.STAGE1_DURATION / total;
            const tr = CONFIG.TRANSITION_DURATION / total;
            const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
            grad.addColorStop(0, CONFIG.COLORS.BLUE);
            grad.addColorStop(s1r, CONFIG.COLORS.BLUE);
            grad.addColorStop(s1r + tr / 2, '#8B5CF6');
            grad.addColorStop(s1r + tr, CONFIG.COLORS.PINK);
            grad.addColorStop(1, CONFIG.COLORS.PINK);
            ctx.fillStyle = grad;
            this.roundRect(ctx, barX, barY, barW * prog, barH, 3); ctx.fill();
        }

        ctx.strokeStyle = '#ccc'; ctx.lineWidth = 0.5;
        this.roundRect(ctx, barX, barY, barW, barH, 3); ctx.stroke();

        ctx.fillStyle = '#777';
        ctx.font = '10px Inter, Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`${Math.floor(elapsed / 1000)}s / ${Math.floor(total / 1000)}s`, barX + barW, barY - 4);

        ctx.font = '8px Inter, Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#aaa';
        const s1w = barW * (CONFIG.STAGE1_DURATION / total);
        const tw = barW * (CONFIG.TRANSITION_DURATION / total);
        ctx.fillText('Roe', barX + s1w / 2, barY + barH + 12);
        ctx.fillText('Dobbs', barX + s1w + tw + (barW - s1w - tw) / 2, barY + barH + 12);
    }

    // ---- Phase Description ----
    drawPhaseDescription() {
        if (this.state.stage === 'preview' || this.state.stage === 'done' || this.state.stage === 0 || this.state.stage === 2) return;
        const ctx = this.ctx;
        const phases = this.currentPhases;
        const time = this.state.currentTime;

        let cur = phases[0];
        for (let i = phases.length - 1; i >= 0; i--) {
            if (time >= phases[i].time) { cur = phases[i]; break; }
        }

        const bw = Math.min(400, this.dim.w - 40);
        const bh = 46;
        const bx = (this.dim.w - bw) / 2;
        const by = this.dim.h - 80;

        ctx.fillStyle = 'rgba(15,23,42,0.85)';
        this.roundRect(ctx, bx, by, bw, bh, 10); ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = '600 12px Inter, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(cur.desc, this.dim.w / 2, by + 20);

        const idx = phases.indexOf(cur) + 1;
        ctx.font = '10px Inter, Arial';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText(`Phase ${idx} of ${phases.length}`, this.dim.w / 2, by + 36);
    }

    // ---- Utilities ----
    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    lerpColor(c1, c2, t) {
        const h = s => parseInt(s, 16);
        const r1 = h(c1.slice(1, 3)), g1 = h(c1.slice(3, 5)), b1 = h(c1.slice(5, 7));
        const r2 = h(c2.slice(1, 3)), g2 = h(c2.slice(3, 5)), b2 = h(c2.slice(5, 7));
        const r = Math.round(Ease.lerp(r1, r2, t));
        const g = Math.round(Ease.lerp(g1, g2, t));
        const b = Math.round(Ease.lerp(b1, b2, t));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    // ======================== INTERACTION ========================
    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        let hovered = null;
        for (const b of this.balloons) {
            if (b.bounds && mx >= b.bounds.x && mx <= b.bounds.x + b.bounds.w &&
                my >= b.bounds.y && my <= b.bounds.y + b.bounds.h) {
                hovered = b; break;
            }
        }
        const tip = document.getElementById('tooltip');
        if (tip && hovered) {
            const side = hovered.isMajority ? this.currentCase.majority : this.currentCase.dissent;
            tip.innerHTML = `
                <strong>${escapeHtml(hovered.title)}</strong>
                <div class="tooltip-line"></div>
                ${hovered.lines.map(l => `<div>• ${escapeHtml(l)}</div>`).join('')}
                <div class="tooltip-line"></div>
                <div style="font-size:10px;color:#999;">Ground: ${escapeHtml(side.ground)}</div>
                <div style="font-size:10px;color:#bbb;margin-top:3px;">Click for details</div>`;
            tip.style.display = 'block';
            tip.style.left = Math.min(mx + 12, this.dim.w - 280) + 'px';
            tip.style.top = (my + 12) + 'px';
            this.canvas.style.cursor = 'pointer';
        } else if (tip) {
            tip.style.display = 'none';
            this.canvas.style.cursor = 'default';
        }
    }

    onClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        for (const b of this.balloons) {
            if (b.bounds && mx >= b.bounds.x && mx <= b.bounds.x + b.bounds.w &&
                my >= b.bounds.y && my <= b.bounds.y + b.bounds.h) {
                this.showModal(b); break;
            }
        }
    }

    showModal(balloon) {
        const modal = document.getElementById('detailModal');
        const tEl = document.getElementById('modalTitle');
        const cEl = document.getElementById('modalContent');
        if (!modal || !tEl || !cEl) return;

        const cd = this.currentCase;
        const side = balloon.isMajority ? cd.majority : cd.dissent;
        tEl.textContent = `${balloon.title} — ${cd.title}`;

        let html = `<p><strong>${escapeHtml(side.label)}</strong></p>`;
        html += `<p style="font-size:0.9em;color:#666;">Ground: ${escapeHtml(side.ground)}</p><ul>`;
        side.arguments.forEach(a => { html += `<li>${escapeHtml(a)}</li>`; });
        html += `</ul><p style="margin-top:14px;font-size:0.85em;"><a href="${escapeHtml(cd.url)}" target="_blank" rel="noopener">View on Oyez.org →</a></p>`;
        cEl.innerHTML = html;
        modal.style.display = 'flex';
    }

    closeModal() {
        const modal = document.getElementById('detailModal');
        if (modal) modal.style.display = 'none';
    }
}

// ============================================================
// INIT
// ============================================================
function initApp() {
    window.lawgraph = new LawGraphVisualization();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

export default LawGraphVisualization;
