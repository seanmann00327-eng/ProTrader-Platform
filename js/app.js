// ProTrader Pro v4.0 - TradingView Style Platform
const FINNHUB_KEY = 'ctq4pnhr01qnb1qm3k40ctq4pnhr01qnb1qm3k4g';
const SYMBOLS = ['AAPL','MSFT','GOOGL','AMZN','NVDA','META','TSLA','AMD','NFLX','JPM','SPY','QQQ'];
const STOCKS = {
    'AAPL': {name:'Apple Inc.',price:178.50,beta:1.28,avgVol:55000000,shortFloat:0.8,instOwn:61.2,pe:28.5,fwdPE:26.2,peg:1.4,target:195,ratings:'Buy',divYield:0.5,sector:'Technology'},
    'MSFT': {name:'Microsoft',price:378.25,beta:0.93,avgVol:22000000,shortFloat:0.5,instOwn:72.1,pe:35.2,fwdPE:30.1,peg:2.4,target:420,ratings:'Strong Buy',divYield:0.8,sector:'Technology'},
    'GOOGL': {name:'Alphabet Inc.',price:141.80,beta:1.05,avgVol:25000000,shortFloat:0.6,instOwn:65.3,pe:23.1,fwdPE:19.8,peg:1.2,target:165,ratings:'Strong Buy',divYield:0,sector:'Technology'},
    'NVDA': {name:'NVIDIA Corp',price:875.50,beta:1.74,avgVol:42000000,shortFloat:1.1,instOwn:68.4,pe:65.2,fwdPE:51.8,peg:0.8,target:1100,ratings:'Strong Buy',divYield:0.02,sector:'Technology'},
    'TSLA': {name:'Tesla Inc.',price:248.30,beta:2.01,avgVol:95000000,shortFloat:2.8,instOwn:44.1,pe:72.5,fwdPE:58.2,peg:3.2,target:280,ratings:'Hold',divYield:0,sector:'Automotive'},
    'AMD': {name:'AMD Inc.',price:178.45,beta:1.68,avgVol:48000000,shortFloat:2.1,instOwn:72.0,pe:45.0,fwdPE:28.0,peg:0.9,target:220,ratings:'Strong Buy',divYield:0,sector:'Technology'},
    'SPY': {name:'S&P 500 ETF',price:478.50,beta:1.0,avgVol:70000000,shortFloat:0,instOwn:0,pe:22.5,fwdPE:20.1,peg:1.5,target:510,ratings:'Buy',divYield:1.4,sector:'ETF'},
    'META': {name:'Meta Platforms',price:505.75,beta:1.35,avgVol:19000000,shortFloat:0.6,instOwn:77.2,pe:26.8,fwdPE:21.1,peg:1.1,target:580,ratings:'Buy',divYield:0.4,sector:'Technology'},
    'AMZN': {name:'Amazon.com',price:178.90,beta:1.22,avgVol:50000000,shortFloat:0.8,instOwn:58.2,pe:62.4,fwdPE:38.5,peg:1.8,target:200,ratings:'Buy',divYield:0,sector:'Consumer'},
    'QQQ': {name:'Nasdaq 100 ETF',price:405.90,beta:1.15,avgVol:50000000,shortFloat:0,instOwn:0,pe:28.2,fwdPE:24.5,peg:1.8,target:450,ratings:'Buy',divYield:0.6,sector:'ETF'},
    'NFLX': {name:'Netflix Inc.',price:485.30,beta:1.35,avgVol:5500000,shortFloat:1.8,instOwn:82.1,pe:44.5,fwdPE:31.8,peg:1.4,target:530,ratings:'Buy',divYield:0,sector:'Entertainment'},
    'JPM': {name:'JPMorgan Chase',price:198.40,beta:1.12,avgVol:9500000,shortFloat:0.8,instOwn:71.3,pe:11.2,fwdPE:10.5,peg:1.6,target:225,ratings:'Buy',divYield:2.5,sector:'Financial'}
};

