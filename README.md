# 未來演算所

以「五行八字」為基礎的演算系統。系統將五行強弱、流年變化與行為權重轉換成可理解的趨勢、風險與選擇建議。

## 專案狀態

V1 目標是先完成可上線的會員體驗：

- 未登入：可查看今日五行摘要，並引導註冊或登入。
- 免費會員：可查看今日運勢分數、當月日曆分數、月/年運勢分數與命盤總覽。
- VIP 會員：解鎖完整 AI 解析、趨勢曲線、彩券建議、幸運提示與十神分析。
- Web 登入：保留 Email/密碼登入，並提供 LINE 登入切換。
- 升級入口：集中放在個人資料頁，避免各頁面過度打擾。

## 技術架構

- Framework：Next.js App Router
- UI：React、Tailwind CSS
- Auth：Web login API、LINE LIFF login
- Fortune API：既有 PHP API
- Build：Next.js static/production build

主要資料來源：

- `https://www.highlight.url.tw/api/login.php`
- `https://www.highlight.url.tw/api/login_line.php`
- `https://www.highlight.url.tw/ai_fortune/php/get_user_fortune.php`
- `https://www.highlight.url.tw/ai_fortune/php/sync_user.php`
- `https://www.highlight.url.tw/ai_fortune/php/sync_ai_daily.php`
- `https://www.highlight.url.tw/ai_fortune/php/get_daily_for_month.php`
- `https://www.highlight.url.tw/ai_fortune/php/fortune_month.php`
- `https://www.highlight.url.tw/ai_fortune/php/fortune_year.php`

## 本機開發

```bash
npm install
npm run dev
```

預設開發網址：

```text
http://localhost:3000
```

## 檢查指令

```bash
npm run build
npx tsc --noEmit
npm run lint
```

目前 `npx tsc --noEmit` 可作為上線前的主要型別檢查。`npm run lint` 仍有既有規則需要整理，包含 `no-explicit-any`、`prefer-const` 與部分 effect 寫法。

## 部署說明

1. 確認 PHP API 已部署，且前端可從正式網域呼叫。
2. 確認 LINE LIFF 的 Endpoint URL 指向正式前端網址。
3. 執行檢查：

```bash
npx tsc --noEmit
npm run build
```

4. 將產出的前端部署到正式站台。
5. 上線後用手機實機檢查以下流程：

- 未登入首頁
- Web 註冊入口
- Web 登入
- LINE 登入
- 建立個人命盤
- 免費會員限制
- VIP 完整內容
- 日曆分數
- 月運勢 / 年運勢
- 個人資料與升級入口

## 上線前待確認

- 個人資料頁正式文案：設定區、通知偏好、管理員查看模式、空資料提示。
- API 空資料提示：日曆已有基本提示，月運勢與年運勢仍建議補更明確的空資料狀態。
- 商城登入銜接：目前升級 VIP 會導到商城；若要減少重複登入，建議 V1.1 加上 token 或一次性登入參數交接。
- SEO 分享圖：目前已設定基本 metadata，正式上線前建議補一張 `1200x630` Open Graph 圖。
- 隱私與免責：首頁今日五行已放短版免責文字；正式條款頁可放到 V2。
