import { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface HomeProps {
  onCreateRoom: (nickname: string, maxPlayers: number, totalRounds: number) => void;
  onJoinRoom: (roomCode: string, nickname: string) => void;
}

export function Home({ onCreateRoom, onJoinRoom }: HomeProps) {
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [totalRounds, setTotalRounds] = useState(5);

  const handleCreateRoom = () => {
    if (nickname.trim()) {
      onCreateRoom(nickname, maxPlayers, totalRounds);
    }
  };

  const handleJoinRoom = () => {
    if (nickname.trim() && roomCode.trim()) {
      onJoinRoom(roomCode, nickname);
    }
  };

  if (mode === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="w-16 h-16 text-amber-500" />
            </div>
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 mb-2">
              珍珍
            </h1>
            <p className="text-xl text-gray-400 font-medium">
              至高のエロスで絶頂へ
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setMode('create')}
              className="w-full py-4 px-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-lg rounded-lg transition-all transform hover:scale-105 shadow-lg"
            >
              部屋を作る
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full py-4 px-6 bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg rounded-lg transition-all transform hover:scale-105 shadow-lg"
            >
              部屋に入る
            </button>
          </div>

          <div className="text-center text-gray-500 text-sm mt-8">
            <p>3～6人でプレイ</p>
            <p className="mt-2">18歳以上推奨</p>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl p-8">
          <h2 className="text-3xl font-bold text-amber-400 mb-6">部屋を作る</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 font-medium mb-2">
                ニックネーム
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="名前を入力"
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                maxLength={20}
              />
            </div>

            <div>
              <label className="block text-gray-300 font-medium mb-2">
                最大プレイヤー数
              </label>
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value={3}>3人</option>
                <option value={4}>4人</option>
                <option value={5}>5人</option>
                <option value={6}>6人</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 font-medium mb-2">
                ラウンド数
              </label>
              <select
                value={totalRounds}
                onChange={(e) => setTotalRounds(Number(e.target.value))}
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value={3}>3ラウンド</option>
                <option value={4}>4ラウンド</option>
                <option value={5}>5ラウンド</option>
                <option value={6}>6ラウンド</option>
              </select>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => setMode('menu')}
                className="flex-1 py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                戻る
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={!nickname.trim()}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                作成
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl p-8">
        <h2 className="text-3xl font-bold text-amber-400 mb-6">部屋に入る</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 font-medium mb-2">
              ニックネーム
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="名前を入力"
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              maxLength={20}
            />
          </div>

          <div>
            <label className="block text-gray-300 font-medium mb-2">
              ルームコード
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="6文字のコードを入力"
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none uppercase tracking-wider text-center text-xl font-mono"
              maxLength={6}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={() => setMode('menu')}
              className="flex-1 py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
            >
              戻る
            </button>
            <button
              onClick={handleJoinRoom}
              disabled={!nickname.trim() || !roomCode.trim()}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              参加
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
