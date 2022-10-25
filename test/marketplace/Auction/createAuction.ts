import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {ContractReceipt} from '@ethersproject/contracts/src.ts';
import {BigNumber, Contract} from "ethers";
import {deployFixture} from "../../utils/fixture";
import {getEventLog} from "../../utils/getEventlog";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("createAuction", function () {
  let ownerSigner: SignerWithAddress;
  let signer1: SignerWithAddress;
  let signer2: SignerWithAddress;
  let stallionContract: Contract;
  let raceHorseContract: Contract;
  let auctionManager: Contract;
  let usdtContractAddress: string;
  const decimals: BigNumber = BigNumber.from([10]).pow(18);

  beforeEach(async function () {
    const fixture = await loadFixture(deployFixture);
    ({ownerSigner, signer1, signer2} =  fixture.accounts);
    ({stallionContract, raceHorseContract, auctionManager} =  fixture.contracts);
    ({usdtContractAddress} = fixture.props);
    await stallionContract.connect(ownerSigner).mint(signer1.address);
    await raceHorseContract.connect(ownerSigner).mint(signer1.address);
    await stallionContract.connect(signer1).setApprovalForAll(auctionManager.address, true);
    await raceHorseContract.connect(signer1).setApprovalForAll(auctionManager.address, true);
  });

  it("[Normally] General Price Listings", async () => {
    const tokenId = 0;
    const tx: ContractReceipt = await (await auctionManager.connect(signer1).createAuction({
      nftContractAddress: stallionContract.address,
      tokenId,
      erc20: usdtContractAddress,
      startPrice: decimals.mul(2).toBigInt(),
      duration: 60 * 60 * 24 * 7
    })).wait();

    const auction = await auctionManager.getAuction({isSearchForLiveAuctions: true, nftContractAddress: stallionContract.address, tokenId });

    expect(await stallionContract.ownerOf(tokenId)).to.equal(auctionManager.address);
    expect(getEventLog(tx.events, "AuctionCreated"))
    expect(auction.seller).to.be.equal(signer1.address);
  });

  it("[Normally] Selling at lowest price", async () => {
    const tokenId = 0;
    const tx: ContractReceipt = await (await auctionManager.connect(signer1).createAuction({
      nftContractAddress: stallionContract.address,
      tokenId,
      erc20: usdtContractAddress,
      startPrice: decimals.mul(1).toBigInt(),
      duration: 60 * 60 * 24 * 7
    })).wait();

    const auction = await auctionManager.getAuction({isSearchForLiveAuctions: true, nftContractAddress: stallionContract.address, tokenId });

    expect(await stallionContract.ownerOf(tokenId)).to.equal(auctionManager.address);
    expect(getEventLog(tx.events, "AuctionCreated"))
    expect(auction.seller).to.be.equal(signer1.address);
  });

  it("[Normally] Selling at highest price", async () => {
    const tokenId = 0;
    const tx: ContractReceipt = await (await auctionManager.connect(signer1).createAuction({
      nftContractAddress: stallionContract.address,
      tokenId,
      erc20: usdtContractAddress,
      startPrice: BigNumber.from("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"),
      duration: 60 * 60 * 24 * 7
    })).wait();

    const auction = await auctionManager.getAuction({isSearchForLiveAuctions: true, nftContractAddress: stallionContract.address, tokenId });

    expect(await stallionContract.ownerOf(tokenId)).to.equal(auctionManager.address);
    expect(getEventLog(tx.events, "AuctionCreated"))
    expect(auction.seller).to.be.equal(signer1.address);
  })

  it("[Normally] List by specifying a chain native token", async () => {
    const tokenId = 0;
    const tx: ContractReceipt = await (await auctionManager.connect(signer1).createAuction({
      nftContractAddress: stallionContract.address,
      tokenId,
      erc20: "0x0000000000000000000000000000000000000000",
      startPrice: decimals.mul(2).toBigInt(),
      duration: 60 * 60 * 24 * 7
    })).wait();

    const auction = await auctionManager.getAuction({isSearchForLiveAuctions: true, nftContractAddress: stallionContract.address, tokenId });

    expect(await stallionContract.ownerOf(tokenId)).to.equal(auctionManager.address);
    expect(getEventLog(tx.events, "AuctionCreated"))
    expect(auction.seller).to.be.equal(signer1.address);
  });

  it("[Normally] Selling raceHorse", async () => {
    const tokenId = 0;
    const tx: ContractReceipt = await (await auctionManager.connect(signer1).createAuction({
      nftContractAddress: raceHorseContract.address,
      tokenId,
      erc20: usdtContractAddress,
      startPrice: decimals.mul(2).toBigInt(),
      duration: 60 * 60 * 24 * 7
    })).wait();

    const auction = await auctionManager.getAuction({isSearchForLiveAuctions: true, nftContractAddress: raceHorseContract.address, tokenId });

    expect(await raceHorseContract.ownerOf(tokenId)).to.equal(auctionManager.address);
    expect(getEventLog(tx.events, "AuctionCreated"))
    expect(auction.seller).to.be.equal(signer1.address);
  });

  it("[Error] Listing NFTs You Don't Own", async () => {
    const tokenId = 0;
    await expect(auctionManager.connect(signer2).createAuction({
      nftContractAddress: stallionContract.address,
      tokenId,
      erc20: usdtContractAddress,
      startPrice: decimals.mul(2).toBigInt(),
      duration: 60 * 60 * 24 * 7
    })).to.revertedWith("createAuction: you are not owner for nft");
    expect(await stallionContract.ownerOf(tokenId)).to.equal(signer1.address);
  });

  it("[Error] Listing non-existing NFTs", async () => {
    const tokenId = 100;
    await expect(auctionManager.connect(signer1).createAuction({
      nftContractAddress: stallionContract.address,
      tokenId,
      erc20: usdtContractAddress,
      startPrice: decimals.mul(2).toBigInt(),
      duration: 60 * 60 * 24 * 7
    })).to.revertedWith("ERC721: invalid token ID");
  });

  it("[Error] Below minimum starting price", async () => {
    const tokenId = 0;
    await expect(auctionManager.connect(signer1).createAuction({
      nftContractAddress: stallionContract.address,
      tokenId,
      erc20: usdtContractAddress,
      startPrice: 0,
      duration: 60 * 60 * 24 * 7
    })).to.revertedWith("createAuction: Listed price cannot specify zero");
    expect(await stallionContract.ownerOf(tokenId)).to.equal(signer1.address);
  });

  it("[Error] non-allowed ERC20", async () => {
    const tokenId = 0;
    await expect(auctionManager.connect(signer1).createAuction({
      nftContractAddress: stallionContract.address,
      tokenId,
      erc20: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE", //SHIBA INU
      startPrice: decimals.mul(2).toBigInt(),
      duration: 60 * 60 * 24 * 7
    })).to.revertedWith("createOrder: this erc20 token is not support");
    expect(await stallionContract.ownerOf(tokenId)).to.equal(signer1.address);
  });

  it("[Error] Already listed in auction", async () => {
    const tokenId = 0;
    await (await auctionManager.connect(signer1).createAuction({
      nftContractAddress: stallionContract.address,
      tokenId,
      erc20: usdtContractAddress,
      startPrice: decimals.mul(2).toBigInt(),
      duration: 60 * 60 * 24 * 7
    })).wait();

    await expect(auctionManager.connect(signer1).createAuction({
      nftContractAddress: stallionContract.address,
      tokenId,
      erc20: usdtContractAddress,
      startPrice: decimals.mul(2).toBigInt(),
      duration: 60 * 60 * 24 * 7
    })).to.revertedWith("createAuction: you are not owner for nft");
  });

});



