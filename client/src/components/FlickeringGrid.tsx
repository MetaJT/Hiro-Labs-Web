import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "components/styles/FlickeringGrid.css";

interface FlickeringGridProps extends React.HTMLAttributes<HTMLDivElement> {
  squareSize?: number;
  gridGap?: number;
  flickerChance?: number;
  color?: string;
  width?: number;
  height?: number;
  className?: string;
  maxOpacity?: number;
  mouseGlow?: boolean;
  mouseGlowRadius?: number;
  centerGlow?: boolean;
  centerGlowRadius?: number;
  clickRipple?: boolean;
}

interface RippleSource {
  x: number;
  y: number;
  startTime: number;
  maxRadius: number;
}

const RIPPLE_RING_COUNT = 5;
const RIPPLE_RING_SPACING = 60;
const RIPPLE_SPEED = 350;
const RIPPLE_RING_WIDTH = 40;
const RIPPLE_MAX_ACTIVE = 5;
const RIPPLE_IGNORED = ".top-nav, .hyper-text";

function sizeCanvas(canvas: HTMLCanvasElement, w: number, h: number) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  return dpr;
}

function parseColor(cssColor: string): string {
  if (typeof window === "undefined") return `rgba(0, 0, 0,`;
  const c = document.createElement("canvas");
  c.width = c.height = 1;
  const ctx = c.getContext("2d");
  if (!ctx) return "rgba(0, 0, 0,";
  ctx.fillStyle = cssColor;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data);
  return `rgba(${r}, ${g}, ${b},`;
}

