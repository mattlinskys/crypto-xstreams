import UniswapV2Stream from '../src/streams/uniswap-v2';
import { USDT, DAI, WBNB, BUSD } from './__data__/assets';

describe('UniswapV2Stream', () => {
  it('should publish new reserves on block change', done => {
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
      error: err => {
        throw err;
      },
    });
  });

  it('calculates proper pair address', () => {
    const uniswapFactory = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
    const uniswapInitCodeHash =
      '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f';
    const pancakeFactory = '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73';
    const pancakeInitCodeHash =
      '0x00fb7f630766e6a796048ea87d01acd3068e8ff67d078148a3fa3f4a84f69bd5';

    expect(
      UniswapV2Stream.getPairAddress(
        USDT,
        DAI,
        uniswapFactory,
        uniswapInitCodeHash
      )
    ).toBe('0xB20bd5D04BE54f870D5C0d3cA85d82b34B836405');

    expect(
      UniswapV2Stream.getPairAddress(
        WBNB,
        BUSD,
        pancakeFactory,
        pancakeInitCodeHash
      )
    ).toBe('0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16');

    // Reserved order
    expect(
      UniswapV2Stream.getPairAddress(
        BUSD,
        WBNB,
        pancakeFactory,
        pancakeInitCodeHash
      )
    ).toBe(
      UniswapV2Stream.getPairAddress(
        WBNB,
        BUSD,
        pancakeFactory,
        pancakeInitCodeHash
      )
    );
  });
});
