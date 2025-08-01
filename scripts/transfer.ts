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
  getAssociatedTokenAddress,
  getAccount,
  TokenAccountNotFoundError,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import fs from "fs";
import * as bs58 from "bs58";

const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");

async function transferTokens({
  secretKey,
  destination,
  tokenMint,
  amount,
  computeUnits,
  microLamports,
}: {
  secretKey: string;
  destination: string;
  tokenMint: string;
  amount: number;
  computeUnits: number;
  microLamports: number;
}) {
  if (!secretKey) {
    console.log('please provide secret key');
    return;
  }
  if (!destination) {
    console.log('please provide destination');
    return;
  }
  let keypair = Keypair.fromSecretKey(bs58.decode(secretKey));
  const mint = new PublicKey(tokenMint);
  const sourceATA = await getAssociatedTokenAddress(mint, keypair.publicKey);
  const destinationPublicKey = new PublicKey(destination);
  const destinationATA = await getAssociatedTokenAddress(mint, destinationPublicKey);
  const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
    units: computeUnits,
  });
  const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: microLamports,
  });
  try {
    const destinationTokenAccount = await getAccount(connection, destinationATA);
    const transferTokensTransaction = new Transaction()
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
    await sendAndConfirmTransaction(connection, transferTokensTransaction, [
      keypair,
    ]);
    console.log("Sent " + amount + " tokens to existing token account:", destinationATA.toString());
  } catch (e) {
    if (e instanceof TokenAccountNotFoundError) {
      const transferTokensTransaction = new Transaction()
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
      await sendAndConfirmTransaction(connection, transferTokensTransaction, [
        keypair,
      ]);
      console.log("Sent " + amount + " tokens to new token account:", destinationATA.toString());
    }
  }
}

const secretKey = process.argv[2];
const address = process.argv[3];
const amountIn = !isNaN(Number(process.argv[4])) ? Number(process.argv[4]) : (10000 * 1000000) // 1 NEWB multiplier
const computeUnits = !isNaN(Number(process.argv[5])) ? Number(process.argv[5]) : 150000
const microLamports = !isNaN(Number(process.argv[6])) ? Number(process.argv[6]) : 3000

transferTokens({
  secretKey: secretKey,
  destination: address,
  tokenMint: "Dg2pYxYHedJaznYG8WJRXwqZwED6WgWafjerUjr4Veky",
  amount: amountIn,
  computeUnits: computeUnits,
  microLamports: microLamports
});
