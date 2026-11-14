import React, { useLayoutEffect, useRef, useState } from "react";
import { Typography, TypographyProps, Box } from "@mui/material";

interface MarqueeOnOverflowProps extends TypographyProps {
  duration?: number;
}

const MarqueeOnOverflow: React.FC<MarqueeOnOverflowProps> = ({
  children,
  duration = 8,
  sx,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [enabled, setEnabled] = useState(false);

  useLayoutEffect(() => {
    let frame: number;

    const measure = () => {
      if (!containerRef.current || !textRef.current) return;
      setEnabled(textRef.current.scrollWidth > containerRef.current.clientWidth);
    };

    // use requestAnimationFrame to ensure layout has settled
    frame = requestAnimationFrame(measure);

    // optional: also check on resize
    window.addEventListener("resize", measure);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
    };
  }, [children]);

  return (
    <Box
      ref={containerRef}
      sx={{
        overflow: "hidden",
        whiteSpace: "nowrap",
        width: "100%",
      }}
    >
      <Typography
        ref={textRef}
        component="span"
        {...props}
        className={enabled ? "marquee-enabled" : undefined}
        sx={{
          display: "inline-block",
          whiteSpace: "nowrap",
          "--marquee-duration": `${duration}s`,
          ...sx,
        }}
      >
        {children}
      </Typography>
    </Box>
  );
};

export default MarqueeOnOverflow;