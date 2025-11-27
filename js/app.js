// ProTrader Platform - Main Application
// Full-featured trading platform with symbol validation, watchlist, options, and indicators

// Valid stock symbols list for validation
const VALID_SYMBOLS = [
    'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B', 'UNH',
    'JNJ', 'V', 'XOM', 'WMT', 'JPM', 'MA', 'PG', 'HD', 'CVX', 'MRK', 'ABBV', 'LLY',
    'PFE', 'KO', 'PEP', 'COST', 'TMO', 'BAC', 'AVGO', 'MCD', 'DIS', 'CSCO', 'ACN',
    'ABT', 'DHR', 'VZ', 'ADBE', 'CRM', 'CMCSA', 'NKE', 'TXN', 'NEE', 'PM', 'BMY',
    'INTC', 'AMD', 'QCOM', 'HON', 'UNP', 'T', 'RTX', 'ORCL', 'LOW', 'SPGI', 'IBM',
    'BA', 'GS', 'CAT', 'MS', 'BLK', 'AMGN', 'INTU', 'DE', 'SBUX', 'GILD', 'AXP',
    'MDLZ', 'ADI', 'ISRG', 'SYK', 'BKNG', 'VRTX', 'REGN', 'ZTS', 'PANW', 'LRCX',
    'ETN', 'MU', 'SNPS', 'KLAC', 'CDNS', 'MRVL', 'AMAT', 'FTNT', 'ADSK', 'ABNB',
    'NFLX', 'PYPL', 'SQ', 'SHOP', 'ROKU', 'UBER', 'LYFT', 'SNAP', 'PINS', 'TWTR',
    'SPY', 'QQQ', 'IWM', 'DIA', 'VTI', 'VOO', 'ARKK', 'XLF', 'XLE', 'XLK', 'GLD', 'SLV',
    'GME', 'AMC', 'BB', 'PLTR', 'NIO', 'RIVN', 'LCID', 'SOFI', 'HOOD', 'COIN'
];

