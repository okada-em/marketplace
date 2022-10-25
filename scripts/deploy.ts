import dotenv from 'dotenv';
import { Contract } from 'ethers';

import { _deploy } from 'utils/_deploy';
dotenv.config();

/**
 * @notice Deploy entry point
 * */
const main = async function(): Promise<void> {
  // NFT
  const stallionContract: Contract = await _deploy('StallionERC721Mock', [
    'Neobred Stallion Token',
    'NeobredStallion'
  ]);
  const raceHorseContract: Contract = await _deploy('RaceHorseERC721Mock', [
    'Neobred RaceHorse Token',
    'NeobredRaceHorse'
  ]);
  // Marketplace
  const marketplaceConstructorArgs = [
    stallionContract.address,
    raceHorseContract.address,
    300
  ];
  await _deploy('OrderItem', marketplaceConstructorArgs);
  await _deploy('AuctionItem', marketplaceConstructorArgs);
};

main();
