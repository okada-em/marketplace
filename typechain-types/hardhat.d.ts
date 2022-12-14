/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { ethers } from "ethers";
import {
  FactoryOptions,
  HardhatEthersHelpers as HardhatEthersHelpersBase,
} from "@nomiclabs/hardhat-ethers/types";

import * as Contracts from ".";

declare module "hardhat/types/runtime" {
  interface HardhatEthersHelpers extends HardhatEthersHelpersBase {
    getContractFactory(
      name: "Ownable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Ownable__factory>;
    getContractFactory(
      name: "Pausable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Pausable__factory>;
    getContractFactory(
      name: "IERC20Permit",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC20Permit__factory>;
    getContractFactory(
      name: "IERC20",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC20__factory>;
    getContractFactory(
      name: "ERC721",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC721__factory>;
    getContractFactory(
      name: "IERC721Metadata",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC721Metadata__factory>;
    getContractFactory(
      name: "IERC721",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC721__factory>;
    getContractFactory(
      name: "IERC721Receiver",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC721Receiver__factory>;
    getContractFactory(
      name: "ERC165",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC165__factory>;
    getContractFactory(
      name: "IERC165",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC165__factory>;
    getContractFactory(
      name: "INeobredERC20Manager",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.INeobredERC20Manager__factory>;
    getContractFactory(
      name: "NeobredERC20Manager",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.NeobredERC20Manager__factory>;
    getContractFactory(
      name: "INeobredERC721Manager",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.INeobredERC721Manager__factory>;
    getContractFactory(
      name: "NeobredERC721Manager",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.NeobredERC721Manager__factory>;
    getContractFactory(
      name: "IContractAddressRegistry",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IContractAddressRegistry__factory>;
    getContractFactory(
      name: "AuctionBids",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.AuctionBids__factory>;
    getContractFactory(
      name: "AuctionItem",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.AuctionItem__factory>;
    getContractFactory(
      name: "AuctionList",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.AuctionList__factory>;
    getContractFactory(
      name: "AuctionTimer",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.AuctionTimer__factory>;
    getContractFactory(
      name: "MarketplaceFeeTaker",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.MarketplaceFeeTaker__factory>;
    getContractFactory(
      name: "MoneySenderToTreasury",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.MoneySenderToTreasury__factory>;
    getContractFactory(
      name: "PausebleOnlyOwner",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.PausebleOnlyOwner__factory>;

    getContractAt(
      name: "Ownable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.Ownable>;
    getContractAt(
      name: "Pausable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.Pausable>;
    getContractAt(
      name: "IERC20Permit",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC20Permit>;
    getContractAt(
      name: "IERC20",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC20>;
    getContractAt(
      name: "ERC721",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC721>;
    getContractAt(
      name: "IERC721Metadata",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC721Metadata>;
    getContractAt(
      name: "IERC721",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC721>;
    getContractAt(
      name: "IERC721Receiver",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC721Receiver>;
    getContractAt(
      name: "ERC165",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC165>;
    getContractAt(
      name: "IERC165",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC165>;
    getContractAt(
      name: "INeobredERC20Manager",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.INeobredERC20Manager>;
    getContractAt(
      name: "NeobredERC20Manager",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.NeobredERC20Manager>;
    getContractAt(
      name: "INeobredERC721Manager",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.INeobredERC721Manager>;
    getContractAt(
      name: "NeobredERC721Manager",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.NeobredERC721Manager>;
    getContractAt(
      name: "IContractAddressRegistry",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IContractAddressRegistry>;
    getContractAt(
      name: "AuctionBids",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.AuctionBids>;
    getContractAt(
      name: "AuctionItem",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.AuctionItem>;
    getContractAt(
      name: "AuctionList",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.AuctionList>;
    getContractAt(
      name: "AuctionTimer",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.AuctionTimer>;
    getContractAt(
      name: "MarketplaceFeeTaker",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.MarketplaceFeeTaker>;
    getContractAt(
      name: "MoneySenderToTreasury",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.MoneySenderToTreasury>;
    getContractAt(
      name: "PausebleOnlyOwner",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.PausebleOnlyOwner>;

    // default types
    getContractFactory(
      name: string,
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<ethers.ContractFactory>;
    getContractFactory(
      abi: any[],
      bytecode: ethers.utils.BytesLike,
      signer?: ethers.Signer
    ): Promise<ethers.ContractFactory>;
    getContractAt(
      nameOrAbi: string | any[],
      address: string,
      signer?: ethers.Signer
    ): Promise<ethers.Contract>;
  }
}
