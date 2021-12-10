// MonopolyBank.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

import "./MonopolyMono.sol";
import "./MonopolyProp.sol";
import "./MonopolyBuild.sol";

contract MonopolyBank is AccessControl {
	bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
	bytes32 public constant BANKER_ROLE = keccak256("BANKER_ROLE");

	MonopolyProp monopolyPROP;
	MonopolyBuild monopolyBUILD;
	MonopolyMono monopolyMONO;

	// price_by_rarity_by_land_by_edition (prop token)
	mapping(uint16 => mapping(uint8 => mapping(uint8 => uint256))) propTokenPrices;
	// price_by_buildtype_by_land_by_edition (build token)
	mapping(uint16 => mapping(uint8 => mapping(uint8 => uint256))) buildTokenPrices;

	event eBuyProp(address indexed to, uint256 indexed prop_id);
	event eBuyBuild(address indexed to, uint256 indexed build_id, uint32 indexed nb);
	event eSellProp(address indexed seller, uint256 indexed prop_id, uint256 indexed price);
	event eSellBuild(address indexed seller, uint256 indexed prop_id, uint256 indexed price);
	event eWithdraw(address indexed to, uint256 indexed value);

	constructor(
		address _monopolyPROP,
		address _monopolyBUILD,
		address _monopolyMONO
	) {
		require(_monopolyPROP != address(0));
		require(_monopolyBUILD != address(0));
		require(_monopolyMONO != address(0));

		monopolyPROP = MonopolyProp(_monopolyPROP);
		monopolyBUILD = MonopolyBuild(_monopolyBUILD);
		monopolyMONO = MonopolyMono(_monopolyMONO);

		// set prices
		mapping(uint8 => mapping(uint8 => uint256)) storage p = propTokenPrices[0];

		mapping(uint8 => mapping(uint8 => uint256)) storage b = buildTokenPrices[0];

		p[1][0] = 600 ether;
		p[1][1] = 60 ether;
		p[1][2] = 6 ether;
		p[3][0] = 600 ether;
		p[3][1] = 60 ether;
		p[3][2] = 6 ether;
		b[1][0] = b[3][0] = 1 ether;
		b[1][1] = b[3][1] = 2 ether;

		p[5][0] = 100 ether;
		p[5][1] = 10 ether;
		p[5][2] = 1 ether;

		p[6][0] = 1000 ether;
		p[6][1] = 100 ether;
		p[6][2] = 10 ether;
		p[8][0] = 1000 ether;
		p[8][1] = 100 ether;
		p[8][2] = 10 ether;
		p[9][0] = 1200 ether;
		p[9][1] = 120 ether;
		p[9][2] = 12 ether;
		b[6][0] = b[8][0] = b[9][0] = 1 ether;
		b[6][1] = b[8][1] = b[9][1] = 2 ether;

		p[11][0] = 1400 ether;
		p[11][1] = 140 ether;
		p[11][2] = 14 ether;
		p[13][0] = 1400 ether;
		p[13][1] = 140 ether;
		p[13][2] = 14 ether;
		p[14][0] = 1600 ether;
		p[14][1] = 160 ether;
		p[14][2] = 16 ether;
		b[11][0] = b[13][0] = b[14][0] = 1 ether;
		b[11][1] = b[13][1] = b[14][1] = 2 ether;

		p[15][0] = 100 ether;
		p[15][1] = 10 ether;
		p[15][2] = 1 ether;

		p[16][0] = 1800 ether;
		p[16][1] = 180 ether;
		p[16][2] = 18 ether;
		p[18][0] = 1800 ether;
		p[18][1] = 180 ether;
		p[18][2] = 18 ether;
		p[19][0] = 2000 ether;
		p[19][1] = 200 ether;
		p[19][2] = 20 ether;
		b[16][0] = b[18][0] = b[19][0] = 1 ether;
		b[16][1] = b[18][1] = b[19][1] = 2 ether;

		p[21][0] = 2200 ether;
		p[21][1] = 220 ether;
		p[21][2] = 22 ether;
		p[23][0] = 2200 ether;
		p[23][1] = 220 ether;
		p[23][2] = 22 ether;
		p[24][0] = 2400 ether;
		p[24][1] = 240 ether;
		p[24][2] = 24 ether;
		b[21][0] = b[23][0] = b[24][0] = 1 ether;
		b[21][1] = b[23][1] = b[24][1] = 2 ether;

		p[25][0] = 100 ether;
		p[25][1] = 10 ether;
		p[25][2] = 1 ether;

		p[26][0] = 2600 ether;
		p[26][1] = 260 ether;
		p[26][2] = 26 ether;
		p[27][0] = 2600 ether;
		p[27][1] = 260 ether;
		p[27][2] = 26 ether;
		p[29][0] = 2800 ether;
		p[29][1] = 280 ether;
		p[29][2] = 28 ether;
		b[26][0] = b[27][0] = b[29][0] = 1 ether;
		b[26][1] = b[27][1] = b[29][1] = 2 ether;

		p[31][0] = 3000 ether;
		p[31][1] = 300 ether;
		p[31][2] = 30 ether;
		p[32][0] = 3000 ether;
		p[32][1] = 300 ether;
		p[32][2] = 30 ether;
		p[34][0] = 3200 ether;
		p[34][1] = 320 ether;
		p[34][2] = 32 ether;
		b[31][0] = b[32][0] = b[34][0] = 1 ether;
		b[31][1] = b[32][1] = b[34][1] = 2 ether;

		p[35][0] = 100 ether;
		p[35][1] = 10 ether;
		p[35][2] = 1 ether;

		p[37][0] = 3500 ether;
		p[37][1] = 350 ether;
		p[37][2] = 35 ether;
		p[39][0] = 4000 ether;
		p[39][1] = 400 ether;
		p[39][2] = 40 ether;
		b[37][0] = b[39][0] = 1 ether;
		b[37][1] = b[39][1] = 2 ether;

		_setupRole(ADMIN_ROLE, msg.sender);
		_setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
		_setupRole(BANKER_ROLE, msg.sender);
		_setRoleAdmin(BANKER_ROLE, ADMIN_ROLE);
	}

	function buyProp(
		uint16 _edition,
		uint8 _land,
		uint8 _rarity
	) public {
		uint256 price = propTokenPrices[_edition][_land][_rarity];

		require(monopolyMONO.transferFrom(msg.sender, address(this), price), "$MONO transfer failed");

		uint256 prop_id = monopolyPROP.mint(msg.sender, _edition, _land, _rarity);

		emit eBuyProp(msg.sender, prop_id);
	}

	function sellProp(uint256 _id) public {
		require(monopolyPROP.ownerOf(_id) == msg.sender, "cannot sell a non owned property");

		//(version, cell, rarity, serial) = monopolyPROP.get(_id);
		Prop memory prop = monopolyPROP.get(_id);

		/* Bank buys PROP at 30% of selling price */
		uint256 price = (propTokenPrices[prop.edition][prop.land][prop.rarity] * 30) / 100;

		require(monopolyMONO.balanceOf(address(this)) >= price, "Bank does not own enough funds");

		monopolyPROP.safeTransferFrom(msg.sender, address(this), _id);

		monopolyMONO.transfer(msg.sender, price);

		emit eSellProp(msg.sender, _id, price);
	}

	function buyBuild(
		uint16 _version,
		uint8 _cell,
		uint8 _buildType,
		uint32 _amount
	) public payable {
		uint256 price = buildTokenPrices[_version][_cell][_buildType];

		require(monopolyMONO.transferFrom(msg.sender, address(this), _amount * price), "$MONO transfer failed");

		uint256 build_id = monopolyBUILD.mint(msg.sender, _version, _cell, _buildType, _amount);

		emit eBuyBuild(msg.sender, build_id, _amount);
	}

	function sellBuild(uint256 _id, uint32 _amount) public {
		Build memory b = monopolyBUILD.get(_id);

		/* Bank buys BUILD at 30% of selling price */
		uint256 price = (buildTokenPrices[b.edition][b.land][b.buildType] * 30 * _amount) / 100;

		require(monopolyMONO.balanceOf(address(this)) >= price, "Bank does not own enough funds");

		monopolyBUILD.burn(msg.sender, _id, _amount);

		monopolyMONO.transfer(msg.sender, price);

		emit eSellBuild(msg.sender, _id, price);
	}

	function getPriceOfProp(
		uint16 _edition,
		uint8 _land,
		uint8 _rarity
	) public view returns (uint256 price) {
		price = propTokenPrices[_edition][_land][_rarity];
	}

	function getPriceOfBuild(
		uint16 _edition,
		uint8 _land,
		uint8 _buildType
	) public view returns (uint256 price) {
		price = buildTokenPrices[_edition][_land][_buildType];
	}

	function setPriceOfProp(
		uint16 _edition,
		uint8 _land,
		uint8 _rarity,
		uint256 _price
	) public onlyRole(BANKER_ROLE) {
		propTokenPrices[_edition][_land][_rarity] = _price;
	}

	function setPriceOfBuild(
		uint16 _edition,
		uint8 _land,
		uint8 _buildType,
		uint256 _price
	) public onlyRole(BANKER_ROLE) {
		propTokenPrices[_edition][_land][_buildType] = _price;
	}

	function withdraw(address _to, uint256 _value) public onlyRole(BANKER_ROLE) {
		require(monopolyMONO.transfer(_to, _value), "withdraw failure");

		emit eWithdraw(_to, _value);
	}
}
