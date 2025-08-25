
async function main() {
  const rpcUrl = "https://rpc.wallet.atlantic-2.sei.io";
  const address = "0x2b5c206516c34896d41db511bab9e878f8c1c109";
  const data = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getBalance",
    "params": [address, "latest"]
  };

  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const result = await res.json();
  if (result.result) {
    const balance = parseInt(result.result, 16) / 1e18;
    console.log("Balance (SEI):", balance);
  } else {
    console.error("Error:", result);
  }
}

main();
