const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const IntentRegistry = await hre.ethers.getContractFactory("IntentRegistry");
  const registry = await IntentRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("IntentRegistry deployed to:", registryAddress);

  const MockSafe = await hre.ethers.getContractFactory("MockSafe");
  const safe = await MockSafe.deploy();
  await safe.waitForDeployment();
  const safeAddress = await safe.getAddress();
  console.log("MockSafe deployed to:", safeAddress);

  const IntentWallet = await hre.ethers.getContractFactory("IntentWallet");
  const wallet = await IntentWallet.deploy(safeAddress, registryAddress);
  await wallet.waitForDeployment();
  const walletAddress = await wallet.getAddress();
  console.log("IntentWallet deployed to:", walletAddress);

  const SafetyModule = await hre.ethers.getContractFactory("SafetyModule");
  const safety = await SafetyModule.deploy(registryAddress, walletAddress);
  await safety.waitForDeployment();
  const safetyAddress = await safety.getAddress();
  console.log("SafetyModule deployed to:", safetyAddress);

  const tx = await registry.setCreExecutor(walletAddress);
  await tx.wait();
  console.log("Registry: setCreExecutor(wallet)");

  const out = {
    network: "base-sepolia",
    chainId: 84532,
    IntentRegistry: registryAddress,
    MockSafe: safeAddress,
    IntentWallet: walletAddress,
    SafetyModule: safetyAddress,
  };
  fs.writeFileSync(
    "contracts-deployed-base-sepolia.json",
    JSON.stringify(out, null, 2)
  );
  console.log("\nWrote contracts-deployed-base-sepolia.json");

  console.log("\n--- Summary (Base Sepolia) ---");
  console.log("IntentRegistry:", registryAddress);
  console.log("MockSafe:", safeAddress);
  console.log("IntentWallet:", walletAddress);
  console.log("SafetyModule:", safetyAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
