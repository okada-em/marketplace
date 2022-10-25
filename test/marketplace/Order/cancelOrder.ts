import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {BigNumber, Contract} from "ethers";
import {deployFixture} from "../../utils/fixture";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {ethers} from "hardhat";

describe("cancelOrder", function () {
  const {provider} = ethers;
  let ownerSigner: SignerWithAddress;
  let signer1: SignerWithAddress, signer2: SignerWithAddress, signer3: SignerWithAddress;
  let nbgdContract: Contract;
  let stallionContract: Contract;
  let raceHorseContract: Contract;
  let orderManager: Contract;
  const decimals: BigNumber = BigNumber.from([10]).pow(18);

  beforeEach(async function () {
    const fixture = await loadFixture(deployFixture);
    ({ownerSigner, signer1, signer2, signer3} =  fixture.accounts);
    ({nbgdContract, stallionContract, raceHorseContract, orderManager} =  fixture.contracts);
    await stallionContract.connect(ownerSigner).mint(signer1.address);
    await raceHorseContract.connect(ownerSigner).mint(signer1.address);
    await stallionContract.connect(signer1).setApprovalForAll(orderManager.address, true);
    await raceHorseContract.connect(signer1).setApprovalForAll(orderManager.address, true);
    await nbgdContract.connect(ownerSigner).transfer(signer2.address, decimals.mul(10).toBigInt());
    await nbgdContract.connect(ownerSigner).transfer(signer3.address, decimals.mul(10).toBigInt());
    await nbgdContract.connect(signer2).approve(orderManager.address, decimals.mul(10).toBigInt());
    await nbgdContract.connect(signer3).approve(orderManager.address, decimals.mul(10).toBigInt());
    await orderManager.connect(signer1).createOrder({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
      erc20: nbgdContract.address,
      price: decimals.mul(5).toBigInt()
    });
    await orderManager.connect(signer1).createOrder({
      nftContractAddress: stallionContract.address,
      tokenId: 0,
      erc20: "0x0000000000000000000000000000000000000000",
      price: ethers.utils.parseEther("5"),
    });
  });

  it("[Normally] Canceling an auction with no offers", async () => {
    const beforeOwner: string = await raceHorseContract.ownerOf(0);
    await expect(orderManager.connect(signer1).cancelOrder({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
    })).to.emit(orderManager, "OrderCanceled");
    const afterOwner: string = await raceHorseContract.ownerOf(0);

    const emptyOrder = await orderManager.getOrder({
      isSearchForLiveOrders: true,
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
    });

    expect(beforeOwner).to.equal(orderManager.address);
    expect(afterOwner).to.equal(signer1.address);
    expect(emptyOrder.startAt).to.equal(0);
  });

  it("[Normally] Canceling an order has offer", async () => {
    const offerPrice = decimals.mul(1).toBigInt();
    await orderManager.connect(signer2).createOffer({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
      price: offerPrice,
    });
    const beforeSigner2Balance = await nbgdContract.balanceOf(signer2.address);
    await expect(orderManager.connect(signer1).cancelOrder({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
    })).to.emit(orderManager, "OrderCanceled");
    const afterSigner2Balance = await nbgdContract.balanceOf(signer2.address);

    expect(afterSigner2Balance).to.equal(beforeSigner2Balance.add(offerPrice));
  });

  it("[Normally] Canceling an order has offer (native token)", async () => {
    const offerPrice = ethers.utils.parseEther("3");
    await orderManager.connect(signer3).createOffer({
      nftContractAddress: stallionContract.address,
      tokenId: 0,
      price: offerPrice
    }, {value: offerPrice});
    const beforeSigner2Balance = await provider.getBalance(signer3.address);
    await expect(orderManager.connect(signer1).cancelOrder({
      nftContractAddress: stallionContract.address,
      tokenId: 0,
    })).to.emit(orderManager, "OrderCanceled");
    const afterSigner2Balance = await provider.getBalance(signer3.address);

    expect(afterSigner2Balance).to.equal(beforeSigner2Balance.add(offerPrice));
  });

  it("[Error] Canceling an auction not living", async () => {
    await expect(orderManager.connect(signer1).cancelOrder({
      nftContractAddress: raceHorseContract.address,
      tokenId: 1,
    })).to.revertedWith("cancelOrder: order is not live");
  });

  it("[Error] Cancellation by someone other than the seller", async () => {
    await expect(orderManager.connect(signer3).cancelOrder({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
    })).to.revertedWith("cancelOrder: you are not seller");
  });

});



