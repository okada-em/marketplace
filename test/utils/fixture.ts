import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {Contract} from "ethers";
import {ethers} from "hardhat";
import {_deploy} from "../../scripts/utils/_deploy";

const USDT_CONTRACT_ADDRESS: string = "0xdac17f958d2ee523a2206206994597c13d831ec7";

export const deployFixture = async() => {
  let ownerSigner: SignerWithAddress;
  let signer1: SignerWithAddress, signer2: SignerWithAddress, signer3: SignerWithAddress;
  let treasuryWallet: SignerWithAddress, serverWallet: SignerWithAddress;
  let signers: SignerWithAddress[];
  let nbgdContract: Contract;
  let stallionContract: Contract;
  let raceHorseContract: Contract;
  let assetManager: Contract;
  let auctionManager: Contract;
  let orderManager: Contract;
  let LContext: Contract;
  let LOrderCreator: Contract;
  let LOrderRetriever: Contract;
  [ownerSigner, signer1, signer2, signer3, ...signers] = await ethers.getSigners();
  serverWallet = signers[-1];
  treasuryWallet = signers[signers.length - 2];

  LContext = await _deploy("LContext");
  nbgdContract = await _deploy("CNbgdTokenMock", ["Noebred Govenance Token", "NBGD"]);
  stallionContract = await _deploy("StallionERC721Mock", ["Stallion", "Stallion", "https://neobred.io/nft/stallion/{id}.json"]);
  raceHorseContract = await _deploy("RaceHorseERC721Mock", ["RaceHorse", "RaceHorse", "https://neobred.io/nft/raceHorse/{id}.json"]);
  assetManager = await _deploy("CNeobredAssetManager", );
  auctionManager = await _deploy("CAuctionsManager", [300, treasuryWallet.address, assetManager.address], {LContext: LContext.address });
  LOrderCreator = await _deploy("LOrderCreator", [], {LContext: LContext.address });
  LOrderRetriever = await _deploy("LOrderRetriever");
  orderManager = await _deploy("COrdersManager", [300, treasuryWallet.address, assetManager.address], {LOrderCreator: LOrderCreator.address, LOrderRetriever: LOrderRetriever.address, LContext: LContext.address });

  await assetManager.allowToken(nbgdContract.address);
  await assetManager.allowToken(USDT_CONTRACT_ADDRESS);
  await assetManager.addNewNftType(stallionContract.address);
  await assetManager.addNewNftType(raceHorseContract.address);

  return {
    accounts: {
      ownerSigner,
      signer1,
      signer2,
      signer3,
      treasuryWallet,
      serverWallet,
      signers,
    },
    contracts: {
      nbgdContract,
      stallionContract,
      raceHorseContract,
      assetManager,
      auctionManager,
      orderManager
    },
    props: {
      treasuryAddress: treasuryWallet.address,
      usdtContractAddress: USDT_CONTRACT_ADDRESS,
    }
  };
}
