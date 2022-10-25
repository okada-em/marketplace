//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import {IERC721} from '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import {INeobredAssetManager} from '../../utils/INeobredAssetManager.sol';
import {LAuctionRegistry} from './LAuctionRegistry.sol';

library LAuctionCreator {
  /**
   * @notice create new auction
   * @param param user requests parameter (nftContractAddress, tokenId, erc20, startPrice, duration)
   * @param from nft owner address
   * @param auctionsManager CAuctionsManager contract address
   * @return new auction item contract
   */
  function createAuction(
    LAuctionRegistry.SCreateAuctionParam memory param,
    address assetManager,
    address from,
    address auctionsManager
  ) internal returns (LAuctionRegistry.SAuction memory) {
    require(
      param.duration >= 1 minutes,
      'createAuction: duration is too short'
    );
    require(
      param.startPrice > 0,
      'createAuction: Listed price cannot specify zero'
    );
    require(
      INeobredAssetManager(assetManager).isErc20Allowed(param.erc20),
      'createOrder: this erc20 token is not support'
    );
    require(
      INeobredAssetManager(assetManager).isNeobredNft(param.nftContractAddress),
      "createOrder: this erc721 token is not Neobred's conract"
    );
    require(
      IERC721(param.nftContractAddress).ownerOf(param.tokenId) == from,
      'createAuction: you are not owner for nft'
    );

    IERC721(param.nftContractAddress).safeTransferFrom(
      from,
      auctionsManager,
      param.tokenId
    );

    LAuctionRegistry.SAuction memory newAuction;
    newAuction.nftContractAddress = param.nftContractAddress;
    newAuction.tokenId = param.tokenId;
    newAuction.startPrice = param.startPrice;
    newAuction.highestBidPrice = param.startPrice;
    newAuction.erc20 = param.erc20;
    newAuction.startAt = block.timestamp;
    newAuction.endAt = block.timestamp + param.duration;
    newAuction.seller = from;
    newAuction.isLive = true;
    return newAuction;
  }

  /**
   * @notice cancel auction
   * @param auction canceling auction item
   * @param auctionsManager CAuctionsManager contract address
   */
  function cancelAuction(
    LAuctionRegistry.SAuction memory auction,
    address from,
    address auctionsManager
  ) internal {
    require(auction.isLive, 'cancelAuction: order is not live');
    require(auction.seller == from, 'cancelAuction: you are not seller');
    require(
      auction.startPrice == auction.highestBidPrice,
      'cancelAuction: Auctions with more than one bid cannot be canceled'
    );
    require(
      auction.highestBidPrice > 0,
      'cancelAuction: Auctions with more than one bid cannot be cancelled'
    );

    IERC721(auction.nftContractAddress).safeTransferFrom(
      auctionsManager,
      auction.seller,
      auction.tokenId
    );
  }
}
