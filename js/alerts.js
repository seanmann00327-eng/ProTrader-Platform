// Alert Manager - Price alerts with notifications

class AlertManager {
    constructor() {
        this.alerts = [];
        this.container = document.getElementById('alerts-list');
        this.loadFromStorage();
        this.requestNotificationPermission();
    }

    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }

    loadFromStorage() {
        const saved = localStorage.getItem('protrader_alerts');
        if (saved) {
            this.alerts = JSON.parse(saved);
        }
        this.render();
    }

    saveToStorage() {
        localStorage.setItem('protrader_alerts', JSON.stringify(this.alerts));
    }

    createAlert(symbol, condition, price, note = '') {
        const alert = {
            id: Date.now(),
            symbol: symbol.toUpperCase(),
            condition, // 'above' or 'below'
            price: parseFloat(price),
            note,
            active: true,
            triggered: false,
            createdAt: new Date().toISOString()
        };

        this.alerts.push(alert);
        this.saveToStorage();
        this.render();
        return alert;
    }

    deleteAlert(id) {
        this.alerts = this.alerts.filter(a => a.id !== id);
        this.saveToStorage();
        this.render();
    }

    toggleAlert(id) {
        const alert = this.alerts.find(a => a.id === id);
        if (alert) {
            alert.active = !alert.active;
            this.saveToStorage();
            this.render();
        }
    }

    async checkAlerts(symbol, currentPrice) {
        const symbolAlerts = this.alerts.filter(a => 
            a.symbol === symbol.toUpperCase() && a.active && !a.triggered
        );

        for (const alert of symbolAlerts) {
            const triggered = this.evaluateCondition(alert, currentPrice);
            
            if (triggered) {
                alert.triggered = true;
                this.triggerAlert(alert, currentPrice);
            }
        }

        this.saveToStorage();
        this.render();
    }

    evaluateCondition(alert, currentPrice) {
        if (alert.condition === 'above') {
            return currentPrice >= alert.price;
        } else if (alert.condition === 'below') {
            return currentPrice <= alert.price;
        }
        return false;
    }

    triggerAlert(alert, currentPrice) {
        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('ProTrader Alert', {
                body: `${alert.symbol} is now ${alert.condition} $${alert.price} (Current: $${currentPrice.toFixed(2)})`,
                icon: '/favicon.ico'
            });
        }

        // Show in-app notification
        this.showToast(`${alert.symbol} Alert: Price ${alert.condition} $${alert.price}`);

        // Play sound
        this.playAlertSound();
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'alert-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    playAlertSound() {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleaD6bAAAQB0CAQ==');
        audio.volume = 0.5;
        audio.play().catch(() => {});
    }

    render() {
        if (!this.container) return;

        if (this.alerts.length === 0) {
            this.container.innerHTML = '<div class="no-alerts">No alerts set. Create one using the form above.</div>';
            return;
        }

        this.container.innerHTML = this.alerts.map(alert => `
            <div class="alert-item ${alert.triggered ? 'triggered' : ''} ${!alert.active ? 'inactive' : ''}">
                <div class="alert-info">
                    <span class="alert-symbol">${alert.symbol}</span>
                    <span class="alert-condition">${alert.condition}</span>
                    <span class="alert-price">$${alert.price.toFixed(2)}</span>
                    ${alert.note ? `<span class="alert-note">${alert.note}</span>` : ''}
                </div>
                <div class="alert-status">
                    ${alert.triggered ? '<span class="triggered-badge">Triggered</span>' : ''}
                </div>
                <div class="alert-actions">
                    <button class="toggle-btn" onclick="alertManager.toggleAlert(${alert.id})">
                        <i class="fas fa-${alert.active ? 'bell' : 'bell-slash'}"></i>
                    </button>
                    <button class="delete-btn" onclick="alertManager.deleteAlert(${alert.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    resetTriggered(id) {
        const alert = this.alerts.find(a => a.id === id);
        if (alert) {
            alert.triggered = false;
            this.saveToStorage();
            this.render();
        }
    }

    getActiveAlerts() {
        return this.alerts.filter(a => a.active && !a.triggered);
    }
}

// Export for use in app.js
window.AlertManager = AlertManager;