class ProTraderApp {
    constructor() {
        this.symbol = 'AAPL';
        this.chart = null;
        this.candleSeries = null;
        this.volumeSeries = null;
        this.watchlist = JSON.parse(localStorage.getItem('watchlist')) || ['AAPL','NVDA','TSLA','AMD','SPY'];
        this.indicators = new Set();
        this.indicatorSeries = {};
        this.data = [];
        this.prices = {};
        this.alerts = JSON.parse(localStorage.getItem('alerts')) || [];
        this.timeframe = 'D';
        this.activePanel = 'watchlist';
        this.activeTool = 'cursor';
    }

    init() {
        console.log('Starting ProTrader Pro v4.0...');
        this.initChart();
        this.setupEventListeners();
        this.loadStock(this.symbol);
        this.renderWatchlist();
        this.startPriceUpdates();
        this.toast('ProTrader Pro Ready!', 'success');
    }

    initChart() {
        const el = document.getElementById('chart-container');
        if (!el || typeof LightweightCharts === 'undefined') return;
        
        this.chart = LightweightCharts.createChart(el, {
            width: el.clientWidth,
            height: el.clientHeight || 400,
            layout: { background: { type: 'solid', color: '#131722' }, textColor: '#d1d4dc' },
            grid: { vertLines: { color: 'rgba(42,46,57,0.5)' }, horzLines: { color: 'rgba(42,46,57,0.5)' }},
            crosshair: { mode: 1 },
            rightPriceScale: { borderColor: 'rgba(42,46,57,0.8)' },
            timeScale: { borderColor: 'rgba(42,46,57,0.8)', timeVisible: true }
        });

        this.candleSeries = this.chart.addCandlestickSeries({
            upColor: '#26a69a', downColor: '#ef5350',
            borderUpColor: '#26a69a', borderDownColor: '#ef5350',
            wickUpColor: '#26a69a', wickDownColor: '#ef5350'
        });

        this.volumeSeries = this.chart.addHistogramSeries({
            color: '#26a69a', priceFormat: { type: 'volume' },
            priceScaleId: '', scaleMargins: { top: 0.85, bottom: 0 }
        });

        window.addEventListener('resize', () => {
            if (this.chart && el) {
                this.chart.applyOptions({ width: el.clientWidth, height: el.clientHeight });
            }
        });

        this.chart.subscribeCrosshairMove(param => this.updateOHLC(param));
    }

    updateOHLC(param) {
        if (!param.time || !param.seriesData) return;
        const data = param.seriesData.get(this.candleSeries);
        if (data) {
            const el = id => document.getElementById(id);
            if(el('ohlc-open')) el('ohlc-open').textContent = data.open?.toFixed(2) || '-';
            if(el('ohlc-high')) el('ohlc-high').textContent = data.high?.toFixed(2) || '-';
            if(el('ohlc-low')) el('ohlc-low').textContent = data.low?.toFixed(2) || '-';
            if(el('ohlc-close')) el('ohlc-close').textContent = data.close?.toFixed(2) || '-';
        }
    }

