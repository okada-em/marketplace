import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {BigNumber, Contract} from "ethers";
import {deployFixture} from "../../utils/fixture";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("acceptOffer", function () {
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

  it("[Normally] Receive a single offer", async () => {
    const beforeSellerBalance = await nbgdContract.balanceOf(signer1.address);
    const beforeTreasuryBalance = await nbgdContract.balanceOf(treasuryWallet.address);
    const offerPrice = await orderManager.getOffer({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
      proposer: signer2.address
    });
    await expect(orderManager.connect(signer1).acceptOffer({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
      proposer: signer2.address
    })).to.emit(orderManager, "OfferAccepted");
    const afterSellerBalance = await nbgdContract.balanceOf(signer1.address);
    const afterTreasuryBalance = await nbgdContract.balanceOf(treasuryWallet.address);
    expect(await raceHorseContract.ownerOf(0)).to.equal(signer2.address);
    const fee = await orderManager.computeFee(offerPrice);
    const salesAmount = offerPrice.sub(fee);
    expect(afterSellerBalance).to.equal(beforeSellerBalance.add(salesAmount));
    expect(afterTreasuryBalance).to.equal(beforeTreasuryBalance.add(fee));
  });

  it("[Error] Specify an NFT that is not listed", async () => {
    await expect(orderManager.connect(signer1).acceptOffer({
      nftContractAddress: raceHorseContract.address,
      tokenId: 100,
      proposer: signer2.address
    })).to.revertedWith('acceptOffer: order is not live');
  });

  it("[Error] Calls by non-sellers", async () => {
    await expect(orderManager.connect(signer3).acceptOffer({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
      proposer: signer2.address
    })).to.revertedWith('acceptOffer: caller is not seller');
  });

  it("[Error] non exist offer", async () => {
    await expect(orderManager.connect(signer1).acceptOffer({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
      proposer: signer3.address
    })).to.revertedWith('acceptOffer: invalid proposer');
  });

});



