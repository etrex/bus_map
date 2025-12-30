// 公車路線查詢地圖應用

// TDX API 設定
const TDX_BASE_URL = 'https://tdx.transportdata.tw/api/basic';

// 城市中心座標
const CITY_CENTERS = {
    'Taipei': [25.0330, 121.5654],
    'NewTaipei': [25.0120, 121.4650],
    'Taoyuan': [24.9936, 121.3010],
    'Taichung': [24.1477, 120.6736],
    'Tainan': [22.9998, 120.2270],
    'Kaohsiung': [22.6273, 120.3014],
    'Keelung': [25.1276, 121.7392],
    'Hsinchu': [24.8015, 120.9718],
    'HssinchuCounty': [24.8387, 121.0178],
    'MiaoliCounty': [24.5602, 120.8214],
    'ChanghuaCounty': [24.0518, 120.5161],
    'NantouCounty': [23.9609, 120.9719],
    'YunlinCounty': [23.7092, 120.4313],
    'ChssyiCounty': [23.4518, 120.2555],
    'Chiayi': [23.4801, 120.4491],
    'PingtungCounty': [22.5519, 120.5487],
    'YilanCounty': [24.7570, 121.7533],
    'HualienCounty': [23.9910, 121.6113],
    'TaitungCounty': [22.7583, 121.1444],
    'KinmenCounty': [24.4493, 118.3767],
    'PenghuCounty': [23.5711, 119.5793],
    'LienchiangCounty': [26.1505, 119.9499]
};

// 路線顏色
const ROUTE_COLORS = [
    '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12',
    '#1abc9c', '#e67e22', '#34495e', '#16a085', '#c0392b',
    '#2980b9', '#27ae60', '#8e44ad', '#d35400', '#7f8c8d'
];

// 應用狀態
const state = {
    map: null,
    currentCity: 'Taipei',
    stations: [],
    routes: [],
    markers: [],
    routeLines: [],
    selectedStation: null,
    stationCache: {}
};

// DOM 元素
const elements = {
    citySelect: null,
    stationInput: null,
    searchBtn: null,
    suggestions: null,
    loading: null,
    stationInfo: null,
    stationName: null,
    stationAddress: null,
    routesList: null
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initElements();
    initMap();
    initEventListeners();
});

// 初始化 DOM 元素參考
function initElements() {
    elements.citySelect = document.getElementById('city-select');
    elements.stationInput = document.getElementById('station-input');
    elements.searchBtn = document.getElementById('search-btn');
    elements.suggestions = document.getElementById('suggestions');
    elements.loading = document.getElementById('loading');
    elements.stationInfo = document.getElementById('station-info');
    elements.stationName = document.getElementById('station-name');
    elements.stationAddress = document.getElementById('station-address');
    elements.routesList = document.getElementById('routes-list');
}

// 初始化地圖
function initMap() {
    const center = CITY_CENTERS[state.currentCity];
    state.map = L.map('map').setView(center, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(state.map);
}

// 初始化事件監聽器
function initEventListeners() {
    // 城市切換
    elements.citySelect.addEventListener('change', (e) => {
        state.currentCity = e.target.value;
        const center = CITY_CENTERS[state.currentCity];
        state.map.setView(center, 13);
        clearResults();
        elements.stationInput.value = '';
    });

    // 站名輸入 - 自動完成
    let debounceTimer;
    elements.stationInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();

        if (query.length < 1) {
            hideSuggestions();
            return;
        }

        debounceTimer = setTimeout(() => {
            searchStations(query);
        }, 300);
    });

    // 點擊其他地方隱藏建議
    document.addEventListener('click', (e) => {
        if (!elements.suggestions.contains(e.target) && e.target !== elements.stationInput) {
            hideSuggestions();
        }
    });

    // 搜尋按鈕
    elements.searchBtn.addEventListener('click', () => {
        const query = elements.stationInput.value.trim();
        if (query) {
            searchAndSelectStation(query);
        }
    });

    // Enter 鍵搜尋
    elements.stationInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = elements.stationInput.value.trim();
            if (query) {
                searchAndSelectStation(query);
            }
        }
    });
}

// 搜尋站點（自動完成）
async function searchStations(query) {
    try {
        const city = state.currentCity;
        const url = `${TDX_BASE_URL}/v2/Bus/Stop/City/${city}?$filter=contains(StopName/Zh_tw,'${encodeURIComponent(query)}')&$top=15&$format=JSON`;

        const response = await fetch(url);

        if (response.status === 429) {
            console.warn('API 請求過於頻繁，請稍後再試');
            return;
        }

        if (!response.ok) throw new Error('API 請求失敗');

        const data = await response.json();

        // 去除重複站名
        const uniqueStations = [];
        const seenNames = new Set();

        data.forEach(station => {
            const name = station.StopName?.Zh_tw;
            if (name && !seenNames.has(name)) {
                seenNames.add(name);
                uniqueStations.push(station);
            }
        });

        showSuggestions(uniqueStations);
    } catch (error) {
        console.error('搜尋站點失敗:', error);
    }
}

