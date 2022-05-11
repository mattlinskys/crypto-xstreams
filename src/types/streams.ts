import { Observable } from 'rxjs';
import { TExchangeId } from './exchange-id';

export interface IBaseAsset {
  symbol: string;
  name: string;
  decimals: number;
}

export interface IFlatAsset extends IBaseAsset {
  type: 'flat';
}

export interface ICoinAsset extends IBaseAsset {
  type: 'coin';
}

export interface ITokenAsset extends IBaseAsset {
  type: 'token';
  address: string;
}

export type TAsset = IFlatAsset | ICoinAsset | ITokenAsset;

export interface IStreamPair {
  symbol: string;
  base: TAsset;
  quote: TAsset;
}

export interface IStreamRawMsg<IRawData> {
  pair: IStreamPair;
  data: IRawData;
}

export interface IStreamMsg<IRawData> {
  pair: IStreamPair;
  data: {
    eventTime: Date;
    averagePrice: number;
  };
  raw: IRawData;
}

export interface IStream<IRawData> {
  observe(): Observable<IStreamMsg<IRawData>[]>;
  observeRaw(): Observable<IStreamRawMsg<IRawData>[]>;
}

export interface IStreamStatic<C = {}, R = {}> {
  id: TExchangeId;

  new (pairs: IStreamPair[], config: C): IStream<R>;
}
