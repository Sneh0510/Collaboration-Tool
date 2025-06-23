// ✅ Enhanced Whiteboard with working Socket.IO sync for clear, undo, redo, image upload
import { useRef, useEffect, useState, useCallback } from "react";
import socket from "../lib/socket";
import ColorPicker from "./ColorPicker";
import ShapeTool from "./ShapeTool";

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const previewRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(3);
  const [tool, setTool] = useState("pen");
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = Math.min(window.innerWidth * 0.9, 800);
    canvas.height = 400;

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    contextRef.current = ctx;

    const previewCanvas = previewRef.current;
    previewCanvas.width = canvas.width;
    previewCanvas.height = canvas.height;
    previewCanvas.getContext("2d").clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    socket.on("draw-line", ({ x0, y0, x1, y1, color, width }) => {
      drawLine(x0, y0, x1, y1, color, width, false);
    });

    socket.on("clear-board", () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      previewRef.current.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      setHistory([]);
      setRedoStack([]);
    });

    socket.on("restore-canvas", (imageDataUrl) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = imageDataUrl;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
  });

    return () => {
      socket.off("draw-line");
      socket.off("clear-board");
      socket.off("restore-canvas");
    };
  }, [color, lineWidth]);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    const image = canvas.toDataURL();
    setHistory((prev) => [...prev, image]);
  };

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const newHistory = [...history];
    const last = newHistory.pop();
    setRedoStack((r) => [canvas.toDataURL(), ...r]);
    setHistory(newHistory);

    const img = new Image();
    img.src = newHistory[newHistory.length - 1] || "";
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      socket.emit("restore-canvas", canvas.toDataURL());
    };
    if (newHistory.length === 0) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [history]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const [next, ...rest] = redoStack;
    const img = new Image();
    img.src = next;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      socket.emit("restore-canvas", canvas.toDataURL());
    };
    setHistory((h) => [...h, next]);
    setRedoStack(rest);
  }, [redoStack]);

  const exportCanvas = useCallback(() => {
    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = canvasRef.current.toDataURL();
    link.click();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        redo();
      }
      if (e.key === "e") {
        e.preventDefault();
        exportCanvas();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, exportCanvas]);

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    if (tool === "pen") {
      contextRef.current.beginPath();
      contextRef.current.moveTo(offsetX, offsetY);
    }
    setStartPos({ x: offsetX, y: offsetY });
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;

    const previewCtx = previewRef.current.getContext("2d");
    previewCtx.clearRect(0, 0, previewRef.current.width, previewRef.current.height);

    previewCtx.strokeStyle = color;
    previewCtx.lineWidth = lineWidth;

    if (tool === "pen") {
      drawLine(startPos.x, startPos.y, offsetX, offsetY, color, lineWidth, true);
      setStartPos({ x: offsetX, y: offsetY });
    } else if (tool === "rect") {
      const width = offsetX - startPos.x;
      const height = offsetY - startPos.y;
      previewCtx.strokeRect(startPos.x, startPos.y, width, height);
    } else if (tool === "circle") {
      const radius = Math.sqrt(
        Math.pow(offsetX - startPos.x, 2) + Math.pow(offsetY - startPos.y, 2)
      );
      previewCtx.beginPath();
      previewCtx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
      previewCtx.stroke();
    }
  };

  const finishDrawing = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    const ctx = contextRef.current;
    const previewCtx = previewRef.current.getContext("2d");
    previewCtx.clearRect(0, 0, previewRef.current.width, previewRef.current.height);

    if (tool === "rect") {
      const width = offsetX - startPos.x;
      const height = offsetY - startPos.y;
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.strokeRect(startPos.x, startPos.y, width, height);
    } else if (tool === "circle") {
      const radius = Math.sqrt(
        Math.pow(offsetX - startPos.x, 2) + Math.pow(offsetY - startPos.y, 2)
      );
      ctx.beginPath();
      ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }

    saveToHistory();
    setIsDrawing(false);
  };

  const drawLine = (x0, y0, x1, y1, color, width, emit) => {
    const ctx = contextRef.current;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.closePath();

    if (emit) {
      socket.emit("draw-line", { x0, y0, x1, y1, color, width });
    }
  };

  const clearBoard = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    previewRef.current.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setHistory([]);
    setRedoStack([]);
    socket.emit("clear-board");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const ctx = canvasRef.current.getContext("2d");
      ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
      saveToHistory();
      socket.emit("restore-canvas", canvasRef.current.toDataURL());
    };
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap gap-3 items-center justify-center p-4 bg-white/40 rounded-xl shadow-xl border border-white/40">
        <ColorPicker color={color} setColor={setColor} />
        <ShapeTool tool={tool} setTool={setTool} />
        <input
          type="range"
          min="1"
          max="10"
          value={lineWidth}
          onChange={(e) => setLineWidth(e.target.value)}
          className="w-24"
          title="Brush Thickness"
        />
        <button
          title="Clear Canvas"
          onClick={clearBoard}
          className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
        >
          Clear
        </button>
        <button
          title="Undo (Ctrl+Z)"
          onClick={undo}
          className="bg-yellow-400 text-white px-4 py-1 rounded hover:bg-yellow-500"
        >
          Undo
        </button>
        <button
          title="Redo (Ctrl+Y)"
          onClick={redo}
          className="bg-blue-400 text-white px-4 py-1 rounded hover:bg-blue-500"
        >
          Redo
        </button>
        <button
          title="Export as PNG (E)"
          onClick={exportCanvas}
          className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600"
        >
          Export
        </button>
        <label className="flex items-center gap-3 px-4 py-2 bg-white text-gray-700 rounded-lg shadow-md border border-gray-300 hover:bg-gray-50 transition cursor-pointer">
          <span className="font-medium text-sm">📤 Upload Image</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>
      </div>

      <div className="relative w-full max-w-[800px] flex justify-center overflow-hidden h-[400px] border-4 border-white/30 rounded-lg shadow-lg">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={finishDrawing}
          onMouseMove={draw}
          onMouseLeave={() => setIsDrawing(false)}
          className="absolute top-0 left-0 z-0 bg-white"
        />
        <canvas
          ref={previewRef}
          className="absolute top-0 left-0 z-10 pointer-events-none bg-transparent"
        />
      </div>
    </div>
  );
};

export default Whiteboard;