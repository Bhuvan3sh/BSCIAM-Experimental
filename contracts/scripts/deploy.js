const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("Starting deployment of BSCIAM contracts...");

  // Get the contract factory
  const BSCIAMToken = await hre.ethers.getContractFactory("BSCIAMToken");
  const BSCIAMAuth = await hre.ethers.getContractFactory("BSCIAMAuth");

  console.log("Deploying BSCIAM Token...");
  
  // Deploy the token contract
  const bsciamToken = await BSCIAMToken.deploy();
  await bsciamToken.waitForDeployment();
  
  console.log("BSCIAM Token deployed to:", await bsciamToken.getAddress());
  console.log("Token name:", await bsciamToken.name());
  console.log("Token symbol:", await bsciamToken.symbol());
  console.log("Initial supply:", hre.ethers.formatEther(await bsciamToken.totalSupply()));

  console.log("\nDeploying BSCIAM Authentication contract...");
  
  // Deploy the auth contract with token address
  const bsciamAuth = await BSCIAMAuth.deploy(await bsciamToken.getAddress());
  await bsciamAuth.waitForDeployment();
  
  console.log("BSCIAM Auth deployed to:", await bsciamAuth.getAddress());

  // Add auth contract as a minter for the token
  console.log("\nAdding auth contract as token minter...");
  const addMinterTx = await bsciamToken.addMinter(await bsciamAuth.getAddress());
  await addMinterTx.wait();
  console.log("Auth contract added as minter");

  console.log("\n=== Deployment Summary ===");
  console.log("BSCIAM Token:", await bsciamToken.getAddress());
  console.log("BSCIAM Auth:", await bsciamAuth.getAddress());
  console.log("Network:", hre.network.name);
  console.log("Deployer:", (await hre.ethers.getSigners())[0].address);

  // Save deployment info for frontend
  const deploymentInfo = {
    network: hre.network.name,
    token: {
      address: await bsciamToken.getAddress(),
      name: await bsciamToken.name(),
      symbol: await bsciamToken.symbol(),
      totalSupply: (await bsciamToken.totalSupply()).toString(),
      decimals: await bsciamToken.decimals()
    },
    auth: {
      address: await bsciamAuth.getAddress(),
      registrationFee: "10000000000000000000", // 10 tokens in wei
      reputationReward: "5000000000000000000" // 5 tokens in wei
    },
    deployer: (await hre.ethers.getSigners())[0].address,
    timestamp: new Date().toISOString()
  };

  // Write deployment info to file
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value, 2));
  
  console.log(`\nDeployment info saved to: ${deploymentFile}`);

  // Copy to frontend directory if it exists
  const frontendConfigPath = path.join(__dirname, '../../frontend/src/config/contracts.json');
  const frontendConfigDir = path.dirname(frontendConfigPath);
  
  if (fs.existsSync(frontendConfigDir)) {
    fs.writeFileSync(frontendConfigPath, JSON.stringify(deploymentInfo, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value, 2));
    console.log(`Frontend config updated: ${frontendConfigPath}`);
  }

  console.log("\nDeployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
