import { ethers } from "ethers";

const ABI = [
  "function mint(address to, string tokenURI, string cantinaId, string collectionId, string bottleNumber, uint256 vintage) returns (uint256)",
  "function burnBottle(uint256 tokenId, string reason) external",
  "function getBottle(uint256 tokenId) view returns (tuple(string cantinaId, string collectionId, string bottleNumber, uint256 vintage, bool burned))",
  "function totalMinted() view returns (uint256)",
  "event Minted(uint256 indexed tokenId, address indexed to, string cantinaId, string collectionId)",
  "event Burned(uint256 indexed tokenId, string reason)",
];

function getContract() {
  const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PLATFORM_WALLET_PRIVATE_KEY!, provider);
  return new ethers.Contract(process.env.NFT_CONTRACT_ADDRESS!, ABI, wallet);
}

export async function mintNft(params: {
  toAddress: string;
  tokenUri: string;
  cantinaId: string;
  collectionId: string;
  bottleNumber: string;
  vintage: number;
}) {
  const contract = getContract();
  const tx = await contract.mint(
    params.toAddress,
    params.tokenUri,
    params.cantinaId,
    params.collectionId,
    params.bottleNumber,
    params.vintage
  );
  const receipt = await tx.wait();
  const event = receipt.logs.find((l: { topics: string[] }) => l.topics[0] === ethers.id("Minted(uint256,address,string,string)"));
  const tokenId = event ? parseInt(event.topics[1], 16) : null;
  return { txHash: receipt.hash, tokenId };
}

export async function burnNft(tokenId: number, reason: string) {
  const contract = getContract();
  const tx = await contract.burnBottle(tokenId, reason);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

