# Supabase Realtime機能のセットアップ

## 問題: 参加者がリアルタイムで反映されない

参加者が部屋に参加しても、ホストプレイヤーの画面に即座に反映されない場合、SupabaseのRealtime機能が有効になっていない可能性があります。

## 解決方法

### ステップ1: SupabaseダッシュボードでRealtimeを有効化

1. [Supabaseダッシュボード](https://app.supabase.com)にログイン
2. プロジェクトを選択
3. 左メニューから「Database」→「Replication」を選択
4. 以下のテーブルで「Enable」をクリック：
   - `rooms`
   - `players`
   - `player_hands`
   - `submissions`
   - `votes`

### ステップ2: または、SQLで一括有効化

1. 左メニューから「SQL Editor」を選択
2. 「New query」をクリック
3. 以下のSQLを貼り付けて実行：

```sql
-- Realtimeを有効化
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE player_hands;
ALTER PUBLICATION supabase_realtime ADD TABLE submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE votes;
```

### ステップ3: 動作確認

1. ブラウザのコンソール（F12）を開く
2. 部屋を作成してロビーに入る
3. コンソールに以下のメッセージが表示されることを確認：
   - `✅ Successfully subscribed to room changes`
   - `Room channel subscription status: SUBSCRIBED`

4. 別のブラウザ（またはシークレットモード）で参加
5. ホストプレイヤーの画面に参加者が即座に表示されることを確認

## トラブルシューティング

### コンソールに「CHANNEL_ERROR」と表示される場合

1. SupabaseプロジェクトのRealtime機能が有効になっているか確認
2. テーブルがRealtimeに追加されているか確認
3. ネットワーク接続を確認

### コンソールに「TIMED_OUT」と表示される場合

1. ネットワーク接続を確認
2. ファイアウォールやプロキシの設定を確認
3. ブラウザをリロードして再試行

### それでも反映されない場合

1. ブラウザのコンソール（F12）でエラーメッセージを確認
2. エラーメッセージをメモして、サポートに問い合わせ

## 注意事項

- Realtime機能はSupabaseの無料プランでも利用可能です
- テーブルごとに有効化する必要があります
- 変更は即座に反映されます（再起動不要）

