//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';
import {LMoneyManager} from '../utils/LMoneyManager.sol';

contract CMarketplaceFeeTaker is Ownable {
  //market place fee 0 - 10000 (0.00 - 100.00)
  uint256 public feeRatio;
  address public treasury;

  event FeeUpdated(uint256 updated);

  constructor(uint256 feeRatio_, address treasury_) {
    feeRatio = feeRatio_;
    treasury = treasury_;
  }

  /**
   * @notice update market place fee
   * @param updated update market place fee
   */
  function updateFee(uint256 updated) external onlyOwner {
    feeRatio = updated;

    emit FeeUpdated(updated);
  }

  /**
   * @notice calculate marketplace fee
   * @param price sell price
   * @return marketplace fee
   */
  function computeFee(uint256 price) public view returns (uint256) {
    return (price * feeRatio) / 10000;
  }

  /**
   * @notice Take commissions from sales and transfer profits to the seller.
   * @param seller seller address
   * @param erc20 erc20 token contract address
   * @param salesAmount amount sold
   * @dev Transfer the fee to the Treasury immediately
   */
  function _sendProfitAndTakeFee(
    address seller,
    address erc20,
    uint256 salesAmount
  ) internal {
    uint256 fee = computeFee(salesAmount);
    uint256 sellerProfit = salesAmount - fee;
    LMoneyManager._sendMoney(erc20, seller, sellerProfit);
    LMoneyManager._sendMoney(erc20, treasury, fee);
  }
}
