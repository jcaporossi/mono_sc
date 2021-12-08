import { ethers } from "hardhat";
import { expect, assert } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { MonopolyBoard, MonopolyProp } from "../typechain";

describe("MonopolyProp contract", function () {

  var board: MonopolyBoard;
  var prop: MonopolyProp;
  var accounts: SignerWithAddress[];
  var deployer: SignerWithAddress;
  var minter: SignerWithAddress;
  var owner1: SignerWithAddress;
  var owner2: SignerWithAddress;
  var owner3: SignerWithAddress;

  type Prop = {
    edition: number;
    land: number;
    rarity: number;
  }

  beforeEach(async function () {

    const BoardFactory = await ethers.getContractFactory("MonopolyBoard");
    board = await BoardFactory.deploy();
    await board.deployed();

    const PropFactory = await ethers.getContractFactory("MonopolyProp");
    prop = await PropFactory.deploy(board.address, "TMWPROP", "PROP", "https://token-cdn/");
    await prop.deployed();

    accounts = await ethers.getSigners();
    deployer = accounts[0];
    minter = accounts[1];
    owner1 = accounts[2];
    owner2 = accounts[3];
    owner3 = accounts[4];

    prop.grantRole(await prop.MINTER_ROLE(), minter.address);

  });

  it("should allow new minter", async function () {
    prop.grantRole(await prop.MINTER_ROLE(), owner1.address);
    assert(prop.hasRole(await prop.MINTER_ROLE(), owner1.address), "not good");
  });

  it("should mint a PROP with rarity_lvl = 0 to owner1", async function () {

    let minterprop = await prop.connect(minter);

    let p: Prop = {
      edition: 0,
      land: 1,
      rarity: 0
    };

    let tx = await minterprop.mint(owner1.address, p.edition, p.land, p.rarity);
    let tr = await tx.wait();

    let events = tr.events;
    if (events && events[0] && events[0].args) {
      let tokenID = events[0].args.tokenId;
      expect(await prop.ownerOf(tokenID.toString())).to.equal(owner1.address);
    }
    else {
      assert(false, "failure when minting a prop");
    }
  });

  it("should mint 2 PROPs with rarity_lvl = 1: one to owner1 and one to owner2", async function () {
    
    let minter_prop = await prop.connect(minter);

    let p: Prop = {
      edition: 0,
      land: 1,
      rarity: 1
    };

    let tx = await minter_prop.mint(owner1.address, p.edition, p.land, p.rarity);
    let tr = await tx.wait();
    let events = tr.events;
    if (events && events[0] && events[0].args) {
      expect(await prop.balanceOf(owner1.address)).to.equal(1);
    }
    else {
      assert(false, "test fails");
    }

    tx = await minter_prop.mint(owner2.address, 0, 1, 1);
    tr = await tx.wait();
    events = tr.events;
    if (events && events[0] && events[0].args) {
      expect(await prop.balanceOf(owner2.address)).to.equal(1);
    }
    else {
      assert(false, "test fails");
    }
    
  });

  it("should fail to mint two PROPs for the same cell_id with rarity_lvl = 0", async function () {
    
    let minter_prop = await prop.connect(minter);

    let p: Prop = {
      edition: 0,
      land: 1,
      rarity: 0
    };

    let tx = await minter_prop.mint(owner1.address, p.edition, p.land, p.rarity);
    await tx.wait();

    await expect(minter_prop.mint(owner1.address, p.edition, p.land, p.rarity)).to.be.reverted;
  });

  it("proper number of minted PROPs shall be returned", async function () {
    let minter_prop = await prop.connect(minter);
    let nb_minted_prop = Math.round(Math.random() * 100);
    let p: Prop = {
      edition: 0,
      land: 1,
      rarity: 2
    };

    for (let i = 0; i < nb_minted_prop; i++){
      let user = accounts[i % accounts.length];
      let tx = await minter_prop.mint(user.address, p.edition, p.land, p.rarity);
      await tx.wait();
    }
    expect(await prop.totalSupply()).to.equal(nb_minted_prop);
  });

  it("should return the proper number of minted PROPs for a specific land and rarity", async function () {

    let minter_prop = await prop.connect(minter);

    let p: Prop = {
      edition: 0,
      land: 1,
      rarity: 2
    };

    let nb_minted_prop = Math.round(Math.random() * (10**p.rarity));
    for (let i = 0; i < nb_minted_prop; i++){
      let user = accounts[i % accounts.length];
      let tx = await minter_prop.mint(user.address, p.edition, p.land, p.rarity);
      await tx.wait();
    }

    expect(await prop.getNbOfProps(p.edition, p.land, p.rarity)).to.equal(nb_minted_prop);
  });

  it("should return the proper PROP when using PROP's ID", async function () {
    let minter_prop = await prop.connect(minter);

    let pin: Prop = {
      edition: 0,
      land: 39,
      rarity: 1
    };

    let tx = await minter_prop.mint(owner1.address, pin.edition, pin.land, pin.rarity);
    let tr = await tx.wait();

    let events = tr.events;
    if (events && events[0] && events[0].args) {
      let propID = events[0].args.tokenId;
      let pout = await minter_prop.get(propID.toString());
      expect(
        (pout.edition, pout.land, pout.rarity, pout.serial)
      ).to.equal((pin.edition, pin.land, pin.rarity, 0));
    }
    else
      assert(false, "test fails");
  });

  it("should return true when using an existing PROP's ID", async function () {
    let minter_prop = await prop.connect(minter);

    let p: Prop = {
      edition: 0,
      land: 39,
      rarity: 1
    };

    let tx = await minter_prop.mint(owner1.address, p.edition, p.land, p.rarity);
    let tr = await tx.wait();

    let events = tr.events;
    if (events && events[0] && events[0].args) {
      let propID = events[0].args.tokenId;
      expect(await minter_prop.exists(propID.toString())).to.be.true;
    }
    else
      assert(false, "test failed");
  });

  it("should return false when using an unknown PROP's ID", async function () {
    expect(await prop.exists("123456789")).to.be.false;
  });

  it("should mint all PROPs for one land", async function () {

    let minter_prop = await prop.connect(minter);

    for (let r = 0; r < 3; r++) {
      for (let n = 0; n < 10 ** r; n++) {
        let prop = {
          edition: 0,
          land: 37,
          rarity: r,
          serial: n
        }
        let tx = await minter_prop.mint(owner1.address, prop.edition, prop.land, prop.rarity);
        let tr = await tx.wait();
        let events = tr.events;
        if (events && events[0] && events[0].args) {
          let propID = events[0].args.tokenId;
          let pout = await minter_prop.get(propID.toString());
            expect(pout.edition).to.equal(prop.edition);
            expect(pout.land).to.equal(prop.land);
            expect(pout.rarity).to.equal(prop.rarity);
            expect(pout.serial).to.equal(prop.serial);
        }
        else
          assert(false, "test fails");
      }
    }
  });

  it("should fail when trying to mint a PROP for a land with all PROPs already minted", async function () {
    let minter_prop = await prop.connect(minter);

    for (let r = 0; r < 3; r++) {
      for (let n = 0; n < 10 ** r; n++) {
        let prop = {
          edition: 0,
          land: 37,
          rarity: r
        }
        let tx = await minter_prop.mint(owner1.address, prop.edition, prop.land, prop.rarity);
        await tx.wait();
      }
    }
    await expect(minter_prop.mint(owner1.address, 0, 37, 0)).to.be.reverted;
    await expect(minter_prop.mint(owner1.address, 0, 37, 1)).to.be.reverted;
    await expect(minter_prop.mint(owner1.address, 0, 37, 2)).to.be.reverted;
  });

  it("should mint a two PROPs with rarity = 0 for the same land but different editions", async function () {
    
    let minter_prop = await prop.connect(minter);
    
    let tx = await minter_prop.mint(owner1.address, 0, 37, 0);
    let tr = await tx.wait();

    tx = await board.newBoard(40, 2, [37], 2);
    await tx.wait();

    tx = await minter_prop.mint(owner1.address, 1, 37, 0);
    await tx.wait();

    expect(await prop.balanceOf(owner1.address)).to.equal(2);
  });

  it("should fail to mint a PROP for non-allowed land", async function () {
    let minter_prop = await prop.connect(minter);
    await expect(minter_prop.mint(owner1.address, 0, 0, 1)).to.be.reverted;
  });

  it("should return total number of tokens = mint_ctr", async function () {
    let minter_prop = await prop.connect(minter);

    let nb_minted_prop = Math.round(Math.random() * 100);

    for (let i = 0; i < nb_minted_prop; i++){
      let tx = await minter_prop.mint(owner1.address, 0, 37, 2);
      let tr = await tx.wait();
    }

    let totalSupply = await prop.totalSupply();
    expect(totalSupply.toNumber()).to.be.equal(nb_minted_prop);
  });
});
