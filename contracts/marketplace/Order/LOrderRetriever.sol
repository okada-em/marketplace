//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import {LOrderRegistry} from './LOrderRegistry.sol';

library LOrderRetriever {
  /**
   * @notice Retrieve orders that match the specified condition
   * @param param retrieve Parameters
   * @return orders list (If no orders match the condition, an empty array is returned)
   */
  function _retrieveOrders(
    LOrderRegistry.SRetrieveOrdersParam memory param,
    mapping(address => mapping(uint256 => LOrderRegistry.SOrder))
      storage orders,
    uint256 ordersCount
  ) external view returns (LOrderRegistry.SOrder[] memory) {
    LOrderRegistry.SOrder[] memory ordersMeedCondition;
    uint256 totalCount;
    (ordersMeedCondition, totalCount) = _pickupOrders(
      param,
      orders,
      ordersCount
    );
    require(totalCount > 0, '__retrieveOrders: no results');

    LOrderRegistry.SOrder[]
      memory orderSorted = _sortOrderArrayOrderLowestPrice(ordersMeedCondition);

    LOrderRegistry.SOrder[] memory pageItems = _extractOrdersForSpecifiedPages(
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
  function _pickupOrders(
    LOrderRegistry.SRetrieveOrdersParam memory param,
    mapping(address => mapping(uint256 => LOrderRegistry.SOrder))
      storage orders,
    uint256 ordersCount
  ) public view returns (LOrderRegistry.SOrder[] memory, uint256) {
    LOrderRegistry.SOrder[] memory ordersMeedCondition;
    uint256 totalCount = 0;
    uint256 orderExistCount = 0;
    for (uint256 i = 0; orderExistCount < ordersCount; i++) {
      LOrderRegistry.SOrder memory order = orders[param.nftContractAddress][i];
      if (order.seller != address(0)) {
        orderExistCount++;
      }
      if (order.seller != param.seller) {
        continue;
      }
      if (param.erc20 != address(0) && order.erc20 != param.erc20) {
        continue;
      }
      if (param.minPrice > 0 && order.price < param.minPrice) {
        continue;
      }
      if (param.maxPrice > 0 && order.price > param.maxPrice) {
        continue;
      }
      ordersMeedCondition[totalCount] = order;
      totalCount++;
    }
    return (ordersMeedCondition, totalCount);
  }

  /**
   * @notice Sort orders in SOrder of lowest price
   * @param orders List before sorting
   * @return sorted orders list
   */
  function _sortOrderArrayOrderLowestPrice(
    LOrderRegistry.SOrder[] memory orders
  ) public pure returns (LOrderRegistry.SOrder[] memory) {
    for (uint256 i = 0; i < orders.length; i++) {
      for (uint256 j = i + 1; j < orders.length; j++) {
        if (orders[i].price < orders[j].price) {
          LOrderRegistry.SOrder memory itemSorting = orders[i];
          orders[i] = orders[j];
          orders[j] = itemSorting;
        }
      }
    }
    return orders;
  }

  /**
   * @notice Retrieve orders for a given page
   * @param orders LOrderRegistry.SOrder list
   * @return orders list on given page
   */
  function _extractOrdersForSpecifiedPages(
    LOrderRegistry.SOrder[] memory orders,
    uint256 itemsCountPerPage,
    uint256 page
  ) public pure returns (LOrderRegistry.SOrder[] memory) {
    LOrderRegistry.SOrder[] memory pageItems;
    uint256 startIndex = itemsCountPerPage * (page - 1);
    for (uint256 i = 0; i < itemsCountPerPage; i++) {
      pageItems[i] = orders[startIndex + i];
    }
    return pageItems;
  }
}
