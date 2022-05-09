import { ICoinAsset, ITokenAsset } from '../../src/types/streams';

export const BTC: ICoinAsset = {
  type: 'coin',
  symbol: 'BTC',
  name: 'Bitcoin',
  decimals: 8,
};

export const USDT: ITokenAsset = {
  type: 'token',
  symbol: 'USDT',
  name: 'Tether USDT',
  decimals: 18,
  address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
};

export const DAI: ITokenAsset = {
  type: 'token',
  symbol: 'DAI',
  name: 'DAI',
  decimals: 18,
  address: '0x6b175474e89094c44da98b954eedeac495271d0f',
};

export const WBNB: ITokenAsset = {
  type: 'token',
  symbol: 'WBNB',
  name: 'WBNB',
  decimals: 18,
  address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
};

export const BUSD: ITokenAsset = {
  type: 'token',
  symbol: 'BUSD',
  name: 'BUSD',
  decimals: 18,
  address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
};
