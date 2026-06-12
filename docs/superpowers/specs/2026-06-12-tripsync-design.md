# TripSync 設計文件

日期：2026-06-12
狀態：已核准

## 概述

TripSync 是一個多人共用的旅遊行程安排＋分帳記帳 Web App。2-4 位旅伴透過 Google 帳號登入、邀請碼加入同一旅程，共同編輯行程、記帳分帳，離線可用，連網自動同步。前端部署於 GitHub Pages，資料層使用 Firebase。

## 需求

- 2-4 人共用一個旅程，Google 登入＋ 6 碼邀請碼加入
- 行程安排：每日時間表、交通與住宿資訊（訂單編號、check-in 時間）、Google Maps 連結、行前準備清單
- 記帳：分帳（誰付的、分給誰、結算誰欠誰）、多幣別、自動換算台幣
- 離線可查看行程與記帳，恢復連線後自動同步
- 手機與電腦皆可使用（響應式 + PWA）
- 部署到 GitHub Pages，push 即自動部署
- 時程：一個月內出發，優先核心功能

## 架構

```
┌─────────────────────────────┐
│  GitHub Pages（靜態託管）      │
│  React + Vite + TypeScript   │
│  PWA（可安裝到手機主畫面）      │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│  Firebase（免費 Spark 方案）   │
│  ├─ Authentication（Google）  │
│  └─ Firestore（資料庫＋離線快取）│
└─────────────────────────────┘
```

- **前端**：React + Vite + TypeScript，手機優先的響應式設計
- **PWA**：Service Worker 快取程式本體（vite-plugin-pwa），可加入手機主畫面全螢幕開啟，離線可啟動
- **資料層**：Firestore 開啟 persistent cache。離線時讀寫本地快取，連網後自動雙向同步，旅伴間即時更新（onSnapshot）
- **登入**：Firebase Auth Google 登入；建立旅程者產生 6 碼邀請碼，旅伴輸入邀請碼加入
- **部署**：GitHub Actions——push 到 main 自動 build 並部署到 GitHub Pages
- **匯率**：旅程設定中手動設定匯率；提供「抓最新匯率」按鈕（免費匯率 API），離線時沿用最後一次的值

## 資料模型（Firestore）

```
trips/{tripId}
 ├─ name, destination, startDate, endDate
 ├─ inviteCode（6 碼）
 ├─ members: { uid: { name, photo, joinedAt } }
 ├─ baseCurrency: "TWD"、rates: { JPY: 0.22, ... }
 │
 ├─ itinerary/{itemId}
 │    day、time、type（景點/交通/住宿/餐廳）
 │    title、note、mapUrl、bookingRef
 │
 ├─ expenses/{expenseId}
 │    date、category（餐飲/交通/住宿/購物/門票/其他）
 │    amount、currency
 │    paidBy（uid）
 │    splitWith（uid 陣列，預設全員）
 │    note
 │
 └─ checklist/{itemId}
      text、done、assignee（可選）
```

邀請碼查詢：另建 `inviteCodes/{code} → tripId` 對照集合，供加入流程查詢。

## 分帳邏輯

1. 每筆帳記錄「誰付的」（paidBy）＋「算誰的」（splitWith，預設全員均分，可勾選部分人）
2. 外幣金額以旅程匯率換算為台幣後計算
3. 結算頁顯示：每人總支出、每人應負擔、最簡化還錢方案（貪婪演算法將淨額配對，最小化轉帳次數）

## 權限與安全

- Firestore 安全規則：僅 `members` 中的 uid 可讀寫該旅程的所有子集合
- 加入旅程：已登入使用者憑邀請碼把自己加入 members（規則允許此一特定寫入）
- `inviteCodes` 集合僅允許已登入者讀取單一文件（憑完整邀請碼查詢）

## 頁面結構

手機底部分頁導覽、電腦側邊欄：

```
登入頁 → 旅程列表（建立旅程 / 輸入邀請碼加入）
   └─ 旅程內四個分頁：
      ① 行程：按天分組的時間軸，項目可展開看備註/訂單資訊，
              地點一鍵開 Google Maps，今天的行程自動置頂
      ② 記帳：帳目列表（按日期分組）＋新增帳目大按鈕
              （金額、幣別、分類、誰付的、怎麼分）
      ③ 結算：每人支出統計（分類圓餅圖）、誰欠誰多少、總花費（台幣）
      ④ 更多：行前清單、旅程設定（匯率、邀請碼、成員）
```

## 離線行為

- Service Worker 快取 App shell，無網路可開啟
- 讀取：Firestore 本地快取，離線照常顯示
- 寫入：離線時寫入本地、畫面立即更新，連網後自動上傳；他人變更自動拉取
- 衝突策略：後寫入者勝（規模小、各記各的帳，衝突極少）
- UI 顯示同步狀態圖示（已同步/待同步）

## 錯誤處理

- 邀請碼無效、登入失敗、匯率 API 失敗（退回手動匯率）皆有明確中文提示
- 刪除帳目/行程項目需二次確認

## 測試

- 核心邏輯（分帳計算、匯率換算、結算最簡化演算法）以 Vitest 單元測試，TDD 先寫測試
- UI 以瀏覽器實測手機/電腦版面（開發期間）

## 範圍外（本次不做）

- 即時匯率自動更新（僅手動觸發）
- 照片上傳、收據附件
- 五人以上的進階分帳（不均分比例、墊付鏈）
- 推播通知
