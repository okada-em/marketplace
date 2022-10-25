import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {BigNumber, Contract} from "ethers";
import {deployFixture} from "../../utils/fixture";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {ethers} from "hardhat";

describe("buy", function () {
  let ownerSigner: SignerWithAddress;
  let signer1: SignerWithAddress, signer2: SignerWithAddress, signer3: SignerWithAddress;
  let treasuryWallet: SignerWithAddress;
  let nbgdContract: Contract;
  let stallionContract: Contract;
  let raceHorseContract: Contract;
  let orderManager: Contract;
  const decimals: BigNumber = BigNumber.from([10]).pow(18);

  beforeEach(async function () {
    const fixture = await loadFixture(deployFixture);
    ({ownerSigner, signer1, signer2, signer3, treasuryWallet} =  fixture.accounts);
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
      price: decimals.mul(5).toBigInt(),
    });
    await orderManager.connect(signer1).createOrder({
      nftContractAddress: stallionContract.address,
      tokenId: 0,
      erc20: "0x0000000000000000000000000000000000000000",
      price: ethers.utils.parseEther("5"),
    });
  });

  it("[Normally] General price order", async () => {
    const beforeSellerBalance = await nbgdContract.balanceOf(signer1.address);
    const beforeTreasuryBalance = await nbgdContract.balanceOf(treasuryWallet.address);
    const order = await orderManager.getOrder({
      isSearchForLiveOrders: true,
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
    });
    await expect(orderManager.connect(signer2).buy({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
    })).to.emit(orderManager, "OrderBought");
    const afterSellerBalance = await nbgdContract.balanceOf(signer1.address);
    const afterTreasuryBalance = await nbgdContract.balanceOf(treasuryWallet.address);
    expect(await raceHorseContract.ownerOf(0)).to.equal(signer2.address);
    const fee = await orderManager.computeFee(order.price);
    const salesAmount = order.price.sub(fee);
    expect(afterSellerBalance).to.equal(beforeSellerBalance.add(salesAmount));
    expect(afterTreasuryBalance).to.equal(beforeTreasuryBalance.add(fee));
  });

  it("[Normally] Buy with offer", async () => {
    const offerPrice = decimals.mul(3).toBigInt();
    await orderManager.connect(signer3).createOffer({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
      price: offerPrice,
    });
    const beforeSellerBalance = await nbgdContract.balanceOf(signer1.address);
    const beforeTreasuryBalance = await nbgdContract.balanceOf(treasuryWallet.address);
    const beforeSigner3Balance = await nbgdContract.balanceOf(signer3.address);

    const order = await orderManager.getOrder({
      isSearchForLiveOrders: true,
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
    });
    await expect(orderManager.connect(signer2).buy({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
    })).to.emit(orderManager, "OrderBought");

    const afterSellerBalance = await nbgdContract.balanceOf(signer1.address);
    const afterTreasuryBalance = await nbgdContract.balanceOf(treasuryWallet.address);
    const afterSigner3Balance = await nbgdContract.balanceOf(signer3.address);
    const fee = await orderManager.computeFee(order.price);
    const salesAmount = order.price.sub(fee);

    expect(await raceHorseContract.ownerOf(0)).to.equal(signer2.address);
    expect(afterSellerBalance).to.equal(beforeSellerBalance.add(salesAmount));
    expect(afterTreasuryBalance).to.equal(beforeTreasuryBalance.add(fee));
    expect(afterSigner3Balance).to.equal(beforeSigner3Balance.add(offerPrice));
  });

  it("[Error] Specify an NFT that is not listed", async () => {
    await expect(orderManager.connect(signer2).buy({
      nftContractAddress: raceHorseContract.address,
      tokenId: 100,
    })).to.revertedWith("buy: order is not live");
  });

  it("[Error] Purchases made by the seller", async () => {
    await expect(orderManager.connect(signer1).buy({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
    })).to.revertedWith("buy: bidder equal seller");
  });

  it("[Error] Insufficient purchase amount", async () => {
    await orderManager.connect(signer1).editOrder({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
      price: decimals.mul(11).toBigInt(),
    });

    await expect(orderManager.connect(signer2).buy({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
    })).to.revertedWith("buy: Purchase amount is insufficient");
  });

  it("[Error] Insufficient purchase amount (native token)", async () => {
    await expect(orderManager.connect(signer2).buy({
      nftContractAddress: stallionContract.address,
      tokenId: 0,
    }, { value: ethers.utils.parseEther("3") })).to.revertedWith("buy: Purchase amount is insufficient");
  });




});



