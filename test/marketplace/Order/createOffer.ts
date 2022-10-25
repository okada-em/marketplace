import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {ContractReceipt} from '@ethersproject/contracts/src.ts';
import {BigNumber, Contract} from "ethers";
import {deployFixture} from "../../utils/fixture";
import {getEventLog} from "../../utils/getEventlog";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {ethers} from "hardhat";

describe("createOffer", function () {
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
      price: decimals.mul(5).toBigInt(),
    });
    await orderManager.connect(signer1).createOrder({
      nftContractAddress: stallionContract.address,
      tokenId: 0,
      erc20: "0x0000000000000000000000000000000000000000",
      price: ethers.utils.parseEther("5"),
    });
  });

  it("[Normally] General price offer", async () => {
    const beforeProposerBalance  = await nbgdContract.balanceOf(signer2.address);
    const offerPrice = decimals.mul(1);
    await expect(orderManager.connect(signer2).createOffer({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
      price: offerPrice,
    })).to.emit(orderManager, "OfferCreated");
    const afterProposerBalance  = await nbgdContract.balanceOf(signer2.address);

    expect(afterProposerBalance).to.equal(beforeProposerBalance.sub(offerPrice));
  });

  it("[Normally] Bidding at a price higher than the current price (native token of the chain)", async () => {
    const beforeProposerBalance  = await provider.getBalance(signer2.address);
    const offerPrice = ethers.utils.parseEther("3");

    const tx: ContractReceipt = await (await orderManager.connect(signer2).createOffer({
      nftContractAddress: stallionContract.address,
      tokenId: 0,
      price: offerPrice,
    }, {value: offerPrice })).wait();
    expect(getEventLog(tx.events, "OfferCreated") !== null).to.equal(true);

    const afterProposerBalance  = await provider.getBalance(signer2.address);

    expect(afterProposerBalance === beforeProposerBalance.sub(offerPrice) );
  });

  it("[Normally] The amount sent in the transaction is greater than or equal to the offer amount", async () => {
    const beforeProposerBalance  = await provider.getBalance(signer2.address);
    const offerPrice = ethers.utils.parseEther("3");
    await expect(orderManager.connect(signer2).createOffer({
      nftContractAddress: stallionContract.address,
      tokenId: 0,
      price: offerPrice,
    }, {value: ethers.utils.parseEther("6") })).to.emit(orderManager, "OfferCreated");
    const afterProposerBalance  = await provider.getBalance(signer2.address);

    expect(afterProposerBalance === beforeProposerBalance.sub(offerPrice) );
  });

  it("[Error] Offer higher than current price", async () => {
    const offerPrice = decimals.mul(7).toBigInt();
    await expect(orderManager.connect(signer2).createOffer({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
      price: offerPrice,
    })).to.revertedWith("createOffer: Offer price higher than current price");
  });

  it("[Error] Lowest price offer", async () => {
    await expect(orderManager.connect(signer2).createOffer({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
      price: 0,
    })).to.revertedWith('createOffer: cannot specify zero for the offer amount');
  });


});



