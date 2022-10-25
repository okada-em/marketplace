import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {BigNumber, Contract} from "ethers";
import {deployFixture} from "../../utils/fixture";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("editOrder", function () {
  let ownerSigner: SignerWithAddress;
  let signer1: SignerWithAddress;
  let signer2: SignerWithAddress;
  let stallionContract: Contract;
  let raceHorseContract: Contract;
  let orderManager: Contract;
  let usdtContractAddress: string;
  const decimals: BigNumber = BigNumber.from([10]).pow(18);

  beforeEach(async function () {
    const fixture = await loadFixture(deployFixture);
    ({ownerSigner, signer1, signer2} =  fixture.accounts);
    ({stallionContract, raceHorseContract, orderManager } =  fixture.contracts);
    ({usdtContractAddress} = fixture.props);
    await stallionContract.connect(ownerSigner).mint(signer1.address);
    await raceHorseContract.connect(ownerSigner).mint(signer1.address);
    await stallionContract.connect(signer1).setApprovalForAll(orderManager.address, true);
    await raceHorseContract.connect(signer1).setApprovalForAll(orderManager.address, true);
    await orderManager.connect(signer1).createOrder({
      nftContractAddress: stallionContract.address,
      tokenId: 0,
      erc20: usdtContractAddress,
      price: decimals.mul(2).toBigInt(),
    });
  });

  it("[Normally] Price change (minimum price)", async () => {
    await expect(orderManager.connect(signer1).editOrder({
      nftContractAddress: stallionContract.address,
      tokenId: 0,
      price: decimals.mul(1).toBigInt(),
    })).to.emit(orderManager, "OrderEdited");

    const editedOrder = await orderManager.getOrder({
      isSearchForLiveOrders: true,
      nftContractAddress: stallionContract.address,
      tokenId: 0,
    });
    expect(editedOrder.price).to.equal(decimals.mul(1).toBigInt());
  });

  it("[Error] lower than minimum price", async () => {
    await expect(orderManager.connect(signer1).editOrder({
      nftContractAddress: stallionContract.address,
      tokenId: 0,
      price: 0,
    })).to.revertedWith("editOrder: Order with more than one bid cannot be cancelled");
  });

  it("[Error] Non seller Edits", async () => {
    await expect(orderManager.connect(signer2).editOrder({
      nftContractAddress: stallionContract.address,
      tokenId: 0,
      price: 0,
    })).to.revertedWith("editOrder: you are not seller");
  });

  it("[Error] non exist nft", async () => {
    await expect(orderManager.connect(signer1).editOrder({
      nftContractAddress: stallionContract.address,
      tokenId: 100,
      price: decimals.mul(3).toBigInt(),
    })).to.revertedWith("editOrder: order is not live");
  });

});