// 顯示搜尋建議
function showSuggestions(stations) {
    if (stations.length === 0) {
        hideSuggestions();
        return;
    }

    elements.suggestions.innerHTML = stations.map(station => `
        <div class="suggestion-item" data-name="${station.StopName?.Zh_tw || ''}">
            <div class="station-name">${station.StopName?.Zh_tw || '未知站名'}</div>
            <div class="station-detail">${station.StopAddress || ''}</div>
        </div>
    `).join('');

    elements.suggestions.classList.add('active');

    // 綁定點擊事件
    elements.suggestions.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            const name = item.dataset.name;
            elements.stationInput.value = name;
            hideSuggestions();
            searchAndSelectStation(name);
        });
    });
}

// 隱藏搜尋建議
function hideSuggestions() {
    elements.suggestions.classList.remove('active');
}

// 搜尋並選擇站點
async function searchAndSelectStation(stationName) {
    showLoading();
    clearResults();
    hideSuggestions();

    try {
        // 1. 取得該站名的所有站點
        const stops = await getStopsByName(stationName);

        if (stops.length === 0) {
            showNoResults('找不到此站點');
            return;
        }

        // 2. 取得經過這些站點的所有路線
        const routes = await getRoutesByStops(stops);

        if (routes.length === 0) {
            showNoResults('找不到經過此站的公車路線');
            return;
        }

        // 3. 顯示站點資訊
        showStationInfo(stationName, stops);

        // 4. 顯示路線列表
        showRoutesList(routes);

        // 5. 在地圖上標記站點
        showStopsOnMap(stops, stationName);

    } catch (error) {
        console.error('查詢失敗:', error);
        showError('查詢失敗，請稍後再試');
    } finally {
        hideLoading();
    }
}

// 根據站名取得站點
async function getStopsByName(stationName) {
    const city = state.currentCity;
    const url = `${TDX_BASE_URL}/v2/Bus/Stop/City/${city}?$filter=StopName/Zh_tw eq '${encodeURIComponent(stationName)}'&$format=JSON`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('API 請求失敗');

    return await response.json();
}

// 根據站點取得路線（使用批量查詢）
async function getRoutesByStops(stops) {
    const city = state.currentCity;
    const routeUIDs = new Set();
    const routes = [];

    // 收集所有 StopUID
    const stopUIDs = stops.map(s => s.StopUID).filter(uid => uid);

    if (stopUIDs.length === 0) return routes;

    try {
        // 使用 OR 條件批量查詢（最多取前 5 個避免 URL 過長）
        const uidsToQuery = stopUIDs.slice(0, 5);
        const filterConditions = uidsToQuery.map(uid =>
            `Stops/any(s:s/StopUID eq '${uid}')`
        ).join(' or ');

        const url = `${TDX_BASE_URL}/v2/Bus/StopOfRoute/City/${city}?$filter=${encodeURIComponent(filterConditions)}&$format=JSON`;
        const response = await fetch(url);

        if (response.ok) {
            const data = await response.json();
            data.forEach(route => {
                // 使用 RouteUID + Direction 作為唯一識別
                const uniqueKey = `${route.RouteUID}_${route.Direction}`;
                if (!routeUIDs.has(uniqueKey)) {
                    routeUIDs.add(uniqueKey);
                    routes.push(route);
                }
            });
        } else if (response.status === 429) {
            // 如果遇到 429，等待後重試一次
            await delay(2000);
            const retryResponse = await fetch(url);
            if (retryResponse.ok) {
                const data = await retryResponse.json();
                data.forEach(route => {
                    const uniqueKey = `${route.RouteUID}_${route.Direction}`;
                    if (!routeUIDs.has(uniqueKey)) {
                        routeUIDs.add(uniqueKey);
                        routes.push(route);
                    }
                });
            }
        }
    } catch (error) {
        console.error('取得路線失敗:', error);
    }

    // 按路線名稱排序
    routes.sort((a, b) => {
        const nameA = a.RouteName?.Zh_tw || '';
        const nameB = b.RouteName?.Zh_tw || '';
        return nameA.localeCompare(nameB, 'zh-TW', { numeric: true });
    });

    return routes;
}

// 延遲函數
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 顯示站點資訊
function showStationInfo(name, stops) {
    elements.stationInfo.classList.remove('hidden');
    elements.stationName.textContent = name;

    const addresses = stops.map(s => s.StopAddress).filter(a => a);
    elements.stationAddress.textContent = addresses[0] || '';
}

