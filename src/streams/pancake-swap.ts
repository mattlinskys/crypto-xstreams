import { StaticImplements } from 'types/utils';
import { IStreamPair, IStreamStatic } from 'types/streams';
import { TExchangeId } from 'types/exchange-id';
import UniswapV2Stream, { IUniswapV2StreamConfig, IUniswapV2StreamRawData } from 'streams/uniswap-v2';

interface PancakeSwapConfig extends IUniswapV2StreamConfig {}

@StaticImplements<IStreamStatic<PancakeSwapConfig, IUniswapV2StreamRawData>>()
class PancakeSwapStream extends UniswapV2Stream {
  public static id: TExchangeId = 'pancake-swap';

  protected get multicallAddress() {
    return this.config.multicallAddress || '0x41263cba59eb80dc200f3e2544eda4ed6a90e76c';
  }

  protected get factoryAddress() {
    return this.config.factoryAddress || '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73';
  }

  protected get initCodeHash() {
    return this.config.initCodeHash || '0x00fb7f630766e6a796048ea87d01acd3068e8ff67d078148a3fa3f4a84f69bd5';
  }

  constructor(protected pairs: IStreamPair[], protected config: PancakeSwapConfig) {
    super(pairs, config);
  }
}

export default PancakeSwapStream;
