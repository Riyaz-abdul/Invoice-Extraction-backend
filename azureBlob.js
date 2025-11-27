const { BlobServiceClient } = require("@azure/storage-blob");
require("dotenv").config();

const blobServiceClient = new BlobServiceClient(
  `https://${process.env.ACCOUNT_NAME}.blob.core.windows.net/?${process.env.SAS_TOKEN}`
);

const containerClient = blobServiceClient.getContainerClient(process.env.CONTAINER_NAME);

async function uploadToBlob(fileBuffer, originalName, mimeType) {
  const blobName = `${Date.now()}-${originalName}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(fileBuffer, {
    blobHTTPHeaders: {
      blobContentType: mimeType,
      blobContentDisposition: "inline",
    },
  });

  return blockBlobClient.url;
}

module.exports = { uploadToBlob };
