const anchor = require('@project-serum/anchor');
const { SystemProgram } = require('@solana/web3.js');

const main = async() => {
  console.log("🚀 Starting test...")
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Gifwall;
  const baseAccount = anchor.web3.Keypair.generate();

  const tx = await program.rpc.startStuffOff({
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    },
    signers: [baseAccount],
  });

  console.log("📝 Your transaction signature", tx);

  let account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log('GIF count: ', account.totalGifs.toString());

  await program.rpc.addGif("https://giphy.com/clips/laff-tv-confused-huh-what-the-hell-A19tglYyfc7JPQYwNi",{
    accounts: {
      baseAccount: baseAccount.publicKey,
    }
  });

  account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log('GIF count: ', account.totalGifs.toString());

  console.log('GIF list', account.gifList);
}

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

runMain();