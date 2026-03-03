import { useState, type FormEvent } from 'react'

type ChatMessage = {
  role: 'user' | 'bot';
  text: string;
};

export default function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

    const sendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
        role: 'user',
        text: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
        const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
        });

        const data = await res.json();

        const botMessage: ChatMessage = {
        role: 'bot',
        text: data.reply,
        };

        setMessages(prev => [...prev, botMessage]);
    } catch (err) {
        setMessages(prev => [
        ...prev,
        { role: 'bot', text: 'Server error.' },
        ]);
    } finally {
        setLoading(false);
    }
    };


  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-700"
        >
          💬
        </button>
      )}

      {isOpen && (
        <div className="bg-white rounded-lg shadow-xl w-96 h-[500px] flex flex-col">
          <div className="bg-green-500 text-white p-4 rounded-t-lg flex justify-between items-center">
            <h3 className="font-semibold">AI Assistant</h3>
            <button onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 p-3 rounded-lg">Typing...</div>
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );  
}
