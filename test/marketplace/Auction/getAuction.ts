import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {Contract} from "ethers";
import {deployFixture} from "../../utils/fixture";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("getAuction", function () {
  let ownerSigner: SignerWithAddress;
  let signer1: SignerWithAddress, signer2: SignerWithAddress, signer3: SignerWithAddress;
  let nbgdContract: Contract;
  let stallionContract: Contract;
  let raceHorseContract: Contract;
  let auctionManager: Contract;

  beforeEach(async function () {
    const fixture = await loadFixture(deployFixture);
    ({ownerSigner, signer1, signer2, signer3} =  fixture.accounts);
    ({nbgdContract, stallionContract, raceHorseContract, auctionManager} =  fixture.contracts);
    await stallionContract.connect(ownerSigner).mint(signer1.address);
    await raceHorseContract.connect(ownerSigner).mint(signer1.address);
    await stallionContract.connect(signer1).setApprovalForAll(auctionManager.address, true);
    await raceHorseContract.connect(signer1).setApprovalForAll(auctionManager.address, true);
    await nbgdContract.connect(ownerSigner).transfer(signer2.address, 10);
    await nbgdContract.connect(ownerSigner).transfer(signer3.address, 10);
    await nbgdContract.connect(signer2).approve(auctionManager.address, 10);
    await nbgdContract.connect(signer3).approve(auctionManager.address, 10);
    await auctionManager.connect(signer1).createAuction({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
      erc20: nbgdContract.address,
      startPrice: 2,
      duration: 60 * 60 * 24 * 7
    });
  });

  it("[Normally] live auction", async () => {
    const auction = await auctionManager.getAuction({
      isSearchForLiveAuctions: true,
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
    });
    expect(auction.startPrice > 0);
  });

  it("[Normally] not exist Auction", async () => {
    const auction = await auctionManager.getAuction({
      isSearchForLiveAuctions: true,
      nftContractAddress: raceHorseContract.address,
      tokenId: 100,
    });
    expect(auction.startPrice === 0);
  });

});



