// MonopolyPROP.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

import "./MonopolyBoard.sol";

struct Prop {
	// edition number
	uint16 edition;
	// id of the cell of Monopoly board
	uint8 land;
	// rarity level (as a power of 10, i.e rarity = 1 means 10^1 = 10 versions)
	uint8 rarity;
	// serial number
	uint32 serial;
}

contract MonopolyProp is ERC721Enumerable, AccessControl {
	bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
	bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

	MonopolyBoard private immutable board;

	function isValidProp(
		uint16 edition,
		uint8 land,
		uint8 rarity
	) public view returns (bool) {
		return
			(edition <= board.getMaxEdition()) &&
			(land <= board.getNbLands(edition)) &&
			(board.isBuildingLand(edition, land)) &&
			(rarity <= board.getRarityLevel(edition));
	}

	mapping(uint256 => Prop) private props;
	// Number of minted properties for each (edition, land, rarity) tuple
	mapping(uint16 => mapping(uint8 => mapping(uint8 => uint16))) numOfProps;
	string private baseTokenURI;

	constructor(
		address board_address,
		string memory _name,
		string memory _symbol,
		string memory _baseTokenURI
	) ERC721(_name, _symbol) {
		baseTokenURI = _baseTokenURI;

		_setupRole(ADMIN_ROLE, msg.sender);
		_setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
		_setupRole(MINTER_ROLE, msg.sender);
		_setRoleAdmin(MINTER_ROLE, ADMIN_ROLE);

		board = MonopolyBoard(board_address);
	}

	function _baseURI() internal view override returns (string memory) {
		return baseTokenURI;
	}

	function tokenURI(uint256 _id) public view override returns (string memory) {
		string memory uri = super.tokenURI(_id);

		string memory ext = ".json";

		return string(abi.encodePacked(uri, ext));
	}

	function mint(
		address _to,
		uint16 _edition,
		uint8 _land,
		uint8 _rarity
	) external onlyRole(MINTER_ROLE) returns (uint256 id_) {
		require(isValidProp(_edition, _land, _rarity), "PROP cannot be minted");
		id_ = generateID(_edition, _land, _rarity);

		_safeMint(_to, id_);
	}

	function get(uint256 _id) public view returns (Prop memory p_) {
		require(exists(_id), "This property does not exist");

		p_ = props[_id];
	}

	function exists(uint256 _id) public view returns (bool) {
		return (
			(props[_id].land == 0) && (props[_id].edition == 0) && (props[_id].rarity == 0) && (props[_id].serial == 0)
				? false
				: true
		);
	}

	function getNbOfProps(
		uint16 _edition,
		uint8 _land,
		uint8 _rarity
	) public view returns (uint32 amount_) {
		require(isValidProp(_edition, _land, _rarity), "PROP does not exist");
		return numOfProps[_edition][_land][_rarity];
	}

	function supportsInterface(bytes4 _interfaceId)
		public
		view
		override(ERC721Enumerable, AccessControl)
		returns (bool)
	{
		return super.supportsInterface(_interfaceId);
	}

	function generateID(
		uint16 _edition,
		uint8 _land,
		uint8 _rarity
	) internal returns (uint256 id_) {
		uint32 serial = numOfProps[_edition][_land][_rarity];
		require(serial < 10**_rarity, "all properties already minted");

		numOfProps[_edition][_land][_rarity] += 1;

		id_ = uint256(keccak256(abi.encode(_edition, _land, _rarity, serial)));

		props[id_] = Prop(_edition, _land, _rarity, serial);
	}
}
