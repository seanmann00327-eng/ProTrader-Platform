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
                    this.handleSymbolSearch(searchInput.value);
                }
            });
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.handleSymbolSearch(searchInput?.value);
            });
        }

        // Timeframe buttons
        document.querySelectorAll('.timeframe-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changeTimeframe(e.target.dataset.timeframe);
            });
        });

        // Chart type buttons
        document.querySelectorAll('.chart-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changeChartType(e.target.dataset.type);
            });
        });

        // Indicator checkboxes
        document.querySelectorAll('.indicator-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.toggleIndicator(e.target.dataset.indicator, e.target.checked);
            });
        });

        // Add to watchlist button
        const addWatchlistBtn = document.getElementById('add-watchlist-btn');
        if (addWatchlistBtn) {
            addWatchlistBtn.addEventListener('click', () => {
                this.watchlistManager.addSymbol(this.currentSymbol);
            });
        }

        // Alert form
        const alertForm = document.getElementById('alert-form');
        if (alertForm) {
            alertForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createAlertFromForm();
            });
        }

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Window resize
        window.addEventListener('resize', () => {
            if (this.chartManager) {
                this.chartManager.resize();
            }
        });
    }

    async loadSymbolData(symbol) {
        this.currentSymbol = symbol.toUpperCase();
        this.updateSymbolDisplay();

        try {
            // Get candle data
            const candles = await StockAPI.getCandles(this.currentSymbol, this.currentTimeframe);
            
            if (candles && candles.length > 0) {
                this.chartManager.setData(candles);
                this.reapplyIndicators();
            }

            // Get quote for header
            const quote = await StockAPI.getQuote(this.currentSymbol);
            this.updateQuoteDisplay(quote);

            // Check alerts
            if (quote) {
                this.alertManager.checkAlerts(this.currentSymbol, quote.c);
            }

            // Load options chain
            this.optionsManager.loadOptionsChain(this.currentSymbol);

        } catch (error) {
            console.error('Error loading symbol data:', error);
        }
    }

    updateSymbolDisplay() {
        const symbolEl = document.getElementById('current-symbol');
        if (symbolEl) {
            symbolEl.textContent = this.currentSymbol;
        }
        document.title = `${this.currentSymbol} - ProTrader`;
    }

    updateQuoteDisplay(quote) {
        if (!quote) return;

        const priceEl = document.getElementById('current-price');
        const changeEl = document.getElementById('price-change');

        if (priceEl) {
            priceEl.textContent = `$${quote.c.toFixed(2)}`;
        }

        if (changeEl) {
            const changeSign = quote.d >= 0 ? '+' : '';
            changeEl.textContent = `${changeSign}${quote.d.toFixed(2)} (${changeSign}${quote.dp.toFixed(2)}%)`;
            changeEl.className = `price-change ${quote.d >= 0 ? 'positive' : 'negative'}`;
        }
    }

    handleSymbolSearch(symbol) {
        if (symbol && symbol.trim()) {
            this.changeSymbol(symbol.trim());
        }
    }

    changeSymbol(symbol) {
        this.loadSymbolData(symbol);
    }

    changeTimeframe(timeframe) {
        this.currentTimeframe = timeframe;
        
        // Update active button
        document.querySelectorAll('.timeframe-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.timeframe === timeframe);
        });
        
        this.loadSymbolData(this.currentSymbol);
    }

    changeChartType(type) {
        // Update active button
        document.querySelectorAll('.chart-type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });
        
        this.chartManager.setChartType(type);
    }

    toggleIndicator(indicator, enabled) {
        if (enabled) {
            this.activeIndicators.add(indicator);
            this.addIndicatorToChart(indicator);
        } else {
            this.activeIndicators.delete(indicator);
            this.chartManager.clearIndicators();
            this.reapplyIndicators();
        }
    }

    addIndicatorToChart(indicator) {
        const colors = CONFIG.CHART_COLORS;
        
        switch (indicator) {
            case 'sma20':
                this.chartManager.addSMA(20, colors.sma20);
                break;
            case 'sma50':
                this.chartManager.addSMA(50, colors.sma50);
                break;
            case 'ema12':
                this.chartManager.addEMA(12, colors.ema12);
                break;
            case 'ema26':
                this.chartManager.addEMA(26, colors.ema26);
                break;
            case 'bb':
                this.chartManager.addBollingerBands(20, colors.bollinger);
                break;
            case 'vwap':
                this.chartManager.addVWAP(colors.vwap);
                break;
        }
    }

    reapplyIndicators() {
        this.chartManager.clearIndicators();
        this.activeIndicators.forEach(indicator => {
            this.addIndicatorToChart(indicator);
        });
    }

    createAlertFromForm() {
        const symbolInput = document.getElementById('alert-symbol');
        const conditionSelect = document.getElementById('alert-condition');
        const priceInput = document.getElementById('alert-price');
        const noteInput = document.getElementById('alert-note');

        if (symbolInput && conditionSelect && priceInput) {
            const symbol = symbolInput.value || this.currentSymbol;
            this.alertManager.createAlert(
                symbol,
                conditionSelect.value,
                priceInput.value,
                noteInput?.value || ''
            );

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
                const quote = await StockAPI.getQuote(this.currentSymbol);
                this.updateQuoteDisplay(quote);
                
                if (quote) {
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
