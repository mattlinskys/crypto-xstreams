import PancakeSwapStream from '../../src/streams/pancake-swap';
import { WBNB, BUSD } from '../__data__/assets';

describe('PancakeSwapStream', () => {
  it('should publish new reserves on block change', (done) => {
    const pancakeStream = new PancakeSwapStream(
      [
        {
          symbol: 'WBNBBUSD',
          base: WBNB,
          quote: BUSD,
        },
      ],
      {
        jsonRpcProviderUrl: 'https://bsc-dataseed.binance.org/',
      }
    );

    const subscriber = pancakeStream.observe().subscribe({
      next: () => {
        subscriber.unsubscribe();
        done();
      },
      error: (err) => {
        throw err;
      },
    });
  });
});
