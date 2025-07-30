import fs from "fs";

const apiKey = fs.readFileSync(
  "/root/helius-api-key.txt",
  { encoding: "utf8" }
);
console.log("Helius API key:", apiKey);

async function snapshotHolders() {
  const body = {
    jsonrpc: "2.0",
    id: "1",
    method: "getTokenAccounts",
    params: {
      mint: "Dg2pYxYHedJaznYG8WJRXwqZwED6WgWafjerUjr4Veky",
      options: {
        showZeroBalance: true
      }
    }
  };
  const url = "https://mainnet.helius-rpc.com/?api-key=" + apiKey;
  const options = {
    method: "POST",
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body)
  };
  const response = await fetch(url, options);
  const data = await response.json();
  const token_accounts = data.result.token_accounts;
  for (var i = 0; i < token_accounts.length; i++) {
    const token_account = token_accounts[i];
    const amount = token_account.amount;
    const owner = token_account.owner;
    if (amount <= 0) {
      fs.appendFileSync("/root/addresses.txt", owner + "\n");
    }
  }
}

snapshotHolders();
