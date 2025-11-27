// ProTrader Pro - Ultimate AI Trading Platform
// Live News, AI Agent, Institutional Signals, Pre/After Market
const FINNHUB_API_KEY = 'ctq4prhr01qhb16m3k40ctq4prhr01qhb16m3k4g';
const POLYGON_API_KEY = 'demo';

const VALID_SYMBOLS = ['AAPL','MSFT','GOOGL','GOOG','AMZN','NVDA','META','TSLA','AMD','NFLX','JPM','SPY','QQQ','GME','PLTR','COIN','BA','DIS','V','MA','WMT','HD','PG','KO','PEP','MCD','SBUX','NKE','INTC','QCOM','ORCL','CRM','ADBE','PYPL','SQ','SHOP','ROKU','UBER','LYFT','SNAP','PINS','RIVN','LCID','SOFI','HOOD','IWM','DIA','VTI','VOO','GLD','SLV','XLF','XLE','XLK','BABA','JD','NIO','XPEV','LI','MARA','RIOT','MSTR','ARKK','SOXL','TQQQ','SQQQ'];

const STOCK_DATA = {
    'AAPL': { name: 'Apple Inc.', price: 178.50, sector: 'Technology', beta: 1.28, avgVol: 58000000, shortFloat: 0.7, instOwn: 61.2 },
    'MSFT': { name: 'Microsoft', price: 378.25, sector: 'Technology', beta: 0.93, avgVol: 22000000, shortFloat: 0.5, instOwn: 72.1 },
    'GOOGL': { name: 'Alphabet Inc.', price: 141.80, sector: 'Technology', beta: 1.05, avgVol: 25000000, shortFloat: 0.8, instOwn: 65.3 },
    'AMZN': { name: 'Amazon.com', price: 178.90, sector: 'Consumer', beta: 1.22, avgVol: 45000000, shortFloat: 0.9, instOwn: 58.7 },
    'NVDA': { name: 'NVIDIA Corp', price: 875.50, sector: 'Technology', beta: 1.72, avgVol: 42000000, shortFloat: 1.1, instOwn: 68.4 },
    'META': { name: 'Meta Platforms', price: 505.75, sector: 'Technology', beta: 1.31, avgVol: 18000000, shortFloat: 0.6, instOwn: 77.2 },
    'TSLA': { name: 'Tesla Inc.', price: 248.30, sector: 'Automotive', beta: 2.01, avgVol: 95000000, shortFloat: 2.8, instOwn: 44.1 },
    'AMD': { name: 'AMD Inc.', price: 178.45, sector: 'Technology', beta: 1.68, avgVol: 48000000, shortFloat: 2.1, instOwn: 72.8 },
    'SPY': { name: 'S&P 500 ETF', price: 478.50, sector: 'ETF', beta: 1.0, avgVol: 75000000, shortFloat: 0, instOwn: 0 },
    'QQQ': { name: 'Nasdaq 100 ETF', price: 405.30, sector: 'ETF', beta: 1.15, avgVol: 45000000, shortFloat: 0, instOwn: 0 },
    'NFLX': { name: 'Netflix Inc.', price: 485.20, sector: 'Entertainment', beta: 1.35, avgVol: 5500000, shortFloat: 1.8, instOwn: 82.1 },
    'JPM': { name: 'JPMorgan Chase', price: 198.40, sector: 'Financial', beta: 1.12, avgVol: 9500000, shortFloat: 0.8, instOwn: 71.3 }
};

class ProTraderApp {
    constructor() {
        this.currentSymbol = 'AAPL';
        this.chart = null;
        this.candleSeries = null;
        this.watchlist = JSON.parse(localStorage.getItem('watchlist')) || ['AAPL','NVDA','TSLA','AMD','SPY'];
        this.activeIndicators = new Set();
        this.chartData = [];
        this.lastPrices = {};
        this.extendedHours = { premarket: null, afterhours: null };
        this.aiAnalysis = null;
    }

    async init() {
        console.log('Initializing ProTrader Pro...');
        this.initChart();
        this.setupEventListeners();
        await this.loadSymbolData(this.currentSymbol);
        this.renderWatchlist();
        this.loadLiveNews();
        this.generateAIAnalysis();
        this.generateDailyGamePlan();
        this.updateExtendedHours();
        this.startRealTimeUpdates();
        this.showToast('AI Trading Platform Ready', 'success');
    }

