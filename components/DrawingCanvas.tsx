'use client';
import { useEffect, useRef, useState } from 'react';
import { Eraser, Pencil, Redo2, Trash2, Undo2 } from 'lucide-react';
export function DrawingCanvas({
  a,
  b,
  operator,
  worksheetTable,
  large = false,
  resetKey,
}: {
  a?: number;
  b?: number;
  operator?: '+' | '−' | '×' | '÷';
  worksheetTable?: number;
  large?: boolean;
  resetKey: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<'pencil' | 'eraser'>('pencil');
  const [history, setHistory] = useState<ImageData[]>([]);
  const [redo, setRedo] = useState<ImageData[]>([]);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const fit = () => {
      const old = c.width ? c.toDataURL() : '';
      c.width = c.clientWidth * devicePixelRatio;
      c.height = c.clientHeight * devicePixelRatio;
      const x = c.getContext('2d')!;
      x.scale(devicePixelRatio, devicePixelRatio);
      if (old) {
        const im = new Image();
        im.onload = () => x.drawImage(im, 0, 0, c.clientWidth, c.clientHeight);
        im.src = old;
      }
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.getContext('2d')?.clearRect(0, 0, c.width, c.height);
    setHistory([]);
    setRedo([]);
  }, [resetKey]);
  const snapshot = () => {
    const c = ref.current!,
      x = c.getContext('2d')!;
    setHistory((h) =>
      [...h, x.getImageData(0, 0, c.width, c.height)].slice(-20),
    );
    setRedo([]);
  };
  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    snapshot();
    const c = e.currentTarget,
      x = c.getContext('2d')!,
      r = c.getBoundingClientRect();
    c.setPointerCapture(e.pointerId);
    x.beginPath();
    x.moveTo(e.clientX - r.left, e.clientY - r.top);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const c = e.currentTarget,
      x = c.getContext('2d')!,
      r = c.getBoundingClientRect();
    x.lineCap = 'round';
    x.lineJoin = 'round';
    x.globalCompositeOperation =
      tool === 'eraser' ? 'destination-out' : 'source-over';
    x.strokeStyle = '#493d63';
    x.lineWidth = tool === 'eraser' ? 24 : Math.max(3, 4 * (e.pressure || 0.5));
    for (const point of e.nativeEvent.getCoalescedEvents?.() ?? [
      e.nativeEvent,
    ]) {
      x.lineTo(point.clientX - r.left, point.clientY - r.top);
      x.stroke();
    }
  };
  const clear = () => {
    snapshot();
    const c = ref.current!;
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height);
  };
  const back = () => {
    if (!history.length) return;
    const c = ref.current!,
      x = c.getContext('2d')!;
    setRedo((r) => [x.getImageData(0, 0, c.width, c.height), ...r]);
    x.putImageData(history[history.length - 1], 0, 0);
    setHistory((h) => h.slice(0, -1));
  };
  const forward = () => {
    if (!redo.length) return;
    const c = ref.current!,
      x = c.getContext('2d')!;
    setHistory((h) => [...h, x.getImageData(0, 0, c.width, c.height)]);
    x.putImageData(redo[0], 0, 0);
    setRedo((r) => r.slice(1));
  };
  return (
    <div className="notebook">
      <div className="canvas-tools">
        <button
          className={tool === 'pencil' ? 'active' : ''}
          onClick={() => setTool('pencil')}
        >
          <Pencil /> Pencil
        </button>
        <button
          className={tool === 'eraser' ? 'active' : ''}
          onClick={() => setTool('eraser')}
        >
          <Eraser /> Eraser
        </button>
        <button onClick={back} disabled={!history.length}>
          <Undo2 /> Undo
        </button>
        <button onClick={forward} disabled={!redo.length}>
          <Redo2 /> Redo
        </button>
        <button onClick={clear}>
          <Trash2 /> Clear
        </button>
      </div>
      <div className="notebook-paper">
        {worksheetTable ? (
          <div
            className="handwritten-table-template"
            aria-label={`${worksheetTable} multiplication table worksheet`}
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <span key={n}>
                {worksheetTable} × {n} =
              </span>
            ))}
          </div>
        ) : (
          <div
            className="vertical-problem notebook-problem"
            aria-label={`${a} ${operator} ${b}`}
          >
            <span>{a}</span>
            <span>
              {operator} {b}
            </span>
            <hr />
          </div>
        )}
        <canvas
          aria-label="Digital notebook. Continue writing your working solution below the given problem."
          ref={ref}
          className={large ? 'large' : ''}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={(e) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId))
              e.currentTarget.releasePointerCapture(e.pointerId);
          }}
          onPointerCancel={(e) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId))
              e.currentTarget.releasePointerCapture(e.pointerId);
          }}
        />
      </div>
    </div>
  );
}
