import '../styles/globals.css'
import styles from '../styles/Home.module.css'
import React,{ useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ethers } from 'ethers'
import Web3Modal from 'web3modal'
import WalletConnectProvider from '@walletconnect/web3-provider'
import CoinbaseWalletSDK from '@coinbase/wallet-sdk';
import { ProviderContext, AccountContext, AddressContext, NetworkContext} from '../context.js'

const INFURA_ID = process.env.NEXT_PUBLIC_INFURA_ID;


function MyApp({ Component, pageProps }) {
    const [provider, setProvider] = useState(null);
    const [account, setAccount] = useState(null);
    const [address, setAddress] = useState(null);
    const [network, setNetwork] = useState(null);
    const [networkModalOpen, setNetworkModalOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [ethBalance, setEthBalance] = useState(0);
    const [width, setWidth] = useState(0);
    const toggleError = () => setNetworkModalOpen(!networkModalOpen);


    async function getWeb3Modal() {
        const web3modal = new Web3Modal({
            network: 'rinkeby',
            cacheProvider: false,
            providerOptions: {
                walletconnect: {
                    package: WalletConnectProvider,
                    options: { 
                        infuraId: INFURA_ID
                    },
                },
                coinbasewallet: {
                    package: CoinbaseWalletSDK, // Required
                    options: {
                        appName: "CPTLO", // Required
                        infuraId:  INFURA_ID,
                        chainId: 4, 
                        darkMode: false
                    }
                }
            },
        })
        return web3modal
    }

    const fetchNetwork = useCallback(async () => {
        try {
            if (provider) { 
                const _provider = new ethers.providers.Web3Provider(window.ethereum, "any");
                _provider.on("network", (newNetwork, oldNetwork) => {
                    // When a Provider makes its initial connection, it emits a "network"
                    // event with a null oldNetwork along with the newNetwork. So, if the
                    // oldNetwork exists, it represents a changing network
                    if (oldNetwork) {
                        window.location.reload();
                    }
                },);
            }
        } catch (error) {
            console.error(error)
        }
    }, [provider])

    const switchNetwork = useCallback(async () => {
        ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{
                chainId: "0x4"
            }]
        }).then( () => {
            window.location.reload();
        }).catch(error => {
                console.error(error);
        });
    }, [])


    const connect = useCallback(async () => {
        try {
            const web3Modal = await getWeb3Modal()
            const connection = await web3Modal.connect()
            const provider = new ethers.providers.Web3Provider(connection)
            const network = await provider.getNetwork()
            const _network = network.chainId.toString()
            setProvider(provider)
            setNetwork(_network)
            const accounts = await provider.listAccounts()
            setAccount(accounts[0])
            const name = await provider.lookupAddress(accounts[0])
            if (name) {
                setAddress(name);
            } else {
                setAddress(accounts[0].substring(0, 6) + "..." + accounts[0].substring(36)); 
            }
            setNetwork(_network)
            if(provider && network != 4) {
                setNetworkModalOpen(true)
            }
        }   catch (err) {
            console.error(err);
            setNetwork(null);
        }
    }, []);

    async function logout(){
        setAccount(null);
        setTimeout(() => {
            window.location.reload();
        }, 1);
    }

    useEffect(() => {
        fetchNetwork();
    }, [fetchNetwork])


    return (
        <div className={styles.container}>
            {network != 4 && provider && networkModalOpen && (
                <div className={styles.Backdrop}>
                    <div className={styles.TxSuccessBody}>
                        <p className={styles.errorText}>Please switch your wallet network to <strong>Rinkeby</strong> to use the app. If you still encounter problems, you may want to switch to a different wallet.</p>
                        <button className={styles.errorButton} onClick={switchNetwork}>Switch Network</button>
                        <div className={styles.closeButtonDiv}>
                        </div>
                    </div>
                </div>
            )}
            <header className={styles.Header}>
                <div className={styles.HeaderLeft}>
                    <Image src="/camlogo.png" alt="CPTLO" width={100} height={100} className={styles.Logo} />
                </div>
                {!account && <button className={styles.ConnectButton} onClick={connect}>Connect</button>}
                {account && <button className={styles.ConnectButton} onClick={logout}>{address}</button>}

            </header>
            <ProviderContext.Provider value={provider}>
                <AccountContext.Provider value={account}>
                    <AddressContext.Provider value={address}>
                        <NetworkContext.Provider value={network}>
                            <Component {...pageProps} />
                        </NetworkContext.Provider>
                    </AddressContext.Provider>
                </AccountContext.Provider>
            </ProviderContext.Provider>
            
        </div>
    
    )
}

export default MyApp
