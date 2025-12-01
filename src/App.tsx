import { useState, useEffect } from 'react';
import { Home } from './components/Home';
import { Lobby } from './components/Lobby';
import { GamePlay } from './components/GamePlay';
import { Voting } from './components/Voting';
import { Results } from './components/Results';
import { useGameState } from './hooks/useGameState';
import * as gameLogic from './lib/gameLogic';

type GamePhase = 'home' | 'lobby' | 'playing' | 'voting' | 'results';

function App() {
  const [phase, setPhase] = useState<GamePhase>('home');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { room, players, currentPlayer, hand, currentTheme, submissions, loading } = useGameState(
    roomId,
    playerId
  );

  useEffect(() => {
    if (!room || !currentPlayer) return;

    if (room.status === 'waiting') {
      setPhase('lobby');
    } else if (room.status === 'playing') {
      const playerSubmission = submissions.find(
        (s) => s.player_id === currentPlayer.id && s.round_number === room.current_round
      );

      const allPlayersSubmitted =
        submissions.filter((s) => s.round_number === room.current_round).length === players.length;

      if (allPlayersSubmitted) {
        const allPlayersVoted =
          players.every((p) => {
            const { data } = { data: null };
            return data;
          });

        if (allPlayersVoted) {
          setPhase('results');
        } else {
          setPhase('voting');
        }
      } else if (playerSubmission) {
        setPhase('voting');
      } else {
        setPhase('playing');
      }
    } else if (room.status === 'finished') {
      setPhase('results');
    }
  }, [room, currentPlayer, submissions, players]);

  const handleCreateRoom = async (nickname: string, maxPlayers: number, totalRounds: number) => {
    try {
      setError(null);
      const { room, player } = await gameLogic.createRoom(nickname, maxPlayers, totalRounds);
      setRoomId(room.id);
      setPlayerId(player.id);
      setPhase('lobby');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    }
  };

  const handleJoinRoom = async (roomCode: string, nickname: string) => {
    try {
      setError(null);
      const { room, player } = await gameLogic.joinRoom(roomCode, nickname);
      setRoomId(room.id);
      setPlayerId(player.id);
      setPhase('lobby');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    }
  };

  const handleStartGame = async () => {
    if (!roomId) return;
    try {
      setError(null);
      await gameLogic.startGame(roomId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game');
    }
  };

  const handleLeaveRoom = () => {
    setRoomId(null);
    setPlayerId(null);
    setPhase('home');
  };

  const handleSubmitAnswer = async (
    card1Id: string,
    card2Id: string,
    freeWord: string,
    wordOrder: number[]
  ) => {
    if (!roomId || !playerId || !room) return;
    try {
      setError(null);
      await gameLogic.submitAnswer(
        roomId,
        playerId,
        room.current_round,
        card1Id,
        card2Id,
        freeWord,
        wordOrder
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answer');
    }
  };

  const handleReloadHand = async () => {
    if (!playerId) return;
    try {
      setError(null);
      await gameLogic.reloadPlayerHand(playerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reload hand');
    }
  };

  const handleVote = async (submissionId: string) => {
    if (!roomId || !playerId || !room) return;
    try {
      setError(null);
      await gameLogic.castVote(roomId, room.current_round, playerId, submissionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cast vote');
    }
  };

  const handleNextRound = async () => {
    if (!roomId) return;
    try {
      setError(null);
      await gameLogic.advanceToNextRound(roomId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to advance round');
    }
  };

  const handleFinish = () => {
    handleLeaveRoom();
  };

  if (loading && phase !== 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-amber-400 text-xl">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="bg-red-900/30 border border-red-500 rounded-lg p-6 max-w-md">
          <h3 className="text-red-400 font-bold text-lg mb-2">エラー</h3>
          <p className="text-red-300">{error}</p>
          <button
            onClick={() => {
              setError(null);
              handleLeaveRoom();
            }}
            className="mt-4 w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'home') {
    return <Home onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
  }

  if (phase === 'lobby' && room && currentPlayer) {
    return (
      <Lobby
        room={room}
        players={players}
        currentPlayer={currentPlayer}
        onStartGame={handleStartGame}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  if (phase === 'playing' && room && currentPlayer) {
    const hasSubmitted = submissions.some(
      (s) => s.player_id === currentPlayer.id && s.round_number === room.current_round
    );

    return (
      <GamePlay
        room={room}
        currentPlayer={currentPlayer}
        hand={hand}
        currentTheme={currentTheme}
        onSubmit={handleSubmitAnswer}
        onReloadHand={handleReloadHand}
        hasSubmitted={hasSubmitted}
      />
    );
  }

  if (phase === 'voting' && room && currentPlayer) {
    const hasVoted = submissions.some((s) => {
      return false;
    });

    return (
      <Voting
        submissions={submissions as any}
        currentPlayer={currentPlayer}
        hasVoted={hasVoted}
        onVote={handleVote}
      />
    );
  }

  if (phase === 'results' && room) {
    return (
      <Results
        room={room}
        players={players}
        onNextRound={handleNextRound}
        onFinish={handleFinish}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
      <div className="text-amber-400 text-xl">準備中...</div>
    </div>
  );
}

export default App;
