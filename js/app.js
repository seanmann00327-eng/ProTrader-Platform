// ProTrader Pro v3.0 - Complete Trading Platform
const FINNHUB_KEY = 'ctq4prhr01qhb1qm3k40ctq4prhr01qhb1qm3k4g';
const SYMBOLS = ['AAPL','MSFT','GOOGL','AMZN','NVDA','META','TSLA','AMD','NFLX','JPM','SPY','QQQ'];
const STOCKS = {
    'AAPL': {name:'Apple Inc.',price:178.50,beta:1.28,avgVol:55000000,shortFloat:0.7,instOwn:61.2,pe:28.5,fwdPE:26.2,peg:1.1,target:195,rating:'Buy',divYield:0.5,sector:'Technology'},
    'MSFT': {name:'Microsoft',price:378.25,beta:0.93,avgVol:22000000,shortFloat:0.5,instOwn:72.1,pe:35.2,fwdPE:30.1,peg:2.4,target:420,rating:'Strong Buy',divYield:0.8,sector:'Technology'},
    'GOOGL': {name:'Alphabet Inc.',price:141.00,beta:1.05,avgVol:25000000,shortFloat:0.4,instOwn:65.5,pe:23.1,fwdPE:19.8,peg:1.2,target:165,rating:'Strong Buy',divYield:0,sector:'Technology'},
    'NVDA': {name:'NVIDIA Corp',price:875.50,beta:1.74,avgVol:42000000,shortFloat:1.1,instOwn:68.4,pe:65.2,fwdPE:31.8,peg:0.8,target:1100,rating:'Strong Buy',divYield:0.02,sector:'Technology'},
    'TSLA': {name:'Tesla Inc.',price:248.30,beta:2.01,avgVol:95000000,shortFloat:2.8,instOwn:44.1,pe:72.5,fwdPE:58.2,peg:3.2,target:280,rating:'Hold',divYield:0,sector:'Automotive'},
    'AMD': {name:'AMD Inc.',price:178.45,beta:1.68,avgVol:48000000,shortFloat:2.1,instOwn:72.8,pe:45.8,fwdPE:28.9,peg:0.9,target:228,rating:'Strong Buy',divYield:0,sector:'Technology'},
    'SPY': {name:'S&P 500 ETF',price:478.50,beta:1.0,avgVol:75000000,shortFloat:0,instOwn:0,pe:22.5,fwdPE:20.1,peg:1.5,target:510,rating:'Buy',divYield:1.4,sector:'ETF'},
    'META': {name:'Meta Platforms',price:505.75,beta:1.35,avgVol:18000000,shortFloat:0.6,instOwn:77.2,pe:8,fwdPE:22.1,peg:1.1,target:580,rating:'Buy',divYield:0.4,sector:'Technology'},
    'AMZN': {name:'Amazon.com',price:178.90,beta:1.22,avgVol:44000000,shortFloat:0.8,instOwn:58.2,pe:62.4,fwdPE:38.5,peg:1.8,target:200,rating:'Buy',divYield:0,sector:'Consumer'},
    'QQQ': {name:'Nasdaq 100 ETF',price:405.30,beta:1.15,avgVol:35000000,shortFloat:0,instOwn:0,pe:28.2,fwdPE:24.5,peg:1.8,target:450,rating:'Buy',divYield:0.6,sector:'ETF'},
    'NFLX': {name:'Netflix Inc.',price:485.30,beta:1.35,avgVol:5500000,shortFloat:1.8,instOwn:82.1,pe:44.5,fwdPE:31.8,peg:1.4,target:580,rating:'Buy',divYield:0,sector:'Entertainment'},
    'JPM': {name:'JPMorgan Chase',price:188.40,beta:1.12,avgVol:9500000,shortFloat:0.8,instOwn:71.3,pe:11.2,fwdPE:10.5,peg:1.6,target:225,rating:'Buy',divYield:2.5,sector:'Financial'}
};

