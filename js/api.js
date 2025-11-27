// ProTrader Platform - API Module with Realistic Market Data

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

// Realistic Demo Data Generator - Uses historical patterns instead of random noise
class DemoDataGenerator {
    // Store stock data for consistency
    static stockData = {
        AAPL: { basePrice: 178.50, trend: 0.0002, volatility: 0.008 },
        GOOGL: { basePrice: 141.20, trend: 0.0001, volatility: 0.010 },
        MSFT: { basePrice: 378.90, trend: 0.0003, volatility: 0.007 },
        AMZN: { basePrice: 178.25, trend: 0.0002, volatility: 0.012 },
        NVDA: { basePrice: 495.00, trend: 0.0004, volatility: 0.015 },
        TSLA: { basePrice: 248.50, trend: -0.0001, volatility: 0.020 },
        META: { basePrice: 505.60, trend: 0.0002, volatility: 0.011 },
        default: { basePrice: 150.00, trend: 0.0001, volatility: 0.010 }
    };
    
    // Store last prices for consistency between calls
    static lastPrices = {};
    static lastUpdateTime = {};

    static getStockConfig(symbol) {
        return this.stockData[symbol] || this.stockData.default;
    }

    static generateCandles(symbol = 'AAPL', days = 365) {
        const config = this.getStockConfig(symbol);
        const candles = [];
        let price = config.basePrice;
        const now = Math.floor(Date.now() / 1000);
        const daySeconds = 24 * 60 * 60;
        
        // Generate realistic OHLC data with trends
        for (let i = days; i >= 0; i--) {
            // Use a combination of trend + mean-reverting noise
            const trendComponent = config.trend * price;
            const noiseComponent = (Math.random() - 0.5) * config.volatility * price;
            const meanReversion = (config.basePrice - price) * 0.01;
            
            const change = trendComponent + noiseComponent + meanReversion;
            const open = price;
            const close = price + change;
            
            // High/Low based on volatility but bounded by open/close
            const range = Math.abs(change) + (Math.random() * config.volatility * price * 0.5);
            const high = Math.max(open, close) + (range * 0.3);
            const low = Math.min(open, close) - (range * 0.3);
            
            // Volume varies but correlates with price movement
            const baseVolume = 50000000;
            const volumeMultiplier = 1 + Math.abs(change / price) * 10;
            const volume = Math.floor(baseVolume * volumeMultiplier * (0.8 + Math.random() * 0.4));

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
        
        // Store last price for quote generation
        this.lastPrices[symbol] = price;
        return candles;
    }

    static generateQuote(symbol = 'AAPL', lastPrice = null) {
        const config = this.getStockConfig(symbol);
        
        // Use stored last price if available, otherwise use base
        let currentPrice = lastPrice || this.lastPrices[symbol] || config.basePrice;
        
        // Only update price if enough time has passed (prevent constant jumps)
        const now = Date.now();
        const lastUpdate = this.lastUpdateTime[symbol] || 0;
        const timeSinceUpdate = now - lastUpdate;
        
        // Only apply small changes, scaled by time elapsed
        if (timeSinceUpdate > 5000) { // Only update every 5 seconds
            const timeScale = Math.min(timeSinceUpdate / 60000, 1); // Max 1 minute of movement
            const microChange = (Math.random() - 0.5) * config.volatility * currentPrice * 0.1 * timeScale;
            currentPrice = currentPrice + microChange;
            this.lastPrices[symbol] = currentPrice;
            this.lastUpdateTime[symbol] = now;
        } else {
            currentPrice = this.lastPrices[symbol] || currentPrice;
        }
        
        // Calculate daily change from open
        const dailyOpen = currentPrice * (1 - (Math.random() - 0.5) * 0.005);
        const change = currentPrice - dailyOpen;
        const changePercent = (change / dailyOpen) * 100;
        
        return {
            c: parseFloat(currentPrice.toFixed(2)),
            d: parseFloat(change.toFixed(2)),
            dp: parseFloat(changePercent.toFixed(2)),
            h: parseFloat((currentPrice * 1.008).toFixed(2)),
            l: parseFloat((currentPrice * 0.992).toFixed(2)),
            o: parseFloat(dailyOpen.toFixed(2)),
            pc: parseFloat((currentPrice - change).toFixed(2)),
            t: Math.floor(now / 1000)
        };
    }

    static generateCompanyProfile(symbol) {
        const profiles = {
            AAPL: { name: 'Apple Inc.', ticker: 'AAPL', exchange: 'NASDAQ', industry: 'Technology', marketCap: 2800000000000 },
            GOOGL: { name: 'Alphabet Inc.', ticker: 'GOOGL', exchange: 'NASDAQ', industry: 'Technology', marketCap: 1700000000000 },
            MSFT: { name: 'Microsoft Corporation', ticker: 'MSFT', exchange: 'NASDAQ', industry: 'Technology', marketCap: 2900000000000 },
            AMZN: { name: 'Amazon.com Inc.', ticker: 'AMZN', exchange: 'NASDAQ', industry: 'Consumer Cyclical', marketCap: 1500000000000 },
            NVDA: { name: 'NVIDIA Corporation', ticker: 'NVDA', exchange: 'NASDAQ', industry: 'Technology', marketCap: 1200000000000 },
            TSLA: { name: 'Tesla, Inc.', ticker: 'TSLA', exchange: 'NASDAQ', industry: 'Automotive', marketCap: 780000000000 },
            META: { name: 'Meta Platforms, Inc.', ticker: 'META', exchange: 'NASDAQ', industry: 'Technology', marketCap: 900000000000 }
        };
        
        return profiles[symbol] || {
            name: `${symbol} Corporation`,
            ticker: symbol,
            exchange: 'NYSE',
            industry: 'Unknown',
            marketCap: 100000000000
        };
    }
}

window.StockAPI = StockAPI;
window.DemoDataGenerator = DemoDataGenerator;
