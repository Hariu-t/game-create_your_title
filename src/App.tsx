import { useState, useEffect } from 'react';
import { Home } from './components/Home';
import { Lobby } from './components/Lobby';
import { ThemeSelection } from './components/ThemeSelection';
import { Countdown } from './components/Countdown';
import { GamePlay } from './components/GamePlay';
import { Voting } from './components/Voting';
import { Results } from './components/Results';
import { useGameState } from './hooks/useGameState';
import * as gameLogic from './lib/gameLogic';

type GamePhase = 'home' | 'lobby' | 'theme_selection' | 'countdown' | 'playing' | 'voting' | 'results';

function App() {
  const [phase, setPhase] = useState<GamePhase>('home');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { room, players, currentPlayer, hand, currentTheme, submissions, currentVote, allVotes, loading } = useGameState(
    roomId,
    playerId
  );

  useEffect(() => {
    if (!room || !currentPlayer) return;

    if (room.status === 'waiting') {
      setPhase('lobby');
    } else if (room.status === 'theme_selection') {
      setPhase('theme_selection');
    } else if (room.status === 'countdown') {
      setPhase('countdown');
    } else if (room.status === 'playing') {
      // 制限時間が過ぎたかチェック
      const isTimeUp = room.round_end_time && new Date(room.round_end_time).getTime() <= Date.now();
      
      if (isTimeUp) {
        // 制限時間が過ぎたら投票画面に遷移（全員の回答を待たない）
        setPhase('voting');
        return;
      }

      const currentRoundSubmissions = submissions.filter((s) => s.round_number === room.current_round);
      const playerSubmission = currentRoundSubmissions.find(
        (s) => s.player_id === currentPlayer.id
      );

      const allPlayersSubmitted = currentRoundSubmissions.length === players.length;

      if (allPlayersSubmitted) {
        setPhase('voting');
      } else if (playerSubmission) {
        setPhase('voting');
      } else {
        setPhase('playing');
      }
    } else if (room.status === 'voting' || room.status === 'results') {
      // 投票フェーズまたは結果フェーズで、全員の投票が完了しているかチェック
      const currentRoundSubmissions = submissions.filter((s) => s.round_number === room.current_round);
      const allPlayersVoted = players.length > 0 && 
        allVotes.length === players.length &&
        players.every((p) => allVotes.some((v) => v.voter_id === p.id));

      // デバッグログ
      if (process.env.NODE_ENV === 'development') {
        console.log('Voting check:', {
          playersCount: players.length,
          votesCount: allVotes.length,
          allPlayersVoted,
          currentRound: room.current_round,
          currentRoundSubmissionsCount: currentRoundSubmissions.length,
          roomStatus: room.status,
          votes: allVotes.map(v => v.voter_id),
          players: players.map(p => p.id)
        });
      }

      if (room.status === 'results') {
        // 既にresultsステータスなら結果画面を表示
        setPhase('results');
      } else if (allPlayersVoted && currentRoundSubmissions.length > 0) {
        setPhase('results');
      } else {
        setPhase('voting');
      }
    } else if (room.status === 'finished') {
      setPhase('results');
    }
  }, [room, currentPlayer, submissions, players, allVotes]);

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

  const handleThemeSelected = async () => {
    if (!roomId) return;
    try {
      setError(null);
      await gameLogic.startCountdown(roomId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start countdown');
    }
  };

  const handleCountdownComplete = async () => {
    if (!roomId) return;
    try {
      setError(null);
      await gameLogic.startPlaying(roomId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start playing');
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
    const isSupabaseError = error.includes('Supabase') || error.includes('データベース接続') || error.includes('環境変数') || error.includes('接続に失敗');
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="bg-red-900/30 border border-red-500 rounded-lg p-6 max-w-md">
          <h3 className="text-red-400 font-bold text-lg mb-2">エラー</h3>
          <p className="text-red-300 mb-4">{error}</p>
          {isSupabaseError && (
            <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-4 mb-4">
              <p className="text-yellow-300 text-sm mb-2">
                <strong>Supabaseのセットアップが必要です</strong>
              </p>
              <p className="text-yellow-200 text-xs">
                1. Supabaseプロジェクトを作成<br/>
                2. マイグレーションファイルを実行<br/>
                3. .envファイルに環境変数を設定<br/>
                4. 開発サーバーを再起動<br/>
                <br/>
                詳細は SETUP.md を参照してください
              </p>
            </div>
          )}
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

  if (phase === 'theme_selection' && room && currentTheme) {
    return (
      <ThemeSelection
        room={room}
        theme={currentTheme}
        onThemeSelected={handleThemeSelected}
      />
    );
  }

  if (phase === 'countdown' && room && currentTheme) {
    return (
      <Countdown
        room={room}
        theme={currentTheme}
        onComplete={handleCountdownComplete}
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
    const hasVoted = currentVote !== null;

    // submissionsが未定義の場合は空配列を使用
    const safeSubmissions = submissions || [];

    return (
      <Voting
        submissions={safeSubmissions as any}
        currentPlayer={currentPlayer}
        hasVoted={hasVoted}
        currentVoteSubmissionId={currentVote?.submission_id || null}
        onVote={handleVote}
        room={room}
        players={players}
      />
    );
  }

  if (phase === 'results' && room && currentPlayer) {
    return (
      <Results
        room={room}
        players={players}
        submissions={submissions as any}
        currentPlayer={currentPlayer}
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
