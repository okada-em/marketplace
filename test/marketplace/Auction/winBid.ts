import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {BigNumber, Contract} from "ethers";
import {deployFixture} from "../../utils/fixture";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {ethers} from "hardhat";

describe("winBid", function () {
  const {provider} = ethers;
  let ownerSigner: SignerWithAddress, treasuryWallet: SignerWithAddress;
  let signer1: SignerWithAddress, signer2: SignerWithAddress, signer3: SignerWithAddress;
  let nbgdContract: Contract;
  let stallionContract: Contract;
  let raceHorseContract: Contract;
  let auctionManager: Contract;
  const decimals: BigNumber = BigNumber.from([10]).pow(18);

  beforeEach(async function () {
    const fixture = await loadFixture(deployFixture);
    ({ownerSigner, signer1, signer2, signer3, treasuryWallet} =  fixture.accounts);
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
      startPrice: ethers.utils.parseEther("2"),
      duration: 60 * 60 * 24 * 7
    });
  });

  it("[Normally] Winning an auction with one bid", async () => {
    await (await auctionManager.connect(signer2).bid({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
      price: decimals.mul(3).toBigInt(),
    })).wait();
    const auction = await auctionManager.getAuction({
      isSearchForLiveAuctions: true,
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
    });

    const beforeSellerBalance = await nbgdContract.balanceOf(signer1.address);
    const beforeTreasuryBalance = await nbgdContract.balanceOf(treasuryWallet.address);
    await expect(auctionManager.winBid({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
    })).to.emit(auctionManager,"AuctionWon");
    const afterSellerBalance = await nbgdContract.balanceOf(signer1.address);
    const afterTreasuryBalance = await nbgdContract.balanceOf(treasuryWallet.address);
    const fee = await auctionManager.computeFee(auction.highestBidPrice);
    const sellerProfit = auction.highestBidPrice - fee;
    expect(afterSellerBalance).to.equal(beforeSellerBalance + sellerProfit);
    expect(await raceHorseContract.ownerOf(0)).to.equal(signer2.address);
    expect(afterTreasuryBalance).to.equal(beforeTreasuryBalance + fee);
  });

  it("[Normally] Winning an auction with three bid", async () => {
    await (await auctionManager.connect(signer2).bid({
      nftContractAddress: stallionContract.address,
      tokenId: 0,
      price: ethers.utils.parseEther("3"),
    }, {value: ethers.utils.parseEther("3")})).wait();
    await (await auctionManager.connect(signer3).bid({
      nftContractAddress: stallionContract.address,
      tokenId: 0,
      price: ethers.utils.parseEther("4"),
    }, {value: ethers.utils.parseEther("4")})).wait();
    await (await auctionManager.connect(signer2).bid({
      nftContractAddress: stallionContract.address,
      tokenId: 0,
      price: ethers.utils.parseEther("5"),
    }, {value: ethers.utils.parseEther("5")})).wait();

    const auction = await auctionManager.getAuction({
      isSearchForLiveAuctions: true,
      nftContractAddress: stallionContract.address,
      tokenId: 0,
    });

    const beforeSellerBalance = await provider.getBalance(signer1.address);
    const beforeTreasuryBalance = await provider.getBalance(treasuryWallet.address);
    await expect(auctionManager.winBid({
      nftContractAddress: stallionContract.address,
      tokenId: 0,
    })).to.emit(auctionManager,"AuctionWon");
    const afterSellerBalance = await provider.getBalance(signer1.address);
    const afterTreasuryBalance = await provider.getBalance(treasuryWallet.address);
    const fee: BigNumber = BigNumber.from(await auctionManager.computeFee(auction.highestBidPrice));
    const sellerProfit = auction.highestBidPrice.sub(fee);
    expect(afterSellerBalance).to.equal(beforeSellerBalance.add(sellerProfit));
    expect(afterTreasuryBalance).to.equal(beforeTreasuryBalance.add(fee));
    expect(await stallionContract.ownerOf(0)).to.equal(signer2.address);
  });

  it("[Error] Specified NFT auction does not exist", async () => {
    await expect(auctionManager.winBid({
      nftContractAddress: raceHorseContract.address,
      tokenId: 100,
    })).to.revertedWith("winBid: auction is not live");
  });

});



