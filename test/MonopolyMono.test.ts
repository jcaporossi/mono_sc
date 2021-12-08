import { ethers } from "hardhat";
import { expect, assert } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { MonopolyMono } from "../typechain";

describe("MonopolyMono contract", function () {
  
  var mono: MonopolyMono;
  var accounts: SignerWithAddress[];
  var deployer: SignerWithAddress;
  var user1: SignerWithAddress; 
  var user2: SignerWithAddress;

  /* mint 1000 $MONO to every account (20) */
  var mint = async (accounts: SignerWithAddress[]) => {
    for (let i = 0; i < accounts.length; i++) {
      await mono.mint(accounts[i].address, ethers.utils.parseUnits("1000", 18));
    }
  };

  beforeEach(async function () {

    const MonoFactory = await ethers.getContractFactory("MonopolyMono");

    /* deploy $MONO ERC-20 with a max supply = 20000 */
    mono = await MonoFactory.deploy(ethers.utils.parseUnits("20000", 18));
    await mono.deployed();

    accounts = await ethers.getSigners();
    deployer = accounts[0];
    user1 = accounts[1];
    user2 = accounts[2];
  });

  it("should mint 1000 $MONO to every account (20)", async function () {

    await mint(accounts);

    for (let i = 0; i < accounts.length; i++) {
      expect(await mono.balanceOf(accounts[i].address)).to.equal(
        ethers.utils.parseUnits("1000", 18)
      );
    }
  });

  it("should fail when minting 20000 + 1000 $MONO as it exceeds token max supply", async function () {

    await mint(accounts);
    
    await expect(mono.mint(user1.address, ethers.utils.parseUnits("1000", 18))).to.be.revertedWith("ERC20Capped: cap exceeded")
  });

  it("should let user to burn 500 $MONO", async function () {

    await mint(accounts);

    let user1mono = await mono.connect(user1);

    await user1mono.burn(ethers.utils.parseUnits("500", 18));

    expect(await user1mono.balanceOf(user1.address)).to.equal(
      ethers.utils.parseUnits("500", 18)
    );
  });

  it("should let granted user to transfer 500 $MONO owned by another user", async function () {
    
    await mint(accounts);
    
    let user1mono = await mono.connect(user1);
    await user1mono.approve(
      user2.address,
      ethers.utils.parseUnits("500", 18)
    );

    let user2mono = await mono.connect(user2);

    await user2mono.transferFrom(user1.address, user2.address, ethers.utils.parseUnits("500", 18));

    expect(await user1mono.balanceOf(user1.address)).to.equal(ethers.utils.parseUnits("500", 18));
  });

  it("should let granted user to burn 500 $MONO owned by another user", async function () {
    
    await mint(accounts);
    
    let user1mono = await mono.connect(user1);
    await user1mono.approve(
      deployer.address,
      ethers.utils.parseUnits("500", 18)
    );
    await mono.burnFrom(user1.address, ethers.utils.parseUnits("500", 18));

    expect(await user1mono.balanceOf(user1.address)).to.equal(ethers.utils.parseUnits("500", 18));
  });

  it("minting token should not be possible after pausing", async function () {
    await mono.pause();
    expect(mono.mint(user1.address, ethers.utils.parseUnits("1000", 18))).to.be.reverted;
  });

  it("minting token should be possible after unpausing", async function () {
    
    await mono.pause();
    await expect(mono.mint(user1.address, ethers.utils.parseUnits("1000", 18))).to.be.reverted;
    
    await mono.unpause();
    await mono.mint(user1.address, ethers.utils.parseUnits("1000", 18));

    expect(await mono.balanceOf(user1.address)).to.equal(
      ethers.utils.parseUnits("1000", 18)
    );
  });

  it("user1 to transfer 500 $MONO to user2", async function () {
    await mint(accounts);
    
    let user1mono = await mono.connect(user1);

    await user1mono.transfer(user2.address, ethers.utils.parseUnits("500", 18));

    expect(await user1mono.balanceOf(user1.address)).to.equal(
      ethers.utils.parseUnits("500", 18)
    );
    expect(await user1mono.balanceOf(user2.address)).to.equal(
      ethers.utils.parseUnits("1500", 18)
    );
  });
});
