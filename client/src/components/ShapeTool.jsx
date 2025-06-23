const ShapeTool = ({ tool, setTool }) => {
  return (
    <select
      value={tool}
      onChange={(e) => setTool(e.target.value)}
      className="bg-white text-black px-2 py-1 rounded shadow"
    >
      <option value="pen">✍️ Pen</option>
      <option value="rect">▭ Rectangle</option>
      <option value="circle">⚪ Circle</option>
    </select>
  );
};

export default ShapeTool;