    setupEventListeners() {
        // Symbol selector
        document.getElementById('symbolBtn')?.addEventListener('click', () => this.openModal('symbolModal'));
        document.getElementById('closeSymbolModal')?.addEventListener('click', () => this.closeModal('symbolModal'));
        document.getElementById('modalSymbolSearch')?.addEventListener('input', e => this.searchSymbols(e.target.value));

        // Indicators modal
        document.getElementById('indicatorsBtn')?.addEventListener('click', () => this.openModal('indicatorsModal'));
        document.getElementById('closeIndicatorsModal')?.addEventListener('click', () => this.closeModal('indicatorsModal'));
        
        // Indicator items
        document.querySelectorAll('.indicator-item').forEach(item => {
            item.addEventListener('click', () => {
                const ind = item.dataset.indicator;
                this.toggleIndicator(ind);
                this.closeModal('indicatorsModal');
            });
        });

        // Alert modal
        document.getElementById('createAlertBtn')?.addEventListener('click', () => {
            document.getElementById('alertSymbol').value = this.symbol;
            this.openModal('alertModal');
        });
        document.getElementById('alertsNavBtn')?.addEventListener('click', () => this.switchPanel('alerts'));
        document.getElementById('closeAlertModal')?.addEventListener('click', () => this.closeModal('alertModal'));
        document.getElementById('submitAlert')?.addEventListener('click', () => this.createAlert());

        // Timeframe buttons
        document.querySelectorAll('.tf-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.timeframe = btn.dataset.tf;
                this.loadStock(this.symbol);
            });
        });

        // Chart type buttons
        document.querySelectorAll('.chart-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Panel tabs
        document.querySelectorAll('.panel-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchPanel(tab.dataset.panel));
        });

        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if(btn.dataset.tool) {
                    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.activeTool = btn.dataset.tool;
                }
            });
        });

        // Bottom tabs
        document.querySelectorAll('.bottom-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.bottom-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });

        // Trade side buttons
        document.querySelectorAll('.side-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.side-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const orderBtn = document.querySelector('.place-order-btn');
                if(btn.classList.contains('buy')) {
                    orderBtn.textContent = 'Place Buy Order';
                    orderBtn.classList.remove('sell');
                    orderBtn.classList.add('buy');
                } else {
                    orderBtn.textContent = 'Place Sell Order';
                    orderBtn.classList.remove('buy');
                    orderBtn.classList.add('sell');
                }
            });
        });

        // Theme toggle
        document.getElementById('themeToggle')?.addEventListener('click', () => this.toast('Theme toggle coming soon!', 'info'));

        // Symbol search in watchlist
        document.getElementById('symbolInput')?.addEventListener('keypress', e => {
            if(e.key === 'Enter') this.addToWatchlist(e.target.value.toUpperCase());
        });

        // Close modals on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', e => {
                if(e.target === modal) this.closeModal(modal.id);
            });
        });
    }

    openModal(id) {
        document.getElementById(id)?.classList.add('active');
    }

    closeModal(id) {
        document.getElementById(id)?.classList.remove('active');
    }

    switchPanel(panel) {
        this.activePanel = panel;
        document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.panel-content').forEach(p => p.classList.add('hidden'));
        document.querySelector(`[data-panel="${panel}"]`)?.classList.add('active');
        document.getElementById(`${panel}Panel`)?.classList.remove('hidden');
    }

    searchSymbols(query) {
        const container = document.getElementById('symbolResults');
        if(!container) return;
        const filtered = SYMBOLS.filter(s => s.toLowerCase().includes(query.toLowerCase()) || 
            STOCKS[s]?.name.toLowerCase().includes(query.toLowerCase()));
        container.innerHTML = filtered.map(s => `
            <div class="symbol-result-item" onclick="app.loadStock('${s}'); app.closeModal('symbolModal');">
                <div><span class="symbol-ticker">${s}</span><div class="symbol-name">${STOCKS[s]?.name || s}</div></div>
                <span class="symbol-exchange">${STOCKS[s]?.sector || 'STOCK'}</span>
            </div>
        `).join('');
    }

    async loadStock(symbol) {
        this.symbol = symbol;
        const stock = STOCKS[symbol] || {name: symbol, price: 100};
        
        // Update UI
        const el = id => document.getElementById(id);
        if(el('current-symbol')) el('current-symbol').textContent = symbol;
        if(el('currentSymbolNav')) el('currentSymbolNav').textContent = symbol;
        if(el('company-name')) el('company-name').textContent = stock.name;
        if(el('alertSymbol')) el('alertSymbol').value = symbol;
        if(el('tradePrice')) el('tradePrice').value = stock.price.toFixed(2);
        
        // Generate chart data
        this.data = this.generateChartData(stock.price, 200);
        if(this.candleSeries) {
            this.candleSeries.setData(this.data);
            const volumeData = this.data.map(d => ({
                time: d.time,
                value: Math.random() * stock.avgVol/10 + stock.avgVol/20,
                color: d.close >= d.open ? '#26a69a' : '#ef5350'
            }));
            this.volumeSeries.setData(volumeData);
        }
        
        // Update price display
        const lastPrice = this.data[this.data.length-1]?.close || stock.price;
        const prevPrice = this.data[this.data.length-2]?.close || stock.price;
        const change = lastPrice - prevPrice;
        const changePct = (change / prevPrice * 100);
        
        if(el('current-price')) el('current-price').textContent = '$' + lastPrice.toFixed(2);
        const changeEl = el('price-change');
        if(changeEl) {
            changeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${change >= 0 ? '+' : ''}${changePct.toFixed(2)}%)`;
            changeEl.className = 'price-change ' + (change >= 0 ? 'positive' : 'negative');
        }

        // Reapply indicators
        this.indicators.forEach(ind => this.addIndicator(ind));
        this.chart?.timeScale().fitContent();
    }

    generateChartData(basePrice, days) {
        const data = [];
        let price = basePrice * 0.85;
        const now = Math.floor(Date.now() / 1000);
        const interval = this.timeframe === 'D' ? 86400 : this.timeframe === 'W' ? 604800 : 3600;
        
        for(let i = days; i >= 0; i--) {
            const time = now - (i * interval);
            const volatility = 0.02;
            const change = (Math.random() - 0.48) * volatility;
            price = price * (1 + change);
            const high = price * (1 + Math.random() * 0.015);
            const low = price * (1 - Math.random() * 0.015);
            const open = price * (1 + (Math.random() - 0.5) * 0.01);
            data.push({ time, open, high, low, close: price });
        }
        return data;
    }

    toggleIndicator(indicator) {
        if(this.indicators.has(indicator)) {
            this.removeIndicator(indicator);
            this.indicators.delete(indicator);
            this.toast(`${indicator} removed`, 'info');
        } else {
            this.addIndicator(indicator);
            this.indicators.add(indicator);
            this.toast(`${indicator} added`, 'success');
        }
    }

    addIndicator(type) {
        if(!this.data.length || !this.chart) return;
        this.removeIndicator(type);
        
        switch(type) {
            case 'SMA': {
                const sma = this.calculateSMA(20);
                this.indicatorSeries[type] = this.chart.addLineSeries({ color: '#2962ff', lineWidth: 2 });
                this.indicatorSeries[type].setData(sma);
                break;
            }
            case 'EMA': {
                const ema = this.calculateEMA(12);
                this.indicatorSeries[type] = this.chart.addLineSeries({ color: '#ff9800', lineWidth: 2 });
                this.indicatorSeries[type].setData(ema);
                break;
            }
            case 'BB': {
                const bb = this.calculateBB(20, 2);
                this.indicatorSeries['BB_upper'] = this.chart.addLineSeries({ color: '#9c27b0', lineWidth: 1 });
                this.indicatorSeries['BB_lower'] = this.chart.addLineSeries({ color: '#9c27b0', lineWidth: 1 });
                this.indicatorSeries['BB_upper'].setData(bb.upper);
                this.indicatorSeries['BB_lower'].setData(bb.lower);
                break;
            }
        }
    }

    removeIndicator(type) {
        if(type === 'BB') {
            ['BB_upper', 'BB_lower'].forEach(k => {
                if(this.indicatorSeries[k]) {
                    this.chart.removeSeries(this.indicatorSeries[k]);
                    delete this.indicatorSeries[k];
                }
            });
        } else if(this.indicatorSeries[type]) {
            this.chart.removeSeries(this.indicatorSeries[type]);
            delete this.indicatorSeries[type];
        }
    }

    calculateSMA(period) {
        const result = [];
        for(let i = period - 1; i < this.data.length; i++) {
            let sum = 0;
            for(let j = 0; j < period; j++) sum += this.data[i - j].close;
            result.push({ time: this.data[i].time, value: sum / period });
        }
        return result;
    }

    calculateEMA(period) {
        const result = [];
        const k = 2 / (period + 1);
        let ema = this.data[0].close;
        for(let i = 0; i < this.data.length; i++) {
            ema = this.data[i].close * k + ema * (1 - k);
            result.push({ time: this.data[i].time, value: ema });
        }
        return result;
    }

    calculateBB(period, mult) {
        const sma = this.calculateSMA(period);
        const upper = [], lower = [];
        for(let i = period - 1; i < this.data.length; i++) {
            let sumSq = 0;
            for(let j = 0; j < period; j++) {
                const diff = this.data[i - j].close - sma[i - period + 1]?.value;
                sumSq += diff * diff;
            }
            const std = Math.sqrt(sumSq / period);
            const idx = i - period + 1;
            if(sma[idx]) {
                upper.push({ time: this.data[i].time, value: sma[idx].value + mult * std });
                lower.push({ time: this.data[i].time, value: sma[idx].value - mult * std });
            }
        }
        return { upper, lower };
    }

    renderWatchlist() {
        const container = document.getElementById('watchlist-items');
        if(!container) return;
        container.innerHTML = this.watchlist.map(s => {
            const stock = STOCKS[s] || { price: 100 };
            const price = this.prices[s] || stock.price;
            const change = ((Math.random() - 0.5) * 4).toFixed(2);
            const isPositive = parseFloat(change) >= 0;
            return `
                <div class="watchlist-item ${s === this.symbol ? 'active' : ''}" onclick="app.loadStock('${s}')">
                    <div class="wl-symbol">
                        <div class="ticker">${s}</div>
                        <div class="name">${STOCKS[s]?.name || s}</div>
                    </div>
                    <div class="wl-price">${price.toFixed(2)}</div>
                    <div class="wl-change ${isPositive ? 'positive' : 'negative'}">${isPositive ? '+' : ''}${change}%</div>
                </div>
            `;
        }).join('');
    }

    addToWatchlist(symbol) {
        if(SYMBOLS.includes(symbol) && !this.watchlist.includes(symbol)) {
            this.watchlist.push(symbol);
            localStorage.setItem('watchlist', JSON.stringify(this.watchlist));
            this.renderWatchlist();
            this.toast(`${symbol} added to watchlist`, 'success');
        }
        document.getElementById('symbolInput').value = '';
    }

    createAlert() {
        const symbol = document.getElementById('alertSymbol')?.value;
        const condition = document.getElementById('alertCondition')?.value;
        const price = document.getElementById('alertPrice')?.value;
        
        const alert = { id: Date.now(), symbol, condition, price: parseFloat(price), active: true };
        this.alerts.push(alert);
        localStorage.setItem('alerts', JSON.stringify(this.alerts));
        this.closeModal('alertModal');
        this.toast(`Alert created for ${symbol} at $${price}`, 'success');
        this.renderAlerts();
    }

    renderAlerts() {
        const container = document.getElementById('alertsList');
        if(!container) return;
        container.innerHTML = this.alerts.map(a => `
            <div class="alert-item">
                <strong>${a.symbol}</strong> ${a.condition.replace('_', ' ')} $${a.price.toFixed(2)}
            </div>
        `).join('') || '<div style="padding:20px;color:var(--text-muted)">No alerts set</div>';
    }

    startPriceUpdates() {
        setInterval(() => {
            this.watchlist.forEach(s => {
                const base = STOCKS[s]?.price || 100;
                this.prices[s] = base * (1 + (Math.random() - 0.5) * 0.002);
            });
            this.renderWatchlist();
        }, 3000);
    }

    toast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if(!container) return;
        const icons = { success: 'check-circle', error: 'times-circle', info: 'info-circle' };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fas fa-${icons[type]}"></i><span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ProTraderApp();
    app.init();
});
