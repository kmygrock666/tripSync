# TripSync

多人共用的旅遊行程安排＋分帳記帳 PWA。

## 功能

- 每日行程時間軸（景點/交通/住宿/餐廳、地圖連結、訂單資訊）
- 分帳記帳（多幣別、自動換算台幣、最少轉帳結算）
- 行前準備清單
- Google 登入 ＋ 邀請碼共用旅程
- 離線可用，連網自動同步（Firestore persistent cache）
- 可安裝到手機主畫面（PWA）

## 開發

```bash
npm install
npm run dev    # 開發伺服器
npm test       # 單元測試
npm run build  # 產出 dist/
```

## 部署

push 到 `main` 自動部署到 GitHub Pages（`.github/workflows/deploy.yml`）。

## Firebase 設定

1. [console.firebase.google.com](https://console.firebase.google.com) 建立專案
2. 啟用 Authentication（Google）與 Firestore（asia-east1）
3. 把 Web App config 貼到 `src/lib/firebaseConfig.ts`
4. 把 `firestore.rules` 貼到 Console → Firestore → Rules 並發布
5. Authentication → Authorized domains 加入 `<username>.github.io`
