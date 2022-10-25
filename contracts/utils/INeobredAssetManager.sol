//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface INeobredAssetManager {
  function isErc20Allowed(address erc20) external view returns (bool);

  function isNeobredNft(address erc721) external view returns (bool);
}
