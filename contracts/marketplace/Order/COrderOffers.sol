//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import {LContext} from '../../utils/LContext.sol';
import {LOrderRegistry} from './LOrderRegistry.sol';

contract COrderOffers {
  //offer count
  uint256 public offersCount;
  //"proposers" and "offersCount" use to refund a voided offer when an order is purchased
  //proposer address list
  address[] public proposers;
  //all offer list on this order
  //proposer address => offer price
  mapping(address => uint256) public offers;

  /**
   * @notice get all offers on this order
   * @return offers list(address, price)
   * @dev Returns an empty array if there are no offers
   */
  function getAllOffers()
    external
    view
    returns (LOrderRegistry.SOfferContext[] memory)
  {
    LOrderRegistry.SOfferContext[] memory offerInfos;
    for (uint256 i = 0; i < proposers.length; i++) {
      offerInfos[i] = LOrderRegistry.SOfferContext(
        proposers[i],
        offers[proposers[i]]
      );
    }
    return offerInfos;
  }

  /**
   * @notice Add offer data to offers (call from createOffer)
   * @param price offer price
   */
  function createOffer(uint256 price, address proposer) external {
    require(proposer != address(0), '_updateOfferPrice: invalid proposer');
    require(offers[proposer] == 0, 'createOffer: proposer already offer');
    require(price > 0, '_updateOfferPrice: offer price must be more than zero');

    proposers.push(proposer);
    offersCount++;
    offers[proposer] = price;
  }

  /**
   * @notice delete offer data
   * @param proposer address of the proposer of the offer to cancel
   */
  function deleteOffer(address proposer) external {
    require(proposer != address(0), 'deleteOffer: invalid proposer');
    require(offers[proposer] > 0, "deleteOffer: proposer hasn't offer");

    require(_deleteProposer(proposer), 'deleteOffer: invalid proposer');

    offersCount--;
  }

  /**
   * @notice get proposers array length
   * @dev If order have a canceled offer, proposers.length and offerCount are different.
   *       (proposers.length is greater by the number of canceled offers)
   */
  function getProposersArrayLength() public view returns (uint256) {
    return proposers.length;
  }

  /**
   * @notice delete a specified proposer from the offer list
   * @param proposer Address of the proposer to be deleted
   * @return true if a proposer is present, otherwise false
   */
  function _deleteProposer(address proposer) private returns (bool) {
    bool result = false;
    for (uint256 i = 0; i < proposers.length; i++) {
      if (proposers[i] == proposer) {
        delete proposers[i];
        offers[proposer] = 0;
        result = true;
        break;
      }
    }
    return result;
  }
}
