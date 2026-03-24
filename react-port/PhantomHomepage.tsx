"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";
import "./phantom-homepage.css";

type HomeCardVariant = "webxr" | "terrain" | "plot" | "threads";

type HomeCard = {
  id: string;
  exp: string;
  year: number;
  title: string;
  tags: string[];
  variant: HomeCardVariant;
  x: number;
  y: number;
  width: number;
  height: number;
};

const WORLD_WIDTH = 1760;
const WORLD_HEIGHT = 1460;

const cards: HomeCard[] = [
  {
    id: "exp-014",
    exp: "EXP 014",
    year: 2020,
    title: "WebXR Sneakers",
    tags: ["DEMO", "WEBGL", "XR"],
    variant: "webxr",
    x: 280,
    y: 115,
    width: 700,
    height: 560,
  },
  {
    id: "exp-015",
    exp: "EXP 015",
    year: 2019,
    title: "Hair Simulation",
    tags: ["WEBGL"],
    variant: "threads",
    x: 1130,
    y: 115,
    width: 540,
    height: 820,
  },
  {
    id: "exp-012",
    exp: "EXP 012",
    year: 2022,
    title: "Small World",
    tags: ["MONTHLY", "WEBGL", "DATAVIS"],
    variant: "terrain",
    x: 280,
    y: 840,
    width: 700,
    height: 560,
  },
  {
    id: "exp-013",
    exp: "EXP 013",
    year: 2022,
    title: "Lazy Plot",
    tags: ["TOOL"],
    variant: "plot",
    x: 1130,
    y: 860,
    width: 540,
    height: 420,
  },
];

const threadStrands = Array.from({ length: 26 }, (_, index) => {
  const left = 8 + (index % 7) * 13;
  const top = -10 + (index % 5) * 7;
  const height = 260 + (index % 4) * 28;
  const width = 10 + (index % 3) * 3;
  const rotate = -65 + index * 7.75;

  return {
    left: `${left}%`,
    top: `${top}%`,
    height: `${height}px`,
    width: `${width}px`,
    transform: `translate3d(-50%, 0, 0) rotate(${rotate}deg)`,
    animationDelay: `${(index % 6) * 0.12}s`,
    animationDuration: `${6 + (index % 5) * 0.8}s`,
  } satisfies CSSProperties;
});

function ProjectCard({ card }: { card: HomeCard }) {
  const style = {
    width: `${card.width}px`,
    height: `${card.height}px`,
    ["--card-x" as "--card-x"]: `${card.x}px`,
    ["--card-y" as "--card-y"]: `${card.y}px`,
    ["--entry-shift-x" as "--entry-shift-x"]: "0px",
    ["--entry-shift-y" as "--entry-shift-y"]: "0px",
    ["--wave-y" as "--wave-y"]: "0px",
    ["--card-scale" as "--card-scale"]: 1,
    ["--card-rotate" as "--card-rotate"]: "0deg",
    ["--card-opacity" as "--card-opacity"]: 1,
    ["--card-blur" as "--card-blur"]: "0px",
  } satisfies CSSProperties;

  return (
    <article
      className={`phantom-home__card phantom-home__card--${card.variant}`}
      style={style}
      data-card-id={card.id}
      aria-label={card.title}
    >
      <div className="phantom-home__card-meta">
        <span>{card.exp}</span>
        <span>{card.year}</span>
      </div>

      <button
        type="button"
        className="phantom-home__card-badge"
        tabIndex={-1}
        aria-hidden="true"
      >
        <span />
      </button>

      {card.variant === "webxr" ? <WebxrArtwork /> : null}

      {card.variant === "terrain" ? <TerrainArtwork /> : null}

      {card.variant === "threads" ? (
        <div className="phantom-home__threads">
          <div className="phantom-home__threads-core" />
          {threadStrands.map((strandStyle, index) => (
            <span
              key={`${card.id}-strand-${index}`}
              className="phantom-home__thread"
              style={strandStyle}
            />
          ))}
        </div>
      ) : null}

      {card.variant === "plot" ? <PlotArtwork /> : null}

      <div className="phantom-home__card-footer">
        <h2>{card.title}</h2>
        <div className="phantom-home__card-tags">
          {card.tags.map((tag) => (
            <span key={`${card.id}-${tag}`}>{tag}</span>
          ))}
        </div>
      </div>
    </article>
  );
}

function WebxrArtwork() {
  return (
    <div className="phantom-home__webxr">
      <div className="phantom-home__webxr-swirl phantom-home__webxr-swirl--one" />
      <div className="phantom-home__webxr-swirl phantom-home__webxr-swirl--two" />
      <div className="phantom-home__webxr-swirl phantom-home__webxr-swirl--three" />
      <div className="phantom-home__webxr-shoe">
        <span className="phantom-home__webxr-sole" />
        <span className="phantom-home__webxr-upper" />
        <span className="phantom-home__webxr-collar" />
        <span className="phantom-home__webxr-tongue" />
        <span className="phantom-home__webxr-toe" />
        <span className="phantom-home__webxr-laces" />
        <span className="phantom-home__webxr-cross phantom-home__webxr-cross--front" />
        <span className="phantom-home__webxr-cross phantom-home__webxr-cross--side" />
      </div>
    </div>
  );
}

