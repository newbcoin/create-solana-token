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
  destination,
  amount,
  keypair,
}: {
  destination: string;
  amount: number;
  keypair: Keypair;
}) {
  const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
    units: 10000,
  });
  const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 3000,
  });
  const transferTokensTransaction = new Transaction()
  .add(
    SystemProgram.transfer({
      fromPubkey: keypair.publicKey,
      toPubkey: new PublicKey(destination),
      lamports: amount - 5000, // 0.000005 SOL fee
    })
  );
  await sendAndConfirmTransaction(connection, transferTokensTransaction, [
    keypair,
  ]);
  console.log("Sent " + amount + " SOL to address:", destination);
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
    const balance = await connection.getBalance(keypair.publicKey);
    await transferTokens({
      destination: collectionAddress,
      amount: balance,
      keypair: keypair
    });
  }
}

batchCollect();
