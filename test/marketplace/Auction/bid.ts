import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {ContractReceipt} from '@ethersproject/contracts/src.ts';
import {BigNumber, Contract} from "ethers";
import {deployFixture} from "../../utils/fixture";
import {getEventLog} from "../../utils/getEventlog";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {ethers} from "hardhat";

describe("bid", function () {
  const {provider} = ethers;
  let ownerSigner: SignerWithAddress;
  let signer1: SignerWithAddress, signer2: SignerWithAddress, signer3: SignerWithAddress;
  let nbgdContract: Contract;
  let stallionContract: Contract;
  let raceHorseContract: Contract;
  let auctionManager: Contract;
  const decimals: BigNumber = BigNumber.from([10]).pow(18);

  beforeEach(async function () {
    const fixture = await loadFixture(deployFixture);
    ({ownerSigner, signer1, signer2, signer3} =  fixture.accounts);
    ({nbgdContract, stallionContract, raceHorseContract, auctionManager} =  fixture.contracts);
    await stallionContract.connect(ownerSigner).mint(signer1.address);
    await raceHorseContract.connect(ownerSigner).mint(signer1.address);
    await stallionContract.connect(signer1).setApprovalForAll(auctionManager.address, true);
    await raceHorseContract.connect(signer1).setApprovalForAll(auctionManager.address, true);
    await nbgdContract.connect(ownerSigner).transfer(signer2.address, decimals.mul(10).toBigInt());
    await nbgdContract.connect(ownerSigner).transfer(signer3.address, decimals.mul(10).toBigInt());
    await nbgdContract.connect(signer2).approve(auctionManager.address, decimals.mul(10).toBigInt());
    await nbgdContract.connect(signer3).approve(auctionManager.address, decimals.mul(10).toBigInt());
    await auctionManager.connect(signer1).createAuction({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
      erc20: nbgdContract.address,
      startPrice: decimals.mul(2).toBigInt(),
      duration: 60 * 60 * 24 * 7
    });
    await auctionManager.connect(signer1).createAuction({
      nftContractAddress: stallionContract.address,
      tokenId: 0,
      erc20: "0x0000000000000000000000000000000000000000",
      startPrice: decimals.mul(2).toBigInt(),
      duration: 60 * 60 * 24 * 7
    });
  });

  it("[Normally] First bid in an auction with no bids", async () => {
    const beforeBids = await auctionManager.getBids({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
    });
    const tx: ContractReceipt = await (await auctionManager.connect(signer2).bid({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
      price: decimals.mul(3).toBigInt(),
    })).wait();
    const afterBids = await auctionManager.getBids({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
    });

    expect(beforeBids.length === 0 && afterBids[afterBids.length - 1].price === 3 && getEventLog(tx.events, "BidCreated"));
  });

  it("[Normally] Bid on an auction that already has bids", async () => {
    await auctionManager.connect(signer2).bid({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
      price: decimals.mul(3).toBigInt(),
    });
    const beforeLastHighestBidderBalance = await nbgdContract.balanceOf(signer2.address);

    const tx: ContractReceipt = await (await auctionManager.connect(signer3).bid({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
      price: decimals.mul(4).toBigInt(),
    })).wait();
    const bids = await auctionManager.getBids({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
    });
    const afterLastHighestBidderBalance = await nbgdContract.balanceOf(signer2.address);

    expect(bids[bids.length - 1].price === 4);
    expect(getEventLog(tx.events, "BidCreated"));
    expect(afterLastHighestBidderBalance == beforeLastHighestBidderBalance + 3);
  });

  it("[Normally] Bidding at a price higher than the current price (native token of the chain)", async () => {
    const beforeEtherBalance: BigNumber = await provider.getBalance(signer2.address);
    const tx: ContractReceipt = await (await auctionManager.connect(signer2).bid({
      nftContractAddress: stallionContract.address,
      tokenId: 0,
      price: ethers.utils.parseEther("3"),
    }, {value: ethers.utils.parseEther("3") })).wait();
    const afterEtherBalance: BigNumber = await provider.getBalance(signer2.address);
    expect(afterEtherBalance === beforeEtherBalance.sub(ethers.utils.parseEther("3")));
    expect(getEventLog(tx.events, "BidCreated"));
  });

  it("[Normally] Bidding at a price higher than the current price (native token of the chain)", async () => {
    const beforeEtherBalance: BigNumber = await provider.getBalance(signer2.address);
    await auctionManager.connect(signer2).bid({
      nftContractAddress: stallionContract.address,
      tokenId: 0,
      price: ethers.utils.parseEther("6"),
    }, {value: ethers.utils.parseEther("6") });
    const afterEtherBalance: BigNumber = await provider.getBalance(signer2.address);
    expect(afterEtherBalance === beforeEtherBalance.sub(ethers.utils.parseEther("3")));
  });

  it("[Error] Bid same current highest price", async () => {
    await auctionManager.connect(signer2).bid({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
      price: decimals.mul(3).toBigInt(),
    });

    await expect(auctionManager.connect(signer3).bid({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
      price: decimals.mul(3).toBigInt(),
    })).to.revertedWith("bid: Bid is lower than current price");
  });

  it("[Error] Bid lower than current highest price", async () => {
    await auctionManager.connect(signer2).bid({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
      price: decimals.mul(2).toBigInt(),
    });

    await expect(auctionManager.connect(signer3).bid({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
      price: decimals.mul(1).toBigInt(),
    })).to.revertedWith("bid: Bid is lower than current price");
  });

  it("[Error] Non exist Auction", async () => {
    await expect(auctionManager.connect(signer2).bid({
      nftContractAddress: raceHorseContract.address,
      tokenId: 1,
      price: decimals.mul(2).toBigInt(),
    })).to.revertedWith("bid: auction is not live");
  });

  it("[Error] Bidding by sellers", async () => {
    await expect(auctionManager.connect(signer1).bid({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
      price: decimals.mul(2).toBigInt(),
    })).to.revertedWith('bid: bidder equal seller');
  });

  it("[Error] Insufficient balance (ERC20)", async () => {
    await expect(auctionManager.connect(signer2).bid({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
      price: decimals.mul(20).toBigInt(),
    })).to.revertedWith('LMoneyManager: Purchase amount is insufficient');
  });

});



