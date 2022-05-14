import BinanceStream from '../../src/streams/binance';
import { BTC, USDT } from '../__data__/assets';

describe('BinanceStream', () => {
  it('should throw connection error', (done) => {
    const binanceStream = new BinanceStream([], {
      wssUrl: 'wss://randomurl.random',
    });

    const subscriber = binanceStream.observe().subscribe({
      error: (err) => {
        subscriber.unsubscribe();
        expect(err.code).toBe('ENOTFOUND');
        done();
      },
    });
  });

  it('receives stream message from binance', (done) => {
    const binanceStream = new BinanceStream(
      [
        {
          symbol: 'BTCUSDT',
          base: BTC,
          quote: USDT,
        },
      ],
      {
        wssUrl: 'wss://stream.binance.com:9443',
      }
    );

    const subscriber = binanceStream.observe().subscribe({
      next() {
        subscriber.unsubscribe();
        done();
      },
      error: (err) => {
        throw err;
      },
    });
  });
});
