import { BinanceStream } from '../src';
import { ICoinAsset, ITokenAsset } from '../src/types/stream';

const BTC: ICoinAsset = {
  type: 'coin',
  symbol: 'BTC',
  name: 'Bitcoin',
  decimals: 8,
};

const USDT: ITokenAsset = {
  type: 'token',
  symbol: 'USDT',
  name: 'Venus USDT',
  decimals: 18,
  contractAddress: '0x55d398326f99059fF775485246999027B3197955',
  chainId: 56,
};

describe('BinanceStream', () => {
  it('should throw connection error', done => {
    const binanceStream = new BinanceStream([], {
      wssUrl: 'wss://randomurl.random',
    });

    const subscriber = binanceStream.observe().subscribe({
      error: err => {
        subscriber.unsubscribe();
        expect(err.code).toBe('ENOTFOUND');
        done();
      },
    });
  });

  it('receives stream message from binance', done => {
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
      next(s) {
        subscriber.unsubscribe();
        expect(1 + 1).toEqual(2);
        console.log(s);
        done();
      },
    });
  });
});
