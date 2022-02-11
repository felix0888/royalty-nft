//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./OricaNFT.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Marketplace {
    using SafeERC20 for IERC20;

    OricaNFT public oricaNFT;
    IERC20 public paymentToken;

    mapping (uint256 => uint256) public tokenPrice;

    event SetForSale(
        uint256 indexed _tokenId,
        uint256 _price,
        bool _onSale,
        address indexed _seller,
        uint256 _timestamp
    );

    event Purchase(
        uint256 indexed _tokenId,
        address indexed _buyer,
        uint256 _timestamp
    );

    constructor(address _oricaNFT, address _paymentToken) {
        oricaNFT = OricaNFT(_oricaNFT);
        paymentToken = IERC20(_paymentToken);
    }

    function setForSale(uint256 _tokenId, uint256 _price, bool _onSale) public {
        require(oricaNFT.ownerOf(_tokenId) == msg.sender, "MarketPlace: not token owner");
        require(oricaNFT.isApprovedForAll(msg.sender, address(this)), "Marketplace: not approved");
        if (_onSale) {
            require(tokenPrice[_tokenId] == 0, "MarketPlace: already on sale");
            require(_price > 0, "MarketPlace: invalid price");
        } else {
            require(tokenPrice[_tokenId] != 0, "MarketPlace: already not on sale");
        }
        tokenPrice[_tokenId] = _onSale ? _price : 0;

        emit SetForSale(_tokenId, _onSale ? _price : 0, _onSale, msg.sender, block.timestamp);
    }

    function purchase(uint256 _tokenId, uint256 _salePrice) public {
        address tokenOwner = oricaNFT.ownerOf(_tokenId);
        require(tokenPrice[_tokenId] > 0, "Marketplace: not on sale");
        require(_salePrice >= tokenPrice[_tokenId], "Marketplace: insufficient funds");
        paymentToken.safeTransferFrom(msg.sender, address(this), _salePrice);
        oricaNFT.safeTransferFrom(tokenOwner, msg.sender, _tokenId);
        tokenPrice[_tokenId] = 0;

        uint256 royaltyAmount = _sendRoyaltyFee(_tokenId, _salePrice);

        paymentToken.safeTransfer(tokenOwner, _salePrice - royaltyAmount);

        emit Purchase(_tokenId, msg.sender, block.timestamp);
    }

    function _sendRoyaltyFee(uint256 _tokenId, uint256 _salePrice) internal returns (uint256) {
        (address royaltyReceiver, uint256 royaltyAmount) = oricaNFT.royaltyInfo(_tokenId, _salePrice);
        if (royaltyAmount == 0) {
            return 0;
        }
        (address sioReceiver, uint256 sioAmount) = oricaNFT.sioInfo(_tokenId, royaltyAmount);
        if (sioReceiver != address(0) && sioAmount != 0) {
            paymentToken.safeTransfer(sioReceiver, sioAmount);
        }
        paymentToken.safeTransfer(royaltyReceiver, royaltyAmount - sioAmount);
        return royaltyAmount;
    }
}
