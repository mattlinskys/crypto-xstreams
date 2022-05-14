import HuobiStream from '../../src/streams/huobi';
import { BTC, USDT } from '../__data__/assets';

describe('HuobiStream', () => {
  it('should throw connection error', (done) => {
    const huobiStream = new HuobiStream([], {
      wssUrl: 'wss://randomurl.random',
    });

    const subscriber = huobiStream.observe().subscribe({
      error: (err) => {
        subscriber.unsubscribe();
        expect(err.code).toBe('ENOTFOUND');
        done();
      },
    });
  });

  it('receives stream message from binance', (done) => {
    const huobiStream = new HuobiStream(
      [
        {
          symbol: 'BTCUSDT',
          base: BTC,
          quote: USDT,
        },
      ],
      {
        wssUrl: 'wss://api.huobi.pro/ws',
      }
    );

    const subscriber = huobiStream.observe().subscribe({
      next(dd) {
        // TODO:
        subscriber.unsubscribe();
        done();
      },
      error: (err) => {
        throw err;
      },
    });
  });
});
