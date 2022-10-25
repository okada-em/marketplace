import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {BigNumber, Contract} from "ethers";
import {deployFixture} from "../../utils/fixture";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("cancelAuction", function () {
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
      startPrice: 2,
      duration: 60 * 60 * 24 * 7
    });
  });

  it("[Normally] Canceling an auction with no bids", async () => {
    const beforeOwner: string = await raceHorseContract.ownerOf(0);
    await expect(auctionManager.connect(signer1).cancelAuction({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
    })).to.emit(auctionManager, "AuctionCanceled");
    const afterOwner: string = await raceHorseContract.ownerOf(0);

    const emptyAuction = await auctionManager.getAuction({
      isSearchForLiveAuctions: true,
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
    });

    expect(beforeOwner).to.equal(auctionManager.address);
    expect(afterOwner).to.equal(signer1.address);
    expect(emptyAuction.startAt).to.equal(0);
  });

  it("[Error] Canceling an auction not living", async () => {
    await expect(auctionManager.connect(signer1).cancelAuction({
      nftContractAddress: raceHorseContract.address,
      tokenId: 1,
    })).to.revertedWith("cancelAuction: order is not live");
  });

  it("[Error] Canceling an auction with one bid", async () => {
    await auctionManager.connect(signer3).bid({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
      price: decimals.mul(4).toBigInt(),
    });

    await expect(auctionManager.connect(signer1).cancelAuction({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
    })).to.revertedWith("cancelAuction: Auctions with more than one bid cannot be canceled");
  });

  it("[Error] Cancellation by someone other than the seller", async () => {
    await expect(auctionManager.connect(signer3).cancelAuction({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
    })).to.revertedWith("cancelAuction: you are not seller");
  });


});



