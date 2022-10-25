import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {ContractReceipt} from '@ethersproject/contracts/src.ts';
import {BigNumber, Contract} from "ethers";
import {deployFixture} from "../../utils/fixture";
import {getEventLog} from "../../utils/getEventlog";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("createOrder", function () {
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
  });

  it("[Normally] General Price Listings", async () => {
    const tokenId = 0;
    const tx: ContractReceipt = await (await orderManager.connect(signer1).createOrder({
      nftContractAddress: stallionContract.address,
      tokenId,
      erc20: usdtContractAddress,
      price: decimals.mul(2).toBigInt(),
    })).wait();

    const order = await orderManager.getOrder({isSearchForLiveOrders: true, nftContractAddress: stallionContract.address, tokenId });

    expect(await stallionContract.ownerOf(tokenId)).to.equal(orderManager.address);
    expect(getEventLog(tx.events, "OrderCreated"))
    expect(order.seller).to.be.equal(signer1.address);
  });

  it("[Normally] Selling at lowest price", async () => {
    const tokenId = 0;
    const tx: ContractReceipt = await (await orderManager.connect(signer1).createOrder({
      nftContractAddress: stallionContract.address,
      tokenId,
      erc20: usdtContractAddress,
      price: decimals.mul(1).toBigInt(),

    })).wait();

    const order = await orderManager.getOrder({isSearchForLiveOrders: true, nftContractAddress: stallionContract.address, tokenId });

    expect(await stallionContract.ownerOf(tokenId)).to.equal(orderManager.address);
    expect(getEventLog(tx.events, "OrderCreated"))
    expect(order.seller).to.be.equal(signer1.address);
  });

  it("[Normally] Selling at highest price", async () => {
    const tokenId = 0;
    const tx: ContractReceipt = await (await orderManager.connect(signer1).createOrder({
      nftContractAddress: stallionContract.address,
      tokenId,
      erc20: usdtContractAddress,
      price: BigNumber.from("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"),

    })).wait();

    const order = await orderManager.getOrder({isSearchForLiveOrders: true, nftContractAddress: stallionContract.address, tokenId });

    expect(await stallionContract.ownerOf(tokenId)).to.equal(orderManager.address);
    expect(getEventLog(tx.events, "OrderCreated"))
    expect(order.seller).to.be.equal(signer1.address);
  })

  it("[Normally] List by specifying a chain native token", async () => {
    const tokenId = 0;
    const tx: ContractReceipt = await (await orderManager.connect(signer1).createOrder({
      nftContractAddress: stallionContract.address,
      tokenId,
      erc20: "0x0000000000000000000000000000000000000000",
      price: decimals.mul(2).toBigInt(),

    })).wait();

    const order = await orderManager.getOrder({isSearchForLiveOrders: true, nftContractAddress: stallionContract.address, tokenId });

    expect(await stallionContract.ownerOf(tokenId)).to.equal(orderManager.address);
    expect(getEventLog(tx.events, "OrderCreated"))
    expect(order.seller).to.be.equal(signer1.address);
  });

  it("[Normally] Selling raceHorse", async () => {
    const tokenId = 0;
    const tx: ContractReceipt = await (await orderManager.connect(signer1).createOrder({
      nftContractAddress: raceHorseContract.address,
      tokenId,
      erc20: usdtContractAddress,
      price: decimals.mul(2).toBigInt(),

    })).wait();

    const order = await orderManager.getOrder({isSearchForLiveOrders: true, nftContractAddress: raceHorseContract.address, tokenId });

    expect(await raceHorseContract.ownerOf(tokenId)).to.equal(orderManager.address);
    expect(getEventLog(tx.events, "OrderCreated"))
    expect(order.seller).to.be.equal(signer1.address);
  });

  it("[Error] Listing NFTs You Don't Own", async () => {
    const tokenId = 0;
    await expect(orderManager.connect(signer2).createOrder({
      nftContractAddress: stallionContract.address,
      tokenId,
      erc20: usdtContractAddress,
      price: decimals.mul(2).toBigInt(),

    })).to.revertedWith("createOrder: you are not owner for nft");
    expect(await stallionContract.ownerOf(tokenId)).to.equal(signer1.address);
  });

  it("[Error] Listing non-existing NFTs", async () => {
    const tokenId = 100;
    await expect(orderManager.connect(signer1).createOrder({
      nftContractAddress: stallionContract.address,
      tokenId,
      erc20: usdtContractAddress,
      price: decimals.mul(2).toBigInt(),

    })).to.revertedWith("ERC721: invalid token ID");
  });

  it("[Error] Below minimum starting price", async () => {
    const tokenId = 0;
    await expect(orderManager.connect(signer1).createOrder({
      nftContractAddress: stallionContract.address,
      tokenId,
      erc20: usdtContractAddress,
      price: 0,

    })).to.revertedWith("createOrder: invalid price");
    expect(await stallionContract.ownerOf(tokenId)).to.equal(signer1.address);
  });

  it("[Error] non-allowed ERC20", async () => {
    const tokenId = 0;
    await expect(orderManager.connect(signer1).createOrder({
      nftContractAddress: stallionContract.address,
      tokenId,
      erc20: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE", //SHIBA INU
      price: decimals.mul(2).toBigInt(),

    })).to.revertedWith("createOrder: this erc20 token is not support");
    expect(await stallionContract.ownerOf(tokenId)).to.equal(signer1.address);
  });

  it("[Error] Already listed in order", async () => {
    const tokenId = 0;
    await (await orderManager.connect(signer1).createOrder({
      nftContractAddress: stallionContract.address,
      tokenId,
      erc20: usdtContractAddress,
      price: decimals.mul(2).toBigInt(),

    })).wait();

    await expect(orderManager.connect(signer1).createOrder({
      nftContractAddress: stallionContract.address,
      tokenId,
      erc20: usdtContractAddress,
      price: decimals.mul(2).toBigInt(),

    })).to.revertedWith("createOrder: you are not owner for nft");
  });

});