export const FlickeringGrid: React.FC<FlickeringGridProps> = ({
  squareSize = 4,
  gridGap = 6,
  flickerChance = 0.3,
  color = "rgb(0, 0, 0)",
  width,
  height,
  className,
  maxOpacity = 0.3,
  mouseGlow = false,
  mouseGlowRadius = 300,
  centerGlow = false,
  centerGlowRadius = 450,
  clickRipple = false,
  ...props
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rippleCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
    null
  );
  const activeRipples = useRef<RippleSource[]>([]);

  const colorPrefix = useMemo(() => parseColor(color), [color]);
  const cellSize = squareSize + gridGap;

  const setupCanvas = useCallback(
    (canvas: HTMLCanvasElement, w: number, h: number) => {
      const dpr = sizeCanvas(canvas, w, h);
      const cols = Math.ceil(w / cellSize);
      const rows = Math.ceil(h / cellSize);

      const squares = new Float32Array(cols * rows);
      for (let i = 0; i < squares.length; i++) {
        squares[i] = Math.random() * maxOpacity;
      }

      return { cols, rows, squares, dpr };
    },
    [cellSize, maxOpacity]
  );

  const updateSquares = useCallback(
    (squares: Float32Array, deltaTime: number) => {
      for (let i = 0; i < squares.length; i++) {
        if (Math.random() < flickerChance * deltaTime) {
          squares[i] = Math.random() * maxOpacity;
        }
      }
    },
    [flickerChance, maxOpacity]
  );

  const drawGrid = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      cols: number,
      rows: number,
      squares: Float32Array,
      dpr: number
    ) => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const opacity = squares[i * rows + j];
          ctx.fillStyle = `${colorPrefix}${opacity})`;
          ctx.fillRect(
            i * cellSize * dpr,
            j * cellSize * dpr,
            squareSize * dpr,
            squareSize * dpr
          );
        }
      }
    },
    [colorPrefix, cellSize, squareSize]
  );

  const drawRipples = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      cols: number,
      rows: number,
      squares: Float32Array,
      dpr: number
    ) => {
      const ripples = activeRipples.current;
      if (ripples.length === 0) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        return;
      }

      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      const now = performance.now();

      for (const ripple of ripples) {
        const elapsed = (now - ripple.startTime) / 1000;
        const leadRadius = elapsed * RIPPLE_SPEED;

        const outerMax = leadRadius + RIPPLE_RING_WIDTH;
        const innerMin = Math.max(
          0,
          leadRadius -
            (RIPPLE_RING_COUNT - 1) * RIPPLE_RING_SPACING -
            RIPPLE_RING_WIDTH
        );

        const minCol = Math.max(
          0,
          Math.floor((ripple.x - outerMax) / cellSize)
        );
        const maxCol = Math.min(
          cols - 1,
          Math.ceil((ripple.x + outerMax) / cellSize)
        );
        const minRow = Math.max(
          0,
          Math.floor((ripple.y - outerMax) / cellSize)
        );
        const maxRow = Math.min(
          rows - 1,
          Math.ceil((ripple.y + outerMax) / cellSize)
        );

        const outerMaxSq = outerMax * outerMax;
        const innerMinSq = innerMin * innerMin;

        for (let i = minCol; i <= maxCol; i++) {
          const dx = i * cellSize + squareSize * 0.5 - ripple.x;

          for (let j = minRow; j <= maxRow; j++) {
            const dy = j * cellSize + squareSize * 0.5 - ripple.y;
            const distSq = dx * dx + dy * dy;

            if (distSq > outerMaxSq || distSq < innerMinSq) continue;

            const dist = Math.sqrt(distSq);
            let boost = 0;

            for (let r = 0; r < RIPPLE_RING_COUNT; r++) {
              const ringRadius = leadRadius - r * RIPPLE_RING_SPACING;
              if (ringRadius <= 0) continue;

              const ringDist = Math.abs(dist - ringRadius);
              if (ringDist < RIPPLE_RING_WIDTH) {
                const ringStrength = 1 - ringDist / RIPPLE_RING_WIDTH;
                const fadeFactor = Math.max(
                  0,
                  1 - ringRadius / ripple.maxRadius
                );
                const ringWeight = 1 - r * 0.18;
                boost +=
                  ringStrength * fadeFactor * fadeFactor * ringWeight * 0.9;
              }
            }

            if (boost > 0.005) {
              const baseOpacity = squares[i * rows + j];
              const rippleOpacity = Math.min(
                (baseOpacity + boost) * (1 + boost * 3),
                1
              );

              ctx.fillStyle = `${colorPrefix}${rippleOpacity})`;
              ctx.fillRect(
                i * cellSize * dpr,
                j * cellSize * dpr,
                squareSize * dpr,
                squareSize * dpr
              );
            }
          }
        }
      }
    },
    [colorPrefix, cellSize, squareSize]
  );

  // Mouse tracking for glow
  useEffect(() => {
    if (!mouseGlow) return;
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleMouseLeave = () => setMousePos(null);

    window.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [mouseGlow]);

  // Click ripple handler
  useEffect(() => {
    if (!clickRipple) return;
    const container = containerRef.current;
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(RIPPLE_IGNORED)) return;
      if (activeRipples.current.length >= RIPPLE_MAX_ACTIVE) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      activeRipples.current.push({
        x,
        y,
        startTime: performance.now(),
        maxRadius: Math.sqrt(
          Math.max(x, rect.width - x) ** 2 + Math.max(y, rect.height - y) ** 2
        ),
      });
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [clickRipple]);

  const maskStyle = useMemo(() => {
    const gradients: string[] = [];

    if (centerGlow) {
      gradients.push(
        `radial-gradient(${centerGlowRadius}px circle at center, white, transparent)`
      );
    }
    if (mouseGlow && mousePos) {
      gradients.push(
        `radial-gradient(${mouseGlowRadius}px circle at ${mousePos.x}px ${mousePos.y}px, white, transparent)`
      );
    }

    if (gradients.length === 0) return undefined;

    const combined = gradients.join(", ");
    return {
      maskImage: combined,
      WebkitMaskImage: combined,
      maskComposite: "add" as const,
      WebkitMaskComposite: "source-over" as const,
    };
  }, [mouseGlow, mousePos, mouseGlowRadius, centerGlow, centerGlowRadius]);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const rippleCanvas = rippleCanvasRef.current;
    const container = containerRef.current;
    const ctx = canvas?.getContext("2d") ?? null;
    const rippleCtx = rippleCanvas?.getContext("2d") ?? null;
    let animationFrameId: number | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;
    let gridParams: ReturnType<typeof setupCanvas> | null = null;

    if (canvas && container && ctx) {
      const updateCanvasSize = () => {
        const newWidth = width || container.clientWidth;
        const newHeight = height || container.clientHeight;
        setCanvasSize({ width: newWidth, height: newHeight });
        gridParams = setupCanvas(canvas, newWidth, newHeight);
        if (rippleCanvas) sizeCanvas(rippleCanvas, newWidth, newHeight);
      };

      updateCanvasSize();

      let lastTime = 0;
      const animate = (time: number) => {
        if (!isInView || !gridParams) return;

        const deltaTime = (time - lastTime) / 1000;
        lastTime = time;

        updateSquares(gridParams.squares, deltaTime);
        drawGrid(
          ctx,
          gridParams.cols,
          gridParams.rows,
          gridParams.squares,
          gridParams.dpr
        );

        if (rippleCtx) {
          drawRipples(
            rippleCtx,
            gridParams.cols,
            gridParams.rows,
            gridParams.squares,
            gridParams.dpr
          );

          if (activeRipples.current.length > 0) {
            const now = performance.now();
            activeRipples.current = activeRipples.current.filter((r) => {
              const elapsed = (now - r.startTime) / 1000;
              const lastRing =
                elapsed * RIPPLE_SPEED -
                (RIPPLE_RING_COUNT - 1) * RIPPLE_RING_SPACING;
              return lastRing < r.maxRadius;
            });
          }
        }

        animationFrameId = requestAnimationFrame(animate);
      };

      resizeObserver = new ResizeObserver(() => updateCanvasSize());
      resizeObserver.observe(container);

      intersectionObserver = new IntersectionObserver(
        ([entry]) => setIsInView(entry.isIntersecting),
        { threshold: 0 }
      );
      intersectionObserver.observe(canvas);

      if (isInView) {
        animationFrameId = requestAnimationFrame(animate);
      }
    }

    return () => {
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      if (resizeObserver) resizeObserver.disconnect();
      if (intersectionObserver) intersectionObserver.disconnect();
    };
  }, [
    setupCanvas,
    updateSquares,
    drawGrid,
    drawRipples,
    width,
    height,
    isInView,
  ]);

  return (
    <div
      ref={containerRef}
      className={`flickering-grid-container ${className || ""}`}
      {...props}
    >
      <canvas
        ref={canvasRef}
        className="flickering-grid-canvas"
        style={{
          ...maskStyle,
          width: canvasSize.width,
          height: canvasSize.height,
        }}
      />
      {clickRipple && (
        <canvas
          ref={rippleCanvasRef}
          className="flickering-grid-ripple-canvas"
          style={{
            width: canvasSize.width,
            height: canvasSize.height,
          }}
        />
      )}
    </div>
  );
};
