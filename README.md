# Neobred Marketplace


**Marketplace for trading Neobred NFTs among users**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview
Neobred Marketplace is a platform where users who want to buy or sell Neobred NFTs can trade with other users.

User who want to sell NFTs can list them for a fixed price or an auction format. User who want to buy NFTs can purchase them by buying, creating a price offer, or bidding in an auction.

The latest build is available at https://marketplace.neobred.com.

## About Neobred
Neobred is a blockchain game in which players can earn by running in races with racehorses they have trained.

The game is a turn-based training game, and the status of the completed racehorse depends on what kind of training is executed within the specified number of turns.

By mastering the horse training game, you can earn by buying and selling high quality completed horses, or you can earn by buying completed horses and playing only online races.


## Two exhibit style
Users who want to sell their NFTs can choose to list them either as "Order" or "Auction".

### 1. Order (Fixed Price Item)

This is a basic style of listing with a fixed price.

Users who want to buy NFTs at a lower price can make a reduced offer on a fixed price listing.

User making the offer (call "Proposer") pays the amount of the offer to the smart contract when the offer is made.

Proposer can cancel offer.

If the seller accepts the offer, the smart contract transfers the amount to the seller, minus a commission.

When proposer cancel offer, seller rejected offer, or another user bought , the smart contract sends back the proposer.

### 2. Auction (English Style)
Users who want to buy NFTs can also bid on the auction.

Users who bid (call "Bidder") pay the bid amount into the smart contract at bidding.

Bidder **can't** cancel bid.

Seller can't cancel Auction with one or more than bid.

When auction is end, smart contract transfers the seller the amount of the highest bid, minus the commission.

When a bid is placed at a higher price than old highest bid, the smart contract will send back the amount to the old highest bidder.

## Multi-currency support
Seller chooses in which currency will receive the sells at the time of the sale.
Buyer pays in the currency selected by the seller.
