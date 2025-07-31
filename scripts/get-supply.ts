import {
  PublicKey,
  Connection,
  clusterApiUrl,
} from "@solana/web3.js";

let connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");

async function getTokenSupply() {
  const mint = new PublicKey("Dg2pYxYHedJaznYG8WJRXwqZwED6WgWafjerUjr4Veky");
  const tokenSupply = await connection.getTokenSupply(mint);
  console.log(tokenSupply.value.uiAmountString);
}

getTokenSupply();









