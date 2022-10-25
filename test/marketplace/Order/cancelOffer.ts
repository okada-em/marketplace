import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {BigNumber, Contract} from "ethers";
import {deployFixture} from "../../utils/fixture";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {ethers} from "hardhat";

describe("cancelOffer", function () {
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
    await orderManager.connect(signer2).createOffer({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
      price: decimals.mul(3).toBigInt(),
    });
    await orderManager.connect(signer1).createOrder({
      nftContractAddress: stallionContract.address,
      tokenId: 0,
      erc20: "0x0000000000000000000000000000000000000000",
      price: decimals.mul(5).toBigInt()
    });
    await orderManager.connect(signer3).createOffer({
      nftContractAddress: stallionContract.address,
      tokenId: 0,
      price: decimals.mul(3).toBigInt(),
    }, {value: decimals.mul(3).toBigInt()});
  });

  it("[Normally] Canceling my offer", async () => {
    const beforeBalance: BigNumber = await nbgdContract.balanceOf(signer2.address);
    const offerPrice = await orderManager.getOffer({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
      proposer: signer2.address
    });
    await expect(orderManager.connect(signer2).cancelOffer({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
    })).to.emit(orderManager, "OfferCanceled");
    const afterBalance: BigNumber = await nbgdContract.balanceOf(signer2.address);

    expect(afterBalance).to.equal(beforeBalance.add(offerPrice));
  });

  it("[Normally] Canceling my offer (use native token)", async () => {
    const beforeBalance: BigNumber = await provider.getBalance(signer3.address);
    const offerPrice = await orderManager.getOffer({
      nftContractAddress: stallionContract.address,
      tokenId: 0,
      proposer: signer3.address
    });
    await expect(orderManager.connect(signer3).cancelOffer({
      nftContractAddress: stallionContract.address,
      tokenId: 0,
    })).to.emit(orderManager, "OfferCanceled");
    const afterBalance: BigNumber = await provider.getBalance(signer3.address);

    expect(afterBalance === beforeBalance.add(offerPrice));
  });

  it("[Error] non exist order", async () => {
    await expect(orderManager.connect(signer2).cancelOffer({
      nftContractAddress: stallionContract.address,
      tokenId: 100,
    })).to.revertedWith('_cancelOffer: order is not live');
  });

  it("[Error] proposer don't have order", async () => {
    await expect(orderManager.connect(signer2).cancelOffer({
      nftContractAddress: stallionContract.address,
      tokenId: 0,
    })).to.revertedWith("_cancelOffer: proposer has not made an offer");
  });


});



