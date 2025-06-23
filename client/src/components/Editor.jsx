import { useEffect, useState, useRef } from 'react';
import socket from '../lib/socket';

const Editor = () => {
  const [text, setText] = useState('');
  const [isSomeoneTyping, setIsSomeoneTyping] = useState(false);
  const textAreaRef = useRef();
  const typingTimeoutRef = useRef();

  useEffect(() => {
    socket.on('text-update', (newText) => {
      console.log("✉️ received updated text:", newText);
      setText(newText);
    });

    socket.on('show-typing', () => {
      setIsSomeoneTyping(true);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsSomeoneTyping(false);
      }, 2000);
    });

    return () => {
      socket.off('text-update');
      socket.off('show-typing');
    };
  }, []);

  const handleChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    socket.emit('send-text', newText);
    socket.emit('typing');
  };

  return (
    <div className="w-full">
      <h2 className="text-xl sm:text-2xl font-semibold mb-3">Collaborative Text Editor</h2>
      {isSomeoneTyping && (
        <p className="text-sm text-white/70 italic animate-pulse mb-2">Someone is typing...</p>
      )}
      <textarea
        ref={textAreaRef}
        value={text}
        onChange={handleChange}
        spellCheck="false"
        className="w-full h-64 sm:h-72 p-4 rounded-lg bg-white/80 text-black resize-none focus:outline-none"
        placeholder="Start typing with others in real-time..."
      ></textarea>
    </div>
  );
};

export default Editor;