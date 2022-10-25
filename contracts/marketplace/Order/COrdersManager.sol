//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {IERC721} from '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import {IERC721Receiver} from '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';
import {LContext} from '../../utils/LContext.sol';
import {LOrderRegistry} from './LOrderRegistry.sol';
import {LMoneyManager} from '../../utils/LMoneyManager.sol';
import {LOrderRetriever} from './LOrderRetriever.sol';
import {LOrderCreator} from './LOrderCreator.sol';
import {COrderOffers} from './COrderOffers.sol';
import {CMarketplaceFeeTaker} from '../CMarketplaceFeeTaker.sol';

contract COrdersManager is CMarketplaceFeeTaker {
  //Number of orders currently live
  //Used to specify the number of loops in a retrieveOrders
  uint256 private _liveOrdersCount;
  //Number of tokens with auction sales history
  //Used to specify the number of loops in a retrieveOrders
  uint256 private _hasOrderHistoryTokenCount;
  //assetManager Contract address
  address private immutable _assetManager;

  //live order Contracts
  //NFT contract address => tokenId => order contract
  mapping(address => mapping(uint256 => LOrderRegistry.SOrder))
    private _liveOrders;
  //offers
  //NFT contract address => tokenId => proposer address => price
  mapping(address => mapping(uint256 => COrderOffers)) private _offerManagers;
  //History order Contracts
  //The most recent history is saved
  //NFT contract address => tokenId => order contract
  mapping(address => mapping(uint256 => LOrderRegistry.SOrder))
    private _historyOrders;

  event OrderCreated(LOrderRegistry.SOrder);
  event OrderEdited(LOrderRegistry.SEditOrderParam);
  event OrderCanceled(LOrderRegistry.SOrderCanceledData);
  event OrderBought(LOrderRegistry.SOrderBoughtData);
  event OfferAccepted(LOrderRegistry.SOfferAcceptedData);
  event OfferCreated(LOrderRegistry.SCreateOfferParam);
  event OfferCanceled(LOrderRegistry.SCancelOfferParam);
  event OfferRejected(LOrderRegistry.SRejectOfferParam);

  constructor(
    uint256 feeRatio_,
    address treasury_,
    address assetManager_
  ) CMarketplaceFeeTaker(feeRatio_, treasury_) {
    _assetManager = assetManager_;
  }

  /**
   * @notice get Order Info
   * @param param (isSearchForLiveOrders, nftContractAddress, tokenId)
   * @return order infos
   */
  function getOrder(LOrderRegistry.SGetOrderParam memory param)
    external
    view
    returns (LOrderRegistry.SOrder memory)
  {
    LOrderRegistry.SOrder memory order;
    if (param.isSearchForLiveOrders) {
      order = _liveOrders[param.nftContractAddress][param.tokenId];
    } else {
      order = _historyOrders[param.nftContractAddress][param.tokenId];
    }

    return order;
  }

  /**
   * @notice Search for orders matching the specified criteria
   * @param param (isSearchForLiveOrders, nftContractAddress, seller, erc20, minPrice, maxPrice, itemsCountPerPage, page)
   * @return search results (Returns an empty array if no hits are found)
   */
  function retrieveOrders(LOrderRegistry.SRetrieveOrdersParam memory param)
    external
    view
    returns (LOrderRegistry.SOrder[] memory)
  {
    LOrderRegistry.SOrder[] memory orderRetrieveResult;
    if (param.isSearchForLiveOrders) {
      orderRetrieveResult = LOrderRetriever._retrieveOrders(
        param,
        _liveOrders,
        _liveOrdersCount
      );
    } else {
      orderRetrieveResult = LOrderRetriever._retrieveOrders(
        param,
        _historyOrders,
        _hasOrderHistoryTokenCount
      );
    }
    return orderRetrieveResult;
  }

  /**
   * @notice get all offers specify order
   * @param param nftContractAddress, tokenId
   * @return offers list(address, price)
   * @dev Returns an empty array if there are no offers
   */
  function getAllOffers(LOrderRegistry.SGetOffersParam memory param)
    external
    view
    returns (LOrderRegistry.SOfferContext[] memory)
  {
    LOrderRegistry.SOrder memory order = _liveOrders[param.nftContractAddress][
      param.tokenId
    ];
    require(order.isLive, 'getOffers: order is not live');
    return
      _offerManagers[param.nftContractAddress][param.tokenId].getAllOffers();
  }

  /**
   * @notice get offer price on specify order
   * @param param nftContractAddress, tokenId, proposer
   * @return offer price (Zero if no offers)
   */
  function getOffer(LOrderRegistry.SGetOfferParam memory param)
    external
    view
    returns (uint256)
  {
    LOrderRegistry.SOrder memory order = _liveOrders[param.nftContractAddress][
      param.tokenId
    ];
    require(order.isLive, 'getOffer: order is not live');

    return
      _offerManagers[param.nftContractAddress][param.tokenId].offers(
        param.proposer
      );
  }

  /**
   * @notice buy order
   * @param param nftContractAddress, tokenId
   */
  function buy(LOrderRegistry.SBuyParam memory param) external payable {
    LOrderRegistry.SOrder memory order = _liveOrders[param.nftContractAddress][
      param.tokenId
    ];
    require(order.isLive, 'buy: order is not live');
    require(order.seller != LContext._msgSender(), 'buy: bidder equal seller');
    require(
      address(0) != order.erc20 &&
        order.price <= IERC20(order.erc20).balanceOf(LContext._msgSender()),
      'buy: Purchase amount is insufficient'
    );
    LMoneyManager._receiveMoney(order.erc20, order.price, msg.value);

    _buy(
      order,
      _offerManagers[param.nftContractAddress][param.tokenId],
      LContext._msgSender(),
      order.price
    );

    _pushOrderHistory(order.nftContractAddress, order.tokenId);

    emit OrderBought(
      LOrderRegistry.SOrderBoughtData(
        order.nftContractAddress,
        order.tokenId,
        order.seller,
        LContext._msgSender(),
        order.erc20,
        order.price
      )
    );
  }

  /**
   * @notice send profits to the seller and transfer nft to the buyer
   * @param order Order to which this offer belongs
   * @param buyer order buyer address
   * @param price buy price
   * @dev When an order with one or more offers is canceled, Process offer refunds
   */
  function _buy(
    LOrderRegistry.SOrder memory order,
    COrderOffers offerManager,
    address buyer,
    uint256 price
  ) internal {
    require(buyer != order.seller, 'buy: seller can not buy mine order');

    _sendProfitAndTakeFee(order.seller, order.erc20, price);

    IERC721(order.nftContractAddress).safeTransferFrom(
      address(this),
      buyer,
      order.tokenId
    );

    if (offerManager.offers(buyer) > 0) {
      offerManager.deleteOffer(buyer);
    }

    _refundAllOffer(offerManager, order.erc20);
  }

  /**
   * @notice refund all offers
   * @param offerManager offers to excute refund
   * @param erc20 erc20 specified in the order
   */
  function _refundAllOffer(COrderOffers offerManager, address erc20) internal {
    for (uint256 i = 0; i < offerManager.getProposersArrayLength(); i++) {
      address proposer = offerManager.proposers(i);
      uint256 offerPrice = offerManager.offers(proposer);

      if (proposer != address(0) && offerPrice > 0) {
        LMoneyManager._sendMoney(erc20, proposer, offerPrice);
        offerManager.deleteOffer(proposer);
      }
    }
  }

  /**
   * @notice Move closed auctions from liveOrders to historyOrders
   * @param nftContractAddress ERC721 contract address
   * @param tokenId ERC721 token id
   */
  function _pushOrderHistory(address nftContractAddress, uint256 tokenId)
    private
  {
    LOrderRegistry.SOrder memory order = _liveOrders[nftContractAddress][
      tokenId
    ];
    if (_historyOrders[nftContractAddress][tokenId].price == 0) {
      _hasOrderHistoryTokenCount++;
    }
    _historyOrders[nftContractAddress][tokenId] = order;
    delete _liveOrders[nftContractAddress][tokenId];
    _liveOrdersCount--;
  }

  /**
   * @notice create new Order
   * @param param nftContractAddress, tokenId, erc20, price
   */
  function createOrder(LOrderRegistry.SCreateOrderParam memory param) external {
    LOrderRegistry.SOrder memory newOrder = LOrderCreator.createOrder(
      param,
      _assetManager,
      address(this)
    );

    _liveOrders[param.nftContractAddress][param.tokenId] = newOrder;
    _liveOrdersCount++;
    _offerManagers[param.nftContractAddress][
      param.tokenId
    ] = new COrderOffers();

    emit OrderCreated(newOrder);
  }

  /**
   * @notice edit order price
   * @param param nftContractAddress, tokenId, price
   * @dev erc20 cannot be changed during the process
   */
  function editOrder(LOrderRegistry.SEditOrderParam memory param) external {
    LOrderRegistry.SOrder storage order = _liveOrders[param.nftContractAddress][
      param.tokenId
    ];
    require(order.isLive, 'editOrder: order is not live');
    require(
      order.seller == LContext._msgSender(),
      'editOrder: you are not seller'
    );
    require(
      param.price > 0,
      'editOrder: Order with more than one bid cannot be cancelled'
    );

    order.price = param.price;

    emit OrderEdited(param);
  }

  /**
   * @notice cancel order
   * @param param nftContractAddress, tokenId
   * @dev When an order with one or more offers is canceled, Process offer refunds
   */
  function cancelOrder(LOrderRegistry.SCancelOrderParam memory param) external {
    LOrderRegistry.SOrder memory order = _liveOrders[param.nftContractAddress][
      param.tokenId
    ];
    require(order.isLive, 'cancelOrder: order is not live');
    require(
      order.seller == LContext._msgSender(),
      'cancelOrder: you are not seller'
    );

    IERC721(param.nftContractAddress).safeTransferFrom(
      address(this),
      LContext._msgSender(),
      param.tokenId
    );

    _refundAllOffer(
      _offerManagers[param.nftContractAddress][param.tokenId],
      order.erc20
    );

    delete _liveOrders[param.nftContractAddress][param.tokenId];
    _liveOrdersCount--;

    emit OrderCanceled(
      LOrderRegistry.SOrderCanceledData(order.nftContractAddress, order.tokenId)
    );
  }

  /**
   * @notice receive offer price and create offer
   * @param param nftContractAddress, tokenId, price
   */
  function createOffer(LOrderRegistry.SCreateOfferParam memory param)
    external
    payable
  {
    LOrderRegistry.SOrder memory order = _liveOrders[param.nftContractAddress][
      param.tokenId
    ];
    require(order.isLive, 'createOffer: order is not live');
    COrderOffers offerManager = _offerManagers[param.nftContractAddress][
      param.tokenId
    ];
    require(
      param.price > 0,
      'createOffer: cannot specify zero for the offer amount'
    );
    require(
      param.price < order.price,
      'createOffer: Offer price higher than current price'
    );
    require(
      offerManager.offers(LContext._msgSender()) == 0,
      'already have offer'
    );

    LMoneyManager._receiveMoney(order.erc20, param.price, msg.value);

    offerManager.createOffer(param.price, LContext._msgSender());

    emit OfferCreated(param);
  }

  /**
   * @notice cancel offer (API entry point)
   * @param param nftContractAddress, tokenId
   */
  function cancelOffer(LOrderRegistry.SCancelOfferParam memory param) external {
    _cancelOffer(
      param.nftContractAddress,
      param.tokenId,
      LContext._msgSender()
    );

    emit OfferCanceled(param);
  }

  /**
   * @notice Accept the offer
   * @param param nftContractAddress, tokenId, proposer
   */
  function acceptOffer(LOrderRegistry.SAcceptOfferParam memory param) external {
    LOrderRegistry.SOrder memory order = _liveOrders[param.nftContractAddress][
      param.tokenId
    ];
    require(order.isLive, 'acceptOffer: order is not live');
    require(
      order.seller == LContext._msgSender(),
      'acceptOffer: caller is not seller'
    );
    uint256 offerPrice = _offerManagers[param.nftContractAddress][param.tokenId]
      .offers(param.proposer);
    require(offerPrice > 0, 'acceptOffer: invalid proposer');

    _buy(
      order,
      _offerManagers[param.nftContractAddress][param.tokenId],
      param.proposer,
      offerPrice
    );

    _pushOrderHistory(order.nftContractAddress, order.tokenId);

    emit OfferAccepted(
      LOrderRegistry.SOfferAcceptedData(
        order.nftContractAddress,
        order.tokenId,
        order.seller,
        param.proposer,
        order.erc20,
        offerPrice
      )
    );
  }

  /**
   * @notice reject offer
   * @param param nftContractAddress, tokenId, proposer;
   */
  function rejectOffer(LOrderRegistry.SRejectOfferParam memory param) external {
    require(
      param.proposer != _msgSender(),
      'rejectOffer: caller equal proposer'
    );
    _cancelOffer(param.nftContractAddress, param.tokenId, param.proposer);

    emit OfferRejected(param);
  }

  /**
   * @notice cancel offer (use internal)
   * @param nftContractAddress erc721 contract address
   * @param tokenId erc721 tokenId
   * @param proposer offer proposer address
   */
  function _cancelOffer(
    address nftContractAddress,
    uint256 tokenId,
    address proposer
  ) private {
    LOrderRegistry.SOrder memory order = _liveOrders[nftContractAddress][
      tokenId
    ];
    require(order.isLive, '_cancelOffer: order is not live');
    uint256 offerPrice = _offerManagers[nftContractAddress][tokenId].offers(
      proposer
    );
    require(offerPrice > 0, '_cancelOffer: proposer has not made an offer');

    _offerManagers[nftContractAddress][tokenId].deleteOffer(proposer);

    LMoneyManager._sendMoney(order.erc20, proposer, offerPrice);
  }

  /**
   * @dev Whenever an {IERC721} `tokenId` token is transferred to this contract via {IERC721-safeTransferFrom}
   */
  function onERC721Received(
    address operator,
    address from,
    uint256 tokenId,
    bytes calldata data
  ) external returns (bytes4) {
    return bytes4(keccak256('onERC721Received(address,address,uint256,bytes)'));
  }
}
