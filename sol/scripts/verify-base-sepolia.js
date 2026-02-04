const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const path = "contracts-deployed-base-sepolia.json";
  if (!fs.existsSync(path)) {
    console.error("Run deploy:base-sepolia first. Missing", path);
    process.exit(1);
  }
  const deployed = JSON.parse(fs.readFileSync(path, "utf8"));

  console.log("Verifying on Base Sepolia (sepolia.basescan.org)...\n");

  await hre.run("verify:verify", {
    address: deployed.IntentRegistry,
    constructorArguments: [],
    contract: "contracts/IntentRegistry.sol:IntentRegistry",
  }).catch((e) => console.log("IntentRegistry:", e.message));

  await hre.run("verify:verify", {
    address: deployed.MockSafe,
    constructorArguments: [],
    contract: "contracts/MockSafe.sol:MockSafe",
  }).catch((e) => console.log("MockSafe:", e.message));

  await hre.run("verify:verify", {
    address: deployed.IntentWallet,
    constructorArguments: [deployed.MockSafe, deployed.IntentRegistry],
    contract: "contracts/IntentWallet.sol:IntentWallet",
  }).catch((e) => console.log("IntentWallet:", e.message));

  await hre.run("verify:verify", {
    address: deployed.SafetyModule,
    constructorArguments: [deployed.IntentRegistry, deployed.IntentWallet],
    contract: "contracts/SafetyModule.sol:SafetyModule",
  }).catch((e) => console.log("SafetyModule:", e.message));

  console.log("\nDone. Check https://sepolia.basescan.org for verified contracts.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
