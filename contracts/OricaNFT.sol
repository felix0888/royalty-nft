//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract OricaNFT is ERC721, ERC721Enumerable, ERC721URIStorage, ERC2981, Ownable {
    using Counters for Counters.Counter;

    struct SIOInfo {
        address receiver;
        uint96 sioFraction;
    }

    mapping(uint256 => SIOInfo) private tokenSIOInfo;

    Counters.Counter private numTokens;

    constructor(string memory _name, string memory _symbol, uint96 _royaltyFeesInBips) ERC721(_name, _symbol) {
        setDefaultRoyaltyInfo(msg.sender, _royaltyFeesInBips);
    }

    function safeMint(uint96 _royaltyFeesInBips, address _sioReceiver, uint96 _sioFeeInBips, string memory _tokenURI) public {
        require(_sioReceiver != address(0), "OricaNFT: invalid SIO receiver");
        require(_sioFeeInBips <= _feeDenominator(), "OricaNFT: SIO fee exceed Royalty");
        require(bytes(_tokenURI).length > 0, "OricaNFT: invalid Token URI");
        numTokens.increment();
        uint256 newTokenId = numTokens.current();
        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, _tokenURI);
        _setTokenRoyalty(newTokenId, msg.sender, _royaltyFeesInBips);
        _setTokenSIO(newTokenId, _sioReceiver, _sioFeeInBips);
    }

    function setDefaultRoyaltyInfo(address _receiver, uint96 _royaltyFeesInBips) public onlyOwner {
        _setDefaultRoyalty(_receiver, _royaltyFeesInBips);
    }

    function sioInfo(uint256 _tokenId, uint256 _royaltyAmount) public view returns (address, uint256) {
        SIOInfo memory sio = tokenSIOInfo[_tokenId];
        uint256 sioAmount = (_royaltyAmount * sio.sioFraction) / _feeDenominator();
        return (sio.receiver, sioAmount);
    }

    function _setTokenSIO(uint256 _tokenId, address _receiver, uint96 _sioFeesInBips) internal {
        tokenSIOInfo[_tokenId] = SIOInfo(_receiver, _sioFeesInBips);
    }

    // override functions
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC2981, ERC721Enumerable) returns (bool) {
        return supportsInterface(interfaceId);
    }

    function tokenURI(uint256 _tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(_tokenId);
    }

    function _beforeTokenTransfer(address _from, address _to, uint256 _tokenId) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(_from, _to, _tokenId);
    }

    function _burn(uint256 _tokenId) internal virtual override(ERC721, ERC721URIStorage) {
        super._burn(_tokenId);
    }
}
