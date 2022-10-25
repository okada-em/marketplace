//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//Structs used in the auction
library LAuctionRegistry {
  //Auction Info
  struct SAuction {
    //erc721 contract address
    address nftContractAddress;
    //erc20 token address to accept payment
    address erc20;
    //seller address
    address seller;
    //erc721 token id
    uint256 tokenId;
    //auction start time
    uint256 startAt;
    //auction end date
    uint256 endAt;
    //auction's duration
    uint256 duration;
    //start price
    uint256 startPrice;
    //current price
    uint256 highestBidPrice;
    //is Selling
    bool isLive;
  }

  //bid context
  struct SAuctionBidContext {
    address bidderAddress;
    uint256 price;
  }

  //getAuction request param
  struct SGetAuctionParam {
    bool isSearchForLiveAuctions;
    address nftContractAddress;
    uint256 tokenId;
  }

  //getBids request param
  struct SGetBidsParam {
    address nftContractAddress;
    uint256 tokenId;
  }

  //retrieveAuctions request param
  struct SRetrieveAuctionsParam {
    bool isSearchForLiveAuctions;
    address nftContractAddress;
    address seller;
    address erc20;
    uint256 minPrice;
    uint256 maxPrice;
    uint256 itemsCountPerPage;
    uint256 page;
  }

  //bid request param
  struct SBidParam {
    address nftContractAddress;
    uint256 tokenId;
    uint256 price;
  }

  //createAuction request param
  struct SCreateAuctionParam {
    address nftContractAddress;
    uint256 tokenId;
    address erc20;
    uint256 startPrice;
    uint256 duration;
  }

  //winBid param
  struct SWinBidParam {
    address nftContractAddress;
    uint256 tokenId;
  }

  //cancelAuction param
  struct SCancelAuctionParam {
    address nftContractAddress;
    uint256 tokenId;
  }

  //AuctionWon event data
  struct SAuctionWonData {
    address nftContractAddress;
    uint256 tokenId;
    address seller;
    address winner;
    address erc20;
    uint256 price;
    uint256 startAt;
    uint256 endAt;
  }

  //AuctionCanceled event data
  struct SAuctionCanceledData {
    address nftContractAddress;
    uint256 tokenId;
  }
}
