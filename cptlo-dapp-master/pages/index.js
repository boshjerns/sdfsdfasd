import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import React,{ useState, useEffect, useRef, useCallback, useContext } from 'react'
import Link from 'next/link'
import { ethers } from 'ethers'
import { ProviderContext, AccountContext, AddressContext, NetworkContext} from '../context.js'
import {CPTLOContractAddrs} from '../config.js'
import CPTLOABI from '../utils/CameraPersonTheLostOnes.json'
import MerkleTree from 'merkletreejs'
import keccak256 from 'keccak256'



export default function Home() {
    const provider = useContext(ProviderContext);
    const account = useContext(AccountContext);
    const address = useContext(AddressContext);
    const network = useContext(NetworkContext);
    const [mintAmount, setMintAmount] = useState(1);
    const [loading, setLoading] = useState(false);
    const [txError, setTxError] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [txCompleted, setTxCompleted] = useState(false);
    const [totalSupply, setTotalSupply] = useState(0);

    const decrementMintAmount = () => {
        let newMintAmount = mintAmount - 1;
        if (newMintAmount < 1) {
            newMintAmount = 1;
        }
        setMintAmount(newMintAmount);
    };
    
    const incrementMintAmount = () => {
        let newMintAmount = mintAmount + 1;
        if (newMintAmount > 2) {
            newMintAmount = 2;
        }
        setMintAmount(newMintAmount);
    };
    async function getTotalSupply() {
        if (provider) {
            try {
                const contract = new ethers.Contract(CPTLOContractAddrs, CPTLOABI.abi, provider);
                const totalSupply = await contract.totalSupply();
                setTotalSupply(totalSupply.toNumber());
            } catch (error) {
                console.log(error);
            }
        }
    }
    
    async function handleMint() {
        if(account && provider) {
            try {
                setLoading(true);
                const signer = provider.getSigner();
                const contract = new ethers.Contract(CPTLOContractAddrs, CPTLOABI.abi, signer);
                const amount = ethers.utils.parseEther(mintAmount.toString());
                const mintTx = await contract.publicMint(address, amount);
                await mintTx.wait().then(() => {
                    setTxCompleted(true);
                    setLoading(false);
                })
            } catch (error) {
                console.log(error);
                setLoading(false);
                setErrorMsg(error.error.message);
                setTxError(true);
            }
        }
    }

    async function handleClaim() {
        if(account && provider) {
            try {
                setLoading(true);
                const signer = provider.getSigner();
                const contract = new ethers.Contract(CPTLOContractAddrs, CPTLOABI.abi, signer);

                let whitelistAddresses = require("../utils/whitelist.json");
                const leafNodes = whitelistAddresses.map(addr => keccak256(addr));
                const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
                let rootHash = merkleTree.getHexRoot();
                console.log(rootHash);

                const claimingAddress = keccak256(account);
                const proof = merkleTree.getHexProof(claimingAddress);
                console.log(proof);
                const claimTx = await contract.mintWhitelist(proof, mintAmount);
                await claimTx.wait().then(() => {
                    setTxCompleted(true);
                    setLoading(false);
                })
            } catch (error) {
                console.log(error);
                setLoading(false);
                setErrorMsg(error.message || error.error.message);
                setTxError(true);
            }
        }
    }

    useEffect(() => {
        getTotalSupply();
        console.log(CPTLOContractAddrs)

    })

    return (
        <div className={styles.container}>
            {!provider && (
                <div className={styles.noProvider}>
                    <h4 className={styles.noProviderText}>Please Connect your wallet</h4>
                </div>
            )}
            {txCompleted && !loading && (
                <div className={styles.backdrop}>
                    <div className={styles.modal}>
                        <h4 className={styles.modalTitle} >Tx Successful</h4>
                        <p className={styles.modalText} >Your transaction has been completed.</p>
                        <p className={styles.modalText}>You can view your nft on <a href='https://opensea.io/' target='_blank' rel='noreferrer' className={styles.modalLink}>OpenSea</a></p>
                        <button className={styles.modalButton} onClick={() => setTxCompleted(false)}>Close</button>
                    </div>
                </div>
            )}
            {txError && !loading && (
                <div className={styles.backdrop}>
                    <div className={styles.modal}>
                        <h4 className={styles.modalTitle} >Tx Failed</h4>
                        <p className={styles.modalText} >Your transaction has been reverted.</p>
                        <p className={styles.modalText}>{errorMsg}</p>
                        <button className={styles.modalButton} onClick={() => setTxError(false)}>Close</button>
                    </div>
                </div>
            )}
            <Head>
                <title>CPTLO Mint</title>
                <meta name="description" content="Camera Person NFT is a collection of tokens on the ethereum blockchain that brings members of the photography community together through graphic art that represents photographers in the NFT space. The main goal is to collectively put out group photography projects that combine the fun of larger scale collectable pfp projects with the beauty in the art of photography and assembling collections." />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Image className={styles.Backgrounds} src="/CptloBackground.webp" alt="CPTLO" layout='fill'/>

            <main className={styles.main}>
                <div className={styles.mintCard}>
                
                    <div className={styles.mintCardHeader}>
                        <h1 className={styles.mintCardTitle}>Mint your cptlo</h1>
                    </div>
                    <div className={styles.mintCardBody}>
                        <p className={styles.mintCardText}>Mint your cptlo to get started</p>
                        <Image className={styles.mintCardImage} src="/sample-nft.png" alt="CPTLO" width={200} height={200} /> 
                        <div className={styles.mintCardBodyInput}>
                            <button className={styles.mathButton} onClick={decrementMintAmount}>-</button>
                            <p className={styles.mintAmountText}>{mintAmount}</p>
                            <button className={styles.mathButton} onClick={incrementMintAmount}>+</button>
                        </div>
                        <p>Claim is free mint cost monneys</p>
                        {!loading && <button onClick={handleClaim} className={styles.MintButton}  disabled={!provider}>Mint</button>}
                        {loading && <button className={styles.MintButtonDisabled} disabled>...Minting...</button>}
                        <p className={styles.SupplyText}>{totalSupply}/444</p>
                    </div>

                </div>
            </main>

            <footer className={styles.footer}>

            </footer>
        </div>
    )
}
