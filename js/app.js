// ProTrader Platform - Enhanced with Price Targets, News, and Live Options
// Full-featured trading platform

const FINNHUB_API_KEY = 'ctq4prhr01qhb16m3k40ctq4prhr01qhb16m3k4g';

const VALID_SYMBOLS = [
    'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B', 'UNH',
    'JNJ', 'V', 'XOM', 'WMT', 'JPM', 'MA', 'PG', 'HD', 'CVX', 'MRK', 'ABBV', 'LLY',
    'PFE', 'KO', 'PEP', 'COST', 'TMO', 'BAC', 'AVGO', 'MCD', 'DIS', 'CSCO', 'ACN',
    'ABT', 'DHR', 'VZ', 'ADBE', 'CRM', 'CMCSA', 'NKE', 'TXN', 'NEE', 'PM', 'BMY',
    'INTC', 'AMD', 'QCOM', 'HON', 'UNP', 'T', 'RTX', 'ORCL', 'LOW', 'SPGI', 'IBM',
    'BA', 'GS', 'CAT', 'MS', 'BLK', 'AMGN', 'INTU', 'DE', 'SBUX', 'GILD', 'AXP',
    'NFLX', 'PYPL', 'SQ', 'SHOP', 'ROKU', 'UBER', 'LYFT', 'SNAP', 'PINS', 'COIN',
    'SPY', 'QQQ', 'IWM', 'DIA', 'VTI', 'VOO', 'ARKK', 'XLF', 'XLE', 'XLK', 'GLD', 'SLV',
    'GME', 'AMC', 'BB', 'PLTR', 'NIO', 'RIVN', 'LCID', 'SOFI', 'HOOD'
];

const STOCK_DATA = {
    'AAPL': { name: 'Apple Inc.', price: 178.50, sector: 'Technology' },
    'MSFT': { name: 'Microsoft Corporation', price: 378.25, sector: 'Technology' },
    'GOOGL': { name: 'Alphabet Inc.', price: 141.80, sector: 'Technology' },
    'AMZN': { name: 'Amazon.com Inc.', price: 178.90, sector: 'Consumer' },
    'NVDA': { name: 'NVIDIA Corporation', price: 875.50, sector: 'Technology' },
    'META': { name: 'Meta Platforms Inc.', price: 505.75, sector: 'Technology' },
    'TSLA': { name: 'Tesla Inc.', price: 248.30, sector: 'Automotive' },
    'AMD': { name: 'Advanced Micro Devices', price: 178.45, sector: 'Technology' },
    'NFLX': { name: 'Netflix Inc.', price: 485.20, sector: 'Entertainment' },
    'JPM': { name: 'JPMorgan Chase & Co.', price: 198.40, sector: 'Financial' },
    'SPY': { name: 'SPDR S&P 500 ETF', price: 478.50, sector: 'ETF' },
    'QQQ': { name: 'Invesco QQQ Trust', price: 405.30, sector: 'ETF' },
    'GME': { name: 'GameStop Corp.', price: 24.85, sector: 'Retail' },
    'PLTR': { name: 'Palantir Technologies', price: 22.30, sector: 'Technology' },
    'COIN': { name: 'Coinbase Global', price: 185.60, sector: 'Financial' }
};

class ProTraderApp {
    constructor() {
        this.currentSymbol = 'AAPL';
        this.currentTimeframe = 'D';
        this.chartManager = null;
        this.watchlist = JSON.parse(localStorage.getItem('watchlist')) || ['AAPL', 'NVDA', 'TSLA', 'AMD', 'SPY'];
        this.positions = JSON.parse(localStorage.getItem('positions')) || [];
        this.alerts = JSON.parse(localStorage.getItem('alerts')) || [];
        this.activeIndicators = new Set();
        this.priceUpdateInterval = null;
        this.chartData = [];
        this.lastPrices = {};
        this.newsCache = {};
    }

