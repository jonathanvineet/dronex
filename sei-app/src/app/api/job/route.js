// Next.js API route for job management
import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import CONTRACT_JSON from '../../../../../../dronex/sei-so/artifacts/contracts/DeliveryEscrow.sol/DeliveryEscrow.json';

const CONTRACT_ABI = CONTRACT_JSON.abi;
const CONTRACT_ADDRESS = "0x233D7487e447248DF9f71C6db46e8454254EB808";
const provider = new ethers.JsonRpcProvider("https://evm-rpc-testnet.sei-apis.com");
const posterWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, posterWallet);

export async function POST(request) {
  // Handles /api/job POST requests (job posting)
  const body = await request.json();
  const { jobId } = body;
  // ...existing logic for job posting...
  return NextResponse.json({ status: 'Job received', jobId });
}

export async function GET(request) {
  // Handles /api/job GET requests (job status)
  // ...existing logic for job status...
  return NextResponse.json({ status: 'API route active' });
}
