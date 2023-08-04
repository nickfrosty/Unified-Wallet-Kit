import React, { FC, PropsWithChildren, useMemo } from 'react'
import { WalletProvider } from '@solana/wallet-adapter-react'
import { Adapter, SupportedTransactionVersions, WalletError, WalletName } from '@solana/wallet-adapter-base'
import { SolanaMobileWalletAdapter, createDefaultAddressSelector, createDefaultAuthorizationResultCache } from '@solana-mobile/wallet-adapter-mobile'
import { Cluster } from '@solana/web3.js'

import { PreviouslyConnectedProvider } from './previouslyConnectedProvider'
import HardcodedWalletStandardAdapter, { IHardcodedWalletStandardAdapter } from './HardcodedWalletStandardAdapter'
export const MWA_NOT_FOUND_ERROR = 'MWA_NOT_FOUND_ERROR'

const noop = (error: WalletError, adapter?: Adapter) => {
  console.log({ error, adapter })
}

export interface IWalletNotification {
  publicKey: string;
  shortAddress: string;
  walletName: string;
  metadata: {
    name: string;
    url: string;
    icon: string;
    supportedTransactionVersions?: SupportedTransactionVersions;
  }
}

export interface ICometKitConfig {
  autoConnect: boolean;
  metadata: ICometKitMetadata;
  env: Cluster;
  walletPrecedence?: WalletName[];
  hardcodedWallets?: IHardcodedWalletStandardAdapter[];
  notificationCallback?: {
    onConnect: (props: IWalletNotification) => void,
    onConnecting: (props: IWalletNotification) => void,
    onDisconnect: (props: IWalletNotification) => void,
    onNotInstalled: (props: IWalletNotification) => void,
    // TODO: Support wallet account change
    // onChangeAccount: (props: IWalletNotification) => void,
  }
}

export interface ICometKitMetadata {
  name: string;
  url: string;
  description: string;
  iconUrls: string[]; // full uri, first icon will be used as main icon (png, jpg, svg)
  additionalInfo?: string;
  walletConnectProjectId?: string; // wallet connect app id, register your app on WalletConnect website
}

const WalletConnectionProvider: FC<
  PropsWithChildren & {
    wallets: Adapter[],
    config: ICometKitConfig;
  }
> = ({ wallets: passedWallets, config, children }) => {
  const wallets = useMemo(() => {
    return [
      new SolanaMobileWalletAdapter({
        addressSelector: createDefaultAddressSelector(),
        appIdentity: config.metadata,
        authorizationResultCache: createDefaultAuthorizationResultCache(),
        cluster: config.env,
        onWalletNotFound: async (
          mobileWalletAdapter: SolanaMobileWalletAdapter,
        ) => {
          throw new Error(MWA_NOT_FOUND_ERROR)
        },
      }),
      ...passedWallets,
      ...(config.hardcodedWallets || []).map(
        item => new HardcodedWalletStandardAdapter(item),
      ),
    ]
  }, [])

  return (
    <WalletProvider wallets={wallets} autoConnect={config.autoConnect} onError={noop}>
      <PreviouslyConnectedProvider>{children}</PreviouslyConnectedProvider>
    </WalletProvider>
  )
}

export default WalletConnectionProvider