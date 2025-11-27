// ProTrader Platform - Technical Indicators
class TechnicalIndicators {
    // Simple Moving Average
    static SMA(data, period) {
        const result = [];
        for (let i = period - 1; i < data.length; i++) {
            let sum = 0;
            for (let j = 0; j < period; j++) {
                sum += data[i - j].close;
            }
            result.push({ time: data[i].time, value: sum / period });
        }
        return result;
    }

    // Exponential Moving Average
    static EMA(data, period) {
        const result = [];
        const multiplier = 2 / (period + 1);
        let ema = data.slice(0, period).reduce((sum, d) => sum + d.close, 0) / period;
        
        result.push({ time: data[period - 1].time, value: ema });
        
        for (let i = period; i < data.length; i++) {
            ema = (data[i].close - ema) * multiplier + ema;
            result.push({ time: data[i].time, value: ema });
        }
        return result;
    }

    // Bollinger Bands
    static BollingerBands(data, period = 20, stdDev = 2) {
        const sma = this.SMA(data, period);
        const upper = [], lower = [], middle = [];
        
        for (let i = period - 1; i < data.length; i++) {
            const slice = data.slice(i - period + 1, i + 1);
            const mean = sma[i - period + 1].value;
            const variance = slice.reduce((sum, d) => sum + Math.pow(d.close - mean, 2), 0) / period;
            const std = Math.sqrt(variance);
            
            middle.push({ time: data[i].time, value: mean });
            upper.push({ time: data[i].time, value: mean + stdDev * std });
            lower.push({ time: data[i].time, value: mean - stdDev * std });
        }
        return { upper, middle, lower };
    }

    // RSI
    static RSI(data, period = 14) {
        const result = [];
        const gains = [], losses = [];
        
        for (let i = 1; i < data.length; i++) {
            const change = data[i].close - data[i - 1].close;
            gains.push(change > 0 ? change : 0);
            losses.push(change < 0 ? -change : 0);
        }
        
        let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
        let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
        
        for (let i = period; i < gains.length; i++) {
            avgGain = (avgGain * (period - 1) + gains[i]) / period;
            avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
            const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
            const rsi = 100 - (100 / (1 + rs));
            result.push({ time: data[i + 1].time, value: rsi });
        }
        return result;
    }

    // MACD
    static MACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
        const fastEMA = this.EMA(data, fastPeriod);
        const slowEMA = this.EMA(data, slowPeriod);
        const macdLine = [], signalLine = [], histogram = [];
        
        const offset = slowPeriod - fastPeriod;
        for (let i = 0; i < slowEMA.length; i++) {
            const macd = fastEMA[i + offset].value - slowEMA[i].value;
            macdLine.push({ time: slowEMA[i].time, value: macd });
        }
        
        const signal = this.EMAFromValues(macdLine, signalPeriod);
        
        for (let i = 0; i < signal.length; i++) {
            const idx = signalPeriod - 1 + i;
            signalLine.push({ time: macdLine[idx].time, value: signal[i].value });
            histogram.push({ 
                time: macdLine[idx].time, 
                value: macdLine[idx].value - signal[i].value,
                color: macdLine[idx].value - signal[i].value >= 0 ? '#26a69a' : '#ef5350'
            });
        }
        return { macdLine: macdLine.slice(signalPeriod - 1), signalLine, histogram };
    }

    static EMAFromValues(data, period) {
        const result = [];
        const multiplier = 2 / (period + 1);
        let ema = data.slice(0, period).reduce((sum, d) => sum + d.value, 0) / period;
        result.push({ time: data[period - 1].time, value: ema });
        
        for (let i = period; i < data.length; i++) {
            ema = (data[i].value - ema) * multiplier + ema;
            result.push({ time: data[i].time, value: ema });
        }
        return result;
    }

    // VWAP
    static VWAP(data) {
        const result = [];
        let cumVolume = 0, cumVwap = 0;
        
        for (const candle of data) {
            const typical = (candle.high + candle.low + candle.close) / 3;
            cumVolume += candle.volume;
            cumVwap += typical * candle.volume;
            result.push({ time: candle.time, value: cumVwap / cumVolume });
        }
        return result;
    }
}

window.TechnicalIndicators = TechnicalIndicators;
