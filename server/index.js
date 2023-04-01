const express = require("express");
const app = express();
const cors = require("cors");

const secp = require("ethereum-cryptography/secp256k1");
const { keccak256 } = require("ethereum-cryptography/keccak");
const { toHex, utf8ToBytes } = require("ethereum-cryptography/utils");

const port = 3042;

app.use(cors());
app.use(express.json());

const balances = {
  "04392be87cab87326128cda150ea827296d95a8fa06b66b45ad4eee7442badca8e9c1a1d0426803ec5bca32a95b874311db9590a1952a8217736cb65b547565a16": 100,
  "041c600a3d3bb09b84812868577b9aaf8fe15533095f24f7b19d52ff4ff0cf2e315c64e099062daf0eb4a86ce2cc9c50cf6decb020e2592bf9ee6df9fd0e401db0": 50,
  "04f31ab7101fe0ced75dea6e6504b9f6143d39174a68c32495e5810e6fb5f2e0e867d9504499b75a92c611320fcda58530bb0bbf922a168100c65d653df92a70c9": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", async (req, res) => {
  const { sender, recipient, amount, signature, recovery } = req.body;

  if (!signature) {
    res.status(404).send({ message: "signature dont was provide" });
    return;
  }
  if (!recovery) {
    res.status(400).send({ message: "recovery dont was provide" });
    return;
  }
  try {
    const bytes = utf8ToBytes(JSON.stringify({ sender, recipient, amount }));
    const hash = keccak256(bytes);
    const sig = new Uint8Array(signature);
    const publicKey = await secp.recoverPublicKey(hash, sig, recovery);
    if (toHex(publicKey) !== sender) {
      res.status(400).send({ message: "signature no is valid" });
      return;
    }
  } catch (error) {
    res.status(500);
    console.log(error.message);
    return;
  }

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
