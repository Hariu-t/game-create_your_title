import { useState, useEffect, useRef } from 'react';
import { Clock, Shuffle, Send } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { soundManager } from '../utils/sounds';

type Room = Database['public']['Tables']['rooms']['Row'];
type Player = Database['public']['Tables']['players']['Row'];
type WordCard = Database['public']['Tables']['word_cards']['Row'];
type Theme = Database['public']['Tables']['themes']['Row'];

interface GamePlayProps {
  room: Room;
  currentPlayer: Player;
  hand: WordCard[];
  currentTheme: Theme | null;
  onSubmit: (card1Id: string, card2Id: string, freeWord: string, wordOrder: number[]) => void;
  onReloadHand: () => void;
  hasSubmitted: boolean;
}

export function GamePlay({
  room,
  currentPlayer,
  hand,
  currentTheme,
  onSubmit,
  onReloadHand,
  hasSubmitted
}: GamePlayProps) {
  const [selectedCards, setSelectedCards] = useState<WordCard[]>([]);
  const [freeWord, setFreeWord] = useState('');
  const [timeLeft, setTimeLeft] = useState(180);
  const [slots, setSlots] = useState<(WordCard | string | null)[]>([null, null, null]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const hasPlayedStartSound = useRef(false);
  const hasPlayedEndSound = useRef(false);
  const bgmStarted = useRef(false);

  // シンキングタイム開始時の処理
  useEffect(() => {
    if (!hasPlayedStartSound.current && room.round_end_time) {
      // 開始音を再生
      soundManager.playStartSound();
      hasPlayedStartSound.current = true;

      // BGMを開始
      if (!bgmStarted.current) {
        soundManager.startBGM();
        bgmStarted.current = true;
      }
    }

    // コンポーネントのアンマウント時にBGMを停止
    return () => {
      soundManager.stopBGM();
    };
  }, [room.round_end_time]);

  // タイマーの処理
  useEffect(() => {
    if (!room.round_end_time) return;

    const timer = setInterval(() => {
      const endTime = new Date(room.round_end_time!).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeft(remaining);

      // 時間が0になったら終了音を再生
      if (remaining === 0 && !hasPlayedEndSound.current) {
        soundManager.playEndSound();
        soundManager.stopBGM();
        hasPlayedEndSound.current = true;
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [room.round_end_time]);

  const handleCardClick = (card: WordCard) => {
    if (hasSubmitted) return;
    if (selectedCards.find(c => c.id === card.id)) {
      setSelectedCards(selectedCards.filter(c => c.id !== card.id));
      setSlots(slots.map(s => s && typeof s === 'object' && s.id === card.id ? null : s));
    } else if (selectedCards.length < 2) {
      setSelectedCards([...selectedCards, card]);
      const emptySlotIndex = slots.findIndex(s => s === null);
      if (emptySlotIndex !== -1) {
        const newSlots = [...slots];
        newSlots[emptySlotIndex] = card;
        setSlots(newSlots);
      }
    }
  };

  const handleSlotClick = (index: number) => {
    if (hasSubmitted) return;
    const slot = slots[index];
    if (slot) {
      if (typeof slot === 'object') {
        setSelectedCards(selectedCards.filter(c => c.id !== slot.id));
      } else {
        setFreeWord('');
      }
      const newSlots = [...slots];
      newSlots[index] = null;
      setSlots(newSlots);
    } else if (freeWord && !slots.includes(freeWord)) {
      const newSlots = [...slots];
      newSlots[index] = freeWord;
      setSlots(newSlots);
    }
  };

  const handleDragStart = (index: number) => {
    if (hasSubmitted || slots[index] === null) return;
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (hasSubmitted || draggedIndex === null) return;
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (hasSubmitted || draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newSlots = [...slots];
    const [draggedItem] = newSlots.splice(draggedIndex, 1);
    newSlots.splice(targetIndex, 0, draggedItem);
    setSlots(newSlots);
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSubmit = () => {
    if (selectedCards.length !== 2 || !freeWord || hasSubmitted) return;

    const filledSlots = slots.filter(s => s !== null);
    if (filledSlots.length !== 3) return;

    const wordOrder = slots.map(slot => {
      if (!slot) return 0;
      if (typeof slot === 'string') return 3;
      if (slot.id === selectedCards[0].id) return 1;
      if (slot.id === selectedCards[1].id) return 2;
      return 0;
    });

    onSubmit(selectedCards[0].id, selectedCards[1].id, freeWord, wordOrder);
  };

  const canSubmit = selectedCards.length === 2 &&
                    freeWord.length > 0 &&
                    freeWord.length <= 5 &&
                    slots.filter(s => s !== null).length === 3 &&
                    !hasSubmitted;

  const getTitle = () => {
    return slots.map(slot => {
      if (!slot) return '___';
      if (typeof slot === 'string') return slot;
      return slot.word;
    }).join('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <div className="max-w-6xl mx-auto py-8">
        <div className="bg-gray-800 rounded-xl shadow-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-gray-400 text-sm">ラウンド {room.current_round} / {room.total_rounds}</span>
              <h2 className="text-2xl font-bold text-amber-400">
                テーマ: {currentTheme?.name || '読み込み中...'}
              </h2>
              {currentTheme?.description && (
                <p className="text-gray-400 text-sm mt-1">{currentTheme.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-2 bg-gray-900 px-4 py-2 rounded-lg">
              <Clock className="w-5 h-5 text-amber-400" />
              <span className="text-2xl font-mono font-bold text-white">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 mb-6">
            <p className="text-gray-400 text-sm mb-4 text-center">タイトルプレビュー</p>
            <div className="text-center text-3xl font-bold text-white bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent min-h-[3rem] flex items-center justify-center">
              {getTitle()}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-gray-300 font-medium mb-3">タイトル構築エリア（3つのスロット）</p>
            <div className="grid grid-cols-3 gap-3">
              {slots.map((slot, index) => (
                <div
                  key={index}
                  draggable={!hasSubmitted && slot !== null}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleSlotClick(index)}
                  className={`h-24 rounded-lg border-2 border-dashed transition-all ${
                    slot
                      ? 'bg-amber-600 border-amber-400 text-white font-bold'
                      : 'bg-gray-700 border-gray-600 text-gray-500'
                  } ${
                    hasSubmitted 
                      ? 'cursor-not-allowed opacity-50' 
                      : slot !== null
                      ? 'hover:border-amber-500 cursor-move'
                      : 'hover:border-amber-500 cursor-pointer'
                  } ${
                    dragOverIndex === index ? 'ring-2 ring-amber-300 ring-offset-2' : ''
                  } ${
                    draggedIndex === index ? 'opacity-50' : ''
                  }`}
                >
                  {slot ? (
                    <div className="text-lg px-2">
                      {typeof slot === 'string' ? slot : slot.word}
                    </div>
                  ) : (
                    <div className="text-4xl">+</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-gray-300 font-medium mb-2">
              フリーワード（5文字以内）
            </label>
            <input
              type="text"
              value={freeWord}
              onChange={(e) => setFreeWord(e.target.value)}
              placeholder="自由に入力"
              maxLength={5}
              disabled={hasSubmitted}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            />
            <p className="text-gray-500 text-sm mt-1">{freeWord.length}/5文字</p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onReloadHand}
              disabled={hasSubmitted || (currentPlayer.hand_reloaded_round === room.current_round)}
              className={`px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center space-x-2 ${
                currentPlayer.hand_reloaded_round === room.current_round ? 'opacity-50' : ''
              }`}
            >
              <Shuffle className="w-5 h-5" />
              <span>{currentPlayer.hand_reloaded_round === room.current_round ? 'リロード済み' : '手札リロード'}</span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Send className="w-5 h-5" />
              <span>{hasSubmitted ? '提出済み' : '回答を提出'}</span>
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-2xl p-6">
          <h3 className="text-xl font-bold text-gray-300 mb-4">手札</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {hand.map((card) => {
              const isSelected = selectedCards.find(c => c.id === card.id);
              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card)}
                  disabled={hasSubmitted}
                  className={`p-4 rounded-lg font-medium transition-all ${
                    isSelected
                      ? 'bg-amber-600 text-white ring-2 ring-amber-400'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  } ${hasSubmitted ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {card.word}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
