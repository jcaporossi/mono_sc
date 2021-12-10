// MonopolyBUILD.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

import "./MonopolyBoard.sol";

struct Build {
	// version number
	uint16 edition;
	// id of the cell of Monopoly board
	uint8 land;
	// build type: e.g. 0 -> house, 1 -> hotel, 2 -> hotel
	uint8 buildType;
}

contract MonopolyBuild is ERC1155Supply, AccessControl {
	bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
	bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

	MonopolyBoard private immutable board;

	modifier isValidBuild(
		uint16 edition,
		uint8 land,
		uint8 buildType
	) {
		require(edition <= board.getMaxEdition(), "non valid edition number");
		require(land <= board.getNbLands(edition), "land idx out of range");
		require(buildType <= board.getBuildType(edition), "build_type out of range");
		_;
	}
	mapping(uint256 => Build) private builds;
	uint256[] private buildIDs;

	constructor(string memory _uri, address board_address) ERC1155(_uri) {
		_setupRole(ADMIN_ROLE, msg.sender);
		_setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
		_setupRole(MINTER_ROLE, msg.sender);
		_setRoleAdmin(MINTER_ROLE, ADMIN_ROLE);

		board = MonopolyBoard(board_address);
	}

	function mint(
		address _to,
		uint16 _edition,
		uint8 _land,
		uint8 _buildType,
		uint32 _supply
	) public onlyRole(MINTER_ROLE) isValidBuild(_edition, _land, _buildType) returns (uint256 id_) {
		id_ = generateID(_edition, _land, _buildType);

		_mint(_to, id_, _supply, "");
	}

	function get(uint256 _id) public view returns (Build memory b_) {
		require(exists(_id), "This build does not exist");

		b_ = builds[_id];
	}

	function burn(
		address _account,
		uint256 _id,
		uint32 _amount
	) public {
		_burn(_account, _id, _amount);
	}

	function supportsInterface(bytes4 _interfaceId) public view override(ERC1155, AccessControl) returns (bool) {
		return super.supportsInterface(_interfaceId);
	}

	function totalID() public view returns (uint256) {
		return buildIDs.length;
	}

	function getIDByIndex(uint256 _index) public view returns (uint256) {
		return buildIDs[_index];
	}

	function generateID(
		uint16 _edition,
		uint8 _land,
		uint8 _buildType
	) internal returns (uint256 id_) {
		id_ = uint256(keccak256(abi.encode(_edition, _land, _buildType)));

		if (!exists(id_)) {
			buildIDs.push(id_);
			builds[id_] = Build(_edition, _land, _buildType);
		}
	}
}
