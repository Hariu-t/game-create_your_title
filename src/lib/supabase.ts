import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 開発環境で環境変数が設定されていない場合の警告
const isConfigValid = supabaseUrl && 
                      supabaseAnonKey && 
                      supabaseUrl !== 'your_supabase_project_url' && 
                      supabaseAnonKey !== 'your_supabase_anon_key';

if (!isConfigValid) {
  console.warn('⚠️ Supabase環境変数が設定されていません。.envファイルにVITE_SUPABASE_URLとVITE_SUPABASE_ANON_KEYを設定してください。');
  console.warn('現在の値:', { 
    url: supabaseUrl || '未設定', 
    key: supabaseAnonKey ? '***' : '未設定' 
  });
}

// ダミーのURLとキーでクライアントを作成（エラーを防ぐため）
// 実際のSupabase機能は動作しませんが、アプリケーションは起動します
const finalUrl = isConfigValid ? supabaseUrl : 'https://placeholder.supabase.co';
const finalKey = isConfigValid ? supabaseAnonKey : 'dummy-key';

export const supabase = createClient<Database>(finalUrl, finalKey);

// 接続テスト関数
export async function testSupabaseConnection(): Promise<{ success: boolean; error?: string }> {
  if (!isConfigValid) {
    return { 
      success: false, 
      error: '環境変数が設定されていません。.envファイルを確認してください。' 
    };
  }

  try {
    // 簡単なクエリで接続をテスト
    const { error } = await supabase.from('word_cards').select('id').limit(1);
    
    if (error) {
      // テーブルが存在しない場合もエラーになる可能性がある
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return { 
          success: false, 
          error: 'データベースのテーブルが作成されていません。マイグレーションファイルを実行してください。' 
        };
      }
      return { 
        success: false, 
        error: `接続エラー: ${error.message}` 
      };
    }
    
    return { success: true };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { 
        success: false, 
        error: 'Supabaseへの接続に失敗しました。URLとキーが正しいか確認してください。' 
      };
    }
    return { 
      success: false, 
      error: `予期しないエラー: ${error instanceof Error ? error.message : '不明なエラー'}` 
    };
  }
}
