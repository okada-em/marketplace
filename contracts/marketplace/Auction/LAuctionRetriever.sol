//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import {LAuctionRegistry} from './LAuctionRegistry.sol';

library LAuctionRetriever {
  /**
   * @notice Retrieve auctions that match the specified condition
   * @param param retrieve Parameters
   * @return auctions list (If no orders match the condition, an empty array is returned)
   */
  function _retrieveAuctions(
    LAuctionRegistry.SRetrieveAuctionsParam memory param,
    mapping(address => mapping(uint256 => LAuctionRegistry.SAuction))
      storage auctions,
    uint256 auctionsCount
  ) internal view returns (LAuctionRegistry.SAuction[] memory) {
    require(param.minPrice < param.maxPrice, "_retrieveAuctions: maxPrice should be higher than minPrice");
    LAuctionRegistry.SAuction[] memory ordersMeedCondition;
    uint256 totalCount;
    (ordersMeedCondition, totalCount) = _pickupAuctions(
      param,
      auctions,
      auctionsCount
    );
    if (totalCount == 0) {
      return ordersMeedCondition;
    }

    LAuctionRegistry.SAuction[]
      memory orderSorted = _sortAuctionArrayAuctionLowestPrice(
        ordersMeedCondition
      );

    LAuctionRegistry.SAuction[]
      memory pageItems = _extractAuctionsForSpecifiedPages(
        orderSorted,
        param.itemsCountPerPage,
        param.page
      );
    return pageItems;
  }

  /**
   * @notice Pick up orders that match your condition
   * @param param retrieve Parameters
   * @return orders list (If no orders match the condition, an empty array is returned)
   * @return totalCount Total count of orders matching the condition
   */
  function _pickupAuctions(
    LAuctionRegistry.SRetrieveAuctionsParam memory param,
    mapping(address => mapping(uint256 => LAuctionRegistry.SAuction))
      storage orders,
    uint256 ordersCount
  ) private view returns (LAuctionRegistry.SAuction[] memory, uint256) {
    LAuctionRegistry.SAuction[]
      memory auctionsMeedCondition = new LAuctionRegistry.SAuction[](
        ordersCount
      );
    uint256 totalCount = 0;
    uint256 orderExistCount = 0;
    for (uint256 i = 0; orderExistCount < ordersCount; i++) {
      LAuctionRegistry.SAuction memory auction = orders[
        param.nftContractAddress
      ][i];
      if (auction.seller != address(0)) {
        orderExistCount++;
      }
      if (auction.seller != param.seller) {
        continue;
      }
      if (auction.erc20 != param.erc20) {
        continue;
      }
      if (param.minPrice > 0 && auction.highestBidPrice < param.minPrice) {
        continue;
      }
      if (param.maxPrice > 0 && auction.highestBidPrice > param.maxPrice) {
        continue;
      }
      auctionsMeedCondition[totalCount] = auction;
      totalCount++;
    }
    if (totalCount == 0) {
      return (auctionsMeedCondition, totalCount);
    }
    LAuctionRegistry.SAuction[]
      memory auctionsMeedConditionResized = new LAuctionRegistry.SAuction[](
        totalCount
      );
    for (uint256 i = 0; i < totalCount; i++) {
      auctionsMeedConditionResized[i] = auctionsMeedCondition[i];
    }
    return (auctionsMeedConditionResized, totalCount);
  }

  /**
   * @notice Sort orders in LAuctionRegistry.SAuction of lowest price
   * @param auctions LAuctionRegistry.SAuction List before sorting
   * @return sorted orders list
   */
  function _sortAuctionArrayAuctionLowestPrice(
    LAuctionRegistry.SAuction[] memory auctions
  ) private pure returns (LAuctionRegistry.SAuction[] memory) {
    for (uint256 i = 0; i < auctions.length; i++) {
      for (uint256 j = i + 1; j < auctions.length; j++) {
        if (auctions[i].highestBidPrice > auctions[j].highestBidPrice) {
          LAuctionRegistry.SAuction memory itemSorting = auctions[i];
          auctions[i] = auctions[j];
          auctions[j] = itemSorting;
        }
      }
    }
    return auctions;
  }

  /**
   * @notice Retrieve auctions for a given page
   * @param auctions LAuctionRegistry.SAuction list
   * @return auctions list on given page
   */
  function _extractAuctionsForSpecifiedPages(
    LAuctionRegistry.SAuction[] memory auctions,
    uint256 itemsCountPerPage,
    uint256 page
  ) private pure returns (LAuctionRegistry.SAuction[] memory) {
    LAuctionRegistry.SAuction[]
      memory pageItems = new LAuctionRegistry.SAuction[](itemsCountPerPage);
    uint256 startIndex = itemsCountPerPage * (page - 1);
    uint256 pageItemsCount = itemsCountPerPage;
    for (uint256 i = 0; i < itemsCountPerPage; i++) {
      if (startIndex + i >= auctions.length) {
        pageItemsCount = i;
        break;
      }
      pageItems[i] = auctions[startIndex + i];
    }
    LAuctionRegistry.SAuction[]
      memory pageItemsResized = new LAuctionRegistry.SAuction[](pageItemsCount);
    for (uint256 i = 0; i < pageItemsCount; i++) {
      pageItemsResized[i] = pageItems[i];
    }
    return pageItemsResized;
  }
}
