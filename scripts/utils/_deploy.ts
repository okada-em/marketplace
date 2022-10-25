import { Libraries } from '@nomiclabs/hardhat-ethers/src/types';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';

/**
 * @notice Deploy contracts based on abi and bytecode
 * @param contractName contract name
 * @param contractConstructorArgs contract's constructor args
 * @param libraries (optional) link library
 * @return Contract
 * */
export const _deploy = async function(
  contractName: string,
  contractConstructorArgs?: (string | number)[],
  libraries?: Libraries
): Promise<Contract> {
  const contract = await ethers.getContractFactory(contractName, { libraries });
  const deploying = contractConstructorArgs ?
    await contract.deploy(...contractConstructorArgs) :
    await contract.deploy();
  const deployed: Contract = await deploying.deployed();

  console.log(`successed deploy:  ${contractName}: ${deploying.address}`);
  return deployed;
};
