import WebSocket from 'ws';
import { map, Observable } from 'rxjs';
import { StaticImplements } from '../types/utils';
import { IStreamMsg, IStreamPair, IStreamRawMsg, IStreamStatic } from '../types/streams';
import { TExchangeId } from '../types/exchange-id';
import util from 'util';
import zlib from 'zlib';

const gunzip = util.promisify(zlib.gunzip);

interface IHuobiPingMsg {
  ping: number;
}

interface IHuobiErrorMsg {
  status: 'error';
  ts: number;
  'err-code': string;
  'err-msg': string;
}

export class HuobiStreamError extends Error {
  readonly code: string;
  readonly ts: number;

  constructor(msg: IHuobiErrorMsg) {
    super(msg['err-msg']);

    this.code = msg['err-code'];
    this.ts = msg.ts;
  }
}

export interface IHuobiStreamRawData {
  ch: string;
  ts: number;
  tick: {
    id: number;
    open: number;
    close: number;
    low: number;
    high: number;
    amount: number;
    vol: number;
    count: number;
  };
}

export interface IHuobiStreamConfig {
  wssUrl: string;
}

@StaticImplements<IStreamStatic<IHuobiStreamConfig, IHuobiStreamRawData>>()
class HuobiStream {
  public static id: TExchangeId = 'huobi';

  constructor(private pairs: IStreamPair[], private config: IHuobiStreamConfig) {}

  observe() {
    return this.observeRaw().pipe<IStreamMsg<IHuobiStreamRawData>[]>(
      map((rawMsgs) =>
        rawMsgs.map(({ pair, data: raw }) => {
          const {
            ts: eventTime,
            tick: { high, low },
          } = raw;

          return {
            pair,
            raw,
            data: {
              averagePrice: (high + low) / 2,
              eventTime: new Date(eventTime),
            },
          };
        })
      )
    );
  }

  observeRaw() {
    return new Observable<IStreamRawMsg<IHuobiStreamRawData>[]>((subscriber) => {
      let ws: WebSocket;

      const connect = () => {
        ws = new WebSocket(this.config.wssUrl);

        ws.on('error', (err) => subscriber.error(err));
        ws.on('close', connect);
        ws.on('open', () => {
          for (const { symbol, base, quote } of this.pairs) {
            ws.send(
              JSON.stringify({
                id: symbol,
                sub: `market.${`${base.symbol}${quote.symbol}`.toLowerCase()}.kline.1min`,
              })
            );
          }
        });

        ws.on('message', async (rawData) => {
          const msg = JSON.parse((await gunzip(rawData as Buffer)).toString());

          if ((msg as IHuobiPingMsg).ping) {
            ws.send(JSON.stringify({ pong: (msg as IHuobiPingMsg).ping }));
          } else if ((msg as IHuobiErrorMsg).status === 'error') {
            subscriber.error(new HuobiStreamError(msg));
          } else if ((msg as IHuobiStreamRawData).ch) {
            const pairSymbol = (msg as IHuobiStreamRawData).ch.split('.')[1];
            const pair = this.pairs.find(({ symbol }) => symbol.toLowerCase() === pairSymbol);

            if (pair) {
              subscriber.next([
                {
                  pair,
                  data: msg as IHuobiStreamRawData,
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
    });
  }
}

export default HuobiStream;
