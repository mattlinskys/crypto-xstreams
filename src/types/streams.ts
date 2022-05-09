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
  address: string;
}

export type TAsset = ICoinAsset | ITokenAsset;

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

export interface IStream<Msg, Raw> {
  observe(): Observable<Msg>;
  observeRaw(): Observable<Raw>;
}

export interface IStreamStatic<C = {}, R = {}> {
  id: TExchangeId;

  new (pairs: IStreamPair[], config: C): IStream<IStreamMsg<R>, R>;
}
