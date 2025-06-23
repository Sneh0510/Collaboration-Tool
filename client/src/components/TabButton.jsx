const TabButton = ({ label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg transition font-semibold ${
        active
          ? 'bg-white text-indigo-600 shadow-md'
          : 'bg-white/20 text-white hover:bg-white/30'
      }`}
    >
      {label}
    </button>
  );
};

export default TabButton;