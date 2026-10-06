import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Sparkles,
  Film,
  ArrowRight
} from 'lucide-react';

export default function ClubAnimationStudio({
  onClose,
  autoPlay = true,
  isIntro = false,
  seamless = false,
  theme = 'light',
  onComplete
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioCtxRef = useRef(null);
  const recorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Playback state (14 seconds: 4 scenes + 2s smooth ending picture transition)
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(14);
  const [soundEnabled, setSoundEnabled] = useState(!seamless);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('remastered'); // 'remastered' | 'original'
  const [loaded, setLoaded] = useState(false);

  // Asset image refs
  const sticLogoImg = useRef(null);
  const sritLogoImg = useRef(null);

  // Playback timer ref
  const lastTimestampRef = useRef(null);
  const currentTimeRef = useRef(0);
  const isPlayingRef = useRef(autoPlay);
  const completedRef = useRef(false);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Load official logo images
  useEffect(() => {
    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount >= 2) {
        setLoaded(true);
      }
    };

    const img1 = new Image();
    img1.crossOrigin = 'anonymous';
    img1.src = '/stic_logo.png?v=2';
    img1.onload = checkLoaded;
    img1.onerror = () => {
      console.warn('Could not load /stic_logo.png');
      checkLoaded();
    };
    sticLogoImg.current = img1;

    const img2 = new Image();
    img2.crossOrigin = 'anonymous';
    img2.src = '/srit_official_logo.png?v=2';
    img2.onload = checkLoaded;
    img2.onerror = () => {
      img2.src = '/srit_circle_wing_ref.png?v=2';
      img2.onload = checkLoaded;
      img2.onerror = checkLoaded;
    };
    sritLogoImg.current = img2;
  }, []);

  // Web Audio Chime Generator
  const playSoundAtTime = useCallback((t) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const playChord = (freqs, gainVal = 0.12, decay = 1.8) => {
        const now = ctx.currentTime;
        freqs.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(gainVal, now + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + decay);
        });
      };

      if (Math.abs(t - 0.1) < 0.05) {
        playChord([261.63, 329.63, 392.00, 493.88], 0.14, 2.2);
      } else if (Math.abs(t - 3.0) < 0.05) {
        playChord([349.23, 440.00, 523.25, 659.25], 0.14, 2.0);
      } else if (Math.abs(t - 6.0) < 0.05) {
        playChord([392.00, 493.88, 587.33, 739.99], 0.14, 2.0);
      } else if (Math.abs(t - 9.0) < 0.05) {
        playChord([523.25, 659.25, 783.99, 987.77, 1046.50], 0.16, 2.8);
      }
    } catch {
      // Ignore autoplay restrictions
    }
  }, [soundEnabled]);

  // Easing helpers
  const easeOutCubic = useCallback((x) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3), []);
  const easeInOutCubic = useCallback((x) => {
    const v = Math.max(0, Math.min(1, x));
    return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2;
  }, []);

  // Draw image preserving aspect ratio inside a sleek elevated card
  const drawEmblemCard = useCallback((ctx, img, cx, cy, boxSize, borderColor = 'rgba(16, 185, 129, 0.35)', shadowColor = 'rgba(16, 185, 129, 0.15)', isRound = false) => {
    ctx.save();

    const half = boxSize / 2;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 10;

    ctx.beginPath();
    if (isRound) {
      ctx.arc(cx, cy, half, 0, Math.PI * 2);
    } else {
      ctx.roundRect(cx - half, cy - half, boxSize, boxSize, 28);
    }
    ctx.fill();
    ctx.stroke();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    if (img && img.complete && img.naturalWidth > 0) {
      const pad = isRound ? boxSize * 0.05 : boxSize * 0.08;
      const availW = boxSize - pad * 2;
      const availH = boxSize - pad * 2;
      const imgW = img.naturalWidth;
      const imgH = img.naturalHeight;
      const scale = Math.min(availW / imgW, availH / imgH);
      const drawW = imgW * scale;
      const drawH = imgH * scale;
      ctx.drawImage(img, cx - drawW / 2, cy - drawH / 2, drawW, drawH);
    }

    ctx.restore();
  }, []);

  // Draw two-tone line (bold + colored text) mathematically centered so words never overlap
  const drawTwoToneCentered = useCallback((ctx, part1, part2, centerX, y, font1, font2, color1, color2) => {
    ctx.save();
    ctx.textBaseline = 'middle';
    ctx.font = font1;
    const w1 = ctx.measureText(part1).width;
    ctx.font = font2;
    const w2 = ctx.measureText(part2).width;
    const totalW = w1 + w2;
    const startX = centerX - totalW / 2;

    ctx.textAlign = 'left';
    ctx.font = font1;
    ctx.fillStyle = color1;
    ctx.fillText(part1, startX, y);

    ctx.font = font2;
    ctx.fillStyle = color2;
    ctx.fillText(part2, startX + w1, y);
    ctx.restore();
  }, []);

  // Main 4K UHD (3840x2160) Render Loop (12s total: 0-3s, 3-6s, 6-9s, 9-12s)
  const drawFrame = useCallback((ctx, rawWidth, rawHeight, t) => {
    ctx.clearRect(0, 0, rawWidth, rawHeight);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const width = 1920;
    const height = 1080;
    ctx.scale(rawWidth / width, rawHeight / height);

    const isDark = seamless && theme === 'dark';
    const textPrimary = isDark ? '#f8fafc' : '#0f172a';
    const textSecondary = isDark ? '#cbd5e1' : '#475569';
    const cardBg = isDark ? 'rgba(15, 23, 42, 0.82)' : 'rgba(255, 255, 255, 0.96)';
    const cardBorder = isDark ? 'rgba(51, 65, 85, 0.85)' : 'rgba(226, 232, 240, 0.95)';
    const greenText = isDark ? '#34d399' : '#059669';
    const orangeText = isDark ? '#fb923c' : '#ea580c';
    const blueText = isDark ? '#38bdf8' : '#0284c7';

    if (!seamless) {
      // 1. Crisp White & Platinum Academic Background (only in non-seamless Studio/Archive mode)
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#ffffff');
      bgGrad.addColorStop(0.5, '#f8fafc');
      bgGrad.addColorStop(1, '#f1f5f9');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Subtle Architectural Grid
      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();

      // 3. Soft Ambient Glow Orbs
      ctx.save();
      const greenGlow = ctx.createRadialGradient(
        width * 0.24 + Math.sin(t * 0.7) * 50,
        height * 0.32 + Math.cos(t * 0.5) * 35,
        10,
        width * 0.24,
        height * 0.32,
        width * 0.42
      );
      greenGlow.addColorStop(0, 'rgba(16, 185, 129, 0.08)');
      greenGlow.addColorStop(0.5, 'rgba(16, 185, 129, 0.025)');
      greenGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = greenGlow;
      ctx.fillRect(0, 0, width, height);

      const orangeGlow = ctx.createRadialGradient(
        width * 0.76 + Math.cos(t * 0.6) * 50,
        height * 0.64 + Math.sin(t * 0.5) * 35,
        10,
        width * 0.76,
        height * 0.64,
        width * 0.42
      );
      orangeGlow.addColorStop(0, 'rgba(234, 88, 12, 0.08)');
      orangeGlow.addColorStop(0.5, 'rgba(234, 88, 12, 0.025)');
      orangeGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = orangeGlow;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // 4. Top Institutional Header Ribbon
      ctx.save();
      const ribbonAlpha = Math.min(1, t / 0.5);
      ctx.globalAlpha = ribbonAlpha;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
      ctx.fillRect(0, 0, width, 76);

      ctx.fillStyle = '#0f172a';
      ctx.font = '800 15px Inter, Segoe UI, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('SRINIVASA RAMANUJAN INSTITUTE OF TECHNOLOGY (SRIT)', 80, 46);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#059669';
      ctx.font = '800 15px Inter, Segoe UI, sans-serif';
      ctx.fillText('DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING', width - 80, 46);

      ctx.strokeStyle = 'rgba(203, 213, 225, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(80, 74);
      ctx.lineTo(width - 80, 74);
      ctx.stroke();

      const progW = ((width - 160) * Math.min(1, t / duration));
      const barGrad = ctx.createLinearGradient(80, 0, width - 80, 0);
      barGrad.addColorStop(0, '#10b981');
      barGrad.addColorStop(0.5, '#0284c7');
      barGrad.addColorStop(1, '#ea580c');
      ctx.fillStyle = barGrad;
      ctx.fillRect(80, 72, progW, 3);
      ctx.restore();
    }

    const centerX = width / 2;
    const centerY = height / 2;

    if (seamless) {
      // Scale the 1520x756 content bounding box up by 1.24x so it fills ~98% of the 1920x1080 4K canvas
      ctx.translate(centerX, centerY);
      ctx.scale(1.24, 1.24);
      ctx.translate(-960, -470);
    }

    // =============================================================
    // SCENE 1: [0.0s - 3.0s] CSE - STIC OFFICIAL EMBLEM & WELCOME
    // =============================================================
    if (t < 3.0) {
      const progress = Math.min(1, t / 0.9);
      const ease = easeOutCubic(progress);

      const emblemY = centerY - 125;

      // Rotating decorative orbital rings with generous breathing room
      ctx.save();
      ctx.translate(centerX, emblemY);
      ctx.beginPath();
      ctx.arc(0, 0, 182 * (0.85 + 0.15 * ease), 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.28)';
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 16]);
      ctx.rotate(t * 0.25);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, 208 * (0.85 + 0.15 * ease), 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(234, 88, 12, 0.22)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([6, 20]);
      ctx.rotate(-t * 0.35);
      ctx.stroke();
      ctx.restore();

      // Draw STIC Emblem
      ctx.save();
      ctx.globalAlpha = ease;
      const logoSize = 285 * (0.84 + 0.16 * ease);
      drawEmblemCard(
        ctx,
        sticLogoImg.current,
        centerX,
        emblemY,
        logoSize,
        'rgba(16, 185, 129, 0.42)',
        'rgba(15, 23, 42, 0.12)',
        true
      );
      ctx.restore();

      // Well-spaced, Executive Typography Below Emblem
      if (t > 0.25) {
        const textEase = easeOutCubic((t - 0.25) / 0.7);
        const slideY = (1 - textEase) * 24;
        ctx.save();
        ctx.globalAlpha = textEase;
        ctx.textAlign = 'center';

        ctx.font = '800 36px Outfit, Segoe UI, sans-serif';
        ctx.fillStyle = textPrimary;
        ctx.fillText(
          'CSE - SUSTAINABLE TECHNOLOGY & INNOVATION CLUB',
          centerX,
          centerY + 115 + slideY
        );

        const pillW = 600;
        const pillH = 44;
        const pillX = centerX - pillW / 2;
        const pillY = centerY + 158 + slideY;
        ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, 999);
        ctx.fill();
        ctx.stroke();

        ctx.font = '800 16px Inter, Segoe UI, sans-serif';
        ctx.fillStyle = greenText;
        ctx.fillText(
          'OFFICIAL STUDENT CHAPTER   •   INNOVATE   •   SUSTAIN   •   IMPACT',
          centerX,
          pillY + 28
        );

        ctx.font = '500 23px Inter, Segoe UI, sans-serif';
        ctx.fillStyle = textSecondary;
        ctx.fillText(
          'Empowering Computer Science students to build technology-driven solutions for a sustainable future.',
          centerX,
          centerY + 258 + slideY
        );
        ctx.restore();
      }
    }
    // =============================================================
    // SCENE 2: [3.0s - 6.0s] CSE-STIC & SRIT INSTITUTIONAL SYNERGY
    // =============================================================
    else if (t < 6.0) {
      const sceneT = t - 3.0;
      const ease = easeInOutCubic(sceneT / 0.85);

      // Generous 860px separation between emblem centers so the bridge is airy and uncrowded
      const targetOffset = 430;
      const sticX = centerX - targetOffset * ease;
      const sritX = centerX + targetOffset * ease;
      const emblemY = centerY - 115;

      // Connecting Synergy Bridge
      if (sceneT > 0.25) {
        const connAlpha = easeOutCubic((sceneT - 0.25) / 0.5);
        ctx.save();
        ctx.globalAlpha = connAlpha;

        const lineStart = sticX + 155;
        const lineEnd = sritX - 155;
        const lineGrad = ctx.createLinearGradient(lineStart, emblemY, lineEnd, emblemY);
        lineGrad.addColorStop(0, '#10b981');
        lineGrad.addColorStop(0.5, '#0284c7');
        lineGrad.addColorStop(1, '#ea580c');
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(lineStart, emblemY);
        ctx.lineTo(lineEnd, emblemY);
        ctx.stroke();

        const pulsePos = (sceneT * 0.7) % 1;
        const pulseX = lineStart + (lineEnd - lineStart) * pulsePos;
        ctx.beginPath();
        ctx.arc(pulseX, emblemY, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#ea580c';
        ctx.fill();

        const badgeW = 290;
        const badgeH = 42;
        ctx.fillStyle = cardBg;
        ctx.strokeStyle = cardBorder;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.roundRect(centerX - badgeW / 2, emblemY - badgeH / 2, badgeW, badgeH, 999);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.font = '800 13.5px Inter, Segoe UI, sans-serif';
        ctx.fillStyle = textPrimary;
        ctx.textAlign = 'center';
        ctx.fillText('UNDER THE MANAGEMENT', centerX, emblemY + 5);
        ctx.restore();
      }

      // Left Emblem: CSE - STIC
      ctx.save();
      drawEmblemCard(
        ctx,
        sticLogoImg.current,
        sticX,
        emblemY,
        265,
        'rgba(16, 185, 129, 0.42)',
        'rgba(16, 185, 129, 0.14)',
        true
      );
      ctx.textAlign = 'center';
      ctx.font = '800 25px Outfit, Segoe UI, sans-serif';
      ctx.fillStyle = textPrimary;
      ctx.fillText('CSE – STIC', sticX, emblemY + 182);
      ctx.font = '600 16.5px Inter, Segoe UI, sans-serif';
      ctx.fillStyle = greenText;
      ctx.fillText('Sustainable Technology & Innovation Club', sticX, emblemY + 214);
      ctx.restore();

      // Right Emblem: Official SRIT Logo
      ctx.save();
      ctx.globalAlpha = Math.min(1, sceneT / 0.65);
      drawEmblemCard(
        ctx,
        sritLogoImg.current,
        sritX,
        emblemY,
        265,
        'rgba(234, 88, 12, 0.42)',
        'rgba(234, 88, 12, 0.14)',
        false
      );
      ctx.textAlign = 'center';
      ctx.font = '800 25px Outfit, Segoe UI, sans-serif';
      ctx.fillStyle = textPrimary;
      ctx.fillText('SRIT INSTITUTION', sritX, emblemY + 182);
      ctx.font = '600 16.5px Inter, Segoe UI, sans-serif';
      ctx.fillStyle = orangeText;
      ctx.fillText('Srinivasa Ramanujan Institute of Technology', sritX, emblemY + 214);
      ctx.restore();

      // Spacious Bottom Statement & Motto
      if (sceneT > 0.35) {
        const cardEase = easeOutCubic((sceneT - 0.35) / 0.6);
        const cardW = 1380;
        const cardH = 104;
        const cardX = centerX - cardW / 2;
        const cardY = centerY + 180 + (1 - cardEase) * 24;

        ctx.save();
        ctx.globalAlpha = cardEase;

        if (!seamless) {
          ctx.fillStyle = cardBg;
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
          ctx.lineWidth = 2;
          ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
          ctx.shadowBlur = 24;
          ctx.shadowOffsetY = 8;
          ctx.beginPath();
          ctx.roundRect(cardX, cardY, cardW, cardH, 20);
          ctx.fill();
          ctx.stroke();
          ctx.shadowBlur = 0;

          ctx.fillStyle = '#10b981';
          ctx.fillRect(cardX, cardY + 18, 6, cardH - 36);
          ctx.fillStyle = '#ea580c';
          ctx.fillRect(cardX + cardW - 6, cardY + 18, 6, cardH - 36);
        }

        ctx.textAlign = 'center';
        ctx.font = '700 25.5px Outfit, Segoe UI, sans-serif';
        ctx.fillStyle = textPrimary;
        ctx.fillText(
          'STIC is an initiative driven by passion, from the Department of CSE, under the management of SRIT.',
          centerX,
          seamless ? cardY + 25 : cardY + 60
        );

        if (seamless) {
          ctx.font = '500 21px Inter, Segoe UI, sans-serif';
          ctx.fillStyle = textSecondary;
          ctx.fillText('to', centerX, cardY + 75);

          ctx.font = '800 27px Outfit, Segoe UI, sans-serif';
          ctx.fillStyle = textPrimary;
          ctx.fillText(
            'INNOVATE with Purpose.     SUSTAIN with Vision.     IMPACT the Future.',
            centerX,
            cardY + 128
          );
        }
        ctx.restore();
      }
    }
    // =============================================================
    // SCENE 3: [6.0s - 9.0s] CLUB VISION & CORE OBJECTIVES CHARTER
    // =============================================================
    else if (t < 9.0) {
      const sceneT = t - 6.0;
      const ease = easeOutCubic(sceneT / 0.65);

      // Dual Emblems with generous spacing at top
      const topY = 148;
      ctx.save();
      ctx.globalAlpha = ease;
      drawEmblemCard(ctx, sticLogoImg.current, centerX - 115, topY, 112, 'rgba(16, 185, 129, 0.38)', 'rgba(15,23,42,0.08)', true);
      drawEmblemCard(ctx, sritLogoImg.current, centerX + 115, topY, 112, 'rgba(234, 88, 12, 0.38)', 'rgba(15,23,42,0.08)', false);
      ctx.restore();

      const vCardW = 1520;
      const vCardH = 195;
      const vCardX = centerX - vCardW / 2;
      const vCardY = 236 + (1 - ease) * 22;

      ctx.save();
      ctx.globalAlpha = ease;
      ctx.fillStyle = cardBg;
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(15, 23, 42, 0.07)';
      ctx.shadowBlur = 28;
      ctx.shadowOffsetY = 10;
      ctx.beginPath();
      ctx.roundRect(vCardX, vCardY, vCardW, vCardH, 24);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.roundRect(centerX - 135, vCardY + 22, 270, 36, 999);
      ctx.fill();
      ctx.textAlign = 'center';
      ctx.font = '800 14.5px Inter, Segoe UI, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('OFFICIAL CLUB VISION', centerX, vCardY + 45);

      ctx.font = '700 24px Outfit, Segoe UI, sans-serif';
      ctx.fillStyle = textPrimary;
      ctx.fillText(
        '“To empower Computer Science students to design and develop innovative, technology-driven solutions',
        centerX,
        vCardY + 106
      );
      ctx.fillText(
        'that contribute to real-world problem solving and align with the UN Sustainable Development Goals (SDGs).”',
        centerX,
        vCardY + 148
      );
      ctx.restore();

      const objectives = [
        {
          lines: ['Promote socially responsible computing for community benefit.'],
          color: blueText,
          bg: 'rgba(2, 132, 199, 0.12)'
        },
        {
          lines: ['Encourage innovation, research, and student entrepreneurship.'],
          color: isDark ? '#c084fc' : '#7c3aed',
          bg: 'rgba(124, 58, 237, 0.12)'
        },
        {
          lines: [
            'Apply AI, Data Analytics, IoT, and Software Engineering',
            'to societal challenges.'
          ],
          color: orangeText,
          bg: 'rgba(234, 88, 12, 0.12)'
        },
        {
          lines: ['Align student projects with global sustainability goals.'],
          color: greenText,
          bg: 'rgba(5, 150, 105, 0.12)'
        }
      ];

      // Generous 48px horizontal gap and 34px vertical gap between Objective cards
      const colGap = 44;
      const rowGap = 32;
      const gridStartX = centerX - vCardW / 2;
      const gridStartY = 478;
      const colW = (vCardW - colGap) / 2;
      const rowH = 136;

      objectives.forEach((obj, idx) => {
        const delay = 0.2 + idx * 0.14;
        const itemProg = easeOutCubic((sceneT - delay) / 0.5);
        if (itemProg <= 0) return;

        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const ox = gridStartX + col * (colW + colGap);
        const oy = gridStartY + row * (rowH + rowGap) + (1 - itemProg) * 18;

        ctx.save();
        ctx.globalAlpha = itemProg;
        ctx.fillStyle = cardBg;
        ctx.strokeStyle = cardBorder;
        ctx.lineWidth = 1.8;
        ctx.shadowColor = 'rgba(15, 23, 42, 0.06)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 8;
        ctx.beginPath();
        ctx.roundRect(ox, oy, colW, rowH, 20);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = obj.color;
        ctx.beginPath();
        ctx.roundRect(ox + 18, oy + 24, 6, rowH - 48, 4);
        ctx.fill();

        ctx.fillStyle = obj.bg;
        ctx.beginPath();
        ctx.arc(ox + 54, oy + rowH / 2, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = obj.color;
        ctx.beginPath();
        ctx.arc(ox + 54, oy + rowH / 2, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.textAlign = 'left';
        ctx.font = '800 13px Inter, Segoe UI, sans-serif';
        ctx.fillStyle = obj.color;
        ctx.fillText(`CLUB OBJECTIVE 0${idx + 1}`, ox + 88, oy + 38);

        ctx.font = '700 19.5px Outfit, Segoe UI, sans-serif';
        ctx.fillStyle = textPrimary;
        if (obj.lines.length === 1) {
          ctx.fillText(obj.lines[0], ox + 88, oy + 82);
        } else {
          ctx.fillText(obj.lines[0], ox + 88, oy + 74);
          ctx.fillText(obj.lines[1], ox + 88, oy + 106);
        }
        ctx.restore();
      });
    }
    // =============================================================
    // SCENE 4: [9.0s - 12.0s] GRAND FINALE & SIGNATURE BRAND MOTTO
    // =============================================================
    else if (t < 12.0) {
      const sceneT = t - 9.0;
      const ease = easeOutCubic(sceneT / 0.65);
      // Smooth transition fade-out & subtle zoom between 11.25s and 12.0s
      const exitProg = t > 11.25 ? easeInOutCubic((t - 11.25) / 0.75) : 0;
      const sceneAlpha = Math.max(0, 1 - exitProg);
      const exitScale = 1 + exitProg * 0.045;

      ctx.save();
      ctx.globalAlpha = sceneAlpha;
      ctx.translate(centerX, centerY);
      ctx.scale(exitScale, exitScale);
      ctx.translate(-centerX, -centerY);

      ctx.save();
      const numParticles = 24;
      for (let i = 0; i < numParticles; i++) {
        const pAngle = (i / numParticles) * Math.PI * 2 + t * 0.22;
        const pDist = 390 + Math.sin(t * 2 + i) * 90;
        const px = centerX + Math.cos(pAngle) * pDist;
        const py = centerY + Math.sin(pAngle) * (pDist * 0.45);
        ctx.beginPath();
        ctx.arc(px, py, i % 3 === 0 ? 4 : 2.8, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(234, 88, 12, 0.3)';
        ctx.fill();
      }
      ctx.restore();

      // Generous 380px center-to-center spacing between the two top emblems
      const topY = 215;
      ctx.save();
      ctx.globalAlpha = ease * sceneAlpha;
      drawEmblemCard(
        ctx,
        sticLogoImg.current,
        centerX - 190,
        topY,
        200,
        'rgba(16, 185, 129, 0.42)',
        'rgba(16, 185, 129, 0.14)',
        true
      );
      drawEmblemCard(
        ctx,
        sritLogoImg.current,
        centerX + 190,
        topY,
        200,
        'rgba(234, 88, 12, 0.42)',
        'rgba(234, 88, 12, 0.14)',
        false
      );
      ctx.restore();

      if (sceneT > 0.1) {
        const sentEase = easeOutCubic((sceneT - 0.1) / 0.5);
        ctx.save();
        ctx.globalAlpha = sentEase * sceneAlpha;
        ctx.textAlign = 'center';
        ctx.font = '700 25.5px Outfit, Segoe UI, sans-serif';
        ctx.fillStyle = textPrimary;
        ctx.fillText(
          'STIC is an initiative driven by passion, from the Department of CSE, under the management of SRIT.',
          centerX,
          405
        );
        ctx.font = '500 20px Inter, Segoe UI, sans-serif';
        ctx.fillStyle = textSecondary;
        ctx.fillText('to', centerX, 446);
        ctx.restore();
      }

      const mottos = [
        {
          bold: 'INNOVATE  ',
          rest: 'with Purpose.',
          color: orangeText,
          border: 'rgba(234, 88, 12, 0.38)',
          delay: 0.25,
          y: 540
        },
        {
          bold: 'SUSTAIN  ',
          rest: 'with Vision.',
          color: greenText,
          border: 'rgba(16, 185, 129, 0.38)',
          delay: 0.55,
          y: 662
        },
        {
          bold: 'IMPACT  ',
          rest: 'the Future.',
          color: blueText,
          border: 'rgba(2, 132, 199, 0.38)',
          delay: 0.85,
          y: 784
        }
      ];

      mottos.forEach((m) => {
        const p = easeOutCubic((sceneT - m.delay) / 0.45);
        if (p <= 0) return;

        const boxW = 720;
        const boxH = 84;
        const by = m.y + (1 - p) * 20;

        ctx.save();
        ctx.globalAlpha = p * sceneAlpha;
        ctx.fillStyle = cardBg;
        ctx.strokeStyle = m.border;
        ctx.lineWidth = 1.8;
        ctx.shadowColor = 'rgba(15, 23, 42, 0.06)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 6;
        ctx.beginPath();
        ctx.roundRect(centerX - boxW / 2, by - boxH / 2, boxW, boxH, 20);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = m.color;
        ctx.beginPath();
        ctx.roundRect(centerX - boxW / 2 + 16, by - 20, 6, 40, 4);
        ctx.fill();

        drawTwoToneCentered(
          ctx,
          m.bold,
          m.rest,
          centerX,
          by + 2,
          '800 35px Outfit, Segoe UI, sans-serif',
          '700 33px Inter, Segoe UI, sans-serif',
          textPrimary,
          m.color
        );
        ctx.restore();
      });

      if (sceneT > 1.0 && !seamless) {
        const footAlpha = easeOutCubic((sceneT - 1.0) / 0.5);
        ctx.save();
        ctx.globalAlpha = footAlpha * sceneAlpha;
        ctx.font = '800 14.5px Inter, Segoe UI, sans-serif';
        ctx.fillStyle = '#475569';
        ctx.textAlign = 'center';
        ctx.fillText(
          'SRINIVASA RAMANUJAN INSTITUTE OF TECHNOLOGY  •  CSE DEPARTMENT  •  OFFICIAL STIC VIDEO ARCHIVE',
          centerX,
          height - 42
        );
        ctx.restore();
      }

      ctx.restore();
    }
    // =============================================================
    // SCENE 5: [12.0s - 14.0s] SMOOTH TRANSITION TO ENDING PICTURE
    // =============================================================
    else {
      const endT = Math.min(2.0, t - 12.0);
      const ease = easeOutCubic(endT / 0.95);
      const emblemY = centerY - 125;

      // 1. Expanding Luminous Transition Ripple Rings (0.0s -> 1.25s)
      if (endT < 1.25) {
        const waveProg = easeOutCubic(endT / 1.25);
        const waveAlpha = (1 - waveProg) * 0.42;
        ctx.save();
        ctx.translate(centerX, emblemY);

        ctx.beginPath();
        ctx.arc(0, 0, 140 + waveProg * 310, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(16, 185, 129, ${waveAlpha})`;
        ctx.lineWidth = 3 * (1 - waveProg * 0.5);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, 110 + waveProg * 240, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(234, 88, 12, ${waveAlpha * 0.85})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
      }

      // 2. Smoothly Expanding Orbital Dashed Rings
      ctx.save();
      ctx.globalAlpha = ease;
      ctx.translate(centerX, emblemY);
      const ringRot = 2.5 * 0.25 - (1 - ease) * 0.45;
      ctx.beginPath();
      ctx.arc(0, 0, 182 * (0.78 + 0.22 * ease), 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.28)';
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 16]);
      ctx.rotate(ringRot);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, 208 * (0.78 + 0.22 * ease), 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(234, 88, 12, 0.22)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([6, 20]);
      ctx.rotate(-ringRot * 1.4);
      ctx.stroke();
      ctx.restore();

      // 3. Smooth Zoom & Reveal of the CSE - STIC Official Emblem
      ctx.save();
      ctx.globalAlpha = ease;
      const logoSize = 285 * (0.78 + 0.22 * ease);
      drawEmblemCard(
        ctx,
        sticLogoImg.current,
        centerX,
        emblemY,
        logoSize,
        'rgba(16, 185, 129, 0.42)',
        'rgba(15, 23, 42, 0.12)',
        true
      );
      ctx.restore();

      // 4. Staggered Smooth Slide-Up & Fade-In of Club Title, Pill & Tagline
      if (endT > 0.2) {
        const titleEase = easeOutCubic((endT - 0.2) / 0.75);
        const titleSlide = (1 - titleEase) * 28;
        ctx.save();
        ctx.globalAlpha = titleEase;
        ctx.textAlign = 'center';
        ctx.font = '800 36px Outfit, Segoe UI, sans-serif';
        ctx.fillStyle = textPrimary;
        ctx.fillText(
          'CSE - SUSTAINABLE TECHNOLOGY & INNOVATION CLUB',
          centerX,
          centerY + 115 + titleSlide
        );
        ctx.restore();
      }

      if (endT > 0.38) {
        const pillEase = easeOutCubic((endT - 0.38) / 0.75);
        const pillSlide = (1 - pillEase) * 24;
        const pillW = 600 * (0.92 + 0.08 * pillEase);
        const pillH = 44;
        const pillX = centerX - pillW / 2;
        const pillY = centerY + 158 + pillSlide;

        ctx.save();
        ctx.globalAlpha = pillEase;
        ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, 999);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.font = '800 16px Inter, Segoe UI, sans-serif';
        ctx.fillStyle = greenText;
        ctx.fillText(
          'OFFICIAL STUDENT CHAPTER   •   INNOVATE   •   SUSTAIN   •   IMPACT',
          centerX,
          pillY + 28
        );
        ctx.restore();
      }

      if (endT > 0.55) {
        const subEase = easeOutCubic((endT - 0.55) / 0.75);
        const subSlide = (1 - subEase) * 20;
        ctx.save();
        ctx.globalAlpha = subEase;
        ctx.textAlign = 'center';
        ctx.font = '500 23px Inter, Segoe UI, sans-serif';
        ctx.fillStyle = textSecondary;
        ctx.fillText(
          'Empowering Computer Science students to build technology-driven solutions for a sustainable future.',
          centerX,
          centerY + 258 + subSlide
        );
        ctx.restore();
      }
    }

    ctx.restore();
  }, [duration, seamless, theme, easeOutCubic, easeInOutCubic, drawEmblemCard, drawTwoToneCentered]);

  // Main animation ticker
  useEffect(() => {
    if (!loaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = (timestamp) => {
      if (!lastTimestampRef.current) lastTimestampRef.current = timestamp;
      const delta = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      if (isPlayingRef.current) {
        let nextTime = currentTimeRef.current + delta;
        if (nextTime >= duration) {
          if (isIntro && onComplete) {
            if (!completedRef.current) {
              completedRef.current = true;
              onComplete();
            }
            return;
          }
          // Smoothly rest on the completed Scene 5 ending picture (t = duration)
          completedRef.current = true;
          isPlayingRef.current = false;
          setIsPlaying(false);
          currentTimeRef.current = duration;
          setCurrentTime(duration);
        } else {
          currentTimeRef.current = nextTime;
          setCurrentTime(nextTime);
          playSoundAtTime(nextTime);
        }
      }

      drawFrame(ctx, canvas.width, canvas.height, currentTimeRef.current);
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [loaded, duration, drawFrame, playSoundAtTime, isIntro, onComplete]);

  const handleTogglePlay = () => {
    if (!isPlayingRef.current && completedRef.current) {
      completedRef.current = false;
      currentTimeRef.current = 0;
      setCurrentTime(0);
      setIsPlaying(true);
      return;
    }
    setIsPlaying((prev) => !prev);
  };

  const handleRestart = () => {
    completedRef.current = false;
    currentTimeRef.current = 0;
    setCurrentTime(0);
    setIsPlaying(true);
    playSoundAtTime(0.1);
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    currentTimeRef.current = newTime;
    setCurrentTime(newTime);
  };

  const jumpToScene = (tVal) => {
    currentTimeRef.current = tVal;
    setCurrentTime(tVal);
    playSoundAtTime(tVal + 0.02);
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  // One-click 4K UHD Video Export (WebM / MP4)
  const handleExportVideo = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setIsRecording(true);
      setRecordProgress(0);
      setIsPlaying(false);

      currentTimeRef.current = 0;
      setCurrentTime(0);

      const stream = canvas.captureStream(60);

      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/mp4';
        }
      }

      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 16000000
      });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        a.download = `STIC_SRIT_Official_Brand_Animation_4K.${ext}`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          setIsRecording(false);
          setIsPlaying(true);
        }, 100);
      };

      recorder.start();

      const totalFrames = duration * 60;
      let frame = 0;
      const ctx = canvas.getContext('2d');

      const recordStep = () => {
        if (frame <= totalFrames) {
          const t = (frame / totalFrames) * duration;
          currentTimeRef.current = t;
          setCurrentTime(t);
          setRecordProgress(Math.round((frame / totalFrames) * 100));
          drawFrame(ctx, canvas.width, canvas.height, t);
          frame++;
          setTimeout(recordStep, 1000 / 60);
        } else {
          recorder.stop();
        }
      };

      recordStep();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Video export could not start: ' + err.message);
      setIsRecording(false);
    }
  };

  // =====================================================================
  // SEAMLESS LOGIN BACKGROUND MODE (True 4K UHD filling entire right space)
  // =====================================================================
  if (seamless) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          padding: 0,
          margin: 0
        }}
      >
        <canvas
          ref={canvasRef}
          width={3840}
          height={2160}
          style={{
            width: '100%',
            height: '100%',
            maxHeight: '100vh',
            objectFit: 'contain',
            background: 'transparent',
            display: 'block'
          }}
        />
      </div>
    );
  }

  // =====================================================================
  // FULL-SCREEN PORTAL INTRO MODE
  // =====================================================================
  if (isIntro) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          background: '#f8fafc',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        <canvas
          ref={canvasRef}
          width={3840}
          height={2160}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
        />

        <div
          style={{
            position: 'fixed',
            bottom: '28px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(14px)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: '999px',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 16px 40px rgba(15, 23, 42, 0.35)',
            zIndex: 10000
          }}
        >
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: soundEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
              border: '1px solid ' + (soundEnabled ? 'rgba(16, 185, 129, 0.45)' : 'rgba(255, 255, 255, 0.15)'),
              color: soundEnabled ? '#34d399' : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title={soundEnabled ? 'Mute Audio' : 'Enable Audio'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#34d399' }}>
              Official CSE – STIC & SRIT Intro
            </span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>
              {Math.max(0, Math.ceil(duration - currentTime))}s remaining
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onComplete) onComplete();
            }}
            style={{
              padding: '8px 18px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
            }}
          >
            <span>Proceed to Login</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        background: '#090d16',
        borderRadius: isFullscreen ? '0px' : '16px',
        overflow: 'hidden',
        border: '1px solid var(--border-highlight, rgba(56, 189, 248, 0.25))',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45)',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: isFullscreen ? '100vw' : '1080px',
        margin: '0 auto',
        position: 'relative'
      }}
    >
      {/* Studio Top Control Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          background: 'rgba(15, 23, 42, 0.96)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981'
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
                STIC & SRIT Official Brand Animation Studio
              </h3>
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  fontWeight: 600
                }}
              >
                4K Ultra HD (3840×2160)
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
              Official CSE – STIC & SRIT ("Empowering Knowledge") Motion Graphics Charter
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.8)',
              padding: '3px',
              borderRadius: '8px',
              display: 'flex',
              gap: '4px',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            <button
              onClick={() => setActiveTab('remastered')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'remastered' ? '#059669' : 'transparent',
                color: activeTab === 'remastered' ? '#ffffff' : '#94a3b8',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <Sparkles size={13} />
              <span>Interactive 4K Studio</span>
            </button>
            <button
              onClick={() => setActiveTab('original')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'original' ? '#0284c7' : 'transparent',
                color: activeTab === 'original' ? '#ffffff' : '#94a3b8',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <Film size={13} />
              <span>Regenerated Video Player</span>
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px'
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Video Viewport */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/9',
          background: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        {activeTab === 'remastered' ? (
          <>
            <canvas
              ref={canvasRef}
              width={3840}
              height={2160}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />

            {/* Recording overlay */}
            {isRecording && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(15, 23, 42, 0.88)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  gap: '16px',
                  zIndex: 20
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    border: '3px solid #38bdf8',
                    borderTopColor: 'transparent',
                    animation: 'spin 1s linear infinite'
                  }}
                />
                <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                  Rendering High-Definition Club Video...
                </h4>
                <div
                  style={{
                    width: '280px',
                    height: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      width: `${recordProgress}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #10b981, #38bdf8)',
                      transition: 'width 0.1s linear'
                    }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                  {recordProgress}% Complete · Preparing Crisp 1080p Video Download
                </p>
              </div>
            )}
          </>
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <video
              controls
              autoPlay
              loop
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            >
              <source src="/stic-animation.webm?v=2" type="video/webm" />
              <source src="/stic-animation.mp4?v=2" type="video/mp4" />
            </video>
          </div>
        )}
      </div>

      {/* Playback Controls & Scene Selector (for Remastered mode) */}
      {activeTab === 'remastered' && (
        <div
          style={{
            padding: '12px 20px',
            background: 'rgba(15, 23, 42, 0.98)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          {/* Progress / Scrub bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', minWidth: '42px', fontFamily: 'monospace' }}>
              {currentTime.toFixed(1)}s
            </span>
            <input
              type="range"
              min="0"
              max={duration}
              step="0.05"
              value={currentTime}
              onChange={handleSeek}
              disabled={isRecording}
              style={{
                flex: 1,
                cursor: 'pointer',
                accentColor: '#10b981',
                height: '4px'
              }}
            />
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', minWidth: '42px', fontFamily: 'monospace' }}>
              {duration.toFixed(1)}s
            </span>
          </div>

          {/* Action buttons row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={handleTogglePlay}
                disabled={isRecording}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: isPlaying ? 'rgba(255,255,255,0.12)' : '#10b981',
                  border: 'none',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
              </button>

              <button
                onClick={handleRestart}
                disabled={isRecording}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title="Restart Animation"
              >
                <RotateCcw size={16} />
              </button>

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: soundEnabled ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.06)',
                  border: '1px solid ' + (soundEnabled ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)'),
                  color: soundEnabled ? '#10b981' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title={soundEnabled ? 'Audio Chime Enabled' : 'Audio Muted'}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>

              {/* Interactive Scene Jump Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px', flexWrap: 'wrap' }}>
                {[
                  { label: '1. Club Identity', start: 0, end: 3.0 },
                  { label: '2. STIC & SRIT Synergy', start: 3.0, end: 6.0 },
                  { label: '3. Vision & Objectives', start: 6.0, end: 9.0 },
                  { label: '4. Core Motto', start: 9.0, end: 12.0 }
                ].map((sc) => {
                  const isActive = currentTime >= sc.start && currentTime < sc.end;
                  return (
                    <button
                      key={sc.label}
                      type="button"
                      onClick={() => jumpToScene(sc.start + 0.5)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '0.73rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: isActive ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255,255,255,0.1)',
                        background: isActive ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255,255,255,0.04)',
                        color: isActive ? '#34d399' : '#94a3b8'
                      }}
                    >
                      {sc.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right actions: Export HD Video + Fullscreen */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={handleExportVideo}
                disabled={isRecording}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: isRecording ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                }}
              >
                <Download size={15} />
                <span>{isRecording ? 'Exporting...' : 'Export HD Video'}</span>
              </button>

              <button
                onClick={handleToggleFullscreen}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Presentation Mode'}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
