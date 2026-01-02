import { useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Theme = Database['public']['Tables']['themes']['Row'];
type Room = Database['public']['Tables']['rooms']['Row'];

interface ThemeSelectionProps {
  room: Room;
  theme: Theme | null;
  onThemeSelected: () => void;
}

export function ThemeSelection({ room, theme, onThemeSelected }: ThemeSelectionProps) {
  // テーマ選択画面を3秒表示した後、自動的にカウントダウンに進む
  useEffect(() => {
    const timer = setTimeout(() => {
      onThemeSelected();
    }, 3000); // 3秒後にカウントダウンに進む

    return () => clearTimeout(timer);
  }, [onThemeSelected]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-gray-800 rounded-xl shadow-2xl p-8 text-center">
        <div className="mb-8">
          <Sparkles className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-amber-400 mb-2">ラウンド {room.current_round}</h2>
          <p className="text-gray-400">テーマが決定しました</p>
        </div>

        {theme && (
          <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-2 border-amber-500/50 rounded-xl p-8 mb-8">
            <p className="text-amber-300 text-sm mb-4">今回のテーマは</p>
            <h3 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-600 mb-4">
              {theme.name}
            </h3>
            {theme.description && (
              <p className="text-gray-300 text-lg">{theme.description}</p>
            )}
          </div>
        )}

        <div className="text-gray-400 text-sm">
          <p>準備が整い次第、カウントダウンが始まります...</p>
        </div>
      </div>
    </div>
  );
}

