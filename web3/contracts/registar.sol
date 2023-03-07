// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract FileRegistrar is ERC721 {
    using Counters for Counters.Counter;

    struct FileMetadata {
        string name;
        string description;
        string fileLink;
        bytes32 fileHash;
    }

    mapping(uint256 => FileMetadata) private _fileMetadata;

    Counters.Counter private _tokenIds;

    address payable private _owner;
    uint256 private _feeAmount;

    constructor(
        string memory name_,
        string memory symbol_,
        address payable owner_,
        uint256 feeAmount_
    ) ERC721(name_, symbol_) {
        _owner = owner_;
        _feeAmount = feeAmount_;
    }

    function registerFile(
        string memory name,
        string memory description,
        string memory fileLink,
        bytes32 fileHash
    ) external payable returns (uint256) {
        require(msg.value >= _feeAmount, "FileRegistrar: fee too low");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        _safeMint(msg.sender, newTokenId);
        _fileMetadata[newTokenId] = FileMetadata(name, description, fileLink, fileHash);

        _owner.transfer(_feeAmount);

        return newTokenId;
    }

    function getFileMetadata(uint256 tokenId) external view returns (FileMetadata memory) {
        require(_exists(tokenId), "FileRegistrar: token does not exist");

        return _fileMetadata[tokenId];
    }

    function setOwner(address payable owner_) external {
        require(msg.sender == _owner, "FileRegistrar: only owner can set new owner");
        _owner = owner_;
    }

    function setFeeAmount(uint256 feeAmount_) external {
        require(msg.sender == _owner, "FileRegistrar: only owner can set fee amount");
        _feeAmount = feeAmount_;
    }
}