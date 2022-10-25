//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LContext} from '../../utils/LContext.sol';
import {IERC721} from '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import {INeobredAssetManager} from '../../utils/INeobredAssetManager.sol';
import {LOrderRegistry} from './LOrderRegistry.sol';

library LOrderCreator {
  /**
   * @notice Lock NFTs and Create OrderItem Contract
   * @param param user request parameter (nftContractAddress, tokenId, erc20, price)
   * @return orderItem Contract (add to order list at caller)
   */
  function createOrder(
    LOrderRegistry.SCreateOrderParam memory param,
    address assetManager,
    address orderManagerAddress
  ) external returns (LOrderRegistry.SOrder memory) {
    require(param.price > 0, 'createOrder: invalid price');
    require(
      INeobredAssetManager(assetManager).isErc20Allowed(param.erc20),
      'createOrder: this erc20 token is not support'
    );
    require(
      INeobredAssetManager(assetManager).isNeobredNft(param.nftContractAddress),
      "createOrder: this erc721 token is not Neobred's conract"
    );
    require(
      IERC721(param.nftContractAddress).ownerOf(param.tokenId) ==
        LContext._msgSender(),
      'createOrder: you are not owner for nft'
    );

    IERC721(param.nftContractAddress).safeTransferFrom(
      LContext._msgSender(),
      orderManagerAddress,
      param.tokenId
    );

    LOrderRegistry.SOrder memory newOrder;
    newOrder.nftContractAddress = param.nftContractAddress;
    newOrder.tokenId = param.tokenId;
    newOrder.price = param.price;
    newOrder.erc20 = param.erc20;
    newOrder.startAt = block.timestamp;
    newOrder.seller = LContext._msgSender();
    newOrder.isLive = true;
    return newOrder;
  }
}
