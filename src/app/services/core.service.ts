import { Injectable } from '@angular/core';
import { Observable, interval, map } from 'rxjs';

export interface PriceData {
  id: string;
  name: string;
  symbol: string;
  price: number;
  image: string; // Agregado para los iconos
}

@Injectable({
  providedIn: 'root'
})
export class CoreService {
  private assets = [
    { id: '1', name: 'Bitcoin', symbol: 'BTC', basePrice: 45000, image: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' },
    { id: '2', name: 'Ethereum', symbol: 'ETH', basePrice: 3000, image: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
    { id: '3', name: 'Solana', symbol: 'SOL', basePrice: 100, image: 'https://cryptologos.cc/logos/solana-sol-logo.png' },
    { id: '4', name: 'Cardano', symbol: 'ADA', basePrice: 0.5, image: 'https://cryptologos.cc/logos/cardano-ada-logo.png' },
    { id: '5', name: 'Polkadot', symbol: 'DOT', basePrice: 7, image: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.png' }
  ];

  getPriceFeed(): Observable<PriceData[]> {
    return interval(200).pipe(
      map(() => {
        return this.assets.map(asset => ({
          id: asset.id,
          name: asset.name,
          symbol: asset.symbol,
          image: asset.image,
          price: asset.basePrice * (1 + (Math.random() - 0.5) * 0.02)
        }));
      })
    );
  }
}
