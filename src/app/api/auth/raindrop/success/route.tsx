import { NextRequest } from "next/server"

/**
 * OAuth成功後の中間ページ
 * Cookieを設定してからクライアント側でリダイレクト
 */
export async function GET(request: NextRequest) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ログイン成功 - Raindary</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(to bottom right, #eff6ff, #e0e7ff);
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #e5e7eb;
      border-top-color: #4f46e5;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h1 {
      color: #1f2937;
      margin: 0 0 0.5rem;
    }
    p {
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h1>ログイン成功</h1>
    <p>ダッシュボードに移動しています...</p>
  </div>
  <script>
    // クライアント側でリダイレクト（Cookieが保存された後）
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 500);
  </script>
</body>
</html>
  `

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  })
}
