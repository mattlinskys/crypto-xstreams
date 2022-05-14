import WebSocket from 'ws';
import { map, Observable } from 'rxjs';
import { StaticImplements } from 'types/utils';
import {
  IStreamMsg,
  IStreamPair,
  IStreamRawMsg,
  IStreamStatic,
} from 'types/streams';
import { TExchangeId } from 'types/exchange-id';

export interface IBinanceStreamRawData {
  stream: string;
  data: {
    e: 'kline'; // Event type
    E: number; // Event time
    s: string; // Symbol
    k: {
      t: number; // Kline start time
      T: number; // Kline close time
      s: string; // Symbol
      i: string; // Interval
      f: number; // First trade ID
      L: number; // Last trade ID
      o: string; // Open price
      c: string; // Close price
      h: string; // High price
      l: string; // Low price
      v: string; // Base asset volume
      n: number; // Number of trades
      x: boolean; // Is this kline closed?
      q: string; // Quote asset volume
      V: string; // Taker buy base asset volume
      Q: string; // Taker buy quote asset volume
    };
  };
}

export interface IBinanceStreamConfig {
  wssUrl: string;
  klineInterval?:
    | '1m'
    | '3m'
    | '5m'
    | '15m'
    | '30m'
    | '1h'
    | '2h'
    | '4h'
    | '6h'
    | '8h'
    | '12h'
    | '1d'
    | '3d'
    | '1w'
    | '1M';
}

@StaticImplements<IStreamStatic<IBinanceStreamConfig, IBinanceStreamRawData>>()
class BinanceStream {
  public static id: TExchangeId = 'binance';

  private get wssUrl() {
    return `${this.config.wssUrl}/stream?streams=${this.pairs
      .map(({ base, quote }) => `${base.symbol}${quote.symbol}`.toLowerCase())
      .map(stream => `${stream}@kline_${this.config.klineInterval || '1m'}`)
      .join('/')}`;
  }

  constructor(
    private pairs: IStreamPair[],
    private config: IBinanceStreamConfig
  ) {}

  observe() {
    return this.observeRaw().pipe<IStreamMsg<IBinanceStreamRawData>[]>(
      map(rawMsgs =>
        rawMsgs.map(({ pair, data: raw }) => {
          const {
            k: { h: highPrice, l: lowPrice },
            E: eventTime,
          } = raw.data;

          return {
            pair,
            raw,
            data: {
              averagePrice: (+highPrice + +lowPrice) / 2,
              eventTime: new Date(eventTime),
            },
          };
        })
      )
    );
  }

  observeRaw() {
    return new Observable<IStreamRawMsg<IBinanceStreamRawData>[]>(
      subscriber => {
        let ws: WebSocket;

        const connect = () => {
          ws = new WebSocket(this.wssUrl);

          ws.on('error', err => subscriber.error(err));
          ws.on('close', connect);

          ws.on('message', rawData => {
            const data = rawData.toString();
            if (data === 'ping') {
              ws.send('pong');
            } else {
              const msg = JSON.parse(data) as IBinanceStreamRawData;
              const pair = this.pairs.find(
                ({ symbol }) => symbol === msg.data.s
              );

              if (pair) {
                subscriber.next([
                  {
                    pair,
                    data: msg,
                  },
                ]);
              }
            }
          });
        };

        connect();

        return () => {
          ws.removeAllListeners();
          ws.close();
        };
      }
    );
  }
}

export default BinanceStream;
