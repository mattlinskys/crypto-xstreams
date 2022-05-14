import { matchers } from 'jest-json-schema';
import BinanceStream from '../../src/streams/binance';
import { BTC, USDT } from '../__data__/assets';

expect.extend(matchers);

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

    const subscriber = binanceStream.observeRaw().subscribe({
      next([{ pair, data }]) {
        expect(pair.symbol).toBe('BTCUSDT');

        expect(data).toMatchSchema({
          properties: {
            stream: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                e: { type: 'string' },
                E: { type: 'number' },
                s: { type: 'string' },
                k: {
                  type: 'object',
                  properties: {
                    t: { type: 'number' },
                    T: { type: 'number' },
                    s: { type: 'string' },
                    i: { type: 'string' },
                    f: { type: 'number' },
                    L: { type: 'number' },
                    o: { type: 'string' },
                    c: { type: 'string' },
                    h: { type: 'string' },
                    l: { type: 'string' },
                    v: { type: 'string' },
                    n: { type: 'number' },
                    x: { type: 'boolean' },
                    q: { type: 'string' },
                    V: { type: 'string' },
                    Q: { type: 'string' },
                  },
                  required: ['t', 'T', 's', 'i', 'f', 'L', 'o', 'c', 'h', 'l', 'v', 'n', 'x', 'q', 'V', 'Q'],
                },
              },
              required: ['e', 'E', 's', 'k'],
            },
          },
          required: ['stream', 'data'],
        });

        subscriber.unsubscribe();
        done();
      },
      error: (err) => {
        throw err;
      },
    });
  });
});
