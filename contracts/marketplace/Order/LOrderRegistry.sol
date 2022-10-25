//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library LOrderRegistry {
  //Order info
  struct SOrder {
    //seller address
    address seller;
    //winner address
    address winner;
    //ERC721 contract address
    address nftContractAddress;
    //ERC721 token id
    uint256 tokenId;
    //order created time
    uint256 startAt;
    //ERC20 tokens that accept payment
    address erc20;
    //order price
    uint256 price;
    //live status
    bool isLive;
  }

  //Offer context
  struct SOfferContext {
    address proposer;
    uint256 price;
  }

  //getOrder request param
  struct SGetOrderParam {
    //true to search for liveOrders, false historyOrders
    bool isSearchForLiveOrders;
    address nftContractAddress;
    uint256 tokenId;
  }

  //retrieveOrders request param
  struct SRetrieveOrdersParam {
    bool isSearchForLiveOrders;
    address nftContractAddress;
    address seller;
    address erc20;
    uint256 minPrice;
    uint256 maxPrice;
    uint256 itemsCountPerPage;
    uint256 page;
  }

  //getOffers param
  struct SGetOffersParam {
    address nftContractAddress;
    uint256 tokenId;
  }

  //createOrder request param
  struct SCreateOrderParam {
    address nftContractAddress;
    uint256 tokenId;
    address erc20;
    uint256 price;
  }

  //editOrder request param
  struct SEditOrderParam {
    address nftContractAddress;
    uint256 tokenId;
    uint256 price;
  }

  //cancelOrder request param
  struct SCancelOrderParam {
    address nftContractAddress;
    uint256 tokenId;
  }

  //buy request param
  struct SBuyParam {
    address nftContractAddress;
    uint256 tokenId;
  }

  //acceptOffer request param
  struct SAcceptOfferParam {
    address nftContractAddress;
    uint256 tokenId;
    address proposer;
  }

  //getOffer request param
  struct SGetOfferParam {
    address nftContractAddress;
    uint256 tokenId;
    address proposer;
  }

  //createOffer request param
  struct SCreateOfferParam {
    address nftContractAddress;
    uint256 tokenId;
    uint256 price;
  }

  //cancelOffer request param
  struct SCancelOfferParam {
    address nftContractAddress;
    uint256 tokenId;
  }

  //rejectOffer request param
  struct SRejectOfferParam {
    address nftContractAddress;
    uint256 tokenId;
    address proposer;
  }

  //OrderCanceled event data
  struct SOrderCanceledData {
    address nftContractAddress;
    uint256 tokenId;
  }

  //OrderBought event data
  struct SOrderBoughtData {
    address erc721;
    uint256 tokenId;
    address seller;
    address buyer;
    address erc20;
    uint256 price;
  }

  //OfferAccepted event data
  struct SOfferAcceptedData {
    address erc721;
    uint256 tokenId;
    address seller;
    address buyer;
    address erc20;
    uint256 price;
  }
}