// 顯示路線列表
function showRoutesList(routes) {
    const routeCount = routes.length;

    elements.routesList.innerHTML = `
        <div class="route-count">共有 ${routeCount} 條公車路線經過此站</div>
        ${routes.map((route, index) => `
            <div class="route-item" data-route-uid="${route.RouteUID}" data-index="${index}">
                <div class="route-header">
                    <span class="route-number">${route.RouteName?.Zh_tw || '未知'}</span>
                    <span class="route-name">${route.SubRouteName?.Zh_tw || ''}</span>
                    <span class="route-direction">${route.Direction === 0 ? '去程' : '返程'}</span>
                </div>
                <div class="route-terminals">
                    <span>${route.Stops?.[0]?.StopName?.Zh_tw || '起點'}</span>
                    <span class="arrow">→</span>
                    <span>${route.Stops?.[route.Stops.length - 1]?.StopName?.Zh_tw || '終點'}</span>
                </div>
            </div>
        `).join('')}
    `;

    // 綁定路線點擊事件
    elements.routesList.querySelectorAll('.route-item').forEach(item => {
        item.addEventListener('click', () => {
            const routeUID = item.dataset.routeUid;
            const index = parseInt(item.dataset.index);
            const route = routes.find(r => r.RouteUID === routeUID && routes.indexOf(r) === index);

            // 切換選中狀態
            elements.routesList.querySelectorAll('.route-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // 在地圖上顯示路線
            if (route) {
                showRouteOnMap(route, index);
            }
        });
    });

    state.routes = routes;
}

// 在地圖上顯示站點
function showStopsOnMap(stops, selectedStationName) {
    // 清除現有標記
    clearMapMarkers();

    const bounds = L.latLngBounds();
    let hasValidCoords = false;

    stops.forEach(stop => {
        const lat = stop.StopPosition?.PositionLat;
        const lon = stop.StopPosition?.PositionLon;

        if (lat && lon) {
            hasValidCoords = true;
            const isSelected = stop.StopName?.Zh_tw === selectedStationName;

            const marker = L.circleMarker([lat, lon], {
                radius: isSelected ? 10 : 6,
                fillColor: isSelected ? '#e74c3c' : '#667eea',
                color: 'white',
                weight: 2,
                fillOpacity: 0.9
            }).addTo(state.map);

            marker.bindPopup(`
                <div class="popup-title">${stop.StopName?.Zh_tw || '未知站名'}</div>
                <div class="popup-info">${stop.StopAddress || ''}</div>
            `);

            state.markers.push(marker);
            bounds.extend([lat, lon]);
        }
    });

    if (hasValidCoords) {
        state.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
}

// 在地圖上顯示路線
function showRouteOnMap(route, colorIndex) {
    // 清除現有路線
    clearRouteLines();

    const color = ROUTE_COLORS[colorIndex % ROUTE_COLORS.length];
    const stops = route.Stops || [];
    const bounds = L.latLngBounds();
    let hasValidCoords = false;

    // 清除現有標記
    clearMapMarkers();

    // 繪製路線（連接站點）
    const latlngs = [];

    stops.forEach((stop, index) => {
        const lat = stop.StopPosition?.PositionLat;
        const lon = stop.StopPosition?.PositionLon;

        if (lat && lon) {
            hasValidCoords = true;
            latlngs.push([lat, lon]);

            // 標記站點
            const marker = L.circleMarker([lat, lon], {
                radius: 6,
                fillColor: color,
                color: 'white',
                weight: 2,
                fillOpacity: 0.9
            }).addTo(state.map);

            marker.bindPopup(`
                <div class="popup-title">${stop.StopName?.Zh_tw || '未知站名'}</div>
                <div class="popup-info">站序: ${stop.StopSequence || index + 1}</div>
            `);

            state.markers.push(marker);
            bounds.extend([lat, lon]);
        }
    });

    // 繪製路線
    if (latlngs.length > 1) {
        const polyline = L.polyline(latlngs, {
            color: color,
            weight: 4,
            opacity: 0.7
        }).addTo(state.map);

        state.routeLines.push(polyline);
    }

    if (hasValidCoords) {
        state.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
}

// 清除地圖標記
function clearMapMarkers() {
    state.markers.forEach(marker => {
        state.map.removeLayer(marker);
    });
    state.markers = [];
}

// 清除路線
function clearRouteLines() {
    state.routeLines.forEach(line => {
        state.map.removeLayer(line);
    });
    state.routeLines = [];
}

// 清除結果
function clearResults() {
    elements.stationInfo.classList.add('hidden');
    elements.routesList.innerHTML = '<p class="placeholder">請輸入站名開始查詢</p>';
    clearMapMarkers();
    clearRouteLines();
}

// 顯示載入中
function showLoading() {
    elements.loading.classList.remove('hidden');
}

// 隱藏載入中
function hideLoading() {
    elements.loading.classList.add('hidden');
}

// 顯示無結果
function showNoResults(message) {
    elements.routesList.innerHTML = `
        <div class="no-results">
            <div class="no-results-icon">🔍</div>
            <p>${message}</p>
        </div>
    `;
}

// 顯示錯誤
function showError(message) {
    elements.routesList.innerHTML = `
        <div class="error-message">${message}</div>
    `;
}
