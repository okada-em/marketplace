//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';

/*
 * Manage ERC20 tokens available in Neobred
 */
contract CNeobredAssetManager is Ownable {
  //List of supported ERC20 addresses (token address => boolean)
  mapping(address => bool) erc20AllowedList;
  //List of supported ERC721 addresses (nft contract address => boolean)
  mapping(address => bool) erc721Addresses;

  event ERC20Allowed(address erc20);
  event ERC20Disallowed(address erc20);
  event ERC721Added(address erc721);
  event ERC721Removed(address erc721);

  constructor() {
    erc20AllowedList[address(0)] = true;
  }

  /**
   * @notice Returns whether the specified ERC20 token is supported by Neobred
   * @param erc20 Address of ERC20 to be verified
   * @return true if supported, otherwise false
   */
  function isErc20Allowed(address erc20) public view returns (bool) {
    return erc20AllowedList[erc20];
  }

  /**
   * @notice Allow use of the new ERC20 token
   * @param erc20 new ERC20 token address
   */
  function allowToken(address erc20) external onlyOwner {
    require(isErc20Allowed(erc20) == false, 'allowToken: already allowed');
    erc20AllowedList[erc20] = true;

    emit ERC20Allowed(erc20);
  }

  /**
   * @notice Disallow use of the new ERC20 token
   * @param erc20 disable ERC20 token address
   */
  function disallowToken(address erc20) external onlyOwner {
    require(isErc20Allowed(erc20) == true, 'disallowToken: already disallowed');
    erc20AllowedList[erc20] = false;

    emit ERC20Disallowed(erc20);
  }

  /**
   * @notice Returns whether the specified ERC721 token is Neobred's nft
   * @param erc721 ERC721 token address
   * @return true if supported, otherwise false
   */
  function isNeobredNft(address erc721) public view returns (bool) {
    return erc721Addresses[erc721];
  }

  /**
   * @notice add new nft type into Neobred
   * @param erc721 ERC721 token address
   */
  function addNewNftType(address erc721) external onlyOwner {
    require(isNeobredNft(erc721) == false, 'addNewNft: already exist nft type');
    erc721Addresses[erc721] = true;

    emit ERC721Added(erc721);
  }

  /**
   * @notice remove nft type into Neobred
   * @param erc721 ERC721 token address
   */
  function removeNftType(address erc721) external onlyOwner {
    require(isNeobredNft(erc721) == true, 'addNewNft: not exist nft type');
    erc721Addresses[erc721] = false;

    emit ERC721Removed(erc721);
  }
}
