export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      word_cards: {
        Row: {
          id: string
          word: string
          created_at: string
        }
        Insert: {
          id?: string
          word: string
          created_at?: string
        }
        Update: {
          id?: string
          word?: string
          created_at?: string
        }
      }
      themes: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      rooms: {
        Row: {
          id: string
          room_code: string
          host_id: string | null
          status: string
          max_players: number
          total_rounds: number
          current_round: number
          current_theme_id: string | null
          round_end_time: string | null
          current_viewing_index: number | null
          show_all_submissions: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_code: string
          host_id?: string | null
          status?: string
          max_players?: number
          total_rounds?: number
          current_round?: number
          current_theme_id?: string | null
          round_end_time?: string | null
          current_viewing_index?: number | null
          show_all_submissions?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_code?: string
          host_id?: string | null
          status?: string
          max_players?: number
          total_rounds?: number
          current_round?: number
          current_theme_id?: string | null
          round_end_time?: string | null
          current_viewing_index?: number | null
          show_all_submissions?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      players: {
        Row: {
          id: string
          room_id: string
          nickname: string
          avatar: string
          total_votes: number
          is_ready: boolean
          joined_at: string
          hand_reloaded_round: number | null
        }
        Insert: {
          id?: string
          room_id: string
          nickname: string
          avatar?: string
          total_votes?: number
          is_ready?: boolean
          joined_at?: string
          hand_reloaded_round?: number | null
        }
        Update: {
          id?: string
          room_id?: string
          nickname?: string
          avatar?: string
          total_votes?: number
          is_ready?: boolean
          joined_at?: string
          hand_reloaded_round?: number | null
        }
      }
      player_hands: {
        Row: {
          id: string
          player_id: string
          word_card_id: string
          created_at: string
        }
        Insert: {
          id?: string
          player_id: string
          word_card_id: string
          created_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          word_card_id?: string
          created_at?: string
        }
      }
      submissions: {
        Row: {
          id: string
          room_id: string
          player_id: string
          round_number: number
          card1_id: string
          card2_id: string
          free_word: string
          word_order: Json
          votes_received: number
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          player_id: string
          round_number: number
          card1_id: string
          card2_id: string
          free_word: string
          word_order?: Json
          votes_received?: number
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          player_id?: string
          round_number?: number
          card1_id?: string
          card2_id?: string
          free_word?: string
          word_order?: Json
          votes_received?: number
          created_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          room_id: string
          round_number: number
          voter_id: string
          submission_id: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          round_number: number
          voter_id: string
          submission_id: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          round_number?: number
          voter_id?: string
          submission_id?: string
          created_at?: string
        }
      }
    }
  }
}
