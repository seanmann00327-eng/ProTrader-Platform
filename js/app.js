// ProTrader Platform - Fixed Version
const FINNHUB_API_KEY = 'ctq4prhr01qhb16m3k40ctq4prhr01qhb16m3k4g';

const VALID_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'NVDA', 'META', 'TSLA', 'AMD', 'NFLX', 'JPM', 'SPY', 'QQQ', 'GME', 'PLTR', 'COIN', 'BA', 'DIS', 'V', 'MA', 'WMT', 'HD', 'PG', 'KO', 'PEP', 'MCD', 'SBUX', 'NKE', 'INTC', 'QCOM', 'ORCL', 'CRM', 'ADBE', 'PYPL', 'SQ', 'SHOP', 'ROKU', 'UBER', 'LYFT', 'SNAP', 'PINS', 'RIVN', 'LCID', 'SOFI', 'HOOD', 'IWM', 'DIA', 'VTI', 'VOO', 'GLD', 'SLV', 'XLF', 'XLE', 'XLK'];

const STOCK_DATA = {
    'AAPL': { name: 'Apple Inc.', price: 178.50 },
    'MSFT': { name: 'Microsoft Corporation', price: 378.25 },
    'GOOGL': { name: 'Alphabet Inc.', price: 141.80 },
    'AMZN': { name: 'Amazon.com Inc.', price: 178.90 },
    'NVDA': { name: 'NVIDIA Corporation', price: 875.50 },
    'META': { name: 'Meta Platforms Inc.', price: 505.75 },
    'TSLA': { name: 'Tesla Inc.', price: 248.30 },
    'AMD': { name: 'Advanced Micro Devices', price: 178.45 },
    'NFLX': { name: 'Netflix Inc.', price: 485.20 },
    'JPM': { name: 'JPMorgan Chase & Co.', price: 198.40 },
    'SPY': { name: 'SPDR S&P 500 ETF', price: 478.50 },
    'QQQ': { name: 'Invesco QQQ Trust', price: 405.30 },
    'GME': { name: 'GameStop Corp.', price: 24.85 },
    'PLTR': { name: 'Palantir Technologies', price: 22.30 },
    'COIN': { name: 'Coinbase Global', price: 185.60 }
};

class ProTraderApp {
    constructor() {
        this.currentSymbol = 'AAPL';
        this.currentTimeframe = 'D';
        this.chart = null;
        this.candleSeries = null;
        this.watchlist = JSON.parse(localStorage.getItem('watchlist')) || ['AAPL', 'NVDA', 'TSLA', 'AMD', 'SPY'];
        this.activeIndicators = new Set();
        this.chartData = [];
        this.lastPrices = {};
    }

    async init() {
        console.log('Initializing ProTrader...');
        this.initChart();
        this.setupEventListeners();
        await this.loadSymbolData(this.currentSymbol);
        this.renderWatchlist();
        this.loadPriceTargets();
        this.loadNews();
        this.loadOptionsData();
        this.showToast('Platform loaded successfully', 'success');
    }

    isValidSymbol(symbol) {
        return VALID_SYMBOLS.includes(symbol.toUpperCase()) || STOCK_DATA.hasOwnProperty(symbol.toUpperCase());
    }