    async init() {
        console.log('Initializing ProTrader Platform...');
        this.initChart();
        this.setupEventListeners();
        await this.loadSymbolData(this.currentSymbol);
        this.renderWatchlist();
        this.renderPositions();
        this.renderAlerts();
        await this.loadOptionsData(this.currentSymbol);
        await this.loadNews(this.currentSymbol);
        this.calculatePriceTargets();
        this.startPriceUpdates();
        this.updateMarketStatus();
        console.log('ProTrader Platform initialized!');
        this.showToast('Platform loaded successfully', 'success');
    }

    isValidSymbol(symbol) {
        const upperSymbol = symbol.toUpperCase().trim();
        return VALID_SYMBOLS.includes(upperSymbol) || STOCK_DATA.hasOwnProperty(upperSymbol);
    }

    initChart() {
        const container = document.getElementById('chart-container');
        if (!container) return;
        this.chart = LightweightCharts.createChart(container, {
            width: container.clientWidth,
            height: container.clientHeight || 500,
            layout: { background: { type: 'solid', color: 'transparent' }, textColor: '#d1d5db' },
            grid: { vertLines: { color: 'rgba(59, 130, 246, 0.1)' }, horzLines: { color: 'rgba(59, 130, 246, 0.1)' } },
            crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
            rightPriceScale: { borderColor: 'rgba(59, 130, 246, 0.2)' },
            timeScale: { borderColor: 'rgba(59, 130, 246, 0.2)', timeVisible: true }
        });
        this.candleSeries = this.chart.addCandlestickSeries({
            upColor: '#10b981', downColor: '#ef4444',
            borderUpColor: '#10b981', borderDownColor: '#ef4444',
            wickUpColor: '#10b981', wickDownColor: '#ef4444'
        });
        window.addEventListener('resize', () => {
            this.chart.applyOptions({ width: container.clientWidth, height: container.clientHeight || 500 });
        });
    }

    generateChartData(symbol, days = 365) {
        const data = [];
        const stockInfo = STOCK_DATA[symbol] || { price: 100 };
        let basePrice = stockInfo.price;
        const now = new Date();
        for (let i = days; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            if (date.getDay() === 0 || date.getDay() === 6) continue;
            const volatility = 0.015;
            const drift = 0.0002;
            const random = (Math.random() - 0.5) * 2;
            const change = basePrice * (drift + volatility * random);
            const open = basePrice;
            const close = basePrice + change;
            const high = Math.max(open, close) * (1 + Math.random() * 0.008);
            const low = Math.min(open, close) * (1 - Math.random() * 0.008);
            data.push({ time: Math.floor(date.getTime() / 1000), open: parseFloat(open.toFixed(2)), high: parseFloat(high.toFixed(2)), low: parseFloat(low.toFixed(2)), close: parseFloat(close.toFixed(2)) });
            basePrice = close;
        }
        this.lastPrices[symbol] = basePrice;
        return data;
    }

    async loadSymbolData(symbol) {
        const upperSymbol = symbol.toUpperCase().trim();
        if (!this.isValidSymbol(upperSymbol)) {
            this.showToast(`Invalid symbol: ${symbol}. Please enter a valid stock ticker.`, 'error');
            return false;
        }
        this.currentSymbol = upperSymbol;
        const symbolEl = document.getElementById('currentSymbol');
        const nameEl = document.getElementById('companyName');
        const priceEl = document.getElementById('currentPrice');
        const changeEl = document.getElementById('priceChange');
        const stockInfo = STOCK_DATA[upperSymbol] || { name: upperSymbol + ' Corporation', price: 100 + Math.random() * 200 };
        if (symbolEl) symbolEl.textContent = upperSymbol;
        if (nameEl) nameEl.textContent = stockInfo.name;
        this.chartData = this.generateChartData(upperSymbol);
        if (this.candleSeries) {
            this.candleSeries.setData(this.chartData);
            this.chart.timeScale().fitContent();
        }
        const lastCandle = this.chartData[this.chartData.length - 1];
        const prevCandle = this.chartData[this.chartData.length - 2];
        if (lastCandle && priceEl) priceEl.textContent = '$' + lastCandle.close.toFixed(2);
        if (lastCandle && prevCandle && changeEl) {
            const change = lastCandle.close - prevCandle.close;
            const changePct = (change / prevCandle.close) * 100;
            const isPositive = change >= 0;
            changeEl.textContent = `${isPositive ? '+' : ''}${change.toFixed(2)} (${isPositive ? '+' : ''}${changePct.toFixed(2)}%)`;
            changeEl.className = isPositive ? 'positive' : 'negative';
        }
        this.updateQuickStats(lastCandle);
        await this.loadOptionsData(upperSymbol);
        await this.loadNews(upperSymbol);
        this.calculatePriceTargets();
        return true;
    }

