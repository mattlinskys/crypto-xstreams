import { BigNumber, Contract, providers, utils } from 'ethers';
import { map, Observable } from 'rxjs';
import { StaticImplements } from '../types/utils';
import { multicallInterface, uniswapV2PairInterface } from '../constants/abis';
import { IStreamMsg, IStreamPair, IStreamRawMsg, IStreamStatic, ITokenAsset } from '../types/streams';
import { TExchangeId } from '../types/exchange-id';
import Decimal from 'decimal.js-light';
import invariant from 'tiny-invariant';

export interface IUniswapV2StreamRawData {
  blockNumber: number;
  reserves: {
    base: BigNumber;
    quote: BigNumber;
  };
  pairAddress: string;
}

export interface IUniswapV2StreamConfig {
  jsonRpcProviderUrl: string;
  multicallAddress?: string;
  factoryAddress?: string;
  initCodeHash?: string;
}

@StaticImplements<IStreamStatic<IUniswapV2StreamConfig, IUniswapV2StreamRawData>>()
class UniswapV2Stream {
  public static id: TExchangeId = 'uniswap-v2';

  static async getReserves(multicallContract: Contract, pairAddresses: string[]) {
    const { returnData } = (await multicallContract.callStatic.aggregate(
      pairAddresses.map((address) => ({
        target: address,
        callData: uniswapV2PairInterface.encodeFunctionData('getReserves'),
      }))
    )) as { blockNumber: BigNumber; returnData: string[] };

    return Array.from(returnData).map((data) =>
      uniswapV2PairInterface.decodeFunctionResult('getReserves', data)
    ) as unknown as { reserve0: BigNumber; reserve1: BigNumber }[];
  }

  static getPairAddress(tokenA: ITokenAsset, tokenB: ITokenAsset, factoryAddress: string, initCodeHash: string) {
    const [token0, token1] =
      tokenA.address.toLowerCase() < tokenB.address.toLowerCase() ? [tokenA, tokenB] : [tokenB, tokenA];
    return utils.getCreate2Address(
      factoryAddress,
      utils.solidityKeccak256(
        ['bytes'],
        [utils.solidityPack(['address', 'address'], [token0.address, token1.address])]
      ),
      initCodeHash
    );
  }

  protected get multicallAddress() {
    return this.config.multicallAddress || '0xeefba1e63905ef1d7acba5a8513c70307c1ce441';
  }

  protected get factoryAddress() {
    return this.config.factoryAddress || '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
  }

  protected get initCodeHash() {
    return this.config.initCodeHash || '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f';
  }

  constructor(protected pairs: IStreamPair[], protected config: IUniswapV2StreamConfig) {
    invariant(
      pairs.every(({ base, quote }) => base.type === 'token' && quote.type === 'token'),
      'Expected only token pairs'
    );
  }

  private getPairAddress(tokenA: ITokenAsset, tokenB: ITokenAsset) {
    return UniswapV2Stream.getPairAddress(tokenA, tokenB, this.factoryAddress, this.initCodeHash);
  }

  observe() {
    return this.observeRaw().pipe<IStreamMsg<IUniswapV2StreamRawData>[]>(
      map((rawMsgs) =>
        rawMsgs.map(({ pair, data: raw }) => {
          const { base, quote } = pair;
          const { reserves } = raw;

          let price = new Decimal(reserves.quote.toString()).div(reserves.base.toString());
          if (base.decimals !== quote.decimals) {
            price = price[base.decimals < quote.decimals ? 'div' : 'mul'](
              utils.parseUnits('1', Math.abs(base.decimals - quote.decimals)).toString()
            );
          }

          return {
            pair,
            raw,
            data: {
              averagePrice: Number(price.toString()),
              eventTime: new Date(),
            },
          };
        })
      )
    );
  }

  observeRaw() {
    return new Observable<IStreamRawMsg<IUniswapV2StreamRawData>[]>((subscriber) => {
      const provider = new providers.JsonRpcProvider(this.config.jsonRpcProviderUrl);
      let unsubscribed = false;

      const handleBlock = async (blockNumber: number) => {
        const multicallContract = new Contract(this.multicallAddress, multicallInterface, provider);
        const pairAddresses = this.pairs.map(({ base, quote }) =>
          this.getPairAddress(base as ITokenAsset, quote as ITokenAsset)
        );
        const reserves = await UniswapV2Stream.getReserves(multicallContract, pairAddresses);

        subscriber.next(
          reserves.map(({ reserve0, reserve1 }, i) => {
            const { base, quote } = this.pairs[i];
            const [baseReserve, quoteReserve] =
              (base as ITokenAsset).address.toLowerCase() < (quote as ITokenAsset).address.toLowerCase()
                ? [reserve0, reserve1]
                : [reserve1, reserve0];

            return {
              pair: this.pairs[i],
              data: {
                blockNumber,
                reserves: {
                  base: baseReserve,
                  quote: quoteReserve,
                },
                pairAddress: pairAddresses[i],
              },
            };
          })
        );

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
