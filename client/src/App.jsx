import { useState } from 'react';
import Editor from './components/Editor';
import Whiteboard from './components/WhiteBoard';
import TabButton from './components/TabButton';

function App() {
  const [view, setView] = useState('editor');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white font-sans px-4 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8">
        🛠️ Real-Time Collaboration Tool
      </h1>

      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
        <TabButton label="✍️ Editor" active={view === 'editor'} onClick={() => setView('editor')} />
        <TabButton label="🎨 Whiteboard" active={view === 'whiteboard'} onClick={() => setView('whiteboard')} />
      </div>

      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-xl rounded-xl shadow-lg p-4 sm:p-6 w-full">
        {view === 'editor' ? <Editor /> : <Whiteboard />}
      </div>
    </div>
  );
}

export default App;