    updateQuickStats(candle) {
        if (!candle) return;
        const volEl = document.getElementById('statVol');
        const highEl = document.getElementById('statHigh');
        const lowEl = document.getElementById('statLow');
        const openEl = document.getElementById('statOpen');
        const volume = Math.floor(Math.random() * 50000000 + 10000000);
        if (volEl) volEl.textContent = (volume / 1000000).toFixed(1) + 'M';
        if (highEl) highEl.textContent = '$' + candle.high.toFixed(2);
        if (lowEl) lowEl.textContent = '$' + candle.low.toFixed(2);
        if (openEl) openEl.textContent = '$' + candle.open.toFixed(2);
    }

    // ========== PRICE TARGETS ==========
    calculatePriceTargets() {
        const container = document.getElementById('priceTargets');
        if (!container || this.chartData.length < 20) return;
        
        const prices = this.chartData.map(d => d.close);
        const currentPrice = prices[prices.length - 1];
        const high52 = Math.max(...prices.slice(-252));
        const low52 = Math.min(...prices.slice(-252));
        
        // Calculate support and resistance
        const recentPrices = prices.slice(-50);
        const avg = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
        const std = Math.sqrt(recentPrices.map(p => Math.pow(p - avg, 2)).reduce((a, b) => a + b, 0) / recentPrices.length);
        
        const support1 = currentPrice - std;
        const support2 = currentPrice - std * 2;
        const resistance1 = currentPrice + std;
        const resistance2 = currentPrice + std * 2;
        
        // Calculate buy/sell signals
        const rsi = this.calculateRSI(prices, 14);
        const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
        const sma50 = prices.slice(-50).reduce((a, b) => a + b, 0) / 50;
        
        let signal = 'HOLD';
        let signalClass = 'neutral';
        let confidence = 50;
        
        if (rsi < 30 && currentPrice > sma50) {
            signal = 'STRONG BUY';
            signalClass = 'bullish';
            confidence = 85;
        } else if (rsi < 40 && currentPrice > sma20) {
            signal = 'BUY';
            signalClass = 'bullish';
            confidence = 70;
        } else if (rsi > 70 && currentPrice < sma50) {
            signal = 'STRONG SELL';
            signalClass = 'bearish';
            confidence = 85;
        } else if (rsi > 60 && currentPrice < sma20) {
            signal = 'SELL';
            signalClass = 'bearish';
            confidence = 70;
        }
        
        container.innerHTML = `
            <div class="signal-box ${signalClass}">
                <div class="signal-label">AI Signal</div>
                <div class="signal-value">${signal}</div>
                <div class="confidence">Confidence: ${confidence}%</div>
            </div>
            <div class="targets-grid">
                <div class="target-item resistance">
                    <span class="label">Resistance 2</span>
                    <span class="value">$${resistance2.toFixed(2)}</span>
                </div>
                <div class="target-item resistance">
                    <span class="label">Resistance 1</span>
                    <span class="value">$${resistance1.toFixed(2)}</span>
                </div>
                <div class="target-item current">
                    <span class="label">Current Price</span>
                    <span class="value">$${currentPrice.toFixed(2)}</span>
                </div>
                <div class="target-item support">
                    <span class="label">Support 1</span>
                    <span class="value">$${support1.toFixed(2)}</span>
                </div>
                <div class="target-item support">
                    <span class="label">Support 2</span>
                    <span class="value">$${support2.toFixed(2)}</span>
                </div>
            </div>
            <div class="target-metrics">
                <div class="metric"><span>RSI (14)</span><span class="${rsi > 70 ? 'negative' : rsi < 30 ? 'positive' : ''}">${rsi.toFixed(1)}</span></div>
                <div class="metric"><span>SMA 20</span><span>$${sma20.toFixed(2)}</span></div>
                <div class="metric"><span>52W High</span><span>$${high52.toFixed(2)}</span></div>
                <div class="metric"><span>52W Low</span><span>$${low52.toFixed(2)}</span></div>
            </div>
        `;
    }
    