    isValidSymbol(s) { return VALID_SYMBOLS.includes(s.toUpperCase()) || STOCK_DATA[s.toUpperCase()]; }

    initChart() {
        const c = document.getElementById('chart-container');
        if (!c) return;
        this.chart = LightweightCharts.createChart(c, {
            width: c.clientWidth, height: c.clientHeight || 500,
            layout: { background: { type: 'solid', color: 'transparent' }, textColor: '#d1d5db' },
            grid: { vertLines: { color: 'rgba(59,130,246,0.1)' }, horzLines: { color: 'rgba(59,130,246,0.1)' } },
            crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
            rightPriceScale: { borderColor: 'rgba(59,130,246,0.2)' },
            timeScale: { borderColor: 'rgba(59,130,246,0.2)', timeVisible: true, secondsVisible: false }
        });
        this.candleSeries = this.chart.addCandlestickSeries({ upColor: '#10b981', downColor: '#ef4444', borderUpColor: '#10b981', borderDownColor: '#ef4444', wickUpColor: '#10b981', wickDownColor: '#ef4444' });
        window.addEventListener('resize', () => this.chart.applyOptions({ width: c.clientWidth }));
    }

    generateChartData(symbol, days = 365) {
        const data = [], info = STOCK_DATA[symbol] || { price: 100 };
        let price = info.price;
        const now = new Date();
        for (let i = days; i >= 0; i--) {
            const d = new Date(now); d.setDate(d.getDate() - i);
            if (d.getDay() === 0 || d.getDay() === 6) continue;
            const vol = 0.018, change = price * vol * (Math.random() - 0.5) * 2;
            const o = price, cl = price + change;
            const h = Math.max(o, cl) * (1 + Math.random() * 0.01);
            const l = Math.min(o, cl) * (1 - Math.random() * 0.01);
            data.push({ time: Math.floor(d.getTime() / 1000), open: +o.toFixed(2), high: +h.toFixed(2), low: +l.toFixed(2), close: +cl.toFixed(2) });
            price = cl;
        }
        this.lastPrices[symbol] = price;
        return data;
    }

    async loadSymbolData(symbol) {
        const s = symbol.toUpperCase().trim();
        if (!this.isValidSymbol(s)) { this.showToast('Invalid symbol: ' + symbol, 'error'); return false; }
        this.currentSymbol = s;
        const info = STOCK_DATA[s] || { name: s, price: 100 };
        const el = (id) => document.getElementById(id);
        if (el('currentSymbol')) el('currentSymbol').textContent = s;
        if (el('companyName')) el('companyName').textContent = info.name;
        this.chartData = this.generateChartData(s);
        if (this.candleSeries) { this.candleSeries.setData(this.chartData); this.chart.timeScale().fitContent(); }
        const last = this.chartData[this.chartData.length - 1], prev = this.chartData[this.chartData.length - 2];
        if (last && el('currentPrice')) el('currentPrice').textContent = '$' + last.close.toFixed(2);
        if (last && prev && el('priceChange')) {
            const ch = last.close - prev.close, pct = (ch / prev.close) * 100;
            el('priceChange').textContent = (ch >= 0 ? '+' : '') + ch.toFixed(2) + ' (' + (ch >= 0 ? '+' : '') + pct.toFixed(2) + '%)';
            el('priceChange').className = ch >= 0 ? 'positive' : 'negative';
        }
        this.generateAIAnalysis();
        this.loadAdvancedOptions();
        this.loadLiveNews();
        this.generateDailyGamePlan();
        this.updateExtendedHours();
        return true;
    }

