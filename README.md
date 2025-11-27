# ProTrader Platform

A professional TradingView-style charting platform for stocks and options trading. Built with pure JavaScript and the Lightweight Charts library.

## Features

### Real-Time Charts
- Interactive candlestick, line, and area charts
- Multiple timeframe support (1m, 5m, 15m, 1H, 4H, 1D, 1W, 1M)
- Powered by TradingView's Lightweight Charts library
- Crosshair with OHLC data display

### Technical Indicators
- SMA (Simple Moving Average) - 20 & 50 period
- EMA (Exponential Moving Average) - 12 & 26 period
- Bollinger Bands
- VWAP (Volume Weighted Average Price)
- RSI (Relative Strength Index)
- MACD (Moving Average Convergence Divergence)

### Options Chain
- Real-time options data display
- Calls and Puts toggle
- Multiple expiration dates
- Greeks display (Delta, Gamma, Theta, Vega)
- Implied Volatility (IV)

### Watchlist
- Add/remove symbols
- Real-time price updates
- Change and percent change display
- Persistent storage (localStorage)

### Price Alerts
- Set alerts for price above/below targets
- Browser notifications
- Audio alerts
- Persistent alert storage

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charting**: TradingView Lightweight Charts
- **Data API**: Finnhub Stock API
- **Icons**: Font Awesome
- **Storage**: localStorage for persistence

## Project Structure

```
ProTrader-Platform/
|-- index.html          # Main HTML file
|-- css/
|   |-- styles.css      # Dark theme styling
|-- js/
|   |-- config.js       # API configuration
|   |-- api.js          # Stock data fetching
|   |-- indicators.js   # Technical indicators
|   |-- chart.js        # Chart management
|   |-- watchlist.js    # Watchlist management
|   |-- options.js      # Options chain viewer
|   |-- alerts.js       # Price alert system
|   |-- app.js          # Main application
|-- README.md
|-- LICENSE
```

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- A Finnhub API key (free tier available)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/seanmann00327-eng/ProTrader-Platform.git
cd ProTrader-Platform
```

2. Get a free API key from [Finnhub](https://finnhub.io/)

3. Update the API key in `js/config.js`:
```javascript
FINNHUB_API_KEY: 'your-api-key-here'
```

4. Open `index.html` in your browser or serve with a local server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve
```

5. Navigate to `http://localhost:8000`

## Usage

### Symbol Search
Enter a stock symbol in the search bar and press Enter or click Search.

### Chart Controls
- Use timeframe buttons to change the chart period
- Toggle between Candlestick, Line, and Area chart types
- Enable/disable technical indicators from the sidebar

### Watchlist
- Click the + button to add the current symbol
- Click on any symbol to switch to that chart
- Click X to remove a symbol

### Alerts
- Set price alerts using the alert form
- Choose above or below condition
- Receive browser notifications when triggered

## API Limits

Finnhub free tier includes:
- 60 API calls per minute
- Real-time US stock data
- Historical candle data

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [TradingView Lightweight Charts](https://github.com/tradingview/lightweight-charts)
- [Finnhub Stock API](https://finnhub.io/)
- [Font Awesome](https://fontawesome.com/)
