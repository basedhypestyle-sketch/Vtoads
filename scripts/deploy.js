async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying with', deployer.address);
  const Vice = await ethers.getContractFactory('ViceToads');
  const v = await Vice.deploy(deployer.address);
  await v.deployed();
  console.log('ViceToads deployed at', v.address);
}
main().catch(e=>{console.error(e); process.exit(1);});