// Stock data with realistic base prices
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
    'V': { name: 'Visa Inc.', price: 278.90, sector: 'Financial' },
    'SPY': { name: 'SPDR S&P 500 ETF', price: 478.50, sector: 'ETF' },
    'QQQ': { name: 'Invesco QQQ Trust', price: 405.30, sector: 'ETF' },
    'GME': { name: 'GameStop Corp.', price: 24.85, sector: 'Retail' },
    'AMC': { name: 'AMC Entertainment', price: 8.45, sector: 'Entertainment' },
    'PLTR': { name: 'Palantir Technologies', price: 22.30, sector: 'Technology' },
    'NIO': { name: 'NIO Inc.', price: 7.85, sector: 'Automotive' },
    'COIN': { name: 'Coinbase Global', price: 185.60, sector: 'Financial' },
    'SOFI': { name: 'SoFi Technologies', price: 9.45, sector: 'Financial' },
    'RIVN': { name: 'Rivian Automotive', price: 18.90, sector: 'Automotive' }
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
    }

    async init() {
        console.log('Initializing ProTrader Platform...');
        
        // Initialize chart
        this.initChart();
        
        // Setup all event listeners
        this.setupEventListeners();
        
        // Load initial data
        await this.loadSymbolData(this.currentSymbol);
        
        // Render watchlist
        this.renderWatchlist();
        
        // Render positions
        this.renderPositions();
        
        // Render alerts
        this.renderAlerts();
        
        // Load options data
        this.loadOptionsData(this.currentSymbol);
        
        // Start price updates
        this.startPriceUpdates();
        
        // Update market status
        this.updateMarketStatus();
        
        console.log('ProTrader Platform initialized successfully!');
        this.showToast('Platform loaded successfully', 'success');
    }

    // Symbol validation - reject garbage tickers
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
            layout: {
                background: { type: 'solid', color: 'transparent' },
                textColor: '#d1d5db'
            },
            grid: {
                vertLines: { color: 'rgba(59, 130, 246, 0.1)' },
                horzLines: { color: 'rgba(59, 130, 246, 0.1)' }
            },
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
                vertLine: { color: '#3b82f6', width: 1, style: 2 },
                horzLine: { color: '#3b82f6', width: 1, style: 2 }
            },
            rightPriceScale: {
                borderColor: 'rgba(59, 130, 246, 0.2)',
                scaleMargins: { top: 0.1, bottom: 0.2 }
            },
            timeScale: {
                borderColor: 'rgba(59, 130, 246, 0.2)',
                timeVisible: true,
                secondsVisible: false
            }
        });

        this.candleSeries = this.chart.addCandlestickSeries({
            upColor: '#10b981',
            downColor: '#ef4444',
            borderUpColor: '#10b981',
            borderDownColor: '#ef4444',
            wickUpColor: '#10b981',
            wickDownColor: '#ef4444'
        });

        // Handle resize
        window.addEventListener('resize', () => {
            this.chart.applyOptions({ 
                width: container.clientWidth,
                height: container.clientHeight || 500
            });
        });
    }

    // Generate realistic chart data
    generateChartData(symbol, days = 365) {
        const data = [];
        const stockInfo = STOCK_DATA[symbol] || { price: 100 };
        let basePrice = stockInfo.price;
        const now = new Date();
        
        for (let i = days; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            // Skip weekends
            if (date.getDay() === 0 || date.getDay() === 6) continue;
            
            const volatility = 0.015; // 1.5% daily volatility
            const drift = 0.0002; // Slight upward bias
            const random = (Math.random() - 0.5) * 2;
            const change = basePrice * (drift + volatility * random);
            
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
        
        // Validate symbol first
        if (!this.isValidSymbol(upperSymbol)) {
            this.showToast(`Invalid symbol: ${symbol}. Please enter a valid stock ticker.`, 'error');
            return false;
        }
        
        this.currentSymbol = upperSymbol;
        
        // Update UI
        const symbolEl = document.getElementById('currentSymbol');
        const nameEl = document.getElementById('companyName');
        const priceEl = document.getElementById('currentPrice');
        const changeEl = document.getElementById('priceChange');
        
        const stockInfo = STOCK_DATA[upperSymbol] || { 
            name: upperSymbol + ' Corporation', 
            price: 100 + Math.random() * 200 
        };
        
        if (symbolEl) symbolEl.textContent = upperSymbol;
        if (nameEl) nameEl.textContent = stockInfo.name;
        
        // Generate and display chart data
        this.chartData = this.generateChartData(upperSymbol);
        
        if (this.candleSeries) {
            this.candleSeries.setData(this.chartData);
            this.chart.timeScale().fitContent();
        }
        
        // Update price display
        const lastCandle = this.chartData[this.chartData.length - 1];
        const prevCandle = this.chartData[this.chartData.length - 2];
        
        if (lastCandle && priceEl) {
            priceEl.textContent = '$' + lastCandle.close.toFixed(2);
        }
        
        if (lastCandle && prevCandle && changeEl) {
            const change = lastCandle.close - prevCandle.close;
            const changePct = (change / prevCandle.close) * 100;
            const isPositive = change >= 0;
            changeEl.textContent = `${isPositive ? '+' : ''}${change.toFixed(2)} (${isPositive ? '+' : ''}${changePct.toFixed(2)}%)`;
            changeEl.className = isPositive ? 'positive' : 'negative';
        }
        
        // Update quick stats
        this.updateQuickStats(lastCandle);
        
        // Load options for this symbol
        this.loadOptionsData(upperSymbol);
        
        return true;
    }

    updateQuickStats(candle) {
        if (!candle) return;
        
        const volEl = document.getElementById('statVol');
        const highEl = document.getElementById('statHigh');
        const lowEl = document.getElementById('statLow');
        const openEl = document.getElementById('statOpen');
        
        // Generate realistic volume
        const volume = Math.floor(Math.random() * 50000000 + 10000000);
        
        if (volEl) volEl.textContent = (volume / 1000000).toFixed(1) + 'M';
        if (highEl) highEl.textContent = '$' + candle.high.toFixed(2);
        if (lowEl) lowEl.textContent = '$' + candle.low.toFixed(2);
        if (openEl) openEl.textContent = '$' + candle.open.toFixed(2);
    }

    setupEventListeners() {
        // Symbol search
        const searchInput = document.getElementById('symbolInput');
        const searchBtn = document.getElementById('searchBtn');
        
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchSymbol(searchInput.value);
                }
            });
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const input = document.getElementById('symbolInput');
                if (input) this.searchSymbol(input.value);
            });
        }

        // Timeframe buttons
        document.querySelectorAll('.tf-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.changeTimeframe(e.target.dataset.tf);
            });
        });

        // Panel tabs (Watchlist, Options, Alerts)
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

        // Watchlist add button
        const addWatchlistBtn = document.getElementById('addWatchlistBtn');
        const watchlistInput = document.getElementById('addWatchlistInput');
        
        if (addWatchlistBtn) {
            addWatchlistBtn.addEventListener('click', () => {
                if (watchlistInput && watchlistInput.value) {
                    this.addToWatchlist(watchlistInput.value);
                    watchlistInput.value = '';
                }
            });
        }
        
        if (watchlistInput) {
            watchlistInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && watchlistInput.value) {
                    this.addToWatchlist(watchlistInput.value);
                    watchlistInput.value = '';
                }
            });
        }

        // Indicator buttons
        const indicatorBtn = document.getElementById('indicatorBtn');
        if (indicatorBtn) {
            indicatorBtn.addEventListener('click', () => this.toggleIndicatorMenu());
        }

        // Individual indicator toggles
        document.querySelectorAll('.indicator-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const indicator = e.target.dataset.indicator;
                this.toggleIndicator(indicator);
            });
        });

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Create alert button
        const createAlertBtn = document.getElementById('createAlertBtn');
        if (createAlertBtn) {
            createAlertBtn.addEventListener('click', () => this.showCreateAlertModal());
        }
    }

    searchSymbol(symbol) {
        if (!symbol || symbol.trim() === '') {
            this.showToast('Please enter a symbol', 'warning');
            return;
        }
        this.loadSymbolData(symbol);
    }

    changeTimeframe(tf) {
        this.currentTimeframe = tf;
        // Regenerate data based on timeframe
        let days = 365;
        switch(tf) {
            case '1m': days = 1; break;
            case '5m': days = 5; break;
            case '15m': days = 15; break;
            case '1H': days = 30; break;
            case '4H': days = 90; break;
            case '1D': days = 365; break;
            case '1W': days = 365 * 2; break;
            case '1M': days = 365 * 5; break;
        }
        this.chartData = this.generateChartData(this.currentSymbol, days);
        if (this.candleSeries) {
            this.candleSeries.setData(this.chartData);
            this.chart.timeScale().fitContent();
        }
    }

    // ========== WATCHLIST FUNCTIONS ==========
    addToWatchlist(symbol) {
        const upperSymbol = symbol.toUpperCase().trim();
        
        if (!this.isValidSymbol(upperSymbol)) {
            this.showToast(`Invalid symbol: ${symbol}`, 'error');
            return;
        }
        
        if (this.watchlist.includes(upperSymbol)) {
            this.showToast(`${upperSymbol} is already in your watchlist`, 'warning');
            return;
        }
        
        this.watchlist.push(upperSymbol);
        localStorage.setItem('watchlist', JSON.stringify(this.watchlist));
        this.renderWatchlist();
        this.showToast(`Added ${upperSymbol} to watchlist`, 'success');
    }

    removeFromWatchlist(symbol) {
        this.watchlist = this.watchlist.filter(s => s !== symbol);
        localStorage.setItem('watchlist', JSON.stringify(this.watchlist));
        this.renderWatchlist();
        this.showToast(`Removed ${symbol} from watchlist`, 'info');
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
            const change = (Math.random() - 0.5) * 4;
            const isPositive = change >= 0;
            
            return `
                <div class="watchlist-item" onclick="app.loadSymbolData('${symbol}')">
                    <div class="watchlist-symbol">
                        <span class="symbol">${symbol}</span>
                        <span class="name">${stockInfo.name || symbol}</span>
                    </div>
                    <div class="watchlist-price">
                        <span class="price">$${price.toFixed(2)}</span>
                        <span class="change ${isPositive ? 'positive' : 'negative'}">
                            ${isPositive ? '+' : ''}${change.toFixed(2)}%
                        </span>
                    </div>
                    <button class="remove-btn" onclick="event.stopPropagation(); app.removeFromWatchlist('${symbol}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        }).join('');
    }

    // ========== OPTIONS CHAIN ==========
    loadOptionsData(symbol) {
        const container = document.getElementById('options-content');
        if (!container) return;
        
        const stockInfo = STOCK_DATA[symbol] || { price: 100 };
        const currentPrice = this.lastPrices[symbol] || stockInfo.price;
        
        // Generate realistic options chain
        const expirations = ['Dec 29', 'Jan 5', 'Jan 12', 'Jan 19', 'Feb 16'];
        const strikes = this.generateStrikes(currentPrice);
        
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
        
        for (let i = -5; i <= 5; i++) {
            strikes.push(baseStrike + (i * interval));
        }
        return strikes;
    }

    generateOptionData(currentPrice, strike, type) {
        const diff = Math.abs(currentPrice - strike);
        const moneyness = diff / currentPrice;
        
        // Intrinsic value
        let intrinsic = 0;
        if (type === 'call' && currentPrice > strike) {
            intrinsic = currentPrice - strike;
        } else if (type === 'put' && currentPrice < strike) {
            intrinsic = strike - currentPrice;
        }
        
        // Time value (decreases with distance from ATM)
        const timeValue = Math.max(0.5, (1 - moneyness) * 3 + Math.random() * 2);
        const premium = intrinsic + timeValue;
        
        return {
            bid: Math.max(0.01, premium - 0.05 - Math.random() * 0.1),
            ask: premium + 0.05 + Math.random() * 0.1,
            volume: Math.floor(Math.random() * 5000 + 100),
            iv: Math.floor(25 + moneyness * 30 + Math.random() * 10)
        };
    }

    // ========== INDICATORS ==========
    toggleIndicator(indicator) {
        if (this.activeIndicators.has(indicator)) {
            this.activeIndicators.delete(indicator);
            this.removeIndicator(indicator);
        } else {
            this.activeIndicators.add(indicator);
            this.addIndicator(indicator);
        }
        this.updateIndicatorButtons();
    }

    addIndicator(indicator) {
        if (!this.chartData || this.chartData.length === 0) return;
        
        switch(indicator) {
            case 'volume':
                this.addVolumeIndicator();
                break;
            case 'rsi':
                this.addRSIIndicator();
                break;
            case 'macd':
                this.addMACDIndicator();
                break;
            case 'sma':
                this.addSMAIndicator();
                break;
            case 'ema':
                this.addEMAIndicator();
                break;
            case 'bb':
                this.addBollingerBands();
                break;
        }
    }

    addVolumeIndicator() {
        if (this.volumeSeries) return;
        
        this.volumeSeries = this.chart.addHistogramSeries({
            color: '#3b82f6',
            priceFormat: { type: 'volume' },
            priceScaleId: 'volume',
            scaleMargins: { top: 0.8, bottom: 0 }
        });
        
        const volumeData = this.chartData.map(d => ({
            time: d.time,
            value: Math.floor(Math.random() * 50000000 + 5000000),
            color: d.close >= d.open ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'
        }));
        
        this.volumeSeries.setData(volumeData);
        this.showToast('Volume indicator added', 'success');
    }

    addSMAIndicator() {
        if (this.smaSeries) return;
        
        const sma = this.calculateSMA(this.chartData, 20);
        
        this.smaSeries = this.chart.addLineSeries({
            color: '#f59e0b',
            lineWidth: 2,
            title: 'SMA 20'
        });
        
        this.smaSeries.setData(sma);
        this.showToast('SMA (20) added', 'success');
    }

    addEMAIndicator() {
        if (this.emaSeries) return;
        
        const ema = this.calculateEMA(this.chartData, 20);
        
        this.emaSeries = this.chart.addLineSeries({
            color: '#8b5cf6',
            lineWidth: 2,
            title: 'EMA 20'
        });
        
        this.emaSeries.setData(ema);
        this.showToast('EMA (20) added', 'success');
    }

    addBollingerBands() {
        if (this.bbUpperSeries) return;
        
        const bb = this.calculateBollingerBands(this.chartData, 20, 2);
        
        this.bbUpperSeries = this.chart.addLineSeries({
            color: 'rgba(59, 130, 246, 0.5)',
            lineWidth: 1,
            title: 'BB Upper'
        });
        
        this.bbLowerSeries = this.chart.addLineSeries({
            color: 'rgba(59, 130, 246, 0.5)',
            lineWidth: 1,
            title: 'BB Lower'
        });
        
        this.bbUpperSeries.setData(bb.upper);
        this.bbLowerSeries.setData(bb.lower);
        this.showToast('Bollinger Bands added', 'success');
    }

    addRSIIndicator() {
        this.showToast('RSI indicator - displayed in panel below chart', 'info');
        const rsiPanel = document.getElementById('rsiPanel');
        if (rsiPanel) rsiPanel.style.display = 'block';
    }

    addMACDIndicator() {
        this.showToast('MACD indicator - displayed in panel below chart', 'info');
        const macdPanel = document.getElementById('macdPanel');
        if (macdPanel) macdPanel.style.display = 'block';
    }

    removeIndicator(indicator) {
        switch(indicator) {
            case 'volume':
                if (this.volumeSeries) {
                    this.chart.removeSeries(this.volumeSeries);
                    this.volumeSeries = null;
                }
                break;
            case 'sma':
                if (this.smaSeries) {
                    this.chart.removeSeries(this.smaSeries);
                    this.smaSeries = null;
                }
                break;
            case 'ema':
                if (this.emaSeries) {
                    this.chart.removeSeries(this.emaSeries);
                    this.emaSeries = null;
                }
                break;
            case 'bb':
                if (this.bbUpperSeries) {
                    this.chart.removeSeries(this.bbUpperSeries);
                    this.chart.removeSeries(this.bbLowerSeries);
                    this.bbUpperSeries = null;
                    this.bbLowerSeries = null;
                }
                break;
        }
        this.showToast(`${indicator.toUpperCase()} removed`, 'info');
    }

    calculateSMA(data, period) {
        const result = [];
        for (let i = period - 1; i < data.length; i++) {
            let sum = 0;
            for (let j = 0; j < period; j++) {
                sum += data[i - j].close;
            }
            result.push({ time: data[i].time, value: sum / period });
        }
        return result;
    }

    calculateEMA(data, period) {
        const result = [];
        const multiplier = 2 / (period + 1);
        let ema = data[0].close;
        
        for (let i = 0; i < data.length; i++) {
            ema = (data[i].close - ema) * multiplier + ema;
            result.push({ time: data[i].time, value: ema });
        }
        return result;
    }

    calculateBollingerBands(data, period, stdDev) {
        const sma = this.calculateSMA(data, period);
        const upper = [];
        const lower = [];
        
        for (let i = 0; i < sma.length; i++) {
            const dataIndex = i + period - 1;
            let sumSquares = 0;
            for (let j = 0; j < period; j++) {
                const diff = data[dataIndex - j].close - sma[i].value;
                sumSquares += diff * diff;
            }
            const std = Math.sqrt(sumSquares / period);
            upper.push({ time: sma[i].time, value: sma[i].value + stdDev * std });
            lower.push({ time: sma[i].time, value: sma[i].value - stdDev * std });
        }
        return { upper, lower };
    }

    updateIndicatorButtons() {
        document.querySelectorAll('.indicator-toggle').forEach(btn => {
            const indicator = btn.dataset.indicator;
            if (this.activeIndicators.has(indicator)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    toggleIndicatorMenu() {
        const menu = document.getElementById('indicatorMenu');
        if (menu) {
            menu.classList.toggle('show');
        }
    }

    // ========== ALERTS ==========
    renderAlerts() {
        const container = document.getElementById('alertsList');
        if (!container) return;
        
        if (this.alerts.length === 0) {
            container.innerHTML = '<div class="empty-state">No alerts set</div>';
            return;
        }
        
        container.innerHTML = this.alerts.map((alert, index) => `
            <div class="alert-item">
                <div class="alert-info">
                    <span class="alert-symbol">${alert.symbol}</span>
                    <span class="alert-condition">${alert.condition} $${alert.price}</span>
                </div>
                <button class="remove-btn" onclick="app.removeAlert(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    showCreateAlertModal() {
        const price = this.lastPrices[this.currentSymbol] || 100;
        const modal = `
            <div class="modal-overlay" id="alertModal">
                <div class="modal-content">
                    <h3>Create Price Alert</h3>
                    <div class="form-group">
                        <label>Symbol</label>
                        <input type="text" id="alertSymbol" value="${this.currentSymbol}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Condition</label>
                        <select id="alertCondition">
                            <option value="above">Price Above</option>
                            <option value="below">Price Below</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Price</label>
                        <input type="number" id="alertPrice" value="${price.toFixed(2)}" step="0.01">
                    </div>
                    <div class="modal-buttons">
                        <button onclick="app.createAlert()">Create Alert</button>
                        <button onclick="app.closeModal()">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modal);
    }

    createAlert() {
        const symbol = document.getElementById('alertSymbol').value;
        const condition = document.getElementById('alertCondition').value;
        const price = parseFloat(document.getElementById('alertPrice').value);
        
        this.alerts.push({ symbol, condition, price });
        localStorage.setItem('alerts', JSON.stringify(this.alerts));
        this.renderAlerts();
        this.closeModal();
        this.showToast(`Alert created for ${symbol}`, 'success');
    }

    removeAlert(index) {
        this.alerts.splice(index, 1);
        localStorage.setItem('alerts', JSON.stringify(this.alerts));
        this.renderAlerts();
        this.showToast('Alert removed', 'info');
    }

    closeModal() {
        const modal = document.getElementById('alertModal');
        if (modal) modal.remove();
    }

    // ========== POSITIONS ==========
    renderPositions() {
        const container = document.getElementById('positionsList');
        const totalPnlEl = document.getElementById('totalPnl');
        if (!container) return;
        
        // Demo positions
        const demoPositions = [
            { symbol: 'AAPL', qty: 100, avgPrice: 175.50, currentPrice: 178.50 },
            { symbol: 'NVDA', qty: 50, avgPrice: 850.00, currentPrice: 875.50 },
            { symbol: 'TSLA', qty: 25, avgPrice: 255.00, currentPrice: 248.30 }
        ];
        
        let totalPnl = 0;
        
        container.innerHTML = demoPositions.map(pos => {
            const pnl = (pos.currentPrice - pos.avgPrice) * pos.qty;
            totalPnl += pnl;
            const isPositive = pnl >= 0;
            
            return `
                <div class="position-item">
                    <div class="position-info">
                        <span class="symbol">${pos.symbol}</span>
                        <span class="qty">${pos.qty} shares @ $${pos.avgPrice.toFixed(2)}</span>
                    </div>
                    <div class="position-pnl ${isPositive ? 'positive' : 'negative'}">
                        ${isPositive ? '+' : ''}$${pnl.toFixed(2)}
                    </div>
                </div>
            `;
        }).join('');
        
        if (totalPnlEl) {
            totalPnlEl.textContent = (totalPnl >= 0 ? '+' : '') + '$' + totalPnl.toFixed(2);
            totalPnlEl.className = 'pnl ' + (totalPnl >= 0 ? 'positive' : 'negative');
        }
    }

    // ========== UTILITIES ==========
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer') || document.body;
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    updateMarketStatus() {
        const statusEl = document.getElementById('marketStatusText');
        const dotEl = document.querySelector('.status-dot');
        
        const now = new Date();
        const day = now.getDay();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const currentTime = hours * 60 + minutes;
        
        // Market hours: 9:30 AM - 4:00 PM EST, Mon-Fri
        const marketOpen = 9 * 60 + 30; // 9:30 AM
        const marketClose = 16 * 60; // 4:00 PM
        
        const isWeekday = day >= 1 && day <= 5;
        const isDuringHours = currentTime >= marketOpen && currentTime < marketClose;
        const isOpen = isWeekday && isDuringHours;
        
        if (statusEl) statusEl.textContent = isOpen ? 'Market Open' : 'Market Closed';
        if (dotEl) {
            dotEl.style.backgroundColor = isOpen ? '#10b981' : '#ef4444';
        }
    }

    toggleTheme() {
        document.body.classList.toggle('light-theme');
        this.showToast('Theme toggled', 'info');
    }

    startPriceUpdates() {
        // Update prices every 5 seconds
        this.priceUpdateInterval = setInterval(() => {
            this.updateLivePrices();
        }, 5000);
    }

    updateLivePrices() {
        // Update watchlist prices slightly
        this.watchlist.forEach(symbol => {
            if (this.lastPrices[symbol]) {
                const change = this.lastPrices[symbol] * (Math.random() - 0.5) * 0.002;
                this.lastPrices[symbol] += change;
            }
        });
        this.renderWatchlist();
    }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ProTraderApp();
    app.init();
});

// Make app globally accessible
window.app = app;
