import { Observable } from 'rxjs';
import { TExchangeId } from './exchange-id';

export interface IBaseAsset {
  type: 'coin' | 'token';
  symbol: string;
  name: string;
  decimals: number;
}

export interface ICoinAsset extends IBaseAsset {
  type: 'coin';
}

export interface ITokenAsset extends IBaseAsset {
  type: 'token';
  contractAddress: string;
  chainId: number;
}

export type TAsset = IBaseAsset;

export interface IStreamPair {
  symbol: string;
  base: TAsset;
  quote: TAsset;
}

export interface IStreamMsg<RawMsg> {
  eventTime: Date;
  symbol: string;
  averagePrice: number;
  raw: RawMsg;
}

export interface IStream<Msg> {
  observe(): Observable<Msg>;
  observeRaw(): Observable<any>;
}

export interface IStreamStatic<C = {}, R = {}> {
  id: TExchangeId;

  new (pairs: IStreamPair[], config: C): IStream<IStreamMsg<R>>;
}
