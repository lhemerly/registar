const Web3 = require('web3');
const FileRegistrar = require('../web3/artifacts/contracts/registar.sol/FileRegistrar.json');
const fs = require('fs');
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Create a new instance of the web3.js library using a provider URL.
const providerUrl = 'http://localhost:8545';
const web3 = new Web3(providerUrl);

// Set the default account to use for transactions.
const defaultAccount = '0x1234567890123456789012345678901234567890';
web3.eth.defaultAccount = defaultAccount;

// Load the contract ABI and create an instance of the contract.
const contractAbi = FileRegistrar.abi;
const contractAddress = '0x1234567890123456789012345678901234567890';
const fileRegistrarContract = new web3.eth.Contract(
  contractAbi,
  contractAddress
);

// Connect to MongoDB using Mongoose.
mongoose.connect('mongodb://localhost:27017/file-registrar', {
  useNewUrlParser: true,
});

// Define a schema for storing file metadata in MongoDB.
const fileMetadataSchema = new mongoose.Schema({
  tokenId: Number,
  name: String,
  description: String,
  fileLink: String,
  fileHash: String,
});

// Create a model for the file metadata schema.
const FileMetadata = mongoose.model('FileMetadata', fileMetadataSchema);

// Create an Express app.
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Define a route for registering a new file.
app.post('/register', async (req, res) => {
  const { name, description, fileLink, fileHash } = req.body;

  // Call the registerFile function on the smart contract.
  const result = await fileRegistrarContract.methods
    .registerFile(name, description, fileLink, fileHash)
    .send({ from: defaultAccount, value: web3.utils.toWei('1', 'ether') });

  // Save the file metadata to MongoDB.
  const fileMetadata = new FileMetadata({
    tokenId: result.events.Transfer.returnValues.tokenId,
    name: name,
    description: description,
    fileLink: fileLink,
    fileHash: fileHash,
  });
  await fileMetadata.save();

  res.json({ success: true });
});

// Define a route for getting the metadata for a token.
app.get('/metadata/:tokenId', async (req, res) => {
  const tokenId = req.params.tokenId;

  // Call the getFileMetadata function on the smart contract.
  const result = await fileRegistrarContract.methods
    .getFileMetadata(tokenId)
    .call();

  // Retrieve the file metadata from MongoDB.
  const fileMetadata = await FileMetadata.findOne({ tokenId: tokenId });

  res.json({
    tokenId: tokenId,
    name: result.name,
    description: result.description,
    fileLink: result.fileLink,
    fileHash: result.fileHash,
    createdAt: fileMetadata.createdAt,
    updatedAt: fileMetadata.updatedAt,
  });
});

// Start the Express app.
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
