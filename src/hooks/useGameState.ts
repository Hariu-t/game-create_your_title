import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Room = Database['public']['Tables']['rooms']['Row'];
type Player = Database['public']['Tables']['players']['Row'];
type WordCard = Database['public']['Tables']['word_cards']['Row'];
type Theme = Database['public']['Tables']['themes']['Row'];
type Submission = Database['public']['Tables']['submissions']['Row'];

export function useGameState(roomId: string | null, playerId: string | null) {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [hand, setHand] = useState<WordCard[]>([]);
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [currentVote, setCurrentVote] = useState<{ submission_id: string } | null>(null);
  const [allVotes, setAllVotes] = useState<{ voter_id: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    const fetchRoomData = async () => {
      const { data: roomData } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .maybeSingle();

      if (roomData) {
        setRoom(roomData);

        if (roomData.current_theme_id) {
          const { data: themeData } = await supabase
            .from('themes')
            .select('*')
            .eq('id', roomData.current_theme_id)
            .maybeSingle();

          setCurrentTheme(themeData);
        }
      }

      const { data: playersData } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .order('joined_at');

      setPlayers(playersData || []);

      if (playerId) {
        const currentPlayerData = playersData?.find(p => p.id === playerId);
        setCurrentPlayer(currentPlayerData || null);

        const { data: handData } = await supabase
          .from('player_hands')
          .select('word_card_id, word_cards(*)')
          .eq('player_id', playerId);

        if (handData) {
          const cards = handData
            .map(h => (h as any).word_cards)
            .filter(Boolean) as WordCard[];
          setHand(cards);
        }
      }

      // 現在のラウンドの提出を取得（current_roundが0以上の場合）
      if (roomData?.current_round !== undefined && roomData.current_round >= 0) {
        const { data: submissionsData } = await supabase
          .from('submissions')
          .select('*, players(*), word_cards!submissions_card1_id_fkey(*), word_cards_card2:word_cards!submissions_card2_id_fkey(*)')
          .eq('room_id', roomId)
          .eq('round_number', roomData.current_round);

        setSubmissions(submissionsData as any || []);

        // 現在のプレイヤーの投票を取得
        if (playerId && roomData.current_round > 0) {
          const { data: voteData } = await supabase
            .from('votes')
            .select('submission_id')
            .eq('room_id', roomId)
            .eq('round_number', roomData.current_round)
            .eq('voter_id', playerId)
            .maybeSingle();

          setCurrentVote(voteData ? { submission_id: voteData.submission_id } : null);
        }

        // 全員の投票状況を取得
        if (roomData.current_round >= 0) {
          const { data: votesData } = await supabase
            .from('votes')
            .select('voter_id')
            .eq('room_id', roomId)
            .eq('round_number', roomData.current_round);

          setAllVotes(votesData || []);
        } else {
          setAllVotes([]);
        }
      } else {
        // current_roundが未定義の場合は空配列を設定
        setSubmissions([]);
        setAllVotes([]);
      }

      setLoading(false);
    };

    fetchRoomData();

    // リアルタイム購読の設定
    const roomChannel = supabase
      .channel(`room:${roomId}`, {
        config: {
          broadcast: { self: true }
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${roomId}`
      }, (payload) => {
        console.log('Room changed:', payload);
        fetchRoomData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        console.log('Player changed:', payload);
        fetchRoomData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'submissions',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        console.log('Submission changed:', payload);
        fetchRoomData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'votes',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        console.log('Vote changed:', payload);
        fetchRoomData();
      })
      .subscribe((status) => {
        console.log('Room channel subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to room changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel subscription error');
        } else if (status === 'TIMED_OUT') {
          console.warn('⚠️ Channel subscription timed out');
        } else if (status === 'CLOSED') {
          console.warn('⚠️ Channel closed');
        }
      });

    let handChannel: ReturnType<typeof supabase.channel> | null = null;

    if (playerId) {
      handChannel = supabase
        .channel(`player_hand:${playerId}`, {
          config: {
            broadcast: { self: true }
          }
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'player_hands',
          filter: `player_id=eq.${playerId}`
        }, (payload) => {
          console.log('Player hand changed:', payload);
          fetchRoomData();
        })
        .subscribe((status) => {
          console.log('Hand channel subscription status:', status);
        });

      return () => {
        roomChannel.unsubscribe();
        if (handChannel) {
          handChannel.unsubscribe();
        }
      };
    }

    return () => {
      roomChannel.unsubscribe();
    };
  }, [roomId, playerId]);

  return {
    room,
    players,
    currentPlayer,
    hand,
    currentTheme,
    submissions,
    currentVote,
    allVotes,
    loading
  };
}