    initChart() {
        const container = document.getElementById('chart-container');
        if (!container) return;
        
        this.chart = LightweightCharts.createChart(container, {
            width: container.clientWidth,
            height: container.clientHeight || 500,
            layout: { background: { type: 'solid', color: 'transparent' }, textColor: '#d1d5db' },
            grid: { vertLines: { color: 'rgba(59,130,246,0.1)' }, horzLines: { color: 'rgba(59,130,246,0.1)' } },
            crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
            rightPriceScale: { borderColor: 'rgba(59,130,246,0.2)' },
            timeScale: { borderColor: 'rgba(59,130,246,0.2)', timeVisible: true }
        });
        
        this.candleSeries = this.chart.addCandlestickSeries({
            upColor: '#10b981', downColor: '#ef4444',
            borderUpColor: '#10b981', borderDownColor: '#ef4444',
            wickUpColor: '#10b981', wickDownColor: '#ef4444'
        });
        
        window.addEventListener('resize', () => {
            this.chart.applyOptions({ width: container.clientWidth });
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
            const change = basePrice * volatility * (Math.random() - 0.5) * 2;
            const open = basePrice;
            const close = basePrice + change;
            const high = Math.max(open, close) * (1 + Math.random() * 0.008);
            const low = Math.min(open, close) * (1 - Math.random() * 0.008);
            
            data.push({
                time: Math.floor(date.getTime() / 1000),
                open: parseFloat(open.toFixed(2)),
                high: parseFloat(high.toFixed(2)),
                low: parseFloat(low.toFixed(2)),
                close: parseFloat(close.toFixed(2))
            });
            basePrice = close;
        }
        this.lastPrices[symbol] = basePrice;
        return data;
    }

    async loadSymbolData(symbol) {
        const upperSymbol = symbol.toUpperCase().trim();
        if (!this.isValidSymbol(upperSymbol)) {
            this.showToast('Invalid symbol: ' + symbol, 'error');
            return false;
        }
        this.currentSymbol = upperSymbol;
        
        const symbolEl = document.getElementById('currentSymbol');
        const nameEl = document.getElementById('companyName');
        const priceEl = document.getElementById('currentPrice');
        const changeEl = document.getElementById('priceChange');
        
        const stockInfo = STOCK_DATA[upperSymbol] || { name: upperSymbol, price: 100 };
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
            changeEl.textContent = (change >= 0 ? '+' : '') + change.toFixed(2) + ' (' + (change >= 0 ? '+' : '') + changePct.toFixed(2) + '%)';
            changeEl.className = change >= 0 ? 'positive' : 'negative';
        }
        
        this.loadPriceTargets();
        this.loadNews();
        this.loadOptionsData();
        return true;
    }

    loadPriceTargets() {
        const container = document.getElementById('priceTargets');
        if (!container || this.chartData.length < 20) return;
        
        const prices = this.chartData.map(d => d.close);
        const currentPrice = prices[prices.length - 1];
        const high52 = Math.max(...prices.slice(-252));
        const low52 = Math.min(...prices.slice(-252));
        
        const recentPrices = prices.slice(-50);
        const avg = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
        const std = Math.sqrt(recentPrices.map(p => Math.pow(p - avg, 2)).reduce((a, b) => a + b, 0) / recentPrices.length);
        
        const support1 = (currentPrice - std).toFixed(2);
        const support2 = (currentPrice - std * 2).toFixed(2);
        const resistance1 = (currentPrice + std).toFixed(2);
        const resistance2 = (currentPrice + std * 2).toFixed(2);
        
        let gains = 0, losses = 0;
        for (let i = prices.length - 14; i < prices.length; i++) {
            const change = prices[i] - prices[i - 1];
            if (change > 0) gains += change; else losses -= change;
        }
        const rs = losses === 0 ? 100 : gains / losses;
        const rsi = (100 - (100 / (1 + rs))).toFixed(1);
        
        const sma20 = (prices.slice(-20).reduce((a, b) => a + b, 0) / 20).toFixed(2);
        
        let signal = 'HOLD', signalClass = 'neutral', confidence = 50;
        if (rsi < 30) { signal = 'STRONG BUY'; signalClass = 'positive'; confidence = 85; }
        else if (rsi < 40) { signal = 'BUY'; signalClass = 'positive'; confidence = 70; }
        else if (rsi > 70) { signal = 'STRONG SELL'; signalClass = 'negative'; confidence = 85; }
        else if (rsi > 60) { signal = 'SELL'; signalClass = 'negative'; confidence = 70; }
        
        container.innerHTML = '<div class="signal-box ' + signalClass + '"><div class="signal-label">AI Signal</div><div class="signal-value ' + signalClass + '">' + signal + '</div><div class="confidence">Confidence: ' + confidence + '%</div></div>' +
            '<div class="targets-grid"><div class="target-item support"><div class="label">Support 2</div><div class="value">$' + support2 + '</div></div>' +
            '<div class="target-item support"><div class="label">Support 1</div><div class="value">$' + support1 + '</div></div>' +
            '<div class="target-item current"><div class="label">Current</div><div class="value">$' + currentPrice.toFixed(2) + '</div></div>' +
            '<div class="target-item resistance"><div class="label">Resistance 1</div><div class="value">$' + resistance1 + '</div></div>' +
            '<div class="target-item resistance"><div class="label">Resistance 2</div><div class="value">$' + resistance2 + '</div></div></div>' +
            '<div class="target-metrics"><div class="metric"><span>RSI (14)</span><span>' + rsi + '</span></div>' +
            '<div class="metric"><span>SMA 20</span><span>$' + sma20 + '</span></div>' +
            '<div class="metric"><span>52W High</span><span>$' + high52.toFixed(2) + '</span></div>' +
            '<div class="metric"><span>52W Low</span><span>$' + low52.toFixed(2) + '</span></div></div>';
    }