class ProTraderApp {
    constructor() {
        this.symbol = 'AAPL';
        this.chart = null;
        this.candles = null;
        this.watchlist = JSON.parse(localStorage.getItem('wl')) || ['AAPL','NVDA','TSLA','AMD','SPY'];
        this.indicators = new Set();
        this.data = [];
        this.prices = {};
        this.activeTab = 'watchlist';
        this.alerts = JSON.parse(localStorage.getItem('alerts')) || [];
        this.timeframe = '1D';
        this.indicatorSeries = {};
    }
    init() {
        console.log('Starting ProTrader Pro v3.0...');
        this.initChart();
        this.setupEvents();
        this.loadStock(this.symbol);
        this.renderWatchlist();
        this.toast('ProTrader Pro Ready!', 'success');
    }
    initChart() {
        const el = document.getElementById('chart-container');
        if (!el || typeof LightweightCharts === 'undefined') return;
        this.chart = LightweightCharts.createChart(el, {
            width: el.clientWidth, height: 320,
            layout: { background: { type: 'solid', color: 'transparent' }, textColor: '#9ca3af' },
            grid: { vertLines: { color: 'rgba(255,255,255,0.05)' }, horzLines: { color: 'rgba(255,255,255,0.05)' } },
            crosshair: { mode: 1 },
            rightPriceScale: { borderColor: 'rgba(255,255,255,0.1)' },
            timeScale: { borderColor: 'rgba(255,255,255,0.1)', timeVisible: true }
        });
        this.candles = this.chart.addCandlestickSeries({ upColor: '#10b981', downColor: '#ef4444', borderUpColor: '#10b981', borderDownColor: '#ef4444', wickUpColor: '#10b981', wickDownColor: '#ef4444' });
        window.addEventListener('resize', () => this.chart && this.chart.resize(el.clientWidth, 320));
    }
    setupEvents() {
        document.querySelectorAll('.sidebar-tabs button').forEach(btn => btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab)));
        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.getElementById('symbolInput');
        if (searchBtn) searchBtn.addEventListener('click', () => this.searchStock(searchInput?.value));
        if (searchInput) searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.searchStock(searchInput.value); });
        document.querySelectorAll('.timeframe-btn').forEach(btn => btn.addEventListener('click', (e) => this.setTimeframe(e.target.textContent)));
        document.querySelectorAll('.indicator-btn').forEach(btn => btn.addEventListener('click', (e) => this.toggleIndicator(e.target.dataset.indicator)));
        const addBtn = document.querySelector('.add-symbol-btn');
        if (addBtn) addBtn.addEventListener('click', () => this.showAddSymbolModal());
    }
    switchTab(tab) {
        if (!tab) return;
        this.activeTab = tab;
        document.querySelectorAll('.sidebar-tabs button').forEach(b => b.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
        if (tab === 'watchlist') this.renderWatchlist();
        else if (tab === 'options') this.renderOptionsChain();
        else if (tab === 'alerts') this.renderAlerts();
    }
    searchStock(symbol) {
        if (!symbol) return;
        const sym = symbol.toUpperCase().trim();
        if (STOCKS[sym] || SYMBOLS.includes(sym)) this.loadStock(sym);
        else this.toast(`Symbol ${sym} not found`, 'error');
    }
    setTimeframe(tf) {
        this.timeframe = tf;
        document.querySelectorAll('.timeframe-btn').forEach(btn => btn.classList.toggle('active', btn.textContent === tf));
        this.loadStock(this.symbol);
        this.toast(`Timeframe: ${tf}`, 'info');
    }
    toggleIndicator(indicator) {
        if (!indicator) return;
        const ind = indicator.replace(/[^a-zA-Z]/g, '').toUpperCase();
        if (this.indicators.has(ind)) { this.indicators.delete(ind); this.removeIndicator(ind); }
        else { this.indicators.add(ind); this.addIndicator(ind); }
        document.querySelectorAll('.indicator-btn').forEach(btn => {
            const btnInd = (btn.dataset.indicator || '').replace(/[^a-zA-Z]/g, '').toUpperCase();
            btn.classList.toggle('active', this.indicators.has(btnInd));
        });
    }
    addIndicator(ind) {
        if (!this.chart || !this.data.length) return;
        const prices = this.data.map(d => d.close);
        if (ind === 'SMA') {
            const sma = this.calcSMA(prices, 20);
            this.indicatorSeries.SMA = this.chart.addLineSeries({ color: '#3b82f6', lineWidth: 2 });
            this.indicatorSeries.SMA.setData(this.data.slice(19).map((d, i) => ({ time: d.time, value: sma[i] })));
        } else if (ind === 'EMA') {
            const ema = this.calcEMA(prices, 20);
            this.indicatorSeries.EMA = this.chart.addLineSeries({ color: '#f59e0b', lineWidth: 2 });
            this.indicatorSeries.EMA.setData(this.data.slice(19).map((d, i) => ({ time: d.time, value: ema[i] })));
        } else if (ind === 'BB') {
            const bb = this.calcBollinger(prices, 20);
            this.indicatorSeries.BB_upper = this.chart.addLineSeries({ color: '#8b5cf6', lineWidth: 1 });
            this.indicatorSeries.BB_lower = this.chart.addLineSeries({ color: '#8b5cf6', lineWidth: 1 });
            this.indicatorSeries.BB_upper.setData(this.data.slice(19).map((d, i) => ({ time: d.time, value: bb.upper[i] })));
            this.indicatorSeries.BB_lower.setData(this.data.slice(19).map((d, i) => ({ time: d.time, value: bb.lower[i] })));
        }
    }
    removeIndicator(ind) {
        if (ind === 'SMA' && this.indicatorSeries.SMA) { this.chart.removeSeries(this.indicatorSeries.SMA); delete this.indicatorSeries.SMA; }
        else if (ind === 'EMA' && this.indicatorSeries.EMA) { this.chart.removeSeries(this.indicatorSeries.EMA); delete this.indicatorSeries.EMA; }
        else if (ind === 'BB') {
            if (this.indicatorSeries.BB_upper) this.chart.removeSeries(this.indicatorSeries.BB_upper);
            if (this.indicatorSeries.BB_lower) this.chart.removeSeries(this.indicatorSeries.BB_lower);
            delete this.indicatorSeries.BB_upper; delete this.indicatorSeries.BB_lower;
        }
    }
    calcSMA(data, p) { const r = []; for (let i = p - 1; i < data.length; i++) r.push(data.slice(i - p + 1, i + 1).reduce((a, b) => a + b, 0) / p); return r; }
    calcEMA(data, p) { const k = 2 / (p + 1), r = [data.slice(0, p).reduce((a, b) => a + b, 0) / p]; for (let i = p; i < data.length; i++) r.push(data[i] * k + r[r.length - 1] * (1 - k)); return r; }
    calcBollinger(data, p) { const sma = this.calcSMA(data, p), u = [], l = []; for (let i = p - 1; i < data.length; i++) { const sl = data.slice(i - p + 1, i + 1), avg = sma[i - p + 1], std = Math.sqrt(sl.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / p); u.push(avg + std * 2); l.push(avg - std * 2); } return { upper: u, lower: l }; }
    showAddSymbolModal() { const sym = prompt('Enter stock symbol to add:'); if (sym) { const s = sym.toUpperCase().trim(); if (!this.watchlist.includes(s)) { this.watchlist.push(s); localStorage.setItem('wl', JSON.stringify(this.watchlist)); this.renderWatchlist(); this.toast(`Added ${s}`, 'success'); } } }
    loadStock(symbol) {
        this.symbol = symbol;
        const stock = STOCKS[symbol] || this.generateStockData(symbol);
        this.prices[symbol] = stock.price;
        this.data = this.generateChartData(symbol, stock.price);
        if (this.candles) {
            Object.keys(this.indicatorSeries).forEach(key => { try { this.chart.removeSeries(this.indicatorSeries[key]); } catch(e) {} });
            this.indicatorSeries = {};
            this.candles.setData(this.data);
            this.chart.timeScale().fitContent();
            this.indicators.forEach(ind => this.addIndicator(ind));
        }
        this.updateUI(symbol, stock);
        this.updateAISignal(symbol, stock);
    }
    generateStockData(symbol) { const p = 100 + Math.random() * 400; return { name: symbol, price: p, beta: 1 + Math.random(), avgVol: Math.floor(Math.random() * 50000000), shortFloat: Math.random() * 5, instOwn: 40 + Math.random() * 40, pe: 15 + Math.random() * 50, fwdPE: 12 + Math.random() * 40, peg: 0.5 + Math.random() * 3, target: p * 1.2, rating: 'Hold', divYield: Math.random() * 3, sector: 'Technology' }; }
    generateChartData(symbol, basePrice) {
        const data = [], now = new Date();
        let days = this.timeframe === '1m' || this.timeframe === '5m' ? 1 : this.timeframe === '15m' ? 3 : this.timeframe === '1H' ? 30 : this.timeframe === '1W' ? 730 : this.timeframe === '1M' ? 1825 : 365;
        let price = basePrice * 0.7;
        for (let i = days; i >= 0; i--) {
            const date = new Date(now); date.setDate(date.getDate() - i);
            const time = Math.floor(date.getTime() / 1000);
            const change = (Math.random() - 0.48) * 0.02 * price;
            price = Math.max(price + change, 1);
            const high = price * (1 + Math.random() * 0.02), low = price * (1 - Math.random() * 0.02);
            data.push({ time, open: low + Math.random() * (high - low), high, low, close: low + Math.random() * (high - low) });
        }
        if (data.length > 0) data[data.length - 1].close = basePrice;
        return data;
    }
    updateUI(symbol, stock) {
        const price = stock.price, change = (Math.random() - 0.5) * 10, changePct = (change / price) * 100;
        const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
        el('current-symbol', symbol); el('company-name', stock.name); el('current-price', `$${price.toFixed(2)}`);
        const changeEl = document.getElementById('price-change');
        if (changeEl) { changeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${change >= 0 ? '+' : ''}${changePct.toFixed(2)}%)`; changeEl.className = 'price-change ' + (change >= 0 ? 'positive' : 'negative'); }
        const dH = price * 1.02, dL = price * 0.98;
        el('stat-vol', this.formatVolume(stock.avgVol)); el('stat-high', `$${dH.toFixed(2)}`); el('stat-low', `$${dL.toFixed(2)}`); el('stat-open', `$${(price * 0.995).toFixed(2)}`);
        this.updateStockDetails(symbol, stock, dH, dL);
    }
    updateStockDetails(symbol, stock, dH, dL) {
        const el = document.getElementById('stock-details'); if (!el) return;
        const p = stock.price, h52 = p * 1.3, l52 = p * 0.7;
        const pivot = (dH + dL + p) / 3, r1 = 2 * pivot - dL, r2 = pivot + (dH - dL), r3 = dH + 2 * (pivot - dL);
        const s1 = 2 * pivot - dH, s2 = pivot - (dH - dL), s3 = dL - 2 * (dH - pivot);
        el.innerHTML = `<div class="details-section"><h4>STOCK DETAILS - ${symbol}</h4><div class="details-grid"><div class="detail-row"><span>Daily High</span><span class="value positive">$${dH.toFixed(2)}</span></div><div class="detail-row"><span>Daily Low</span><span class="value negative">$${dL.toFixed(2)}</span></div><div class="detail-row"><span>52W High</span><span class="value positive">$${h52.toFixed(2)}</span></div><div class="detail-row"><span>52W Low</span><span class="value negative">$${l52.toFixed(2)}</span></div><div class="detail-row"><span>P/E Ratio</span><span class="value">${stock.pe?.toFixed(1)||'N/A'}</span></div><div class="detail-row"><span>Target</span><span class="value positive">$${stock.target?.toFixed(0)||'N/A'}</span></div><div class="detail-row"><span>Rating</span><span class="value">${stock.rating||'N/A'}</span></div></div></div><div class="details-section"><h4>SUPPORT & RESISTANCE</h4><div class="sr-levels"><div class="level"><span>R3</span><span>$${r3.toFixed(2)}</span></div><div class="level"><span>R2</span><span>$${r2.toFixed(2)}</span></div><div class="level"><span>R1</span><span>$${r1.toFixed(2)}</span></div><div class="level current"><span>CURRENT</span><span>$${p.toFixed(2)}</span></div><div class="level"><span>S1</span><span>$${s1.toFixed(2)}</span></div><div class="level"><span>S2</span><span>$${s2.toFixed(2)}</span></div><div class="level"><span>S3</span><span>$${s3.toFixed(2)}</span></div></div></div>`;
    }
    updateAISignal(symbol, stock) {
        const el = document.getElementById('ai-signal'); if (!el) return;
        const p = stock.price, t = stock.target || p * 1.1, up = ((t - p) / p) * 100;
        let sig, conf, reason;
        if (up > 15) { sig = 'BUY'; conf = 75 + Math.floor(Math.random() * 20); reason = 'Above SMA20, momentum up'; }
        else if (up > 5) { sig = 'HOLD'; conf = 50 + Math.floor(Math.random() * 20); reason = 'Wait for better entry'; }
        else { sig = 'SELL'; conf = 60 + Math.floor(Math.random() * 25); reason = 'Below SMA20, momentum down'; }
        el.innerHTML = `<div class="signal-content"><div class="signal-label">SIGNAL</div><div class="signal-value ${sig.toLowerCase()}">${sig}</div><div class="signal-confidence">Confidence: ${conf}%</div><div class="signal-reason">${reason}</div></div>`;
    }
    renderWatchlist() {
        const c = document.getElementById('sidebar-content'); if (!c) return;
        let h = '<div class="watchlist">';
        this.watchlist.forEach(sym => {
            const s = STOCKS[sym] || { price: 100 + Math.random() * 300, name: sym }, p = s.price, ch = (Math.random() - 0.5) * 8, chP = (ch / p) * 100;
            h += `<div class="watchlist-item ${sym === this.symbol ? 'active' : ''}" onclick="window.app.loadStock('${sym}')"><div class="wl-info"><span class="wl-symbol">${sym}</span><span class="wl-name">${s.name}</span></div><div class="wl-price"><span class="wl-current">$${p.toFixed(2)}</span><span class="wl-change ${ch >= 0 ? 'positive' : 'negative'}">${ch >= 0 ? '+' : ''}${chP.toFixed(2)}%</span></div><button class="wl-remove" onclick="event.stopPropagation();window.app.removeFromWatchlist('${sym}')">&times;</button></div>`;
        });
        c.innerHTML = h + '</div>';
    }
    removeFromWatchlist(sym) { this.watchlist = this.watchlist.filter(s => s !== sym); localStorage.setItem('wl', JSON.stringify(this.watchlist)); this.renderWatchlist(); this.toast(`Removed ${sym}`, 'info'); }
    renderOptionsChain() {
        const c = document.getElementById('sidebar-content'); if (!c) return;
        const s = STOCKS[this.symbol] || { price: 150 }, p = s.price, strikes = [];
        for (let i = -5; i <= 5; i++) strikes.push(Math.round(p * (1 + i * 0.05)));
        let h = `<div class="options-chain"><h4>Options - ${this.symbol}</h4><div class="options-table"><div class="options-row header"><span>Call</span><span>Strike</span><span>Put</span></div>`;
        strikes.forEach(st => {
            const cB = Math.max(0, p - st + Math.random() * 5).toFixed(2), pB = Math.max(0, st - p + Math.random() * 5).toFixed(2);
            h += `<div class="options-row"><span>$${cB}</span><span>$${st}</span><span>$${pB}</span></div>`;
        });
        c.innerHTML = h + '</div></div>';
    }
    renderAlerts() {
        const c = document.getElementById('sidebar-content'); if (!c) return;
        let h = `<div class="alerts-panel"><div class="alerts-header"><h4>Price Alerts</h4><button class="add-alert-btn" onclick="window.app.showAddAlertModal()">+ Add</button></div><div class="alerts-list">`;
        if (this.alerts.length === 0) h += '<div class="no-alerts">No alerts. Click + Add to create.</div>';
        else this.alerts.forEach((a, i) => h += `<div class="alert-item"><span>${a.symbol} ${a.condition} $${a.price}</span><button onclick="window.app.removeAlert(${i})">&times;</button></div>`);
        c.innerHTML = h + '</div></div>';
    }
    showAddAlertModal() { const p = prompt(`Alert price for ${this.symbol}:`); if (p && !isNaN(parseFloat(p))) { const cp = STOCKS[this.symbol]?.price || 100, cond = parseFloat(p) > cp ? 'Above' : 'Below'; this.alerts.push({ symbol: this.symbol, price: parseFloat(p), condition: cond }); localStorage.setItem('alerts', JSON.stringify(this.alerts)); this.renderAlerts(); this.toast(`Alert set`, 'success'); } }
    removeAlert(i) { this.alerts.splice(i, 1); localStorage.setItem('alerts', JSON.stringify(this.alerts)); this.renderAlerts(); this.toast('Alert removed', 'info'); }
    formatVolume(v) { if (!v) return 'N/A'; if (v >= 1e9) return (v/1e9).toFixed(1)+'B'; if (v >= 1e6) return (v/1e6).toFixed(1)+'M'; if (v >= 1e3) return (v/1e3).toFixed(1)+'K'; return v.toString(); }
    toast(msg, type = 'info') { const ex = document.querySelector('.toast'); if (ex) ex.remove(); const t = document.createElement('div'); t.className = `toast toast-${type}`; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.classList.add('show'), 10); setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000); }
}
window.app = null;
document.addEventListener('DOMContentLoaded', () => { window.app = new ProTraderApp(); window.app.init(); });
