import { ethers } from "hardhat";
import { expect, assert } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { MonopolyBoard, MonopolyMono, MonopolyProp, MonopolyBuild, MonopolyBank } from "../typechain";

describe("MonopolyBank", function () {

  var board: MonopolyBoard;
  var mono: MonopolyMono;
  var prop: MonopolyProp;
  var build: MonopolyBuild;
  var bank: MonopolyBank;
  var accounts: SignerWithAddress[];
  var user1: SignerWithAddress;
  var user2: SignerWithAddress;

  type Prop = {
    edition: number;
    land: number;
    rarity: number;
  }

  type Build = {
    edition: number;
    land: number;
    type: number;
  }

  beforeEach(async function () {

    accounts = await ethers.getSigners();

    const MonoFactory = await ethers.getContractFactory("MonopolyMono");
    /* max_supply = 5000 $MONO per account */
    let max_supply = 5000 * accounts.length;
    mono = await MonoFactory.deploy(ethers.utils.parseUnits(max_supply.toString(), 18));
    await mono.deployed();

     /* mint 5000 $MONO to every account */
     for (let i = 0; i < accounts.length; i++) {
      await mono.mint(accounts[i].address, ethers.utils.parseUnits("5000", 18));
    }

    /* Deploy Board */
    const BoardFactory = await ethers.getContractFactory("MonopolyBoard");
    board = await BoardFactory.deploy();
    await board.deployed();
  
    /* Deploy Prop */
    const PropFactory = await ethers.getContractFactory("MonopolyProp");
    prop = await PropFactory.deploy(board.address, "TMWMONO", "PROP", "https://token-cdn/");
    await prop.deployed();
    
        /* Deploy Build */
    const BuildFactory = await ethers.getContractFactory("MonopolyBuild");
    build = await BuildFactory.deploy(board.address, "https://token-cdn/");
    await build.deployed();

        /* Deploy Bank */
    const BankFactory = await ethers.getContractFactory("MonopolyBank");
    bank = await BankFactory.deploy(prop.address, build.address, mono.address);
    await bank.deployed();

    /* grant MINTER_ROLE to Bank smartcontract */
    prop.grantRole(await prop.MINTER_ROLE(), bank.address);
    build.grantRole(await build.MINTER_ROLE(), bank.address);

   

    user1 = accounts[1];
    user2 = accounts[2];
  });

  it("should GET price of Prop(0,1,2)", async function () {
    let p: Prop = {
      edition: 0,
      land: 1,
      rarity: 2
    }
    let price = await bank.getPriceOfProp(p.edition, p.land, p.rarity);
    expect(price).to.equal(ethers.utils.parseUnits("6", 18));
  });

  it("should SET price of Prop(0,1,2)", async function () {
    let p: Prop = {
      edition: 0,
      land: 1,
      rarity: 2
    }

    let price = ethers.utils.parseUnits("6000", 18);

    await bank.setPriceOfProp(p.edition, p.land, p.rarity, price);
    let price_out = await bank.getPriceOfProp(p.edition, p.land, p.rarity);
    expect(price_out).to.equal(price);
  });

  it("should REVERT when trying to get non allowed property's price", async function () {
    let p: Prop = {
      edition: 0,
      land: 2,
      rarity: 2
    }
    await expect(bank.getPriceOfProp(p.edition, p.land, p.rarity)).to.be.reverted;
  });

  it("should REVERT when trying to set non allowed property's price", async function () {
    let p: Prop = {
      edition: 0,
      land: 2,
      rarity: 2
    }
    let price = ethers.utils.parseUnits("6000", 18);
    await expect(bank.setPriceOfProp(p.edition, p.land, p.rarity, price)).to.be.reverted;
  });

  it("should GET price of Build(0, 1, 1)", async function () {
    let b: Build = {
      edition: 0,
      land: 1,
      type: 1
    }
    let price = await bank.getPriceOfBuild(b.edition, b.land, b.type);
    expect(price).to.equal(ethers.utils.parseUnits("2", 18));
  });

  it("should SET price of Build(0,1,1)", async function () {
    let b: Build = {
      edition: 0,
      land: 1,
      type: 1
    }

    let price = ethers.utils.parseUnits("4", 18);

    await bank.setPriceOfBuild(b.edition, b.land, b.type, price);
    let price_out = await bank.getPriceOfBuild(b.edition, b.land, b.type);
    expect(price_out).to.equal(price);
  });

  it("should REVERT when trying to get non allowed build's price", async function () {
    
    let b: Build = {
      edition: 0,
      land: 2,
      type: 1
    }
    await expect(bank.getPriceOfBuild(b.edition, b.land, b.type)).to.be.reverted;
  });

  it("should REVERT when trying to set non allowed build's price", async function () {
    
    let b: Build = {
      edition: 0,
      land: 2,
      type: 1
    }

    let price = ethers.utils.parseUnits("4", 18);

    await expect(bank.setPriceOfBuild(b.edition, b.land, b.type, price)).to.be.reverted;
  });

  it("should REVERT when trying to get price of an unknown PROP", async function () {
    
    let user1bank = bank.connect(user1);

    let p: Prop = {
      edition: 99,
      land: 1,
      rarity: 2
    }
    await expect(user1bank.getPriceOfProp(p.edition, p.land, p.rarity)).to.be.reverted;

    p.edition = 0;
    p.land = 99;
    await expect(user1bank.getPriceOfProp(p.edition, p.land, p.rarity)).to.be.reverted;

    p.land = 1;
    p.rarity = 5;
    await expect(user1bank.getPriceOfProp(p.edition, p.land, p.rarity)).to.be.reverted;
  });

  it("should REVERT when trying to BUY an unknown PROP", async function () {
    
    let user1mono = mono.connect(user1);
    let user1bank = bank.connect(user1);

    let p: Prop = {
      edition: 0,
      land: 1,
      rarity: 2
    }
    let price = await user1bank.getPriceOfProp(p.edition, p.land, p.rarity);
    await user1mono.approve(bank.address, price);

    p.edition = 99;
    await expect(user1bank.buyProp(p.edition, p.land, p.rarity)).to.be.reverted;

    p.edition = 0;
    p.land = 99;
    await expect(user1bank.buyProp(p.edition, p.land, p.rarity)).to.be.reverted;

    p.edition = 0;
    p.land = 1;
    p.rarity = 5;
    await expect(user1bank.buyProp(p.edition, p.land, p.rarity)).to.be.reverted;
  });

  it("user 1 to BUY PROP(0,1,2)", async function () {

    let p: Prop = {
      edition: 0,
      land: 1,
      rarity: 2
    }

    let user1mono = mono.connect(user1);
    let user1bank = bank.connect(user1);

    let price = await user1bank.getPriceOfProp(p.edition, p.land, p.rarity);

    await user1mono.approve(bank.address, price);
    let tx = await user1bank.buyProp(p.edition, p.land, p.rarity);
    let tr = await tx.wait();

    let events = tr.events;
    if (events && events[3] && events[3].args) {
      let prop_id = events[3].args.prop_id;
      expect(await prop.ownerOf(prop_id)).to.equal(user1.address);
      expect(await prop.balanceOf(user1.address)).to.equal(1);
    }
    else {
      assert(false, "test fails");
    }
  });

  it("should fail when buying too expensive prop", async function () {
    let p: Prop = {
      edition: 0,
      land: 39,
      rarity: 0
    }
    let price = ethers.utils.parseUnits("10000", 18);
    await bank.setPriceOfProp(p.edition, p.land, p.rarity, price);

    let user1mono = mono.connect(user1);
    let user1bank = bank.connect(user1);
    await user1mono.approve(bank.address, price);

    await expect(user1bank.buyProp(p.edition, p.land, p.rarity)).to.be.reverted;
  });

  it("should mint 10 Builds (0, 1, 0) to user 1", async function () {

    let b: Build = {
      edition: 0,
      land: 1,
      type: 0
    }

    let user1mono = mono.connect(user1);
    let user1bank = bank.connect(user1);

    let value = (await user1bank.getPriceOfBuild(b.edition, b.land, b.type)).mul(10);
    await user1mono.approve(bank.address, value);

    let tx = await user1bank.buyBuild(b.edition, b.land, b.type, 10);
    let tr = await tx.wait();
    let events = tr.events;
    if (events && events[3] && events[3].args) {
      let id = events[3].args.build_id;
      expect(await build.balanceOf(user1.address, id)).to.equal(10);
    }
    else {
      assert(false, "test fails");
    }
  });

  it("user shall be able to resell to the bank an owned PROP", async function () {
    
    let p: Prop = {
      edition: 0,
      land: 1,
      rarity: 2
    }

    let user1mono = mono.connect(user1);
    let user1bank = bank.connect(user1);
    let user1prop = prop.connect(user1);

    let price = await user1bank.getPriceOfProp(p.edition, p.land, p.rarity);
    await user1mono.approve(bank.address, price);
    let tx = await user1bank.buyProp(p.edition, p.land, p.rarity);
    let tr = await tx.wait();
    let events = tr.events;
    if (events && events[3] && events[3].args) {
      let prop_id = events[3].args.prop_id;
      await user1prop.approve(bank.address, prop_id);
      tx = await user1bank.sellProp(prop_id);
      tr = await tx.wait();
      events = tr.events;
      if (events && events[3] && events[3].args) {
        expect(events[3].args.prop_id).to.equal(prop_id);
      }
      else {
        assert(false, "test fails");
      }
    }
    else {
      assert(false, "test fails");
    }
  });

});
