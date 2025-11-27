// ProTrader Platform - Configuration
const CONFIG = {
    // API Keys - Replace with your own keys from Finnhub
    FINNHUB_API_KEY: 'd4joes9r01qgcb0uirggd4joes9r01qgcb0uirh0', // Get free key at https://finnhub.io/
    
    // Default Settings
    DEFAULT_SYMBOL: 'AAPL',
    DEFAULT_TIMEFRAME: 'D',
    
    // Chart Settings
    CHART_COLORS: {
        background: '#131722',
        text: '#d1d4dc',
        grid: '#363a45',
        upColor: '#26a69a',
        downColor: '#ef5350',
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
        volumeUp: 'rgba(38, 166, 154, 0.5)',
        volumeDown: 'rgba(239, 83, 80, 0.5)'
    },
    
    // Indicator Colors
    INDICATOR_COLORS: {
        sma: '#2196F3',
        ema: '#FF9800',
        bb_upper: '#9C27B0',
        bb_lower: '#9C27B0',
        bb_middle: '#9C27B0',
        vwap: '#00BCD4',
        rsi: '#E91E63',
        macd: '#4CAF50',
        macd_signal: '#FF5722',
        macd_histogram: '#2196F3'
    },
    
    // API Endpoints
    ENDPOINTS: {
        FINNHUB_BASE: 'https://finnhub.io/api/v1',
        QUOTE: '/quote',
        CANDLES: '/stock/candle',
        COMPANY: '/stock/profile2',
        NEWS: '/company-news',
        SEARCH: '/search'
    },
    
    // Timeframe mappings (for API calls)
    TIMEFRAMES: {
        '1': { resolution: '1', days: 1 },
        '5': { resolution: '5', days: 1 },
        '15': { resolution: '15', days: 3 },
        '60': { resolution: '60', days: 7 },
        'D': { resolution: 'D', days: 365 },
        'W': { resolution: 'W', days: 730 },
        'M': { resolution: 'M', days: 1825 }
    },
    
    // Default Watchlist
    DEFAULT_WATCHLIST: [
        { symbol: 'AAPL', name: 'Apple Inc.' },
        { symbol: 'MSFT', name: 'Microsoft Corp.' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.' },
        { symbol: 'NVDA', name: 'NVIDIA Corp.' },
        { symbol: 'TSLA', name: 'Tesla Inc.' },
        { symbol: 'META', name: 'Meta Platforms' },
        { symbol: 'AMD', name: 'AMD Inc.' }
    ],
    
    // Update intervals (in milliseconds)
    UPDATE_INTERVALS: {
        QUOTE: 5000,      // Update price every 5 seconds
        CHART: 60000,     // Update chart every minute
        WATCHLIST: 10000  // Update watchlist every 10 seconds
    }
};

// Make CONFIG available globally
window.CONFIG = CONFIG;
