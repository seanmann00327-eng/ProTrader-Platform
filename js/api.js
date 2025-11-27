// ProTrader Platform - API Module
class StockAPI {
    constructor() {
        this.baseUrl = CONFIG.ENDPOINTS.FINNHUB_BASE;
        this.apiKey = CONFIG.FINNHUB_API_KEY;
    }

    async fetchWithKey(endpoint, params = {}) {
        const url = new URL(this.baseUrl + endpoint);
        url.searchParams.append('token', this.apiKey);
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async getQuote(symbol) {
        return this.fetchWithKey(CONFIG.ENDPOINTS.QUOTE, { symbol: symbol.toUpperCase() });
    }

    async getCandles(symbol, resolution, from, to) {
        return this.fetchWithKey(CONFIG.ENDPOINTS.CANDLES, {
            symbol: symbol.toUpperCase(),
            resolution,
            from: Math.floor(from / 1000),
            to: Math.floor(to / 1000)
        });
    }

    async getCompanyProfile(symbol) {
        return this.fetchWithKey(CONFIG.ENDPOINTS.COMPANY, { symbol: symbol.toUpperCase() });
    }

    async searchSymbol(query) {
        return this.fetchWithKey(CONFIG.ENDPOINTS.SEARCH, { q: query });
    }

    async getHistoricalData(symbol, timeframe = 'D') {
        const tf = CONFIG.TIMEFRAMES[timeframe];
        const to = Date.now();
        const from = to - (tf.days * 24 * 60 * 60 * 1000);
        
        const data = await this.getCandles(symbol, tf.resolution, from, to);
        
        if (data.s !== 'ok' || !data.c) {
            console.warn('No data returned for', symbol);
            return [];
        }
        
        return data.t.map((timestamp, i) => ({
            time: timestamp,
            open: data.o[i],
            high: data.h[i],
            low: data.l[i],
            close: data.c[i],
            volume: data.v[i]
        }));
    }
}

// Demo data generator for when API key is not set
class DemoDataGenerator {
    static generateCandles(days = 365) {
        const candles = [];
        let price = 150 + Math.random() * 50;
        const now = Math.floor(Date.now() / 1000);
        const daySeconds = 24 * 60 * 60;
        
        for (let i = days; i >= 0; i--) {
            const volatility = 0.02;
            const change = (Math.random() - 0.5) * 2 * volatility * price;
            const open = price;
            const close = price + change;
            const high = Math.max(open, close) + Math.random() * volatility * price;
            const low = Math.min(open, close) - Math.random() * volatility * price;
            const volume = Math.floor(Math.random() * 50000000) + 10000000;
            
            candles.push({
                time: now - (i * daySeconds),
                open: parseFloat(open.toFixed(2)),
                high: parseFloat(high.toFixed(2)),
                low: parseFloat(low.toFixed(2)),
                close: parseFloat(close.toFixed(2)),
                volume
            });
            
            price = close;
        }
        return candles;
    }

    static generateQuote(lastPrice) {
        const change = (Math.random() - 0.5) * 2;
        const price = lastPrice + change;
        return {
            c: parseFloat(price.toFixed(2)),
            d: parseFloat(change.toFixed(2)),
            dp: parseFloat((change / lastPrice * 100).toFixed(2)),
            h: parseFloat((price + Math.random() * 2).toFixed(2)),
            l: parseFloat((price - Math.random() * 2).toFixed(2)),
            o: parseFloat((price - change).toFixed(2)),
            pc: parseFloat((price - change).toFixed(2))
        };
    }
}

window.StockAPI = StockAPI;
window.DemoDataGenerator = DemoDataGenerator;
