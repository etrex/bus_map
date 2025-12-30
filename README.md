# 公車路線查詢地圖

一個可在 GitHub Pages 上執行的 Web 地圖介面，讓使用者輸入公車站名後，即可查詢並顯示所有會經過該站的公車路線。

## 功能特色

- 支援全台灣 22 個縣市的公車路線查詢
- 站名自動完成搜尋
- 顯示經過該站的所有公車路線
- 在地圖上標記站點位置
- 點擊路線可在地圖上顯示完整路線及所有站點
- 響應式設計，支援桌面與行動裝置

## 使用方式

1. 選擇城市
2. 輸入站名（支援模糊搜尋）
3. 從自動完成清單中選擇站點，或直接點擊「查詢」
4. 查看經過該站的公車路線列表
5. 點擊任一路線可在地圖上檢視完整路線

## 部署到 GitHub Pages

1. Fork 或 clone 此專案到你的 GitHub 帳號
2. 進入 Repository 的 Settings > Pages
3. Source 選擇 `main` branch，資料夾選擇 `/ (root)`
4. 點擊 Save，等待部署完成
5. 訪問 `https://<你的帳號>.github.io/<repository名稱>/`

## 技術架構

- **前端框架**: 純 HTML/CSS/JavaScript（無需建置）
- **地圖**: Leaflet.js + OpenStreetMap
- **資料來源**: TDX 運輸資料流通服務平台

## API 限制說明

本專案使用 TDX（運輸資料流通服務平台）的公開 API。免費使用有以下限制：

- 每分鐘請求次數限制
- 如遇到 429 錯誤，請稍等片刻後再試

如需更高的請求配額，可至 [TDX 平台](https://tdx.transportdata.tw/) 申請會員並取得 API Key。

## 檔案結構

```
bus_map/
├── index.html    # 主頁面
├── styles.css    # 樣式檔
├── app.js        # 應用邏輯
└── README.md     # 說明文件
```

## 授權

MIT License
