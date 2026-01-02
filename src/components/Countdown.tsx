import { useEffect, useState } from 'react';
import type { Database } from '../lib/database.types';

type Theme = Database['public']['Tables']['themes']['Row'];
type Room = Database['public']['Tables']['rooms']['Row'];

interface CountdownProps {
  room: Room;
  theme: Theme | null;
  onComplete: () => void;
}

export function Countdown({ room, theme, onComplete }: CountdownProps) {
  const [count, setCount] = useState(3);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (count > 0) {
      const timer = setTimeout(() => {
        setCount(count - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (count === 0 && !isComplete) {
      setIsComplete(true);
      // 少し待ってから完了
      setTimeout(() => {
        onComplete();
      }, 500);
    }
  }, [count, isComplete, onComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {theme && (
          <div className="mb-8">
            <p className="text-amber-300 text-lg mb-2">ラウンド {room.current_round}</p>
            <h3 className="text-3xl font-bold text-amber-400">{theme.name}</h3>
          </div>
        )}

        <div className="relative">
          <div
            className={`text-9xl font-bold transition-all duration-300 ${
              count > 0
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-600 scale-100'
                : 'text-green-400 scale-150'
            }`}
            style={{
              animation: count > 0 ? 'pulse 0.5s ease-in-out' : 'none',
            }}
          >
            {count > 0 ? count : 'GO!'}
          </div>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.2);
            }
          }
        `}</style>
      </div>
    </div>
  );
}

