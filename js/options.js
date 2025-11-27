// Options Chain Manager - Display and manage options data

class OptionsManager {
    constructor() {
        this.currentSymbol = '';
        this.optionType = 'calls';
        this.expirationDates = [];
        this.selectedExpiration = '';
        this.optionsData = null;
        this.container = document.getElementById('options-chain');
    }

    async loadOptionsChain(symbol) {
        this.currentSymbol = symbol.toUpperCase();
        
        try {
            // Get current stock price first
            const quote = await StockAPI.getQuote(this.currentSymbol);
            const currentPrice = quote ? quote.c : 0;
            
            // Generate demo options data (real API would require premium subscription)
            this.optionsData = this.generateDemoOptions(currentPrice);
            this.expirationDates = this.optionsData.expirations;
            this.selectedExpiration = this.expirationDates[0];
            
            this.render();
        } catch (error) {
            console.error('Error loading options chain:', error);
            this.showError('Unable to load options data');
        }
    }

    generateDemoOptions(currentPrice) {
        const expirations = this.generateExpirationDates();
        const strikes = this.generateStrikes(currentPrice);
        const chains = {};

        expirations.forEach(exp => {
            chains[exp] = {
                calls: strikes.map(strike => this.generateOption(strike, currentPrice, 'call', exp)),
                puts: strikes.map(strike => this.generateOption(strike, currentPrice, 'put', exp))
            };
        });

        return { expirations, chains };
    }

    generateExpirationDates() {
        const dates = [];
        const today = new Date();
        
        // Weekly expirations for next 4 weeks
        for (let i = 1; i <= 4; i++) {
            const friday = new Date(today);
            friday.setDate(today.getDate() + (5 - today.getDay() + 7 * i) % 7 + 7 * (i - 1));
            dates.push(friday.toISOString().split('T')[0]);
        }
        
        // Monthly expirations
        for (let i = 1; i <= 3; i++) {
            const monthly = new Date(today.getFullYear(), today.getMonth() + i, 1);
            // Third Friday
            monthly.setDate(15 + (5 - monthly.getDay() + 7) % 7);
            dates.push(monthly.toISOString().split('T')[0]);
        }
        
        return [...new Set(dates)].sort();
    }

    generateStrikes(currentPrice) {
        const strikes = [];
        const base = Math.round(currentPrice / 5) * 5;
        
        for (let i = -10; i <= 10; i++) {
            strikes.push(base + i * 5);
        }
        
        return strikes.filter(s => s > 0);
    }

    generateOption(strike, currentPrice, type, expiration) {
        const daysToExp = Math.max(1, Math.ceil((new Date(expiration) - new Date()) / (1000 * 60 * 60 * 24)));
        const moneyness = (currentPrice - strike) / currentPrice;
        const isITM = type === 'call' ? strike < currentPrice : strike > currentPrice;
        
        // Simplified Black-Scholes-like pricing
        const baseIV = 0.25 + Math.random() * 0.15;
        const iv = baseIV + Math.abs(moneyness) * 0.1;
        
        const timeValue = currentPrice * iv * Math.sqrt(daysToExp / 365) * 0.4;
        const intrinsicValue = isITM ? Math.abs(currentPrice - strike) : 0;
        const premium = Math.max(0.01, intrinsicValue + timeValue);
        
        const bid = Math.max(0.01, premium - 0.05 - Math.random() * 0.1);
        const ask = premium + 0.05 + Math.random() * 0.1;
        
        return {
            strike,
            bid: bid.toFixed(2),
            ask: ask.toFixed(2),
            last: ((bid + ask) / 2).toFixed(2),
            volume: Math.floor(Math.random() * 5000),
            openInterest: Math.floor(Math.random() * 10000),
            iv: (iv * 100).toFixed(1),
            delta: type === 'call' 
                ? (0.5 + moneyness * 2).toFixed(2)
                : (-0.5 + moneyness * 2).toFixed(2),
            gamma: (0.01 + Math.random() * 0.02).toFixed(3),
            theta: (-premium / daysToExp * 0.5).toFixed(3),
            vega: (currentPrice * Math.sqrt(daysToExp / 365) * 0.01).toFixed(3),
            itm: isITM
        };
    }

    setOptionType(type) {
        this.optionType = type;
        this.render();
    }

    setExpiration(expiration) {
        this.selectedExpiration = expiration;
        this.render();
    }

    render() {
        if (!this.container || !this.optionsData) return;

        const chain = this.optionsData.chains[this.selectedExpiration];
        const options = chain[this.optionType];

        this.container.innerHTML = `
            <div class="options-header">
                <div class="expiration-selector">
                    <label>Expiration:</label>
                    <select id="expiration-select">
                        ${this.expirationDates.map(date => 
                            `<option value="${date}" ${date === this.selectedExpiration ? 'selected' : ''}>${date}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="type-toggle">
                    <button class="${this.optionType === 'calls' ? 'active' : ''}" onclick="optionsManager.setOptionType('calls')">Calls</button>
                    <button class="${this.optionType === 'puts' ? 'active' : ''}" onclick="optionsManager.setOptionType('puts')">Puts</button>
                </div>
            </div>
            <table class="options-table">
                <thead>
                    <tr>
                        <th>Strike</th>
                        <th>Bid</th>
                        <th>Ask</th>
                        <th>Last</th>
                        <th>Vol</th>
                        <th>OI</th>
                        <th>IV</th>
                        <th>Delta</th>
                    </tr>
                </thead>
                <tbody>
                    ${options.map(opt => `
                        <tr class="${opt.itm ? 'itm' : 'otm'}">
                            <td class="strike">$${opt.strike}</td>
                            <td>$${opt.bid}</td>
                            <td>$${opt.ask}</td>
                            <td>$${opt.last}</td>
                            <td>${opt.volume.toLocaleString()}</td>
                            <td>${opt.openInterest.toLocaleString()}</td>
                            <td>${opt.iv}%</td>
                            <td>${opt.delta}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        // Add expiration change listener
        document.getElementById('expiration-select')?.addEventListener('change', (e) => {
            this.setExpiration(e.target.value);
        });
    }

    showError(message) {
        if (this.container) {
            this.container.innerHTML = `<div class="options-error">${message}</div>`;
        }
    }
}

// Export for use in app.js
window.OptionsManager = OptionsManager;
