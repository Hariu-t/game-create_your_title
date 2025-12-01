import { Users, Copy, Check, Crown } from 'lucide-react';
import { useState } from 'react';
import type { Database } from '../lib/database.types';

type Room = Database['public']['Tables']['rooms']['Row'];
type Player = Database['public']['Tables']['players']['Row'];

interface LobbyProps {
  room: Room;
  players: Player[];
  currentPlayer: Player;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export function Lobby({ room, players, currentPlayer, onStartGame, onLeaveRoom }: LobbyProps) {
  const [copied, setCopied] = useState(false);
  const isHost = room.host_id === currentPlayer.id;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.room_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-gray-800 rounded-xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-amber-400 mb-4">待機中</h2>

          <div className="bg-gray-900 rounded-lg p-4 inline-block">
            <p className="text-gray-400 text-sm mb-2">ルームコード</p>
            <div className="flex items-center space-x-2">
              <span className="text-3xl font-mono font-bold text-white tracking-wider">
                {room.room_code}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-amber-400" />
              <span className="text-gray-300 font-medium">
                プレイヤー ({players.length}/{room.max_players})
              </span>
            </div>
            <span className="text-gray-400 text-sm">
              {room.total_rounds}ラウンド
            </span>
          </div>

          <div className="space-y-3">
            {players.map((player) => (
              <div
                key={player.id}
                className="bg-gray-800 rounded-lg p-4 flex items-center space-x-3"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {player.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium">{player.nickname}</span>
                    {player.id === room.host_id && (
                      <Crown className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {players.length < 3 && (
          <div className="bg-orange-900/30 border border-orange-500/50 rounded-lg p-4 mb-6">
            <p className="text-orange-300 text-center text-sm">
              最低3人のプレイヤーが必要です
            </p>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={onLeaveRoom}
            className="flex-1 py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            退出
          </button>
          {isHost && (
            <button
              onClick={onStartGame}
              disabled={players.length < 3}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
            >
              ゲーム開始
            </button>
          )}
        </div>

        {!isHost && (
          <p className="text-center text-gray-500 text-sm mt-4">
            ホストがゲームを開始するまでお待ちください
          </p>
        )}
      </div>
    </div>
  );
}
