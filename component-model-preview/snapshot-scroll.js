(function () {
  const stage = document.querySelector(".cards-wrapper2");
  const cards = Array.from(document.querySelectorAll(".card.card--abs"));

  if (!stage || cards.length === 0) {
    return;
  }

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const lerp = (start, end, alpha) => start + (end - start) * alpha;
  const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);

  const parseTransform = (value) => {
    if (!value) {
      return { x: 0, y: 0, rotate: 0 };
    }

    const translate3dMatch = value.match(
      /translate3d\(\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/,
    );
    const translateXMatch = value.match(/translateX\(([^)]+)\)/);
    const translateYMatch = value.match(/translateY\(([^)]+)\)/);
    const rotateMatch = value.match(/rotate\(([-\d.]+)deg\)/);

    return {
      x: translate3dMatch ? parseFloat(translate3dMatch[1]) : translateXMatch ? parseFloat(translateXMatch[1]) : 0,
      y: translate3dMatch ? parseFloat(translate3dMatch[2]) : translateYMatch ? parseFloat(translateYMatch[1]) : 0,
      rotate: rotateMatch ? parseFloat(rotateMatch[1]) : 0,
    };
  };

  const baseStageTransform = parseTransform(stage.style.transform);

  let currentOffset = 0;
  let targetOffset = 0;
  let velocity = 0;
  let minOffset = -window.innerHeight * 0.5;
  let maxOffset = window.innerHeight * 0.25;
  let isDragging = false;
  let dragPointerId = null;
  let lastPointerY = 0;

  const cardStates = cards.map((card, index) => {
    const baseTransform = parseTransform(card.style.transform);

    return {
      card,
      img: card.querySelector(".card__img"),
      text: card.querySelector(".card__text"),
      top: card.querySelector(".card__top"),
      bottom: card.querySelector(".card__bottom"),
      baseX: baseTransform.x,
      baseY: baseTransform.y,
      baseRotate: baseTransform.rotate,
      width: 0,
      height: 0,
      anchor: 1,
      phase: index * 1.618 + 0.35,
    };
  });

  const applyStageTransform = (offset) => {
    stage.style.transform = `translate3d(${baseStageTransform.x}px, ${(
      baseStageTransform.y + offset
    ).toFixed(3)}px, 0px)`;
  };

  const measureCardMetrics = () => {
    applyStageTransform(0);

    const stageRect = stage.getBoundingClientRect();
    const viewportMidX = window.innerWidth * 0.5;

    cardStates.forEach((state) => {
      state.width =
        parseFloat(state.card.style.width) ||
        state.card.getBoundingClientRect().width;
      state.height =
        parseFloat(state.card.style.height) ||
        state.card.getBoundingClientRect().height;

      const origin = (
        state.card.style.transformOrigin ||
        getComputedStyle(state.card).transformOrigin ||
        ""
      ).toLowerCase();

      const cardCenterX = stageRect.left + state.baseX + state.width * 0.5;

      state.anchor =
        origin.includes("right") || cardCenterX > viewportMidX ? 1 : -1;
    });
  };

  const renderCards = (now) => {
    const stageRect = stage.getBoundingClientRect();
    const viewportCenterY = window.innerHeight * 0.5;
    const horizontalTravel = Math.min(window.innerWidth * 0.2, 260);
    const verticalLift = Math.min(window.innerHeight * 0.065, 44);

    cardStates.forEach((state) => {
      const cardCenterY = stageRect.top + state.baseY + state.height * 0.5;
      const distanceY = (cardCenterY - viewportCenterY) / window.innerHeight;
      const proximity = clamp(1 - Math.abs(distanceY) / 0.78, 0, 1);
      const reveal = easeOutCubic(proximity);
      const away = 1 - reveal;
      const wave = Math.sin(now * 0.00115 + state.phase);
      const sway = Math.cos(now * 0.001 + state.phase * 1.37);

      const translateX =
        state.baseX +
        state.anchor * horizontalTravel * away +
        velocity * state.anchor * 10 +
        sway * 4;
      const translateY =
        state.baseY - verticalLift * away + wave * 3 + sway * 1.5;
      const rotation =
        state.baseRotate +
        state.anchor * away * 4.75 +
        velocity * state.anchor * 0.085 +
        wave * 0.55;
      const scale = 0.93 + reveal * 0.07;

      state.card.style.transform =
        `translate3d(${translateX.toFixed(3)}px, ${translateY.toFixed(
          3,
        )}px, 0px) ` +
        `rotate(${rotation.toFixed(3)}deg) scale(${scale.toFixed(4)})`;
      state.card.style.opacity = (0.42 + reveal * 0.58).toFixed(3);
      state.card.style.zIndex = String(20 + Math.round(reveal * 20));
      state.card.style.boxShadow =
        `0 ${Math.round(16 + reveal * 24)}px ${Math.round(
          44 + away * 28,
        )}px rgba(0, 0, 0, ${(0.18 + reveal * 0.16).toFixed(3)})`;

      if (state.img) {
        const imageX = state.anchor * away * -28 + sway * 8;
        const imageY = distanceY * -60 + wave * 8;
        const imageScale = 1.04 + away * 0.04;

        state.img.style.transform =
          `translate3d(${imageX.toFixed(3)}px, ${imageY.toFixed(
            3,
          )}px, 0px) ` + `scale(${imageScale.toFixed(4)})`;
        state.img.style.filter =
          `blur(${(away * 4).toFixed(2)}px) ` +
          `brightness(${(0.82 + reveal * 0.24).toFixed(3)}) ` +
          `contrast(${(0.9 + reveal * 0.14).toFixed(3)})`;
      }

      if (state.text) {
        const textY = away * 18 - wave * 2.5;
        state.text.style.transform = `translate3d(0px, ${textY.toFixed(
          3,
        )}px, 0px)`;
        state.text.style.opacity = (0.58 + reveal * 0.42).toFixed(3);
      }

      if (state.top) {
        const topY = -away * 10 + wave * 1.5;
        state.top.style.transform = `translate3d(0px, ${topY.toFixed(
          3,
        )}px, 0px)`;
        state.top.style.opacity = (0.65 + reveal * 0.35).toFixed(3);
      }

      if (state.bottom) {
        const bottomY = away * 12 - sway * 1.5;
        state.bottom.style.transform = `translate3d(0px, ${bottomY.toFixed(
          3,
        )}px, 0px)`;
        state.bottom.style.opacity = (0.6 + reveal * 0.4).toFixed(3);
      }
    });
  };

  const measureBounds = () => {
    measureCardMetrics();

    const stageRect = stage.getBoundingClientRect();
    const topMost = Math.min(...cardStates.map((state) => state.baseY));
    const bottomMost = Math.max(
      ...cardStates.map((state) => state.baseY + state.height),
    );
    const topPadding = 72;
    const bottomPadding = 72;

    maxOffset = Math.max(0, topPadding - (stageRect.top + topMost));
    minOffset = Math.min(
      0,
      window.innerHeight - bottomPadding - (stageRect.top + bottomMost),
    );

    currentOffset = clamp(currentOffset, minOffset, maxOffset);
    targetOffset = clamp(targetOffset, minOffset, maxOffset);

    applyStageTransform(currentOffset);
    renderCards(performance.now());
  };

  const pushOffset = (delta) => {
    targetOffset = clamp(targetOffset + delta, minOffset, maxOffset);
  };

  window.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      pushOffset(-event.deltaY * 0.82);
    },
    { passive: false },
  );

  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "PageDown") {
      event.preventDefault();
      pushOffset(-window.innerHeight * 0.22);
    }

    if (event.key === "ArrowUp" || event.key === "PageUp") {
      event.preventDefault();
      pushOffset(window.innerHeight * 0.22);
    }
  });

  window.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    isDragging = true;
    dragPointerId = event.pointerId;
    lastPointerY = event.clientY;
    document.documentElement.classList.add("is-dragging-gallery");
  });

  window.addEventListener("pointermove", (event) => {
    if (!isDragging || event.pointerId !== dragPointerId) {
      return;
    }

    const delta = event.clientY - lastPointerY;
    lastPointerY = event.clientY;
    pushOffset(delta * 1.2);
  });

  const stopDragging = () => {
    isDragging = false;
    dragPointerId = null;
    document.documentElement.classList.remove("is-dragging-gallery");
  };

  window.addEventListener("pointerup", stopDragging);
  window.addEventListener("pointercancel", stopDragging);
  window.addEventListener("resize", measureBounds);

  const tick = (now) => {
    const previousOffset = currentOffset;

    currentOffset = lerp(currentOffset, targetOffset, 0.1);

    if (Math.abs(targetOffset - currentOffset) < 0.01) {
      currentOffset = targetOffset;
    }

    velocity = lerp(velocity, currentOffset - previousOffset, 0.18);

    applyStageTransform(currentOffset);
    renderCards(now);
    requestAnimationFrame(tick);
  };

  measureBounds();
  requestAnimationFrame(tick);
})();
