const ColorPicker = ({ color, setColor }) => {
  return (
    <input
      type="color"
      value={color}
      onChange={(e) => setColor(e.target.value)}
      className="w-10 h-10 rounded-full border border-white cursor-pointer"
    />
  );
};

export default ColorPicker;