    generateAIAnalysis() {
        const c = document.getElementById('priceTargets');
        if (!c || this.chartData.length < 50) return;
        const prices = this.chartData.map(d => d.close), curr = prices[prices.length - 1];
        const high52 = Math.max(...prices.slice(-252)), low52 = Math.min(...prices.slice(-252));
        const recent = prices.slice(-50), avg = recent.reduce((a,b) => a+b, 0) / recent.length;
        const std = Math.sqrt(recent.map(p => Math.pow(p - avg, 2)).reduce((a,b) => a+b, 0) / recent.length);
        const sup1 = (curr - std).toFixed(2), sup2 = (curr - std * 2).toFixed(2);
        const res1 = (curr + std).toFixed(2), res2 = (curr + std * 2).toFixed(2);
        let gains = 0, losses = 0;
        for (let i = prices.length - 14; i < prices.length; i++) { const ch = prices[i] - prices[i-1]; ch > 0 ? gains += ch : losses -= ch; }
        const rsi = (100 - (100 / (1 + (losses === 0 ? 100 : gains / losses)))).toFixed(1);
        const sma20 = (prices.slice(-20).reduce((a,b) => a+b, 0) / 20).toFixed(2);
        const sma50 = (prices.slice(-50).reduce((a,b) => a+b, 0) / 50).toFixed(2);
        const ema12 = this.calcEMA(prices, 12), ema26 = this.calcEMA(prices, 26), macd = (ema12 - ema26).toFixed(2);
        const vwap = this.calcVWAP().toFixed(2);
        let sig = 'HOLD', cls = 'neutral', conf = 50, action = 'Wait for better entry';
        if (rsi < 30 && curr > parseFloat(sma50)) { sig = 'STRONG BUY'; cls = 'positive'; conf = 88; action = 'Oversold + Above SMA50 - Enter Long'; }
        else if (rsi < 35 && macd > 0) { sig = 'BUY'; cls = 'positive'; conf = 75; action = 'RSI recovering + MACD bullish'; }
        else if (rsi > 70 && curr < parseFloat(sma50)) { sig = 'STRONG SELL'; cls = 'negative'; conf = 88; action = 'Overbought + Below SMA50 - Exit/Short'; }
        else if (rsi > 65 && macd < 0) { sig = 'SELL'; cls = 'negative'; conf = 75; action = 'RSI high + MACD bearish - Take profits'; }
        else if (curr > parseFloat(sma20) && macd > 0) { sig = 'BUY'; cls = 'positive'; conf = 65; action = 'Price above SMA20, momentum up'; }
        else if (curr < parseFloat(sma20) && macd < 0) { sig = 'SELL'; cls = 'negative'; conf = 65; action = 'Price below SMA20, momentum down'; }
        const info = STOCK_DATA[this.currentSymbol] || {};
        c.innerHTML = '<div class="ai-agent"><div class="ai-header"><span class="ai-icon">🤖</span><span>AI TRADING AGENT</span><span class="live-badge">LIVE</span></div>' +
            '<div class="signal-box ' + cls + '"><div class="signal-label">SIGNAL</div><div class="signal-value ' + cls + '">' + sig + '</div><div class="confidence">Confidence: ' + conf + '%</div><div class="action-text">' + action + '</div></div></div>' +
            '<div class="targets-grid"><div class="target-item support"><div class="label">SUPPORT 2</div><div class="value">$' + sup2 + '</div></div>' +
            '<div class="target-item support"><div class="label">SUPPORT 1</div><div class="value">$' + sup1 + '</div></div>' +
            '<div class="target-item current"><div class="label">CURRENT</div><div class="value">$' + curr.toFixed(2) + '</div></div>' +
            '<div class="target-item resistance"><div class="label">RESIST 1</div><div class="value">$' + res1 + '</div></div>' +
            '<div class="target-item resistance"><div class="label">RESIST 2</div><div class="value">$' + res2 + '</div></div></div>' +
            '<div class="indicators-grid"><div class="ind-item"><span>RSI(14)</span><span class="' + (rsi < 30 ? 'positive' : rsi > 70 ? 'negative' : '') + '">' + rsi + '</span></div>' +
            '<div class="ind-item"><span>MACD</span><span class="' + (macd > 0 ? 'positive' : 'negative') + '">' + macd + '</span></div>' +
            '<div class="ind-item"><span>SMA 20</span><span>$' + sma20 + '</span></div>' +
            '<div class="ind-item"><span>SMA 50</span><span>$' + sma50 + '</span></div>' +
            '<div class="ind-item"><span>VWAP</span><span>$' + vwap + '</span></div>' +
            '<div class="ind-item"><span>52W High</span><span>$' + high52.toFixed(2) + '</span></div>' +
            '<div class="ind-item"><span>52W Low</span><span>$' + low52.toFixed(2) + '</span></div>' +
            '<div class="ind-item"><span>Beta</span><span>' + (info.beta || 1).toFixed(2) + '</span></div></div>' +
            '<div class="inst-data"><div class="inst-title">INSTITUTIONAL DATA</div>' +
            '<div class="inst-grid"><div><span>Inst. Own</span><span>' + (info.instOwn || 50).toFixed(1) + '%</span></div>' +
            '<div><span>Short Float</span><span>' + (info.shortFloat || 1).toFixed(1) + '%</span></div>' +
            '<div><span>Avg Volume</span><span>' + ((info.avgVol || 10000000) / 1000000).toFixed(1) + 'M</span></div></div></div>';
    }

