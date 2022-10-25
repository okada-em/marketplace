//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20, SafeERC20} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import {LContext} from './LContext.sol';

//Receive money(ERC20 Token or Chain's Native Token) from user to the contract
library LMoneyManager {
  using SafeERC20 for IERC20;

  /**
   * @notice Receive amount sent by the user
   * @param erc20 erc20 token address
   * @param amount price
   * @param msgValue amount sent by the user
   */
  function _receiveMoney(
    address erc20,
    uint256 amount,
    uint256 msgValue
  ) internal {
    if (address(0) == erc20) {
      require(
        msgValue >= amount,
        'LMoneyManager: Purchase amount is insufficient'
      );
      _sendBackOverValue(msgValue, amount);
    } else {
      if (msgValue > 0) {
        payable(msg.sender).transfer(msgValue);
      }
      uint256 userBalance = IERC20(erc20).balanceOf(LContext._msgSender());
      require(
        userBalance >= amount,
        'LMoneyManager: Purchase amount is insufficient'
      );
      IERC20(erc20).safeTransferFrom(
        LContext._msgSender(),
        address(this),
        amount
      );
    }
  }

  /**
   * @notice When the token is sent over the purchase amount, send it back
   * @param msgValue msgValue
   * @param price Required purchase amount
   * @param msgValue Amount transferred in the transaction
   */
  function _sendBackOverValue(uint256 msgValue, uint256 price) private {
    uint256 surplusAmount = msgValue - price;
    if (surplusAmount > 0) {
      payable(msg.sender).transfer(surplusAmount);
    }
  }

  /**
   * @notice Transfer amount sent to user
   * @param erc20 erc20 token address
   * @param to receiver address
   * @param amount price
   */
  function _sendMoney(
    address erc20,
    address to,
    uint256 amount
  ) internal {
    require(amount > 0, 'LMoneyManager: amount should be a number more than 0');
    if (erc20 == address(0)) {
      payable(to).transfer(amount);
    } else {
      IERC20(erc20).safeTransfer(to, amount);
    }
  }
}
