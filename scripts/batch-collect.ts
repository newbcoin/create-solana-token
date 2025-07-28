import {
  Keypair,
  Transaction,
  SystemProgram,
  ComputeBudgetProgram,
  Connection,
  clusterApiUrl,
  PublicKey,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  ACCOUNT_SIZE,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  createCloseAccountInstruction,
  getAssociatedTokenAddress,
  getAccount,
  TokenAccountNotFoundError,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import fs from "fs";
import * as bs58 from "bs58";

const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");

async function addTransferTokensInstructions({
  destination,
  tokenMint,
  amount,
  keypair,
  transaction,
}: {
  destination: string;
  tokenMint: string;
  amount: number;
  keypair: Keypair;
  transaction: Transaction;
}) {
  const mint = new PublicKey(tokenMint);
  const sourceATA = await getAssociatedTokenAddress(mint, keypair.publicKey);
  const destinationPublicKey = new PublicKey(destination);
  const destinationATA = await getAssociatedTokenAddress(mint, destinationPublicKey);
  const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
    units: 10000,
  });
  const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 3000,
  });
  try {
    const destinationTokenAccount = await getAccount(connection, destinationATA);
    transaction
    .add(
      createTransferCheckedInstruction(
        sourceATA,
        mint,
        destinationATA,
        keypair.publicKey,
        amount,
        6
      )
    );
    console.log("Sent " + amount + " tokens to existing token account:", destinationATA.toString());
  } catch (e) {
    if (e instanceof TokenAccountNotFoundError) {
      transaction
      .add(
        createAssociatedTokenAccountInstruction(
          keypair.publicKey,
          destinationATA,
          destinationPublicKey,
          mint
        )
      )
      .add(
        createTransferCheckedInstruction(
          sourceATA,
          mint,
          destinationATA,
          keypair.publicKey,
          amount,
          6
        )
      );
      console.log("Sent " + amount + " tokens to new token account:", destinationATA.toString());
    }
  }
}

async function batchCollect() {
  for (var i = 0; i < 200 - 1; i++) {
    const privateKeyFile = fs.readFileSync(
      "/root/keypairs/my-keypair" + i + ".json"
    );
    let privateKeySeed = JSON.parse(privateKeyFile.toString()).slice(0, 32);
    let keypair = Keypair.fromSeed(Uint8Array.from(privateKeySeed));
    console.log("Token send authority:", keypair.publicKey.toString());

    const collectionAddress = "7s7BdRGAH9EjwFriPYFtDdFynXsuTVwLs5k9rXiX6GJy";
    const tokenMint = "Dg2pYxYHedJaznYG8WJRXwqZwED6WgWafjerUjr4Veky";
    var transaction = new Transaction();
    const mint = new PublicKey(tokenMint);
    const sourceATA = await getAssociatedTokenAddress(mint, keypair.publicKey);
    try {
      const sourceTokenAccount = await getAccount(connection, sourceATA);
      await addTransferTokensInstructions({
        destination: collectionAddress,
        tokenMint: tokenMint,
        amount: Number(sourceTokenAccount.amount),
        keypair,
        transaction
      });
      transaction
      .add(
        createCloseAccountInstruction(
          sourceATA,
          keypair.publicKey,
          keypair.publicKey
        )
      );
      await sendAndConfirmTransaction(connection, transaction, [
        keypair,
      ]);
    } catch (e) {
      console.log("No token account exists:", sourceATA.toString());
      continue;
    }
  }
}

batchCollect();
