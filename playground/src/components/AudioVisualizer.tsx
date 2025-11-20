import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  volume: number;
  frequency?: number[];
  isActive: boolean;
  className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  volume,
  frequency = [],
  isActive,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      if (!isActive) {
        // Draw inactive state
        ctx.fillStyle = '#e5e7eb';
        ctx.fillRect(width / 2 - 2, height / 2 - 20, 4, 40);
        return;
      }

      // Draw frequency bars
      if (frequency.length > 0) {
        const barWidth = width / frequency.length;
        const maxBarHeight = height * 0.8;

        frequency.forEach((value, index) => {
          const barHeight = (value / 255) * maxBarHeight;
          const x = index * barWidth;
          const y = height - barHeight;

          // Gradient color based on intensity
          const intensity = value / 255;
          ctx.fillStyle = `rgba(59, 130, 246, ${0.3 + intensity * 0.7})`;
          ctx.fillRect(x, y, barWidth - 2, barHeight);
        });
      }

      // Draw volume indicator
      const volumeHeight = (volume / 100) * height * 0.9;
      ctx.fillStyle = isActive ? '#3b82f6' : '#94a3b8';
      ctx.fillRect(10, height - volumeHeight, 30, volumeHeight);

      // Volume label
      ctx.fillStyle = '#1f2937';
      ctx.font = '12px monospace';
      ctx.fillText(`${volume}%`, 10, height - volumeHeight - 5);
    };

    draw();
  }, [volume, frequency, isActive]);

  return (
    <div className={`audio-visualizer ${className}`}>
      <canvas
        ref={canvasRef}
        width={800}
        height={200}
        className="w-full h-full border rounded-lg bg-gray-50"
      />
    </div>
  );
};