    loadNews() {
        const container = document.getElementById('newsContainer');
        if (!container) return;
        
        const symbol = this.currentSymbol;
        const news = [
            { source: 'Reuters', headline: symbol + ' reports strong quarterly earnings beat expectations', time: '2 hours ago' },
            { source: 'Bloomberg', headline: 'Analysts upgrade ' + symbol + ' price target following product launch', time: '4 hours ago' },
            { source: 'CNBC', headline: symbol + ' stock moves on institutional investor activity', time: '6 hours ago' },
            { source: 'MarketWatch', headline: 'Technical analysis: ' + symbol + ' approaching key resistance level', time: '8 hours ago' },
            { source: 'WSJ', headline: symbol + ' CEO discusses growth strategy in investor call', time: '12 hours ago' }
        ];
        
        container.innerHTML = '<h3><i class="fas fa-newspaper"></i> Latest News</h3>' +
            news.map(item => '<div class="news-item"><div class="news-source">' + item.source + '</div><div class="news-headline">' + item.headline + '</div><div class="news-time">' + item.time + '</div></div>').join('');
    }

    loadOptionsData() {
        const container = document.getElementById('options-content');
        if (!container) return;
        
        const currentPrice = this.lastPrices[this.currentSymbol] || 100;
        const strikes = [];
        const interval = currentPrice > 100 ? 5 : 2.5;
        const baseStrike = Math.round(currentPrice / interval) * interval;
        for (let i = -5; i <= 5; i++) strikes.push(baseStrike + (i * interval));
        
        let html = '<div class="options-header"><span>Current: $' + currentPrice.toFixed(2) + '</span></div>';
        html += '<div class="options-table"><div class="options-row header"><span>CALLS</span><span>Strike</span><span>PUTS</span></div>';
        
        strikes.forEach(strike => {
            const diff = Math.abs(currentPrice - strike);
            const moneyness = diff / currentPrice;
            const isITM = strike < currentPrice;
            const callPremium = (isITM ? currentPrice - strike : 0) + Math.max(0.5, (1 - moneyness) * 3) + Math.random() * 2;
            const putPremium = (!isITM ? strike - currentPrice : 0) + Math.max(0.5, (1 - moneyness) * 3) + Math.random() * 2;
            
            html += '<div class="options-row' + (isITM ? ' itm' : '') + '">';
            html += '<span class="call-data">$' + callPremium.toFixed(2) + '</span>';
            html += '<span class="strike-price">' + strike.toFixed(2) + '</span>';
            html += '<span class="put-data">$' + putPremium.toFixed(2) + '</span>';
            html += '</div>';
        });
        html += '</div>';
        container.innerHTML = html;
    }