function TerrainArtwork() {
  return (
    <div className="phantom-home__terrain">
      <div className="phantom-home__terrain-shell">
        <div className="phantom-home__terrain-texture" />
        <svg
          className="phantom-home__terrain-river"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M53 0 C41 10, 62 24, 45 36 S61 59, 43 74 S55 91, 48 100"
            fill="none"
            stroke="rgba(48,48,48,0.68)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M53 0 C41 10, 62 24, 45 36 S61 59, 43 74 S55 91, 48 100"
            fill="none"
            stroke="rgba(164,164,164,0.55)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}

function PlotArtwork() {
  return (
    <div className="phantom-home__plot">
      <div className="phantom-home__plot-grid" />
      <svg
        className="phantom-home__plot-svg"
        viewBox="0 0 540 420"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M -10 266 C 58 118, 112 66, 160 216 S 306 368, 380 148 S 480 104, 560 276"
          fill="none"
          stroke="rgba(255,255,255,0.72)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M 270 0 L 270 420"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="2"
        />
        <path
          d="M 0 212 L 540 212"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="2"
        />
      </svg>
      <div className="phantom-home__plot-labels" aria-hidden="true">
        <span>1</span>
        <span>0.5</span>
        <span>0</span>
        <span>-0.5</span>
        <span>-1</span>
      </div>
    </div>
  );
}

function MiniPreview() {
  return (
    <div className="phantom-home__preview" aria-hidden="true">
      <div className="phantom-home__preview-panel">
        <div className="phantom-home__preview-thumb phantom-home__preview-thumb--image" />
        <div className="phantom-home__preview-thumb phantom-home__preview-thumb--graph">
          <svg viewBox="0 0 100 62" preserveAspectRatio="none">
            <path
              d="M0 40 C 12 10, 28 10, 46 40 S 78 60, 100 18"
              fill="none"
              stroke="rgba(255,255,255,0.82)"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

function TopLeftMark() {
  return (
    <div className="phantom-home__mark" aria-hidden="true">
      <svg viewBox="0 0 40 40" fill="none">
        <circle cx="14" cy="12" r="3" fill="currentColor" />
        <circle cx="26" cy="12" r="3" fill="currentColor" />
        <circle cx="20" cy="24" r="7.5" stroke="currentColor" strokeWidth="3" />
        <circle cx="27.5" cy="24" r="2.4" fill="currentColor" />
      </svg>
    </div>
  );
}

export default function PhantomHomepage() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const track = trackRef.current;
    if (!stage || !track) return;

    const state = {
      currentX: 0,
      currentY: 22,
      targetX: 0,
      targetY: 22,
      pointerId: -1,
      startX: 0,
      startY: 0,
      originX: 0,
      originY: 22,
      dragging: false,
      frame: 0,
    };
    const cardNodes = Array.from(
      track.querySelectorAll<HTMLElement>(".phantom-home__card")
    );
    const cardMotion = [
      { start: 0.02, end: 0.2, shiftX: -260, shiftY: 42, rotate: -9 },
      { start: 0.05, end: 0.26, shiftX: 240, shiftY: 28, rotate: 8 },
      { start: 0.3, end: 0.56, shiftX: -240, shiftY: 78, rotate: -8 },
      { start: 0.38, end: 0.7, shiftX: 220, shiftY: 54, rotate: 7 },
    ] as const;

    const clamp = (value: number, min: number, max: number) =>
      Math.min(max, Math.max(min, value));
    const invLerp = (value: number, min: number, max: number) =>
      clamp((value - min) / (max - min), 0, 1);
    const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);

    const bounds = () => {
      const rect = stage.getBoundingClientRect();
      const scaleValue = parseFloat(
        getComputedStyle(stage).getPropertyValue("--world-scale")
      );
      const scale = Number.isFinite(scaleValue) && scaleValue > 0 ? scaleValue : 1;
      const marginX = Math.min(280, rect.width * 0.18);
      const marginTop = 28;
      const marginBottom = 94;
      const minX = rect.width - WORLD_WIDTH * scale - marginX;
      const maxX = marginX;
      const minY = rect.height - WORLD_HEIGHT * scale - marginBottom;
      const maxY = marginTop;

      return {
        minX: Math.min(minX, maxX),
        maxX,
        minY: Math.min(minY, maxY),
        maxY,
      };
    };

    const applyBounds = () => {
      const { minX, maxX, minY, maxY } = bounds();
      state.targetX = clamp(state.targetX, minX, maxX);
      state.targetY = clamp(state.targetY, minY, maxY);
      state.currentX = clamp(state.currentX, minX, maxX);
      state.currentY = clamp(state.currentY, minY, maxY);
    };

    const render = () => {
      state.currentX += (state.targetX - state.currentX) * 0.12;
      state.currentY += (state.targetY - state.currentY) * 0.12;

      track.style.transform = `translate3d(${state.currentX}px, ${state.currentY}px, 0)`;

      const { minY, maxY } = bounds();
      const progress =
        maxY === minY ? 1 : clamp((maxY - state.currentY) / (maxY - minY), 0, 1);
      const time = performance.now();

      cardNodes.forEach((cardNode, index) => {
        const motion = cardMotion[index];
        if (!motion) return;

        const localProgress = easeOutCubic(
          invLerp(progress, motion.start, motion.end)
        );
        const unresolved = 1 - localProgress;
        const wave =
          Math.sin(time * 0.0021 + index * 0.85 + progress * 7.5) *
          (6 + unresolved * 10);
        const settle =
          Math.cos(time * 0.00135 + index * 0.6 + progress * 5.4) *
          (1.5 + unresolved * 2.8);

        cardNode.style.setProperty(
          "--entry-shift-x",
          `${motion.shiftX * unresolved}px`
        );
        cardNode.style.setProperty(
          "--entry-shift-y",
          `${motion.shiftY * unresolved}px`
        );
        cardNode.style.setProperty("--wave-y", `${wave}px`);
        cardNode.style.setProperty(
          "--card-scale",
          `${0.92 + localProgress * 0.08}`
        );
        cardNode.style.setProperty(
          "--card-rotate",
          `${motion.rotate * unresolved + settle}deg`
        );
        cardNode.style.setProperty(
          "--card-opacity",
          `${0.22 + localProgress * 0.78}`
        );
        cardNode.style.setProperty(
          "--card-blur",
          `${unresolved * 18}px`
        );
      });

      state.frame = window.requestAnimationFrame(render);
    };

    const onPointerDown = (event: PointerEvent) => {
      state.dragging = true;
      state.pointerId = event.pointerId;
      state.startX = event.clientX;
      state.startY = event.clientY;
      state.originX = state.targetX;
      state.originY = state.targetY;

      stage.setPointerCapture(event.pointerId);
      stage.classList.add("is-dragging");
      document.body.classList.add("phantom-home-dragging");
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!state.dragging || state.pointerId !== event.pointerId) return;
      event.preventDefault();

      const { minX, maxX, minY, maxY } = bounds();
      state.targetX = clamp(
        state.originX + (event.clientX - state.startX),
        minX,
        maxX
      );
      state.targetY = clamp(
        state.originY + (event.clientY - state.startY),
        minY,
        maxY
      );
    };

    const endDrag = (event: PointerEvent) => {
      if (state.pointerId !== event.pointerId) return;
      state.dragging = false;
      stage.classList.remove("is-dragging");
      document.body.classList.remove("phantom-home-dragging");

      if (stage.hasPointerCapture(event.pointerId)) {
        stage.releasePointerCapture(event.pointerId);
      }
    };

    const onResize = () => {
      applyBounds();
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();

      const { minX, maxX, minY, maxY } = bounds();
      const wheelUnit = event.deltaMode === 1 ? 24 : 1;
      const deltaX =
        Math.abs(event.deltaX) > 0
          ? event.deltaX * wheelUnit
          : event.shiftKey
            ? event.deltaY * wheelUnit
            : 0;
      const deltaY = event.deltaY * wheelUnit;

      state.targetX = clamp(state.targetX - deltaX * 0.65, minX, maxX);
      state.targetY = clamp(state.targetY - deltaY * 0.72, minY, maxY);
    };

    const onLostPointerCapture = () => {
      state.dragging = false;
      stage.classList.remove("is-dragging");
      document.body.classList.remove("phantom-home-dragging");
    };

    applyBounds();
    render();

    stage.addEventListener("pointerdown", onPointerDown);
    stage.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);
    stage.addEventListener("lostpointercapture", onLostPointerCapture);
    stage.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", onResize);

    return () => {
      window.cancelAnimationFrame(state.frame);
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerup", endDrag);
      stage.removeEventListener("pointercancel", endDrag);
      stage.removeEventListener("lostpointercapture", onLostPointerCapture);
      stage.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      stage.classList.remove("is-dragging");
      document.body.classList.remove("phantom-home-dragging");
    };
  }, []);

  return (
    <section className="phantom-home">
      <header className="phantom-home__header">
        <button type="button" className="phantom-home__logo-btn">
          <TopLeftMark />
        </button>

        <div className="phantom-home__nav">
          <button type="button">ABOUT</button>
          <button type="button">CONTACT</button>
          <button type="button">
            LUSION
            <span aria-hidden="true">↗</span>
          </button>
        </div>

        <div className="phantom-home__header-right">
          <div className="phantom-home__toggle" aria-hidden="true">
            <span className="is-active">GRID</span>
            <span>LIST</span>
          </div>

          <div className="phantom-home__wordmark" aria-hidden="true">
            <span>B</span>
            <span>O</span>
          </div>
        </div>
      </header>

      <div ref={stageRef} className="phantom-home__stage">
        <div ref={trackRef} className="phantom-home__track">
          <div className="phantom-home__world">
            {cards.map((card) => (
              <ProjectCard key={card.id} card={card} />
            ))}
          </div>
        </div>
      </div>

      <div className="phantom-home__orb" aria-hidden="true" />
      <MiniPreview />
    </section>
  );
}