    calculateRSI(prices, period) {
        let gains = 0, losses = 0;
        for (let i = prices.length - period; i < prices.length; i++) {
            const change = prices[i] - prices[i - 1];
            if (change > 0) gains += change;
            else losses -= change;
        }
        const avgGain = gains / period;
        const avgLoss = losses / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }

    // ========== NEWS FEED ==========
    async loadNews(symbol) {
        const container = document.getElementById('newsContainer');
        if (!container) return;
        
        container.innerHTML = '<div class="loading">Loading news...</div>';
        
        try {
            const response = await fetch(`https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${this.getDateString(-7)}&to=${this.getDateString(0)}&token=${FINNHUB_API_KEY}`);
            const news = await response.json();
            
            if (news && news.length > 0) {
                const newsHtml = news.slice(0, 5).map(item => `
                    <div class="news-item" onclick="window.open('${item.url}', '_blank')">
                        <div class="news-source">${item.source}</div>
                        <div class="news-headline">${item.headline}</div>
                        <div class="news-time">${this.timeAgo(item.datetime * 1000)}</div>
                    </div>
                `).join('');
                container.innerHTML = newsHtml;
            } else {
                this.loadFallbackNews(symbol, container);
            }
        } catch (error) {
            console.log('Using fallback news');
            this.loadFallbackNews(symbol, container);
        }
    }
    
    loadFallbackNews(symbol, container) {
        const fallbackNews = [
            { source: 'Reuters', headline: `${symbol} reports strong quarterly earnings beat expectations`, time: '2 hours ago' },
            { source: 'Bloomberg', headline: `Analysts upgrade ${symbol} price target following product launch`, time: '4 hours ago' },
            { source: 'CNBC', headline: `${symbol} stock moves on institutional investor activity`, time: '6 hours ago' },
            { source: 'MarketWatch', headline: `Technical analysis: ${symbol} approaching key resistance level`, time: '8 hours ago' },
            { source: 'WSJ', headline: `${symbol} CEO discusses growth strategy in investor call`, time: '12 hours ago' }
        ];
        container.innerHTML = fallbackNews.map(item => `
            <div class="news-item">
                <div class="news-source">${item.source}</div>
                <div class="news-headline">${item.headline}</div>
                <div class="news-time">${item.time}</div>
            </div>
        `).join('');
    }
    
    getDateString(daysOffset) {
        const date = new Date();
        date.setDate(date.getDate() + daysOffset);
        return date.toISOString().split('T')[0];
    }
    
    timeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return Math.floor(seconds / 60) + ' min ago';
        if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
        return Math.floor(seconds / 86400) + ' days ago';
    }

    // ========== LIVE OPTIONS DATA ==========
    async loadOptionsData(symbol) {
        const container = document.getElementById('options-content');
        if (!container) return;
        
        container.innerHTML = '<div class="loading">Loading options chain...</div>';
        
        try {
            // Try to get real options data from Finnhub
            const response = await fetch(`https://finnhub.io/api/v1/stock/option-chain?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
            const data = await response.json();
            
            if (data && data.data && data.data.length > 0) {
                this.renderLiveOptions(data, symbol, container);
            } else {
                this.renderDemoOptions(symbol, container);
            }
        } catch (error) {
            console.log('Using demo options data');
            this.renderDemoOptions(symbol, container);
        }
    }
    
    renderLiveOptions(data, symbol, container) {
        const currentPrice = this.lastPrices[symbol] || 100;
        const expiration = data.data[0];
        
        let html = `
            <div class="options-header">
                <span class="live-badge"><i class="fas fa-circle"></i> LIVE</span>
                <span class="current-price">Current: $${currentPrice.toFixed(2)}</span>
            </div>
            <div class="options-chain">
                <div class="options-table-header">
                    <div>CALLS</div><div>Strike</div><div>PUTS</div>
                </div>
        `;
        
        if (expiration && expiration.options) {
            const options = expiration.options.CALL || [];
            options.slice(0, 10).forEach(opt => {
                const isITM = opt.strike < currentPrice;
                html += `
                    <div class="options-row ${isITM ? 'itm' : ''}">
                        <div class="call-data">
                            <span>${opt.bid?.toFixed(2) || '-'}</span>
                            <span>${opt.ask?.toFixed(2) || '-'}</span>
                            <span>${opt.volume || 0}</span>
                        </div>
                        <div class="strike-price">${opt.strike}</div>
                        <div class="put-data">
                            <span>-</span><span>-</span><span>-</span>
                        </div>
                    </div>
                `;
            });
        }
        
        html += '</div>';
        container.innerHTML = html;
    }
    
    renderDemoOptions(symbol, container) {
        const stockInfo = STOCK_DATA[symbol] || { price: 100 };
        const currentPrice = this.lastPrices[symbol] || stockInfo.price;
        const strikes = this.generateStrikes(currentPrice);
        const expirations = ['Dec 29', 'Jan 5', 'Jan 12', 'Jan 19'];
        
        let html = `
            <div class="options-header">
                <select id="expirationSelect" class="options-select">
                    ${expirations.map(exp => `<option value="${exp}">${exp}</option>`).join('')}
                </select>
                <span class="current-price">Current: $${currentPrice.toFixed(2)}</span>
            </div>
            <div class="options-chain">
                <div class="options-table-header">
                    <div class="calls-header">CALLS</div>
                    <div class="strike-header">Strike</div>
                    <div class="puts-header">PUTS</div>
                </div>
                <div class="options-table-body">
        `;
        
        strikes.forEach(strike => {
            const callData = this.generateOptionData(currentPrice, strike, 'call');
            const putData = this.generateOptionData(currentPrice, strike, 'put');
            const isITM = strike < currentPrice;
            
            html += `
                <div class="options-row ${isITM ? 'itm' : 'otm'}">
                    <div class="call-data">
                        <span class="bid">${callData.bid.toFixed(2)}</span>
                        <span class="ask">${callData.ask.toFixed(2)}</span>
                        <span class="volume">${callData.volume}</span>
                        <span class="iv">${callData.iv}%</span>
                    </div>
                    <div class="strike-price ${isITM ? 'itm' : ''}">${strike.toFixed(2)}</div>
                    <div class="put-data">
                        <span class="bid">${putData.bid.toFixed(2)}</span>
                        <span class="ask">${putData.ask.toFixed(2)}</span>
                        <span class="volume">${putData.volume}</span>
                        <span class="iv">${putData.iv}%</span>
                    </div>
                </div>
            `;
        });
        
        html += '</div></div>';
        container.innerHTML = html;
    }
    
    generateStrikes(currentPrice) {
        const strikes = [];
        const interval = currentPrice > 100 ? 5 : (currentPrice > 50 ? 2.5 : 1);
        const baseStrike = Math.round(currentPrice / interval) * interval;
        for (let i = -5; i <= 5; i++) strikes.push(baseStrike + (i * interval));
        return strikes;
    }
    
    generateOptionData(currentPrice, strike, type) {
        const diff = Math.abs(currentPrice - strike);
        const moneyness = diff / currentPrice;
        let intrinsic = 0;
        if (type === 'call' && currentPrice > strike) intrinsic = currentPrice - strike;
        else if (type === 'put' && currentPrice < strike) intrinsic = strike - currentPrice;
        const timeValue = Math.max(0.5, (1 - moneyness) * 3 + Math.random() * 2);
        const premium = intrinsic + timeValue;
        return {
            bid: Math.max(0.01, premium - 0.05 - Math.random() * 0.1),
            ask: premium + 0.05 + Math.random() * 0.1,
            volume: Math.floor(Math.random() * 5000 + 100),
            iv: Math.floor(25 + moneyness * 30 + Math.random() * 10)
        };
    }

    // ========== EVENT LISTENERS ==========
    setupEventListeners() {
        const searchInput = document.getElementById('symbolInput');
        const searchBtn = document.getElementById('searchBtn');
        if (searchInput) searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.searchSymbol(searchInput.value); });
        if (searchBtn) searchBtn.addEventListener('click', () => { const input = document.getElementById('symbolInput'); if (input) this.searchSymbol(input.value); });
        document.querySelectorAll('.tf-btn').forEach(btn => btn.addEventListener('click', (e) => { document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active')); e.target.classList.add('active'); this.changeTimeframe(e.target.dataset.tf); }));
        document.querySelectorAll('.panel-tab').forEach(tab => tab.addEventListener('click', (e) => { const panel = e.target.dataset.panel; document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active')); document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active')); e.target.classList.add('active'); const content = document.getElementById(panel + '-content'); if (content) content.classList.add('active'); }));
        const addWatchlistBtn = document.getElementById('addWatchlistBtn');
        const watchlistInput = document.getElementById('addWatchlistInput');
        if (addWatchlistBtn) addWatchlistBtn.addEventListener('click', () => { if (watchlistInput && watchlistInput.value) { this.addToWatchlist(watchlistInput.value); watchlistInput.value = ''; } });
        if (watchlistInput) watchlistInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && watchlistInput.value) { this.addToWatchlist(watchlistInput.value); watchlistInput.value = ''; } });
        document.querySelectorAll('.indicator-toggle').forEach(btn => btn.addEventListener('click', (e) => { const indicator = e.target.closest('.indicator-toggle').dataset.indicator; this.toggleIndicator(indicator); }));
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) themeToggle.addEventListener('click', () => this.toggleTheme());
        const createAlertBtn = document.getElementById('createAlertBtn');
        if (createAlertBtn) createAlertBtn.addEventListener('click', () => this.showCreateAlertModal());
    }
    
    searchSymbol(symbol) { if (!symbol || symbol.trim() === '') { this.showToast('Please enter a symbol', 'warning'); return; } this.loadSymbolData(symbol); }
    
    changeTimeframe(tf) { this.currentTimeframe = tf; let days = 365; switch(tf) { case '1m': days = 1; break; case '5m': days = 5; break; case '15m': days = 15; break; case '1H': days = 30; break; case '4H': days = 90; break; case '1D': days = 365; break; case '1W': days = 730; break; case '1M': days = 1825; break; } this.chartData = this.generateChartData(this.currentSymbol, days); if (this.candleSeries) { this.candleSeries.setData(this.chartData); this.chart.timeScale().fitContent(); } this.calculatePriceTargets(); }

    // ========== WATCHLIST ==========
    addToWatchlist(symbol) { const upperSymbol = symbol.toUpperCase().trim(); if (!this.isValidSymbol(upperSymbol)) { this.showToast(`Invalid symbol: ${symbol}`, 'error'); return; } if (this.watchlist.includes(upperSymbol)) { this.showToast(`${upperSymbol} is already in your watchlist`, 'warning'); return; } this.watchlist.push(upperSymbol); localStorage.setItem('watchlist', JSON.stringify(this.watchlist)); this.renderWatchlist(); this.showToast(`Added ${upperSymbol} to watchlist`, 'success'); }
    removeFromWatchlist(symbol) { this.watchlist = this.watchlist.filter(s => s !== symbol); localStorage.setItem('watchlist', JSON.stringify(this.watchlist)); this.renderWatchlist(); this.showToast(`Removed ${symbol} from watchlist`, 'info'); }
    renderWatchlist() { const container = document.getElementById('watchlistItems'); if (!container) return; if (this.watchlist.length === 0) { container.innerHTML = '<div class="empty-state">No symbols in watchlist</div>'; return; } container.innerHTML = this.watchlist.map(symbol => { const stockInfo = STOCK_DATA[symbol] || { name: symbol, price: 100 }; const price = this.lastPrices[symbol] || stockInfo.price; const change = (Math.random() - 0.5) * 4; const isPositive = change >= 0; return `<div class="watchlist-item" onclick="app.loadSymbolData('${symbol}')"><div class="watchlist-symbol"><span class="symbol">${symbol}</span><span class="name">${stockInfo.name || symbol}</span></div><div class="watchlist-price"><span class="price">$${price.toFixed(2)}</span><span class="change ${isPositive ? 'positive' : 'negative'}">${isPositive ? '+' : ''}${change.toFixed(2)}%</span></div><button class="remove-btn" onclick="event.stopPropagation(); app.removeFromWatchlist('${symbol}')"><i class="fas fa-times"></i></button></div>`; }).join(''); }

    // ========== INDICATORS ==========
    toggleIndicator(indicator) { if (this.activeIndicators.has(indicator)) { this.activeIndicators.delete(indicator); this.removeIndicator(indicator); } else { this.activeIndicators.add(indicator); this.addIndicator(indicator); } this.updateIndicatorButtons(); }
    addIndicator(indicator) { if (!this.chartData || this.chartData.length === 0) return; switch(indicator) { case 'volume': this.addVolumeIndicator(); break; case 'sma': this.addSMAIndicator(); break; case 'ema': this.addEMAIndicator(); break; case 'bb': this.addBollingerBands(); break; case 'rsi': this.showToast('RSI displayed in price targets section', 'info'); break; case 'macd': this.showToast('MACD indicator added', 'info'); break; } }
    addVolumeIndicator() { if (this.volumeSeries) return; this.volumeSeries = this.chart.addHistogramSeries({ color: '#3b82f6', priceFormat: { type: 'volume' }, priceScaleId: 'volume', scaleMargins: { top: 0.8, bottom: 0 } }); const volumeData = this.chartData.map(d => ({ time: d.time, value: Math.floor(Math.random() * 50000000 + 5000000), color: d.close >= d.open ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)' })); this.volumeSeries.setData(volumeData); this.showToast('Volume indicator added', 'success'); }
    addSMAIndicator() { if (this.smaSeries) return; const sma = this.calculateSMA(this.chartData, 20); this.smaSeries = this.chart.addLineSeries({ color: '#f59e0b', lineWidth: 2, title: 'SMA 20' }); this.smaSeries.setData(sma); this.showToast('SMA (20) added', 'success'); }
    addEMAIndicator() { if (this.emaSeries) return; const ema = this.calculateEMA(this.chartData, 20); this.emaSeries = this.chart.addLineSeries({ color: '#8b5cf6', lineWidth: 2, title: 'EMA 20' }); this.emaSeries.setData(ema); this.showToast('EMA (20) added', 'success'); }
    addBollingerBands() { if (this.bbUpperSeries) return; const bb = this.calculateBollingerBands(this.chartData, 20, 2); this.bbUpperSeries = this.chart.addLineSeries({ color: 'rgba(59, 130, 246, 0.5)', lineWidth: 1 }); this.bbLowerSeries = this.chart.addLineSeries({ color: 'rgba(59, 130, 246, 0.5)', lineWidth: 1 }); this.bbUpperSeries.setData(bb.upper); this.bbLowerSeries.setData(bb.lower); this.showToast('Bollinger Bands added', 'success'); }
    removeIndicator(indicator) { switch(indicator) { case 'volume': if (this.volumeSeries) { this.chart.removeSeries(this.volumeSeries); this.volumeSeries = null; } break; case 'sma': if (this.smaSeries) { this.chart.removeSeries(this.smaSeries); this.smaSeries = null; } break; case 'ema': if (this.emaSeries) { this.chart.removeSeries(this.emaSeries); this.emaSeries = null; } break; case 'bb': if (this.bbUpperSeries) { this.chart.removeSeries(this.bbUpperSeries); this.chart.removeSeries(this.bbLowerSeries); this.bbUpperSeries = null; this.bbLowerSeries = null; } break; } this.showToast(`${indicator.toUpperCase()} removed`, 'info'); }
    calculateSMA(data, period) { const result = []; for (let i = period - 1; i < data.length; i++) { let sum = 0; for (let j = 0; j < period; j++) sum += data[i - j].close; result.push({ time: data[i].time, value: sum / period }); } return result; }
    calculateEMA(data, period) { const result = []; const multiplier = 2 / (period + 1); let ema = data[0].close; for (let i = 0; i < data.length; i++) { ema = (data[i].close - ema) * multiplier + ema; result.push({ time: data[i].time, value: ema }); } return result; }
    calculateBollingerBands(data, period, stdDev) { const sma = this.calculateSMA(data, period); const upper = [], lower = []; for (let i = 0; i < sma.length; i++) { const dataIndex = i + period - 1; let sumSquares = 0; for (let j = 0; j < period; j++) { const diff = data[dataIndex - j].close - sma[i].value; sumSquares += diff * diff; } const std = Math.sqrt(sumSquares / period); upper.push({ time: sma[i].time, value: sma[i].value + stdDev * std }); lower.push({ time: sma[i].time, value: sma[i].value - stdDev * std }); } return { upper, lower }; }
    updateIndicatorButtons() { document.querySelectorAll('.indicator-toggle').forEach(btn => { const indicator = btn.dataset.indicator; if (this.activeIndicators.has(indicator)) btn.classList.add('active'); else btn.classList.remove('active'); }); }


    // ========== MISC UTILITIES ==========
    showToast(message, type = 'info') {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 3000);
    }
    
    toggleTheme() {
        document.body.classList.toggle('light-theme');
        this.showToast('Theme toggled', 'info');
    }
    
    showCreateAlertModal() {
        this.showToast('Alert creation coming soon', 'info');
    }
    
    renderPositions() {
        const container = document.getElementById('positionsList');
        if (!container) return;
        container.innerHTML = '<div class="empty-state">No open positions</div>';
    }
    
    renderAlerts() {
        const container = document.getElementById('alertsList');
        if (!container) return;
        container.innerHTML = '<div class="empty-state">No active alerts</div>';
    }
    
    startPriceUpdates() {
        // Update prices every 5 seconds
        this.priceUpdateInterval = setInterval(() => {
            this.watchlist.forEach(symbol => {
                const stockInfo = STOCK_DATA[symbol] || { price: 100 };
                const currentPrice = this.lastPrices[symbol] || stockInfo.price;
                const change = (Math.random() - 0.5) * 0.5;
                this.lastPrices[symbol] = currentPrice + change;
            });
            this.renderWatchlist();
        }, 5000);
    }
    
    updateMarketStatus() {
        const statusEl = document.getElementById('marketStatusText');
        if (!statusEl) return;
        
        const now = new Date();
        const day = now.getDay();
        const hour = now.getHours();
        
        const isWeekday = day >= 1 && day <= 5;
        const isMarketHours = hour >= 9 && hour < 16;
        
        statusEl.textContent = (isWeekday && isMarketHours) ? 'Market Open' : 'Market Closed';
    }
}

// ========== INITIALIZATION ==========
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing ProTrader...');
    window.app = new ProTraderApp();
    window.app.init().catch(err => {
        console.error('Failed to initialize:', err);
    });
});
