//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import {IERC721} from '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import {IERC721Receiver} from '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';
import {LAuctionRegistry} from './LAuctionRegistry.sol';
import {LMoneyManager} from '../../utils/LMoneyManager.sol';
import {LAuctionRetriever} from './LAuctionRetriever.sol';
import {LAuctionCreator} from './LAuctionCreator.sol';
import {CMarketplaceFeeTaker} from '../CMarketplaceFeeTaker.sol';
import {LContext} from '../../utils/LContext.sol';

contract CAuctionsManager is CMarketplaceFeeTaker, IERC721Receiver {
  //Number of auctions currently live
  //Used to specify the number of loops in a retrieveAuctions
  uint256 private _liveAuctionsCount;
  //Number of tokens with auction sales history
  //Used to specify the number of loops in a retrieveAuctions
  uint256 private _hasAuctionHistoryTokenCount;
  //Neobred Asset Manager contract's address
  address private immutable _assetManagerAddress;

  //Current auction Contracts
  //NFT contract address => tokenId => auction contract
  mapping(address => mapping(uint256 => LAuctionRegistry.SAuction))
    private _liveAuctions;
  //auction bids
  //NFT contract address => tokenId => auction's bid array
  mapping(address => mapping(uint256 => LAuctionRegistry.SAuctionBidContext[]))
    private _bids;
  //History auction Contracts
  //The most recent history is saved
  //NFT contract address => tokenId => auction contracts array
  mapping(address => mapping(uint256 => LAuctionRegistry.SAuction))
    private _historyAuctions;

  event AuctionCreated(LAuctionRegistry.SAuction);
  event AuctionWon(LAuctionRegistry.SAuctionWonData);
  event BidCreated(
    LAuctionRegistry.SAuction,
    LAuctionRegistry.SAuctionBidContext
  );
  event AuctionCanceled(LAuctionRegistry.SCancelAuctionParam);

  constructor(
    uint256 feeRatio_,
    address treasury_,
    address assetManager_
  ) CMarketplaceFeeTaker(feeRatio_, treasury_) {
    _assetManagerAddress = assetManager_;
  }

  /**
   * @notice get Auction Info
   * @param param (isSearchForLiveAuctions, nftContractAddress, tokenId)
   * @return auction infos
   */
  function getAuction(LAuctionRegistry.SGetAuctionParam memory param)
    external
    view
    returns (LAuctionRegistry.SAuction memory)
  {
    LAuctionRegistry.SAuction memory auction;
    if (param.isSearchForLiveAuctions) {
      auction = _liveAuctions[param.nftContractAddress][param.tokenId];
    } else {
      auction = _historyAuctions[param.nftContractAddress][param.tokenId];
    }
    return auction;
  }

  /**
   * @notice get all bids
   * @param param (nftContractAddress, tokenId)
   * @return auction's bids array
   */
  function getBids(LAuctionRegistry.SGetBidsParam memory param)
    external
    view
    returns (LAuctionRegistry.SAuctionBidContext[] memory)
  {
    return _bids[param.nftContractAddress][param.tokenId];
  }

  /**
   * @notice Search for auctions matching the specified criteria
   * @param param (nftContractAddress, seller, erc20, minPrice, maxPrice, itemsCountPerPage, page
   * @return search results (Returns an empty array if no hits are found)
   */
  function retrieveAuctions(
    LAuctionRegistry.SRetrieveAuctionsParam memory param
  ) external view returns (LAuctionRegistry.SAuction[] memory) {
    LAuctionRegistry.SAuction[] memory auctionRetrieveResult;
    if (param.isSearchForLiveAuctions) {
      auctionRetrieveResult = LAuctionRetriever._retrieveAuctions(
        param,
        _liveAuctions,
        _liveAuctionsCount
      );
    } else {
      auctionRetrieveResult = LAuctionRetriever._retrieveAuctions(
        param,
        _historyAuctions,
        _hasAuctionHistoryTokenCount
      );
    }
    return auctionRetrieveResult;
  }

  /**
   * @notice create new Auction
   * @param param create auction parameters
   */
  function createAuction(LAuctionRegistry.SCreateAuctionParam memory param)
    external
  {
    LAuctionRegistry.SAuction memory auction = LAuctionCreator.createAuction(
      param,
      _assetManagerAddress,
      LContext._msgSender(),
      address(this)
    );

    _liveAuctions[param.nftContractAddress][param.tokenId] = auction;
    _liveAuctionsCount++;

    emit AuctionCreated(auction);
  }

  /**
   * @notice cancel auction
   * @param param nftContractAddress, tokenId
   */
  function cancelAuction(LAuctionRegistry.SCancelAuctionParam memory param)
    external
  {
    LAuctionRegistry.SAuction memory auction = _liveAuctions[
      param.nftContractAddress
    ][param.tokenId];

    LAuctionCreator.cancelAuction(
      auction,
      LContext._msgSender(),
      address(this)
    );

    delete _liveAuctions[param.nftContractAddress][param.tokenId];
    _liveAuctionsCount--;

    emit AuctionCanceled(param);
  }

  /**
   * @notice win Auction
   * @param param nftContractAddress, tokenId, salesAmount
   * @dev Called by neobred's server at the end of the auction
   */
  function winBid(LAuctionRegistry.SWinBidParam memory param) external {
    LAuctionRegistry.SAuction memory auction = _liveAuctions[
      param.nftContractAddress
    ][param.tokenId];
    require(auction.isLive, 'winBid: auction is not live');
    LAuctionRegistry.SAuctionBidContext[] memory bids = _bids[
      param.nftContractAddress
    ][param.tokenId];
    require(bids.length > 0, 'winBid: non bid');
    LAuctionRegistry.SAuctionBidContext memory highestBid = bids[
      bids.length - 1
    ];
    require(highestBid.price > 0, 'winBid: bid price is zero');

    _sendProfitAndTakeFee(auction.seller, auction.erc20, highestBid.price);

    IERC721(auction.nftContractAddress).safeTransferFrom(
      address(this),
      highestBid.bidderAddress,
      auction.tokenId
    );

    _pushAuctionHistory(auction.nftContractAddress, auction.tokenId);

    emit AuctionWon(
      LAuctionRegistry.SAuctionWonData(
        auction.nftContractAddress,
        auction.tokenId,
        auction.seller,
        highestBid.bidderAddress,
        auction.erc20,
        highestBid.price,
        auction.startAt,
        auction.endAt
      )
    );
  }

  /**
   * @notice Move closed auctions from liveAuctions to historyAuctions
   * @param nftContractAddress ERC721 contract address
   * @param tokenId ERC721 token id
   */
  function _pushAuctionHistory(address nftContractAddress, uint256 tokenId)
    private
  {
    LAuctionRegistry.SAuction memory auction = _liveAuctions[
      nftContractAddress
    ][tokenId];
    auction.isLive = false;
    if (_historyAuctions[nftContractAddress][tokenId].startPrice == 0) {
      _hasAuctionHistoryTokenCount++;
    }
    _historyAuctions[nftContractAddress][tokenId] = auction;
    delete _liveAuctions[nftContractAddress][tokenId];
    _liveAuctionsCount--;
  }

  /**
   * @notice bid auction
   * @param param bidderAddress, bidPrice;
   * @dev The user pays at the time of bidding.
   *      They get a refund when a bidder higher than theirs comes along
   */
  function bid(LAuctionRegistry.SBidParam memory param) external payable {
    LAuctionRegistry.SAuction storage auction = _liveAuctions[
      param.nftContractAddress
    ][param.tokenId];
    require(auction.isLive, 'bid: auction is not live');

    LAuctionRegistry.SAuctionBidContext memory lastHighestBid;
    if (_bids[param.nftContractAddress][param.tokenId].length > 0) {
      lastHighestBid = _bids[param.nftContractAddress][param.tokenId][
        _bids[param.nftContractAddress][param.tokenId].length - 1
      ];
    }
    require(_msgSender() != auction.seller, 'bid: bidder equal seller');
    require(
      _msgSender() != lastHighestBid.bidderAddress,
      'bid: You are already the highest bidder'
    );
    require(
      param.price > lastHighestBid.price,
      'bid: Bid is lower than current price'
    );

    LMoneyManager._receiveMoney(auction.erc20, param.price, msg.value);

    if (lastHighestBid.price > 0) {
      LMoneyManager._sendMoney(
        auction.erc20,
        lastHighestBid.bidderAddress,
        lastHighestBid.price
      );
    }

    LAuctionRegistry.SAuctionBidContext memory newBid;
    newBid.bidderAddress = _msgSender();
    newBid.price = param.price;

    auction.highestBidPrice = param.price;
    _bids[param.nftContractAddress][param.tokenId].push(newBid);

    emit BidCreated(auction, newBid);
  }

  /**
   * @dev Whenever an {IERC721} `tokenId` token is transferred to this contract via {IERC721-safeTransferFrom}
   */
  function onERC721Received(
    address operator,
    address from,
    uint256 tokenId,
    bytes calldata data
  ) external pure returns (bytes4) {
    return bytes4(keccak256('onERC721Received(address,address,uint256,bytes)'));
  }
}
