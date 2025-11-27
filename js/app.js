// ProTrader Platform - Main Application
// Initializes and orchestrates all components

class ProTraderApp {
    constructor() {
        this.currentSymbol = CONFIG.DEFAULT_SYMBOL;
        this.currentTimeframe = CONFIG.DEFAULT_TIMEFRAME;
        this.chartManager = null;
        this.watchlistManager = null;
        this.optionsManager = null;
        this.alertManager = null;
        this.activeIndicators = new Set();
        this.api = new StockAPI();
    }

    async init() {
        console.log('Initializing ProTrader Platform...');
        
        // Initialize managers
        this.chartManager = new ChartManager('chart-container');
        this.watchlistManager = new WatchlistManager();
        this.optionsManager = new OptionsManager();
        this.alertManager = new AlertManager();
        
        // Make managers globally accessible
        window.watchlistManager = this.watchlistManager;
        window.optionsManager = this.optionsManager;
        window.alertManager = this.alertManager;
        window.app = this;
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load initial data
        await this.loadSymbolData(this.currentSymbol);
        
        // Start auto-updates
        this.watchlistManager.startAutoUpdate();
        this.startPriceUpdates();
        
        console.log('ProTrader Platform initialized successfully!');
    }

    setupEventListeners() {
        // Symbol search
        const searchInput = document.getElementById('symbol-search');
        const searchBtn = document.getElementById('search-btn');
        
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchSymbol(searchInput.value);
                }
            });
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.searchSymbol(searchInput.value);
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
        
        // Chart type buttons
        document.querySelectorAll('.chart-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
                e.target.closest('.chart-type-btn').classList.add('active');
                const chartType = e.target.closest('.chart-type-btn').dataset.type;
                this.chartManager.setChartType(chartType);
            });
        });
        
        // Indicator toggles
        document.querySelectorAll('.indicator-toggle').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const indicator = e.target.dataset.indicator;
                if (e.target.checked) {
                    this.activeIndicators.add(indicator);
                } else {
                    this.activeIndicators.delete(indicator);
                }
                this.reapplyIndicators();
            });
        });
        
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                document.body.classList.toggle('light-theme');
            });
        }
        
        // Alert form
        const createAlertBtn = document.getElementById('createAlert');
        if (createAlertBtn) {
            createAlertBtn.addEventListener('click', () => {
                this.createAlertFromForm();
            });
        }
    }

    async searchSymbol(symbol) {
        if (!symbol) return;
        symbol = symbol.toUpperCase().trim();
        this.currentSymbol = symbol;
        await this.loadSymbolData(symbol);
    }

    async loadSymbolData(symbol) {
        try {
            console.log(`Loading data for ${symbol}...`);
            
            // Update UI to show loading state
            document.getElementById('symbolName').textContent = symbol;
            document.getElementById('companyName').textContent = 'Loading...';
            
            let quote, candles, profile;
            let useDemoData = false;
            
            // Try to get real data from API
            try {
                [quote, candles, profile] = await Promise.all([
                    this.api.getQuote(symbol),
                    this.api.getHistoricalData(symbol, this.currentTimeframe),
                    this.api.getCompanyProfile(symbol)
                ]);
                
                // Check if we got valid data
                if (!candles || candles.length === 0 || !quote || quote.c === 0) {
                    console.log('API returned empty data, using demo data');
                    useDemoData = true;
                }
            } catch (apiError) {
                console.log('API error, falling back to demo data:', apiError);
                useDemoData = true;
            }
            
            // Use demo data if API failed or returned empty
            if (useDemoData) {
                console.log('Generating demo data for', symbol);
                candles = DemoDataGenerator.generateCandles(365);
                quote = DemoDataGenerator.generateQuote(candles[candles.length - 1].close);
                profile = { name: this.getCompanyName(symbol) };
            }
            
            // Update price display
            this.updateQuoteDisplay(quote);
            
            // Update company name
            if (profile && profile.name) {
                document.getElementById('companyName').textContent = profile.name;
            } else {
                document.getElementById('companyName').textContent = this.getCompanyName(symbol);
            }
            
            // Update chart with candle data
            if (candles && candles.length > 0) {
                this.chartManager.setData(candles);
                this.reapplyIndicators();
            }
            
            console.log(`Data loaded for ${symbol}:`, { quote, candlesCount: candles?.length });
            
        } catch (error) {
            console.error('Error loading symbol data:', error);
            // Still show demo data on error
            const candles = DemoDataGenerator.generateCandles(365);
            const quote = DemoDataGenerator.generateQuote(candles[candles.length - 1].close);
            this.updateQuoteDisplay(quote);
            this.chartManager.setData(candles);
            document.getElementById('companyName').textContent = this.getCompanyName(symbol);
        }
    }
    
    getCompanyName(symbol) {
        const names = {
            'AAPL': 'Apple Inc.',
            'MSFT': 'Microsoft Corporation',
            'GOOGL': 'Alphabet Inc.',
            'AMZN': 'Amazon.com Inc.',
            'META': 'Meta Platforms Inc.',
            'TSLA': 'Tesla Inc.',
            'NVDA': 'NVIDIA Corporation',
            'JPM': 'JPMorgan Chase & Co.',
            'V': 'Visa Inc.',
            'JNJ': 'Johnson & Johnson'
        };
        return names[symbol] || symbol;
    }

    updateQuoteDisplay(quote) {
        if (!quote) return;
        
        const priceEl = document.getElementById('currentPrice');
        const changeEl = document.getElementById('priceChange');
        
        if (priceEl) {
            priceEl.textContent = `$${quote.c?.toFixed(2) || '0.00'}`;
        }
        
        if (changeEl) {
            const change = quote.d || 0;
            const changePercent = quote.dp || 0;
            const isPositive = change >= 0;
            
            changeEl.textContent = `${isPositive ? '+' : ''}${change.toFixed(2)} (${isPositive ? '+' : ''}${changePercent.toFixed(2)}%)`;
            changeEl.className = `change ${isPositive ? 'positive' : 'negative'}`;
        }
    }

    async changeTimeframe(timeframe) {
        this.currentTimeframe = timeframe;
        await this.loadSymbolData(this.currentSymbol);
    }

    reapplyIndicators() {
        if (!this.chartManager || !this.chartManager.currentData) return;
        
        // Clear existing indicators
        this.chartManager.clearIndicators();
        
        // Apply active indicators
        this.activeIndicators.forEach(indicator => {
            switch(indicator) {
                case 'sma20':
                    const sma20 = TechnicalIndicators.SMA(this.chartManager.currentData, 20);
                    this.chartManager.addIndicatorSeries(sma20, CONFIG.INDICATOR_COLORS.sma);
                    break;
                case 'sma50':
                    const sma50 = TechnicalIndicators.SMA(this.chartManager.currentData, 50);
                    this.chartManager.addIndicatorSeries(sma50, CONFIG.INDICATOR_COLORS.sma);
                    break;
                case 'ema12':
                    const ema12 = TechnicalIndicators.EMA(this.chartManager.currentData, 12);
                    this.chartManager.addIndicatorSeries(ema12, CONFIG.INDICATOR_COLORS.ema);
                    break;
                case 'ema26':
                    const ema26 = TechnicalIndicators.EMA(this.chartManager.currentData, 26);
                    this.chartManager.addIndicatorSeries(ema26, CONFIG.INDICATOR_COLORS.ema);
                    break;
                case 'bb':
                    const bb = TechnicalIndicators.BollingerBands(this.chartManager.currentData, 20);
                    this.chartManager.addBollingerBands(bb);
                    break;
                case 'vwap':
                    const vwap = TechnicalIndicators.VWAP(this.chartManager.currentData);
                    this.chartManager.addIndicatorSeries(vwap, CONFIG.INDICATOR_COLORS.vwap);
                    break;
            }
        });
    }

    createAlertFromForm() {
        const symbolInput = document.getElementById('alert-symbol');
        const conditionSelect = document.getElementById('alert-condition');
        const priceInput = document.getElementById('alert-price');
        const noteInput = document.getElementById('alert-note');
        
        if (symbolInput && conditionSelect && priceInput) {
            const symbol = symbolInput.value || this.currentSymbol;
            this.alertManager.createAlert({
                symbol,
                conditionSelect.value,
                priceInput.value,
                noteInput?.value || ''
            });
            
            // Clear form
            if (priceInput) priceInput.value = '';
            if (noteInput) noteInput.value = '';
        }
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
    }

    startPriceUpdates() {
        setInterval(async () => {
            try {
                let quote;
                try {
                    quote = await this.api.getQuote(this.currentSymbol);
                } catch (e) {
                    // Use demo quote on error
                    quote = DemoDataGenerator.generateQuote(150 + Math.random() * 50);
                }
                
                if (quote) {
                    this.updateQuoteDisplay(quote);
                    this.alertManager.checkAlerts(this.currentSymbol, quote.c);
                }
            } catch (error) {
                console.error('Error updating price:', error);
            }
        }, CONFIG.UPDATE_INTERVAL);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new ProTraderApp();
    app.init();
});

// Export for global access
window.ProTraderApp = ProTraderApp;
