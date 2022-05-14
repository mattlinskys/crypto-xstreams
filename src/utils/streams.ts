import { BinanceStream, HuobiStream, UniswapV2Stream, PancakeSwapStream } from 'streams';
import invariant from 'tiny-invariant';
import { TExchangeId } from 'types/exchange-id';
import { IStreamStatic } from 'types/streams';

const xstreams: Record<TExchangeId, IStreamStatic<any, any>> = {
  ['binance']: BinanceStream,
  ['huobi']: HuobiStream,
  ['uniswap-v2']: UniswapV2Stream,
  ['pancake-swap']: PancakeSwapStream,
};

export const getXStreamById = (id: TExchangeId) => {
  invariant(id in xstreams, 'XStream not found');
  return xstreams[id];
};
