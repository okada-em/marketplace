import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {BigNumber, Contract} from "ethers";
import {deployFixture} from "../../utils/fixture";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("getOrder", function () {
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
    await nbgdContract.connect(ownerSigner).transfer(signer2.address, 10);
    await nbgdContract.connect(ownerSigner).transfer(signer3.address, 10);
    await nbgdContract.connect(signer2).approve(orderManager.address, 10);
    await nbgdContract.connect(signer3).approve(orderManager.address, 10);
    await orderManager.connect(signer1).createOrder({
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
      erc20: nbgdContract.address,
      price: decimals.mul(5).toBigInt(),
    });
  });

  it("[Normally] live order", async () => {
    const order = await orderManager.getOrder({
      isSearchForLiveOrders: true,
      nftContractAddress: raceHorseContract.address,
      tokenId: 0,
    });
    expect(order.price > 0);
  });

  it("[Normally] not exist Order", async () => {
    const order = await orderManager.getOrder({
      isSearchForLiveOrders: true,
      nftContractAddress: raceHorseContract.address,
      tokenId: 100,
    });
    expect(order.price === 0);
  });

});



