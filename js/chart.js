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
        this.currentData = data;
        this.candleSeries.setData(data);
        this.chart.timeScale().fitContent();
    }

    setupCrosshairHandler() {
        this.chart.subscribeCrosshairMove((param) => {
            if (!param.time || !param.seriesData.size) return;
            const data = param.seriesData.get(this.candleSeries);
            if (data) {
                document.getElementById('ohlcInfo').textContent = 
                    `O: ${data.open?.toFixed(2) || '--'} H: ${data.high?.toFixed(2) || '--'} L: ${data.low?.toFixed(2) || '--'} C: ${data.close?.toFixed(2) || '--'}`;
            }
        });
    }

    addSMA(period, color) {
        const smaData = TechnicalIndicators.SMA(this.currentData, period);
        const series = this.chart.addLineSeries({ color, lineWidth: 1 });
        series.setData(smaData);
        this.indicatorSeries[`sma_${period}`] = series;
    }

    addEMA(period, color) {
        const emaData = TechnicalIndicators.EMA(this.currentData, period);
        const series = this.chart.addLineSeries({ color, lineWidth: 1 });
        series.setData(emaData);
        this.indicatorSeries[`ema_${period}`] = series;
    }

    addBollingerBands(period, color) {
        const bb = TechnicalIndicators.BollingerBands(this.currentData, period);
        const upper = this.chart.addLineSeries({ color, lineWidth: 1 });
        const lower = this.chart.addLineSeries({ color, lineWidth: 1 });
        upper.setData(bb.upper);
        lower.setData(bb.lower);
        this.indicatorSeries.bb_upper = upper;
        this.indicatorSeries.bb_lower = lower;
    }

    addVWAP(color) {
        const vwapData = TechnicalIndicators.VWAP(this.currentData);
        const series = this.chart.addLineSeries({ color, lineWidth: 2 });
        series.setData(vwapData);
        this.indicatorSeries.vwap = series;
    }

    clearIndicators() {
        Object.values(this.indicatorSeries).forEach(series => {
            this.chart.removeSeries(series);
        });
        this.indicatorSeries = {};
    }

    setChartType(type) {
        this.chart.removeSeries(this.candleSeries);
        const colors = CONFIG.CHART_COLORS;
        
        if (type === 'candlestick') {
            this.candleSeries = this.chart.addCandlestickSeries({
                upColor: colors.upColor, downColor: colors.downColor,
                wickUpColor: colors.wickUpColor, wickDownColor: colors.wickDownColor,
            });
        } else if (type === 'line') {
            this.candleSeries = this.chart.addLineSeries({ color: colors.upColor });
        } else if (type === 'area') {
            this.candleSeries = this.chart.addAreaSeries({
                topColor: 'rgba(38, 166, 154, 0.4)',
                bottomColor: 'rgba(38, 166, 154, 0.0)',
                lineColor: colors.upColor,
            });
        }
        
        if (type === 'candlestick') {
            this.candleSeries.setData(this.currentData);
        } else {
            this.candleSeries.setData(this.currentData.map(d => ({ time: d.time, value: d.close })));
        }
    }
}

window.ChartManager = ChartManager;
