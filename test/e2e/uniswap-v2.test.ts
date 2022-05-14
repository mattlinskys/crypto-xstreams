import UniswapV2Stream from '../../src/streams/uniswap-v2';
import { USDT, DAI } from '../__data__/assets';

describe('UniswapV2Stream', () => {
  it('should publish new reserves on block change', (done) => {
    const uniswapStream = new UniswapV2Stream(
      [
        {
          symbol: 'USDTDAI',
          base: USDT,
          quote: DAI,
        },
        {
          symbol: 'DAIUSDT',
          base: DAI,
          quote: USDT,
        },
      ],
      {
        jsonRpcProviderUrl: 'https://main-light.eth.linkpool.io',
      }
    );

    const subscriber = uniswapStream.observe().subscribe({
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
