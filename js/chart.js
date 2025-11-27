// ProTrader Platform - Chart Module
class ChartManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.chart = null;
        this.candleSeries = null;
        this.volumeSeries = null;
        this.indicatorSeries = {};
        this.currentData = [];
        this.init();
    }

    init() {
        const colors = CONFIG.CHART_COLORS;
        this.chart = LightweightCharts.createChart(this.container, {
            width: this.container.clientWidth,
            height: this.container.clientHeight,
            layout: {
                background: { color: colors.background },
                textColor: colors.text,
            },
            grid: {
                vertLines: { color: colors.grid },
                horzLines: { color: colors.grid },
            },
            crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
            rightPriceScale: { borderColor: colors.grid },
            timeScale: { borderColor: colors.grid, timeVisible: true },
        });

        this.candleSeries = this.chart.addCandlestickSeries({
            upColor: colors.upColor,
            downColor: colors.downColor,
            wickUpColor: colors.wickUpColor,
            wickDownColor: colors.wickDownColor,
            borderVisible: false,
        });

        window.addEventListener('resize', () => this.resize());
        this.setupCrosshairHandler();
    }

    resize() {
        this.chart.applyOptions({
            width: this.container.clientWidth,
            height: this.container.clientHeight,
        });
    }

    setData(data) {
        if (!data || data.length === 0) return;
        
        this.currentData = data;
        
        // Format data for lightweight charts
        const formattedData = data.map(candle => ({
            time: candle.time,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close
        }));
        
        this.candleSeries.setData(formattedData);
        this.chart.timeScale().fitContent();
    }

    setChartType(type) {
        // Remove existing series
        if (this.candleSeries) {
            this.chart.removeSeries(this.candleSeries);
        }
        
        const colors = CONFIG.CHART_COLORS;
        
        switch(type) {
            case 'line':
                this.candleSeries = this.chart.addLineSeries({
                    color: colors.upColor,
                    lineWidth: 2,
                });
                break;
            case 'area':
                this.candleSeries = this.chart.addAreaSeries({
                    topColor: 'rgba(38, 166, 154, 0.56)',
                    bottomColor: 'rgba(38, 166, 154, 0.04)',
                    lineColor: colors.upColor,
                    lineWidth: 2,
                });
                break;
            default: // candlestick
                this.candleSeries = this.chart.addCandlestickSeries({
                    upColor: colors.upColor,
                    downColor: colors.downColor,
                    wickUpColor: colors.wickUpColor,
                    wickDownColor: colors.wickDownColor,
                    borderVisible: false,
                });
        }
        
        // Re-apply data if available
        if (this.currentData && this.currentData.length > 0) {
            this.setData(this.currentData);
        }
    }

    addIndicatorSeries(data, color) {
        if (!data || data.length === 0) return null;
        
        const series = this.chart.addLineSeries({
            color: color,
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
        });
        
        series.setData(data);
        const id = 'indicator_' + Date.now();
        this.indicatorSeries[id] = series;
        return id;
    }

    addBollingerBands(bbData) {
        if (!bbData) return;
        
        const colors = CONFIG.INDICATOR_COLORS;
        
        // Upper band
        if (bbData.upper) {
            this.addIndicatorSeries(bbData.upper, colors.bb_upper);
        }
        // Middle band (SMA)
        if (bbData.middle) {
            this.addIndicatorSeries(bbData.middle, colors.bb_middle);
        }
        // Lower band
        if (bbData.lower) {
            this.addIndicatorSeries(bbData.lower, colors.bb_lower);
        }
    }

    clearIndicators() {
        Object.keys(this.indicatorSeries).forEach(id => {
            try {
                this.chart.removeSeries(this.indicatorSeries[id]);
            } catch (e) {
                console.log('Error removing indicator:', e);
            }
        });
        this.indicatorSeries = {};
    }

    setupCrosshairHandler() {
        this.chart.subscribeCrosshairMove((param) => {
            if (!param.time || !param.seriesData) return;
            
            const data = param.seriesData.get(this.candleSeries);
            if (data) {
                const ohlcInfo = document.getElementById('ohlcInfo');
                if (ohlcInfo) {
                    ohlcInfo.textContent = `O: ${data.open?.toFixed(2) || '-'} H: ${data.high?.toFixed(2) || '-'} L: ${data.low?.toFixed(2) || '-'} C: ${data.close?.toFixed(2) || '-'}`;
                }
            }
        });
    }
}

// Export for global access
window.ChartManager = ChartManager;
