// Watchlist Manager - Manages stock watchlist with localStorage persistence

class WatchlistManager {
    constructor() {
        this.watchlist = [];
        this.container = document.getElementById('watchlist-items');
        this.loadFromStorage();
    }

    loadFromStorage() {
        const saved = localStorage.getItem('protrader_watchlist');
        if (saved) {
            this.watchlist = JSON.parse(saved);
        } else {
            // Default watchlist
            this.watchlist = CONFIG.DEFAULT_WATCHLIST.map(symbol => ({
                symbol,
                price: 0,
                change: 0,
                changePercent: 0
            }));
        }
        this.render();
    }

    saveToStorage() {
        localStorage.setItem('protrader_watchlist', JSON.stringify(this.watchlist));
    }

    addSymbol(symbol) {
        symbol = symbol.toUpperCase().trim();
        if (!symbol) return false;
        
        if (this.watchlist.find(item => item.symbol === symbol)) {
            return false; // Already exists
        }

        this.watchlist.push({
            symbol,
            price: 0,
            change: 0,
            changePercent: 0
        });

        this.saveToStorage();
        this.render();
        this.updatePrices();
        return true;
    }

    removeSymbol(symbol) {
        this.watchlist = this.watchlist.filter(item => item.symbol !== symbol);
        this.saveToStorage();
        this.render();
    }

    async updatePrices() {
        for (const item of this.watchlist) {
            try {
                const quote = await StockAPI.getQuote(item.symbol);
                if (quote) {
                    item.price = quote.c;
                    item.change = quote.d;
                    item.changePercent = quote.dp;
                }
            } catch (error) {
                console.error(`Error fetching quote for ${item.symbol}:`, error);
            }
        }
        this.saveToStorage();
        this.render();
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = this.watchlist.map(item => {
            const changeClass = item.change >= 0 ? 'positive' : 'negative';
            const changeSign = item.change >= 0 ? '+' : '';
            
            return `
                <div class="watchlist-item" data-symbol="${item.symbol}">
                    <div class="watchlist-symbol">
                        <span class="symbol-name">${item.symbol}</span>
                    </div>
                    <div class="watchlist-price">
                        <span class="price">$${item.price.toFixed(2)}</span>
                        <span class="change ${changeClass}">
                            ${changeSign}${item.change.toFixed(2)} (${changeSign}${item.changePercent.toFixed(2)}%)
                        </span>
                    </div>
                    <button class="remove-btn" onclick="watchlistManager.removeSymbol('${item.symbol}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        }).join('');

        // Add click handlers for symbol selection
        this.container.querySelectorAll('.watchlist-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('remove-btn') && 
                    !e.target.closest('.remove-btn')) {
                    const symbol = item.dataset.symbol;
                    if (window.app) {
                        window.app.changeSymbol(symbol);
                    }
                }
            });
        });
    }

    startAutoUpdate() {
        this.updatePrices();
        setInterval(() => this.updatePrices(), CONFIG.UPDATE_INTERVAL);
    }

    getSymbols() {
        return this.watchlist.map(item => item.symbol);
    }
}

// Export for use in app.js
window.WatchlistManager = WatchlistManager;
