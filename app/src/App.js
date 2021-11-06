import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import { useEffect, useState } from 'react';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';
import idl from './idl.json';
import kp from './keypair.json'

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const { SystemProgram } = web3;

const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);

const programID = new PublicKey(idl.metadata.address);

const network = clusterApiUrl('devnet');

const opts = {
  preflightCommitment: "processed"
}

const formatAccount = (account) => {
  return {
    id: account.id,
    gifLink: account.gifLink.toString(),
    updoots: account.updoots,
    userAddress: account.userAddress.toString(),
  }
}

const App = () => {

  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);

  const createGifAccount = async () => {
    try { 
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping");
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId
        },
        signers: [baseAccount]
      });
      console.log('Created new base account at address', baseAccount.publicKey.toString());
      await getGifList();
    } catch (e) {
      console.error(e);
    }
  }

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment
    );
    return provider;
  }

  const checkIfWalletIsConnected = async () => {
    try {
      const {solana} = window;

      if(solana) {
        if(solana.isPhantom) {
          console.log('Found phantom wallet');

          const response = await solana.connect({onlyIfTrusted: true});
          console.log(
            'Connected with Public Key:',
            response.publicKey.toString()
          );

          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert('No solana object found');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;

    if(solana) {
      const response = await solana.connect();
      const pubKey = response.publicKey.toString();
      console.log('Connected with public key', pubKey);
      setWalletAddress(pubKey);
    }
  };

  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  }

  const sendGif = async () => {
    if(inputValue.length === 0) {
      console.log('Empty input. Try again');
      return;
    }

    console.log('Gif link: ', inputValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
        },
      });
      console.log('GIF sent to program! ', inputValue);
      await getGifList();
    } catch (e) {
      console.error(e);
    }
  }

  const renderNotConnectedContainer = () => (
    <button className="cta-button connect-wallet-button" onClick={connectWallet}>Connect to wallet</button>
  )

  const renderConnectedContainer = () => {
    console.log(gifList);
    if(gifList === null) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>Create new GIF account</button>
        </div>
      )
    } else {
      return (
        <div className="connected-container">
          <input type="text" placeholder="Enter gif link!" value={inputValue} onChange={onInputChange} />
          <button className="cta-button submit-gif-button" onClick={sendGif}>
            Submit
          </button>
          <div className="gif-grid">
            {gifList.map((gif,index) => (
              <div className="gif-item" key={index}>
                <img src={gif.gifLink} alt={gif.gifLink} onClick={() => { updoot(gif.id) }} />
                <div className="upvotes">{gif.updoots}</div>
              </div>
            ))}
          </div>
        </div>
      )
    }
  }

  const updoot = async (id) => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      await program.rpc.updoot(id, {
        accounts: {
          baseAccount: baseAccount.publicKey,
        },
      });

      await getGifList();
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    window.addEventListener('load', async (event) => {
      await checkIfWalletIsConnected();
    });
  }, []);

  const getGifList = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

      console.log('Got the account', account);
      setGifList(account.gifList.map(formatAccount));
    } catch (e) {
      console.error(e);
      setGifList(null);
    }
  }

  useEffect(() => {
    if(walletAddress){
      console.log('Fetching GIF list...');
      getGifList();
    }
  }, [walletAddress]);

  return (
    <div className="App">
      <div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header">🖼 Salvana 🖼</p>
          <p className="sub-text">
            View the best GIF collection of the capitone in the metaverse ✨
          </p>
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