    setupEventListeners() {
        const searchInput = document.getElementById('symbolInput');
        const searchBtn = document.getElementById('searchBtn');
        
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.loadSymbolData(searchInput.value);
            });
        }
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const input = document.getElementById('symbolInput');
                if (input) this.loadSymbolData(input.value);
            });
        }
        
        document.querySelectorAll('.tf-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
        
        document.querySelectorAll('.panel-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const panel = e.target.dataset.panel;
                document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                const content = document.getElementById(panel + '-content');
                if (content) content.classList.add('active');
            });
        });
        
        const addBtn = document.getElementById('addWatchlistBtn');
        const addInput = document.getElementById('addWatchlistInput');
        if (addBtn && addInput) {
            addBtn.addEventListener('click', () => this.addToWatchlist(addInput.value));
            addInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.addToWatchlist(addInput.value);
            });
        }
        
        document.querySelectorAll('.indicator-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const indicator = e.target.closest('.indicator-toggle').dataset.indicator;
                this.toggleIndicator(indicator);
            });
        });
    }

    addToWatchlist(symbol) {
        if (!symbol) return;
        const upperSymbol = symbol.toUpperCase().trim();
        if (!this.isValidSymbol(upperSymbol)) {
            this.showToast('Invalid symbol: ' + symbol, 'error');
            return;
        }
        if (this.watchlist.includes(upperSymbol)) {
            this.showToast(upperSymbol + ' is already in watchlist', 'warning');
            return;
        }
        this.watchlist.push(upperSymbol);
        localStorage.setItem('watchlist', JSON.stringify(this.watchlist));
        this.renderWatchlist();
        this.showToast('Added ' + upperSymbol + ' to watchlist', 'success');
        const input = document.getElementById('addWatchlistInput');
        if (input) input.value = '';
    }

    removeFromWatchlist(symbol) {
        this.watchlist = this.watchlist.filter(s => s !== symbol);
        localStorage.setItem('watchlist', JSON.stringify(this.watchlist));
        this.renderWatchlist();
        this.showToast('Removed ' + symbol, 'info');
    }

    renderWatchlist() {
        const container = document.getElementById('watchlistItems');
        if (!container) return;
        
        if (this.watchlist.length === 0) {
            container.innerHTML = '<div class="empty-state">No symbols in watchlist</div>';
            return;
        }
        
        container.innerHTML = this.watchlist.map(symbol => {
            const stockInfo = STOCK_DATA[symbol] || { name: symbol, price: 100 };
            const price = this.lastPrices[symbol] || stockInfo.price;
            const change = ((Math.random() - 0.5) * 4).toFixed(2);
            const isPositive = parseFloat(change) >= 0;
            return '<div class="watchlist-item" onclick="app.loadSymbolData(\'' + symbol + '\')">' +
                '<div class="watchlist-info"><span class="watchlist-symbol">' + symbol + '</span><span class="watchlist-name">' + stockInfo.name + '</span></div>' +
                '<div class="watchlist-price"><span>$' + price.toFixed(2) + '</span><span class="' + (isPositive ? 'positive' : 'negative') + '">' + (isPositive ? '+' : '') + change + '%</span></div>' +
                '<button class="remove-btn" onclick="event.stopPropagation(); app.removeFromWatchlist(\'' + symbol + '\')">&times;</button></div>';
        }).join('');
    }

    toggleIndicator(indicator) {
        const btn = document.querySelector('[data-indicator="' + indicator + '"]');
        if (this.activeIndicators.has(indicator)) {
            this.activeIndicators.delete(indicator);
            this.removeIndicator(indicator);
            if (btn) btn.classList.remove('active');
            this.showToast(indicator.toUpperCase() + ' removed', 'info');
        } else {
            this.activeIndicators.add(indicator);
            this.addIndicator(indicator);
            if (btn) btn.classList.add('active');
            this.showToast(indicator.toUpperCase() + ' added', 'success');
        }
    }

    addIndicator(indicator) {
        if (!this.chartData || this.chartData.length === 0) return;
        
        if (indicator === 'sma' && !this.smaSeries) {
            const smaData = [];
            for (let i = 19; i < this.chartData.length; i++) {
                let sum = 0;
                for (let j = 0; j < 20; j++) sum += this.chartData[i - j].close;
                smaData.push({ time: this.chartData[i].time, value: sum / 20 });
            }
            this.smaSeries = this.chart.addLineSeries({ color: '#f59e0b', lineWidth: 2 });
            this.smaSeries.setData(smaData);
        }
        
        if (indicator === 'ema' && !this.emaSeries) {
            const emaData = [];
            const mult = 2 / 21;
            let ema = this.chartData[0].close;
            for (let i = 0; i < this.chartData.length; i++) {
                ema = (this.chartData[i].close - ema) * mult + ema;
                emaData.push({ time: this.chartData[i].time, value: ema });
            }
            this.emaSeries = this.chart.addLineSeries({ color: '#8b5cf6', lineWidth: 2 });
            this.emaSeries.setData(emaData);
        }
        
        if (indicator === 'volume' && !this.volumeSeries) {
            this.volumeSeries = this.chart.addHistogramSeries({
                color: '#3b82f6', priceFormat: { type: 'volume' },
                priceScaleId: 'volume', scaleMargins: { top: 0.8, bottom: 0 }
            });
            const volData = this.chartData.map(d => ({
                time: d.time, value: Math.floor(Math.random() * 50000000 + 5000000),
                color: d.close >= d.open ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)'
            }));
            this.volumeSeries.setData(volData);
        }
    }

    removeIndicator(indicator) {
        if (indicator === 'sma' && this.smaSeries) {
            this.chart.removeSeries(this.smaSeries);
            this.smaSeries = null;
        }
        if (indicator === 'ema' && this.emaSeries) {
            this.chart.removeSeries(this.emaSeries);
            this.emaSeries = null;
        }
        if (indicator === 'volume' && this.volumeSeries) {
            this.chart.removeSeries(this.volumeSeries);
            this.volumeSeries = null;
        }
    }

    showToast(message, type) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = 'toast ' + (type || 'info');
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// Initialize app when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting app...');
    window.app = new ProTraderApp();
    window.app.init();
});
