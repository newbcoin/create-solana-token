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

async function addTransferInstructions({
  destination,
  amount,
  transaction,
}: {
  destination: string;
  amount: number;
  transaction: Transaction;
}) {
  const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
    units: 10000,
  });
  const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 3000,
  });
  transaction
  .add(
    SystemProgram.transfer({
      fromPubkey: keypair.publicKey,
      toPubkey: new PublicKey(destination),
      lamports: amount,
    })
  );
  console.log("Sent " + amount + " SOL to address:", destination);
}

const privateKeyFile = fs.readFileSync(
  "/root/burner1-keypair.json"
);
let privateKeySeed = JSON.parse(privateKeyFile.toString()).slice(0, 32);
let keypair = Keypair.fromSeed(Uint8Array.from(privateKeySeed));
console.log("Token send authority:", keypair.publicKey.toString());

const addressesFile = fs.readFileSync(
  "/root/addresses.txt"
);
const addresses = addressesFile.toString().split("\n");

async function batchTransfer() {
  const batchSize = 10;
  let transaction = new Transaction();
  for (var i = 0; i < addresses.length - 1; i++) {
    const address = addresses[i];
    const amountIn = 10 * 1000000 // 0.001 SOL multiplier
    await addTransferInstructions({
      destination: address,
      amount: amountIn,
      transaction: transaction
    });
    if (transaction.instructions.length == batchSize) {
      await sendAndConfirmTransaction(connection, transaction, [
        keypair,
      ]);
      transaction = new Transaction();
    }
  }
  if (transaction.instructions.length > 0) {
    await sendAndConfirmTransaction(connection, transaction, [
      keypair,
    ]);
  }
}

batchTransfer();