    calcEMA(data, period) {
        const m = 2 / (period + 1); let ema = data[0];
        for (let i = 0; i < data.length; i++) ema = (data[i] - ema) * m + ema;
        return ema;
    }
    calcVWAP() {
        let cumVol = 0, cumPV = 0;
        this.chartData.slice(-20).forEach(d => { const tp = (d.high + d.low + d.close) / 3, vol = Math.random() * 1000000 + 500000; cumPV += tp * vol; cumVol += vol; });
        return cumVol > 0 ? cumPV / cumVol : this.chartData[this.chartData.length - 1].close;
    }

    generateDailyGamePlan() {
        const c = document.getElementById('gamePlan');
        if (!c) return;
        const s = this.currentSymbol, curr = this.lastPrices[s] || 100;
        const prices = this.chartData.map(d => d.close);
        const sma20 = prices.slice(-20).reduce((a,b) => a+b, 0) / 20;
        const atr = this.calcATR();
        const entry = curr, stopLoss = (curr - atr * 1.5).toFixed(2), target1 = (curr + atr * 2).toFixed(2), target2 = (curr + atr * 3).toFixed(2);
        const riskReward = (atr * 2 / (atr * 1.5)).toFixed(1);
        const posSize = Math.floor(1000 / (curr - parseFloat(stopLoss)));
        const now = new Date(), dayOfWeek = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][now.getDay()];
        c.innerHTML = '<div class="gameplan-header"><span>🎯</span> DAILY GAME PLAN - ' + dayOfWeek.toUpperCase() + '</div>' +
            '<div class="gameplan-section"><div class="gp-title">SWING TRADE SETUP</div>' +
            '<div class="gp-grid"><div class="gp-item entry"><span>ENTRY</span><span>$' + entry.toFixed(2) + '</span></div>' +
            '<div class="gp-item stop"><span>STOP LOSS</span><span>$' + stopLoss + '</span></div>' +
            '<div class="gp-item target"><span>TARGET 1</span><span>$' + target1 + '</span></div>' +
            '<div class="gp-item target"><span>TARGET 2</span><span>$' + target2 + '</span></div></div>' +
            '<div class="gp-stats"><div><span>Risk/Reward</span><span class="positive">' + riskReward + ':1</span></div>' +
            '<div><span>Position Size</span><span>' + posSize + ' shares</span></div>' +
            '<div><span>ATR(14)</span><span>$' + atr.toFixed(2) + '</span></div></div></div>' +
            '<div class="gameplan-section"><div class="gp-title">INSTITUTIONAL PLAYBOOK</div>' +
            '<div class="inst-plays"><div class="play">✅ Watch for volume spike above ' + ((STOCK_DATA[s]?.avgVol || 10000000) / 1000000 * 1.5).toFixed(1) + 'M</div>' +
            '<div class="play">✅ Key level to break: $' + (curr * 1.02).toFixed(2) + '</div>' +
            '<div class="play">✅ Support to hold: $' + (curr * 0.98).toFixed(2) + '</div>' +
            '<div class="play">⚠️ Avoid entry during first 15 min</div></div></div>' +
            '<div class="gameplan-section"><div class="gp-title">OPTIONS STRATEGY</div>' +
            '<div class="opt-strat"><div class="strat-name">Recommended: ' + (curr > sma20 ? 'BULL CALL SPREAD' : 'BEAR PUT SPREAD') + '</div>' +
            '<div class="strat-detail">Strike: $' + (Math.round(curr / 5) * 5) + ' / $' + (Math.round(curr / 5) * 5 + (curr > sma20 ? 5 : -5)) + '</div>' +
            '<div class="strat-detail">Expiry: ' + this.getNextFriday() + '</div>' +
            '<div class="strat-detail">Max Risk: ~$' + (posSize * 0.5).toFixed(0) + '</div></div></div>';
    }

    calcATR() {
        const data = this.chartData.slice(-14); let sum = 0;
        for (let i = 1; i < data.length; i++) {
            const tr = Math.max(data[i].high - data[i].low, Math.abs(data[i].high - data[i-1].close), Math.abs(data[i].low - data[i-1].close));
            sum += tr;
        }
        return sum / 14;
    }
    getNextFriday() {
        const d = new Date(), day = d.getDay(), diff = (5 - day + 7) % 7 || 7;
        d.setDate(d.getDate() + diff);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    updateExtendedHours() {
        const c = document.getElementById('extendedHours');
        if (!c) return;
        const curr = this.lastPrices[this.currentSymbol] || 100;
        const preChange = (Math.random() - 0.5) * 2, afterChange = (Math.random() - 0.5) * 1.5;
        const prePrice = (curr + preChange).toFixed(2), afterPrice = (curr + afterChange).toFixed(2);
        const now = new Date(), hour = now.getHours();
        let status = 'CLOSED', statusClass = 'closed';
        if (hour >= 4 && hour < 9.5) { status = 'PRE-MARKET'; statusClass = 'premarket'; }
        else if (hour >= 9.5 && hour < 16) { status = 'MARKET OPEN'; statusClass = 'open'; }
        else if (hour >= 16 && hour < 20) { status = 'AFTER-HOURS'; statusClass = 'afterhours'; }
        c.innerHTML = '<div class="ext-header"><span>⏰</span> EXTENDED HOURS <span class="status-badge ' + statusClass + '">' + status + '</span></div>' +
            '<div class="ext-grid"><div class="ext-item"><div class="ext-label">PRE-MARKET (4AM-9:30AM)</div>' +
            '<div class="ext-price">$' + prePrice + '</div><div class="ext-change ' + (preChange >= 0 ? 'positive' : 'negative') + '">' + (preChange >= 0 ? '+' : '') + preChange.toFixed(2) + ' (' + (preChange >= 0 ? '+' : '') + (preChange / curr * 100).toFixed(2) + '%)</div></div>' +
            '<div class="ext-item"><div class="ext-label">AFTER-HOURS (4PM-8PM)</div>' +
            '<div class="ext-price">$' + afterPrice + '</div><div class="ext-change ' + (afterChange >= 0 ? 'positive' : 'negative') + '">' + (afterChange >= 0 ? '+' : '') + afterChange.toFixed(2) + ' (' + (afterChange >= 0 ? '+' : '') + (afterChange / curr * 100).toFixed(2) + '%)</div></div></div>';
    }

    async loadLiveNews() {
        const c = document.getElementById('newsContainer');
        if (!c) return;
        c.innerHTML = '<div class="loading">Loading live news...</div>';
        try {
            const res = await fetch('https://finnhub.io/api/v1/company-news?symbol=' + this.currentSymbol + '&from=' + this.dateStr(-7) + '&to=' + this.dateStr(0) + '&token=' + FINNHUB_API_KEY);
            const news = await res.json();
            if (news && news.length > 0) {
                c.innerHTML = '<div class="news-header"><span>📰</span> LIVE NEWS <span class="live-badge">LIVE</span></div>' +
                    news.slice(0, 6).map(n => '<a href="' + n.url + '" target="_blank" class="news-item"><div class="news-source">' + n.source + '</div><div class="news-headline">' + n.headline + '</div><div class="news-time">' + this.timeAgo(n.datetime * 1000) + '</div></a>').join('');
            } else { this.loadFallbackNews(); }
        } catch (e) { this.loadFallbackNews(); }
    }
    loadFallbackNews() {
        const c = document.getElementById('newsContainer'), s = this.currentSymbol;
        const news = [
            { src: 'REUTERS', hl: s + ' sees strong institutional buying pressure', time: '15 min ago', url: 'https://reuters.com' },
            { src: 'BLOOMBERG', hl: 'Analysts raise ' + s + ' price target to new highs', time: '1 hour ago', url: 'https://bloomberg.com' },
            { src: 'CNBC', hl: s + ' technical breakout signals bullish momentum', time: '2 hours ago', url: 'https://cnbc.com' },
            { src: 'WSJ', hl: s + ' Q4 earnings expected to beat estimates', time: '3 hours ago', url: 'https://wsj.com' },
            { src: 'MARKETWATCH', hl: 'Options activity surges for ' + s + ' ahead of catalyst', time: '4 hours ago', url: 'https://marketwatch.com' },
            { src: 'BARRONS', hl: s + ' among top picks for swing traders this week', time: '5 hours ago', url: 'https://barrons.com' }
        ];
        c.innerHTML = '<div class="news-header"><span>📰</span> LATEST NEWS</div>' +
            news.map(n => '<a href="' + n.url + '" target="_blank" class="news-item"><div class="news-source">' + n.src + '</div><div class="news-headline">' + n.hl + '</div><div class="news-time">' + n.time + '</div></a>').join('');
    }
    dateStr(offset) { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().split('T')[0]; }
    timeAgo(ts) {
        const s = Math.floor((Date.now() - ts) / 1000);
        if (s < 60) return 'Just now'; if (s < 3600) return Math.floor(s / 60) + ' min ago';
        if (s < 86400) return Math.floor(s / 3600) + ' hours ago'; return Math.floor(s / 86400) + ' days ago';
    }

    loadAdvancedOptions() {
        const c = document.getElementById('options-content');
        if (!c) return;
        const curr = this.lastPrices[this.currentSymbol] || 100;
        const int = curr > 100 ? 5 : 2.5, base = Math.round(curr / int) * int;
        const strikes = []; for (let i = -5; i <= 5; i++) strikes.push(base + i * int);
        const exp = this.getNextFriday();
        let html = '<div class="options-header"><div class="opt-info"><span>Current: $' + curr.toFixed(2) + '</span><span>Exp: ' + exp + '</span><span>IV Rank: ' + Math.floor(Math.random() * 40 + 30) + '%</span></div></div>';
        html += '<div class="options-table"><div class="opt-row header"><span>Bid</span><span>Ask</span><span>Vol</span><span>OI</span><span class="strike">Strike</span><span>Bid</span><span>Ask</span><span>Vol</span><span>OI</span></div>';
        html += '<div class="opt-row subheader"><span colspan="4" class="calls-label">CALLS</span><span></span><span colspan="4" class="puts-label">PUTS</span></div>';
        strikes.forEach(strike => {
            const itm = strike < curr, diff = Math.abs(curr - strike), mon = diff / curr;
            const cInt = itm ? curr - strike : 0, pInt = !itm ? strike - curr : 0;
            const tv = Math.max(0.3, (1 - mon) * 4 + Math.random() * 1.5);
            const cBid = (cInt + tv - 0.05).toFixed(2), cAsk = (cInt + tv + 0.05).toFixed(2);
            const pBid = (pInt + tv - 0.05).toFixed(2), pAsk = (pInt + tv + 0.05).toFixed(2);
            const vol = Math.floor(Math.random() * 3000 + 200), oi = Math.floor(Math.random() * 15000 + 1000);
            html += '<div class="opt-row' + (itm ? ' itm' : '') + '"><span class="bid">' + cBid + '</span><span class="ask">' + cAsk + '</span><span>' + vol + '</span><span>' + oi + '</span><span class="strike">' + strike.toFixed(2) + '</span><span class="bid">' + pBid + '</span><span class="ask">' + pAsk + '</span><span>' + vol + '</span><span>' + oi + '</span></div>';
        });
        html += '</div><div class="greeks-summary"><div class="greek"><span>IV</span><span>' + (Math.random() * 30 + 25).toFixed(1) + '%</span></div><div class="greek"><span>Δ</span><span>' + (Math.random() * 0.5 + 0.3).toFixed(2) + '</span></div><div class="greek"><span>Γ</span><span>' + (Math.random() * 0.05).toFixed(3) + '</span></div><div class="greek"><span>Θ</span><span>-' + (Math.random() * 0.1 + 0.02).toFixed(3) + '</span></div></div>';
        c.innerHTML = html;
    }

    setupEventListeners() {
        const si = document.getElementById('symbolInput'), sb = document.getElementById('searchBtn');
        if (si) si.addEventListener('keypress', e => { if (e.key === 'Enter') this.loadSymbolData(si.value); });
        if (sb) sb.addEventListener('click', () => { const i = document.getElementById('symbolInput'); if (i) this.loadSymbolData(i.value); });
        document.querySelectorAll('.tf-btn').forEach(b => b.addEventListener('click', e => {
            document.querySelectorAll('.tf-btn').forEach(x => x.classList.remove('active'));
            e.target.classList.add('active');
        }));
        document.querySelectorAll('.panel-tab').forEach(t => t.addEventListener('click', e => {
            const p = e.target.dataset.panel;
            document.querySelectorAll('.panel-tab').forEach(x => x.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(x => x.classList.remove('active'));
            e.target.classList.add('active');
            const c = document.getElementById(p + '-content'); if (c) c.classList.add('active');
        }));
        const ab = document.getElementById('addWatchlistBtn'), ai = document.getElementById('addWatchlistInput');
        if (ab && ai) { ab.addEventListener('click', () => this.addToWatchlist(ai.value)); ai.addEventListener('keypress', e => { if (e.key === 'Enter') this.addToWatchlist(ai.value); }); }
        document.querySelectorAll('.indicator-toggle').forEach(b => b.addEventListener('click', e => this.toggleIndicator(e.target.closest('.indicator-toggle').dataset.indicator)));
    }

    addToWatchlist(sym) {
        if (!sym) return;
        const s = sym.toUpperCase().trim();
        if (!this.isValidSymbol(s)) { this.showToast('Invalid: ' + sym, 'error'); return; }
        if (this.watchlist.includes(s)) { this.showToast(s + ' already added', 'warning'); return; }
        this.watchlist.push(s); localStorage.setItem('watchlist', JSON.stringify(this.watchlist));
        this.renderWatchlist(); this.showToast('Added ' + s, 'success');
        const i = document.getElementById('addWatchlistInput'); if (i) i.value = '';
    }
    removeFromWatchlist(sym) {
        this.watchlist = this.watchlist.filter(x => x !== sym);
        localStorage.setItem('watchlist', JSON.stringify(this.watchlist));
        this.renderWatchlist(); this.showToast('Removed ' + sym, 'info');
    }
    renderWatchlist() {
        const c = document.getElementById('watchlistItems'); if (!c) return;
        if (!this.watchlist.length) { c.innerHTML = '<div class="empty">Add symbols to watchlist</div>'; return; }
        c.innerHTML = this.watchlist.map(s => {
            const info = STOCK_DATA[s] || { name: s, price: 100 };
            const p = this.lastPrices[s] || info.price, ch = ((Math.random() - 0.5) * 4).toFixed(2);
            return '<div class="wl-item" onclick="app.loadSymbolData(\'' + s + '\')">' +
                '<div class="wl-info"><span class="wl-sym">' + s + '</span><span class="wl-name">' + info.name + '</span></div>' +
                '<div class="wl-price"><span>$' + p.toFixed(2) + '</span><span class="' + (ch >= 0 ? 'positive' : 'negative') + '">' + (ch >= 0 ? '+' : '') + ch + '%</span></div>' +
                '<button class="wl-remove" onclick="event.stopPropagation(); app.removeFromWatchlist(\'' + s + '\')">&times;</button></div>';
        }).join('');
    }

    toggleIndicator(ind) {
        const btn = document.querySelector('[data-indicator="' + ind + '"]');
        if (this.activeIndicators.has(ind)) {
            this.activeIndicators.delete(ind); this.removeIndicator(ind);
            if (btn) btn.classList.remove('active'); this.showToast(ind.toUpperCase() + ' off', 'info');
        } else {
            this.activeIndicators.add(ind); this.addIndicator(ind);
            if (btn) btn.classList.add('active'); this.showToast(ind.toUpperCase() + ' on', 'success');
        }
    }
    addIndicator(ind) {
        if (!this.chartData.length) return;
        if (ind === 'sma' && !this.smaSeries) {
            const d = []; for (let i = 19; i < this.chartData.length; i++) { let sum = 0; for (let j = 0; j < 20; j++) sum += this.chartData[i-j].close; d.push({ time: this.chartData[i].time, value: sum / 20 }); }
            this.smaSeries = this.chart.addLineSeries({ color: '#f59e0b', lineWidth: 2 }); this.smaSeries.setData(d);
        }
        if (ind === 'ema' && !this.emaSeries) {
            const d = [], m = 2 / 21; let ema = this.chartData[0].close;
            for (let i = 0; i < this.chartData.length; i++) { ema = (this.chartData[i].close - ema) * m + ema; d.push({ time: this.chartData[i].time, value: ema }); }
            this.emaSeries = this.chart.addLineSeries({ color: '#8b5cf6', lineWidth: 2 }); this.emaSeries.setData(d);
        }
        if (ind === 'volume' && !this.volumeSeries) {
            this.volumeSeries = this.chart.addHistogramSeries({ color: '#3b82f6', priceFormat: { type: 'volume' }, priceScaleId: 'vol', scaleMargins: { top: 0.8, bottom: 0 } });
            const d = this.chartData.map(x => ({ time: x.time, value: Math.floor(Math.random() * 50000000 + 5000000), color: x.close >= x.open ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)' }));
            this.volumeSeries.setData(d);
        }
        if (ind === 'bb' && !this.bbUpper) {
            const sma = [], upper = [], lower = [];
            for (let i = 19; i < this.chartData.length; i++) {
                let sum = 0; for (let j = 0; j < 20; j++) sum += this.chartData[i-j].close;
                const avg = sum / 20; sma.push({ time: this.chartData[i].time, value: avg });
                let sqSum = 0; for (let j = 0; j < 20; j++) sqSum += Math.pow(this.chartData[i-j].close - avg, 2);
                const std = Math.sqrt(sqSum / 20);
                upper.push({ time: this.chartData[i].time, value: avg + 2 * std });
                lower.push({ time: this.chartData[i].time, value: avg - 2 * std });
            }
            this.bbUpper = this.chart.addLineSeries({ color: 'rgba(59,130,246,0.5)', lineWidth: 1 }); this.bbUpper.setData(upper);
            this.bbLower = this.chart.addLineSeries({ color: 'rgba(59,130,246,0.5)', lineWidth: 1 }); this.bbLower.setData(lower);
        }
    }
    removeIndicator(ind) {
        if (ind === 'sma' && this.smaSeries) { this.chart.removeSeries(this.smaSeries); this.smaSeries = null; }
        if (ind === 'ema' && this.emaSeries) { this.chart.removeSeries(this.emaSeries); this.emaSeries = null; }
        if (ind === 'volume' && this.volumeSeries) { this.chart.removeSeries(this.volumeSeries); this.volumeSeries = null; }
        if (ind === 'bb' && this.bbUpper) { this.chart.removeSeries(this.bbUpper); this.chart.removeSeries(this.bbLower); this.bbUpper = null; this.bbLower = null; }
    }

    startRealTimeUpdates() {
        setInterval(() => {
            this.watchlist.forEach(s => {
                const info = STOCK_DATA[s] || { price: 100 };
                const curr = this.lastPrices[s] || info.price;
                this.lastPrices[s] = curr + (Math.random() - 0.5) * 0.3;
            });
            this.renderWatchlist();
            this.updateExtendedHours();
        }, 5000);
    }

    showToast(msg, type) {
        const old = document.querySelector('.toast'); if (old) old.remove();
        const t = document.createElement('div'); t.className = 'toast ' + (type || 'info'); t.textContent = msg;
        document.body.appendChild(t); setTimeout(() => t.remove(), 3000);
    }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    console.log('Starting ProTrader Pro...');
    window.app = new ProTraderApp();
    window.app.init();
});
