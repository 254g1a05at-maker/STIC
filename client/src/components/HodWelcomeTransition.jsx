import React, { useEffect, useState, useRef, useCallback } from 'react';

export default function HodWelcomeTransition({ onComplete }) {
  const [isExiting, setIsExiting] = useState(false);
  const autoExitRef = useRef(null);
  const exitTimeoutRef = useRef(null);

  const handleExit = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    if (autoExitRef.current) clearTimeout(autoExitRef.current);
    exitTimeoutRef.current = setTimeout(() => {
      if (onComplete) onComplete();
    }, 600);
  }, [isExiting, onComplete]);

  useEffect(() => {
    autoExitRef.current = setTimeout(() => {
      handleExit();
    }, 3200);

    return () => {
      if (autoExitRef.current) clearTimeout(autoExitRef.current);
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    };
  }, [handleExit]);

  const titleText = "Welcome back, Head of the Department";
  const subtitleText = "Privilege to have you";

  return (
    <div
      onClick={handleExit}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        overflow: 'hidden',
        userSelect: 'none',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'scale(1.03)' : 'scale(1)',
        transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        boxSizing: 'border-box',
        padding: '24px',
        willChange: 'opacity, transform'
      }}
    >
      <style>{`
        @keyframes hodSalutePop {
          0% {
            transform: scale(0) rotate(-16deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.18) rotate(4deg);
            opacity: 1;
          }
          75% {
            transform: scale(0.95) rotate(-2deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes hodFloatGentle {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-6px) rotate(1deg);
          }
        }

        @keyframes hodLetterPop {
          0% {
            transform: translateY(24px) scale(0.4);
            opacity: 0;
          }
          65% {
            transform: translateY(-4px) scale(1.12);
            opacity: 1;
          }
          85% {
            transform: translateY(1px) scale(0.97);
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }

        @keyframes hodSubLetterPop {
          0% {
            transform: translateY(18px) scale(0.5);
            opacity: 0;
          }
          70% {
            transform: translateY(-3px) scale(1.08);
            opacity: 1;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }

        @keyframes hodBadgeIn {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }

        @keyframes hodProgressRun {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>

      {/* Decorative Soft Golden Radial Aura on Pure White */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '720px',
          height: '720px',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(254, 240, 138, 0.45) 0%, rgba(253, 230, 138, 0.2) 35%, rgba(255, 255, 255, 0) 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Central Content Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: '860px',
          margin: '0 auto'
        }}
      >
        {/* Department & Institution Tag */}
        <div
          style={{
            animation: 'hodBadgeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1.5px solid rgba(245, 158, 11, 0.35)',
            padding: '6px 18px',
            borderRadius: '999px',
            color: '#b45309',
            fontSize: '0.82rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '28px'
          }}
        >
          <span>🏛️ Srinivasa Ramanujan Institute of Technology</span>
          <span style={{ opacity: 0.5 }}>•</span>
          <span>CSE Department</span>
        </div>

        {/* Popping Salute Emoji (100% Transparent, No White Box) */}
        <div
          style={{
            position: 'relative',
            marginBottom: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Soft Warm Radial Glow */}
          <div
            style={{
              position: 'absolute',
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(251, 191, 36, 0.35) 0%, rgba(255, 255, 255, 0) 70%)',
              filter: 'blur(12px)',
              pointerEvents: 'none'
            }}
          />

          {/* Popping Salute Emoji Container */}
          <div
            style={{
              animation: 'hodSalutePop 0.85s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.15s both',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div
              style={{
                animation: 'hodFloatGentle 3s ease-in-out 1s infinite',
                width: '150px',
                height: '150px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent'
              }}
            >
              <img
                src="/hod_salute.png?v=apple_salute"
                alt="🫡"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.nextSibling) {
                    e.currentTarget.nextSibling.style.display = 'block';
                  }
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  background: 'transparent',
                  filter: 'drop-shadow(0 12px 24px rgba(217, 119, 6, 0.28))'
                }}
              />
              <span
                style={{
                  display: 'none',
                  fontSize: '110px',
                  lineHeight: 1,
                  userSelect: 'none',
                  filter: 'drop-shadow(0 12px 24px rgba(217, 119, 6, 0.28))'
                }}
              >
                🫡
              </span>
            </div>
          </div>
        </div>

        {/* Popping Title: "Welcome back, Head of the Department" */}
        <h1
          style={{
            margin: '0 0 16px 0',
            fontSize: 'clamp(1.4rem, 3.4vw, 2.3rem)',
            fontWeight: 900,
            color: '#0f172a',
            letterSpacing: '-0.025em',
            lineHeight: 1.25,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.24em',
            maxWidth: '920px'
          }}
        >
          {titleText.split(' ').map((word, wordIdx) => {
            return (
              <span
                key={wordIdx}
                style={{
                  display: 'inline-flex',
                  whiteSpace: 'nowrap',
                  overflow: 'visible'
                }}
              >
                {word.split('').map((char, charIdx) => {
                  const globalIdx = wordIdx * 10 + charIdx;
                  const delay = 0.35 + globalIdx * 0.028;
                  return (
                    <span
                      key={charIdx}
                      style={{
                        display: 'inline-block',
                        animation: `hodLetterPop 0.65s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${delay}s both`,
                        color: word.toLowerCase() === 'department' ? '#b45309' : '#0f172a'
                      }}
                    >
                      {char}
                    </span>
                  );
                })}
              </span>
            );
          })}
        </h1>

        {/* Popping Subtitle: "Privilege to have you" (Smaller Size) */}
        <div
          style={{
            fontSize: 'clamp(0.95rem, 2vw, 1.2rem)',
            fontWeight: 700,
            color: '#64748b',
            letterSpacing: '0.01em',
            margin: '0 0 28px 0',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.28em'
          }}
        >
          {subtitleText.split(' ').map((word, wordIdx) => {
            return (
              <span
                key={wordIdx}
                style={{
                  display: 'inline-flex',
                  whiteSpace: 'nowrap'
                }}
              >
                {word.split('').map((char, charIdx) => {
                  const delay = 0.95 + (wordIdx * 6 + charIdx) * 0.035;
                  return (
                    <span
                      key={charIdx}
                      style={{
                        display: 'inline-block',
                        animation: `hodSubLetterPop 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${delay}s both`,
                        color: '#64748b'
                      }}
                    >
                      {char}
                    </span>
                  );
                })}
              </span>
            );
          })}
        </div>

        {/* Bottom Minimalist Progress Bar */}
        <div
          style={{
            width: '240px',
            height: '4px',
            background: 'rgba(203, 213, 225, 0.6)',
            borderRadius: '999px',
            overflow: 'hidden',
            marginTop: '10px'
          }}
        >
          <div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #f59e0b, #10b981)',
              borderRadius: '999px',
              animation: 'hodProgressRun 3.2s linear forwards'
            }}
          />
        </div>

        {/* Click to Skip Hint */}
        <p
          style={{
            marginTop: '16px',
            fontSize: '0.78rem',
            color: '#94a3b8',
            fontWeight: 600,
            letterSpacing: '0.04em'
          }}
        >
          Click anywhere to enter dashboard immediately • Initializing portal...
        </p>
      </div>
    </div>
  );
}
