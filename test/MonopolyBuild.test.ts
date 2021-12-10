import { ethers } from "hardhat";
import { expect, assert } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { MonopolyBoard, MonopolyBuild } from "../typechain";

describe("MonopolyBuild contract", function () {

  var board: MonopolyBoard;
  var build: MonopolyBuild;
  var accounts: SignerWithAddress[];
  var deployer: SignerWithAddress;
  var minter: SignerWithAddress;
  var owner1: SignerWithAddress; 
  var owner2: SignerWithAddress; 
  var owner3: SignerWithAddress;

  type Build = {
    edition: number;
    land: number;
    type: number;
  }

  beforeEach(async function () {

    const BoardFactory = await ethers.getContractFactory("MonopolyBoard");
    board = await BoardFactory.deploy();
    await board.deployed();

    const buildFactory = await ethers.getContractFactory("MonopolyBuild");
    build = await buildFactory.deploy(board.address, "https://token-cdn/");
    await build.deployed();

    accounts = await ethers.getSigners();
    deployer = accounts[0];
    minter = accounts[1];
    owner1 = accounts[2];
    owner2 = accounts[3];
    owner3 = accounts[4];
  });

  it("should allow new minter", async function () {
    build.grantRole(await build.MINTER_ROLE(), minter.address);

    assert(build.hasRole(await build.MINTER_ROLE(), minter.address), "bad role for minter");
  });

  it("should mint 10 builds with build_type = 0 to owner1", async function () {

    let b: Build = {
      edition: 0,
      land: 1,
      type: 0
    }

    let tx = await build.mint(owner1.address, b.edition, b.land, b.type, 10);
    let tr = await tx.wait();

    let events = tr.events;
    if (events && events[0] && events[0].args) {
      let id = events[0].args.id;
      expect(await build.balanceOf(owner1.address, id.toString())).to.equal(10);
      expect(await build.totalSupply(id.toString())).to.equal(10);
    }
    else{
      assert(false, "test fails");
    }
  });

  it("should mint 5 builds with build_type = 1 to owner2", async function () {
    let b: Build = {
      edition: 0,
      land: 1,
      type: 1
    }

    let tx = await build.mint(owner2.address, b.edition, b.land, b.type, 5);
    let tr = await tx.wait();

    let events = tr.events;
    if (events && events[0] && events[0].args) {
      let id = events[0].args.id;
      expect(await build.balanceOf(owner2.address, id.toString())).to.equal(5);
      expect(await build.totalSupply(id.toString())).to.equal(5);
    }
    else{
      assert(false, "test fails");
    }
  });

  it("should revert when trying to mint unknown build_type", async function () {
    await expect(build.mint(owner2.address, 0, 1, 2, 5)).to.be.reverted;
  });

  it("should revert when trying to mint for unknown edition", async function () {
    await expect(build.mint(owner2.address, 1, 1, 2, 5)).to.be.reverted;
  });
});
