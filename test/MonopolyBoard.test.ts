import { ethers } from "hardhat";
import { expect, assert } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { MonopolyBoard } from "../typechain";

describe("MonopolyBoard contract", function () {
    
    var board: MonopolyBoard;
    var accounts: SignerWithAddress[];
    var deployer: SignerWithAddress;

    type Board = {
        lands: number;
        rarity_lvl: number;
        buildings: number[];
        build_lvl: number;
    }

    beforeEach(async function () {
        const BoardFactory = await ethers.getContractFactory("MonopolyBoard");
    
        board = await BoardFactory.deploy();
        await board.deployed();
    
        accounts = await ethers.getSigners();
        deployer = accounts[0];
    });


    it("should return proper number of lands ", async function () {
        expect(await board.getNbLands(0)).to.equal(40);
    });

    it("should return true when land is a building plot", async function () {
        expect(await board.isBuildingLand(0, 1)).to.equal(true);
    });

    it("should return false when a land is not a building plot", async function () {
        expect(await board.isBuildingLand(0, 0)).to.equal(false);
    });

    it("should return proper max edition", async function () {
        expect(await board.getMaxEdition()).to.equal(0);
    });

    it("should return proper rarity level", async function () {
        expect(await board.getRarityLevel(0)).to.equal(2);
    });

    it("should return proper build type", async function () {
        expect(await board.getBuildType(0)).to.equal(1); 
    });

    it("should deploy a new version", async function () {

        let b: Board = {
            lands: 30,
            rarity_lvl: 10,
            build_lvl: 4,
            buildings: [1, 2, 3, 6, 8]
        };

        let tx = await board.newBoard(b.lands, b.rarity_lvl, b.buildings, b.build_lvl);
        let tr = await tx.wait();
        let events = tr.events;
        if (events && events[0] && events[0].args) {
            let edition_nb = events[0].args.new_edition_nb;
            expect(await board.getMaxEdition()).to.equal(1);
            expect(await board.getNbLands(edition_nb)).to.equal(b.lands);
            expect(await board.getRarityLevel(edition_nb)).to.equal(b.rarity_lvl);
            expect(await board.getBuildType(edition_nb)).to.equal(b.build_lvl);
            for (let i = 0; i < b.buildings.length; i++){
                expect(await board.isBuildingLand(edition_nb, b.buildings[i])).to.equal(true);
            }
        }
        else{
            assert(false, "test fails");
        }

    });
});