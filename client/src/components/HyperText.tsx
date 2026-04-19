import { useCallback, useEffect, useRef, useState } from "react";
import "components/styles/HyperText.css";

type CharacterSet = string[] | readonly string[];

type HyperTextElement =
  | "div"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "p"
  | "span";

interface HyperTextProps {
  children: string;
  className?: string;
  duration?: number;
  delay?: number;
  as?: HyperTextElement;
  startOnView?: boolean;
  animateOnHover?: boolean;
  characterSet?: CharacterSet;
}

const DEFAULT_CHARACTER_SET = Object.freeze(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
) as readonly string[];

const HOVER_INTERVAL_MS = 50;

const getRandomChar = (set: CharacterSet): string =>
  set[Math.floor(Math.random() * set.length)];

export function HyperText({
  children,
  className,
  duration = 800,
  delay = 0,
  as: Component = "div",
  startOnView = false,
  animateOnHover = true,
  characterSet = DEFAULT_CHARACTER_SET,
}: HyperTextProps) {
  const [displayText, setDisplayText] = useState<string[]>(() =>
    children.split("")
  );
  const [initialDone, setInitialDone] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const hoveredIndices = useRef(new Set<number>());
  const hoverIntervalId = useRef<ReturnType<typeof setInterval> | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  // Initial left-to-right reveal animation
  useEffect(() => {
    if (!startOnView) {
      const startTimeout = setTimeout(() => {
        setIsAnimating(true);
      }, delay);
      return () => clearTimeout(startTimeout);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsAnimating(true);
          }, delay);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "-30% 0px -30% 0px" }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [delay, startOnView]);

  useEffect(() => {
    let animationFrameId: number | null = null;

    if (isAnimating) {
      const maxIterations = children.length;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const revealed = progress * maxIterations;

        setDisplayText(
          children.split("").map((letter, index) => {
            if (letter === " ") return letter;
            if (index <= revealed) return children[index];
            return getRandomChar(characterSet);
          })
        );

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          setInitialDone(true);
        }
      };

      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [children, duration, isAnimating, characterSet]);

  // Per-character hover scramble
  const startHoverLoop = useCallback(() => {
    if (hoverIntervalId.current !== null) return;

    hoverIntervalId.current = setInterval(() => {
      if (hoveredIndices.current.size === 0) {
        clearInterval(hoverIntervalId.current!);
        hoverIntervalId.current = null;
        return;
      }

      setDisplayText((prev) =>
        prev.map((_curr, index) => {
          if (children[index] === " ") return " ";
          if (hoveredIndices.current.has(index))
            return getRandomChar(characterSet);
          return children[index];
        })
      );
    }, HOVER_INTERVAL_MS);
  }, [children, characterSet]);

  const handleCharEnter = useCallback(
    (index: number) => {
      if (!initialDone || !animateOnHover) return;
      hoveredIndices.current.add(index);
      startHoverLoop();
    },
    [initialDone, animateOnHover, startHoverLoop]
  );

  const handleCharLeave = useCallback(
    (index: number) => {
      hoveredIndices.current.delete(index);
      setDisplayText((prev) =>
        prev.map((curr, i) => (i === index ? children[i] : curr))
      );
    },
    [children]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hoverIntervalId.current !== null) {
        clearInterval(hoverIntervalId.current);
      }
    };
  }, []);

  return (
    <Component
      ref={elementRef as React.RefObject<never>}
      className={`hyper-text ${className || ""}`}
    >
      {displayText.map((char, index) => (
        <span
          key={index}
          className={char === " " ? "hyper-text-space" : "hyper-text-char"}
          onMouseEnter={() => handleCharEnter(index)}
          onMouseLeave={() => handleCharLeave(index)}
        >
          {char.toUpperCase()}
        </span>
      ))}
    </Component>
  );
}

export default HyperText;
