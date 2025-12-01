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

      if (roomData?.current_round && roomData.current_round > 0) {
        const { data: submissionsData } = await supabase
          .from('submissions')
          .select('*, players(*), word_cards!submissions_card1_id_fkey(*), word_cards_card2:word_cards!submissions_card2_id_fkey(*)')
          .eq('room_id', roomId)
          .eq('round_number', roomData.current_round);

        setSubmissions(submissionsData as any || []);
      }

      setLoading(false);
    };

    fetchRoomData();

    const roomChannel = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${roomId}`
      }, () => {
        fetchRoomData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `room_id=eq.${roomId}`
      }, () => {
        fetchRoomData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'submissions',
        filter: `room_id=eq.${roomId}`
      }, () => {
        fetchRoomData();
      })
      .subscribe();

    if (playerId) {
      const handChannel = supabase
        .channel(`player_hand:${playerId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'player_hands',
          filter: `player_id=eq.${playerId}`
        }, () => {
          fetchRoomData();
        })
        .subscribe();

      return () => {
        roomChannel.unsubscribe();
        handChannel.unsubscribe();
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
    loading
  };
}
