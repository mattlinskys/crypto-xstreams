import { BigNumber, Contract, providers, utils } from 'ethers';
import { map, Observable } from 'rxjs';
import { StaticImplements } from 'types/utils';
import { multicallInterface, uniswapV2PairInterface } from 'constants/abis';
import { IStreamPair, IStreamStatic, ITokenAsset } from 'types/streams';
import { TExchangeId } from 'types/exchange-id';
import { getCreate2Address } from 'ethers/lib/utils';
import invariant from 'tiny-invariant';

export interface IUniswapV2StreamRawMsg {
  blockNumber: number;
  reserve0: BigNumber;
  reserve1: BigNumber;
}

export interface IUniswapV2StreamConfig {
  jsonRpcProviderUrl: string;
  multicallAddress?: string;
  factoryAddress?: string;
  initCodeHash?: string;
}

@StaticImplements<
  IStreamStatic<IUniswapV2StreamConfig, IUniswapV2StreamRawMsg>
>()
class UniswapV2Stream {
  public static id: TExchangeId = 'uniswap-v2';

  static async getReserves(
    multicallContract: Contract,
    pairAddresses: string[]
  ) {
    const { returnData } = (await multicallContract.callStatic.aggregate(
      pairAddresses.map(address => ({
        target: address,
        callData: uniswapV2PairInterface.encodeFunctionData('getReserves'),
      }))
    )) as { blockNumber: BigNumber; returnData: string[] };

    return (Array.from(returnData).map(data =>
      uniswapV2PairInterface.decodeFunctionResult('getReserves', data)
    ) as unknown) as { reserve0: BigNumber; reserve1: BigNumber }[];
  }

  static getPairAddress(
    tokenA: ITokenAsset,
    tokenB: ITokenAsset,
    factoryAddress: string,
    initCodeHash: string
  ) {
    const [token0, token1] =
      tokenA.address.toLowerCase() < tokenB.address.toLowerCase()
        ? [tokenA, tokenB]
        : [tokenB, tokenA];
    return getCreate2Address(
      factoryAddress,
      utils.solidityKeccak256(
        ['bytes'],
        [
          utils.solidityPack(
            ['address', 'address'],
            [token0.address, token1.address]
          ),
        ]
      ),
      initCodeHash
    );
  }

  protected get multicallAddress() {
    return (
      this.config.multicallAddress ||
      '0xeefba1e63905ef1d7acba5a8513c70307c1ce441'
    );
  }

  protected get factoryAddress() {
    return (
      this.config.factoryAddress || '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'
    );
  }

  protected get initCodeHash() {
    return (
      this.config.initCodeHash ||
      '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f'
    );
  }

  constructor(
    protected pairs: IStreamPair[],
    protected config: IUniswapV2StreamConfig
  ) {
    invariant(
      pairs.every(
        ({ base, quote }) => base.type === 'token' && quote.type === 'token'
      ),
      'Expected only token pairs'
    );
  }

  private getPairAddress(tokenA: ITokenAsset, tokenB: ITokenAsset) {
    return UniswapV2Stream.getPairAddress(
      tokenA,
      tokenB,
      this.factoryAddress,
      this.initCodeHash
    );
  }

  observe() {
    return this.observeRaw().pipe(
      // TODO:
      map(raw => ({
        symbol: '',
        averagePrice: 1,
        eventTime: new Date(),
        raw,
      }))
    );
  }

  observeRaw() {
    return new Observable<IUniswapV2StreamRawMsg>(subscriber => {
      const provider = new providers.JsonRpcProvider(
        this.config.jsonRpcProviderUrl
      );
      let unsubscribed = false;

      const handleBlock = async (blockNumber: number) => {
        const multicallContract = new Contract(
          this.multicallAddress,
          multicallInterface,
          provider
        );
        const reserves = await UniswapV2Stream.getReserves(
          multicallContract,
          this.pairs.map(({ base, quote }) =>
            this.getPairAddress(base as ITokenAsset, quote as ITokenAsset)
          )
        );

        for (let i = 0; i < reserves.length; i++) {
          const { base, quote } = this.pairs[i];
          // TODO: Sorts before
          const { reserve0, reserve1 } = reserves[i];
          // const fraction = 10 ** 9;
          // const price =
          //   reserve0
          //     .mul(fraction)
          //     .div(reserve1)
          //     .toNumber() / fraction;

          console.log(base, quote, reserve0.toString(), reserve1.toString());
          subscriber.next({
            reserve0,
            reserve1,
            blockNumber,
          });
        }

        if (!unsubscribed) {
          provider.once('block', handleBlock);
        }
      };

      provider.on('error', subscriber.error);
      provider.once('block', handleBlock);

      return () => {
        unsubscribed = true;
        provider.removeAllListeners();
      };
    });
  }
}

export default UniswapV2Stream;
