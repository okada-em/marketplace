import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {BigNumber, Contract} from "ethers";
import {deployFixture} from "../../utils/fixture";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("retrieveAuctions", function () {
  let ownerSigner: SignerWithAddress;
  let signer1: SignerWithAddress, signer2: SignerWithAddress, signer3: SignerWithAddress;
  let nbgdContract: Contract;
  let raceHorseContract: Contract;
  let auctionManager: Contract;
  const decimals: BigNumber = BigNumber.from([10]).pow(18);

  beforeEach(async function () {
    const fixture = await loadFixture(deployFixture);
    ({ownerSigner, signer1, signer2, signer3} =  fixture.accounts);
    ({nbgdContract, raceHorseContract, auctionManager} =  fixture.contracts);
    await nbgdContract.connect(ownerSigner).transfer(signer2.address, 10);
    await nbgdContract.connect(ownerSigner).transfer(signer3.address, 10);
    await nbgdContract.connect(signer2).approve(auctionManager.address, 10);
    await nbgdContract.connect(signer3).approve(auctionManager.address, 10);
    await raceHorseContract.connect(signer1).setApprovalForAll(auctionManager.address, true);
    await raceHorseContract.connect(signer2).setApprovalForAll(auctionManager.address, true);
    for(let i = 0; i < 20; i++){
      const signer = (i % 2 === 0) ? signer1: signer2;
      await raceHorseContract.connect(ownerSigner).mint(signer.address);
      await auctionManager.connect(signer).createAuction({
        nftContractAddress: raceHorseContract.address,
        tokenId: i,
        erc20: (i % 2 === 0) ? nbgdContract.address: "0x0000000000000000000000000000000000000000",
        startPrice: decimals.mul(2 * i + 1).toBigInt(),
        duration: 60 * 60 * 24 * 7
      });
    }
  });

  it("[Normally] Successful search", async () => {
    const auctions = await auctionManager.retrieveAuctions({
      isSearchForLiveAuctions: true,
      erc20: nbgdContract.address,
      nftContractAddress: raceHorseContract.address,
      seller: signer1.address,
      minPrice: decimals.mul(7).toBigInt(),
      maxPrice: decimals.mul(100).toBigInt(),
      itemsCountPerPage: 100,
      page: 1
    });
    expect(auctions.length === 4 && auctions[-1].highestBidPrice === 17);
  });

  it("[Normally] no results", async () => {
    const auctions = await auctionManager.retrieveAuctions({
      isSearchForLiveAuctions: true,
      erc20: nbgdContract.address,
      nftContractAddress: raceHorseContract.address,
      seller: signer1.address,
      minPrice: 0,
      maxPrice: decimals.mul(1).toBigInt(),
      itemsCountPerPage: 100,
      page: 1
    });
    expect(auctions.length === 0);
  });

  it("[Normally] no search on the specified page", async () => {
    const auctions = await auctionManager.retrieveAuctions({
      isSearchForLiveAuctions: true,
      erc20: nbgdContract.address,
      nftContractAddress: raceHorseContract.address,
      seller: signer1.address,
      minPrice: decimals.mul(7).toBigInt(),
      maxPrice: decimals.mul(100).toBigInt(),
      itemsCountPerPage: 100,
      page: 2
    });
    expect(auctions.length === 0);
  });


});



