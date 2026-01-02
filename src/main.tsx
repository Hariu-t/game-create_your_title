import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (error) {
  console.error('アプリケーションの起動に失敗しました:', error);
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(to bottom right, #111827, #1f2937, #000); color: #fbbf24; padding: 20px;">
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 8px; padding: 24px; max-width: 500px;">
          <h3 style="color: #fca5a5; font-weight: bold; font-size: 18px; margin-bottom: 8px;">エラーが発生しました</h3>
          <p style="color: #fecaca; margin-bottom: 16px;">${error instanceof Error ? error.message : '不明なエラー'}</p>
          <p style="color: #fecaca; font-size: 14px; margin-top: 16px;">
            Supabaseの環境変数が設定されていない可能性があります。<br/>
            .envファイルにVITE_SUPABASE_URLとVITE_SUPABASE_ANON_KEYを設定してください。
          </p>
        </div>
      </div>
    `;
  }
}
