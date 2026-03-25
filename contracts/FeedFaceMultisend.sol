// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract FeedFaceMultisend {
    using SafeERC20 for IERC20;

    error EthTransferFailed();
    error EthRefundFailed();

    struct EthTransfer {
        address to;
        uint256 amount;
    }

    struct TokenTransfer {
        address token;
        address to;
        uint256 amount;
    }

    struct Permit {
        address token;
        uint256 value;
        uint256 deadline;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    function disperse(
        address sender,
        EthTransfer[] calldata ethTransfers,
        TokenTransfer[] calldata tokenTransfers,
        Permit[] calldata permits
    ) external payable {
        for (uint256 i = 0; i < permits.length;) {
            IERC20Permit(permits[i].token).permit(
                sender, address(this), permits[i].value, permits[i].deadline, permits[i].v, permits[i].r, permits[i].s
            );
            unchecked {
                ++i;
            }
        }

        uint256 ethSpent;
        for (uint256 i = 0; i < ethTransfers.length;) {
            (bool ok,) = ethTransfers[i].to.call{value: ethTransfers[i].amount}("");
            if (!ok) revert EthTransferFailed();
            ethSpent += ethTransfers[i].amount;
            unchecked {
                ++i;
            }
        }

        for (uint256 i = 0; i < tokenTransfers.length;) {
            IERC20(tokenTransfers[i].token).safeTransferFrom(sender, tokenTransfers[i].to, tokenTransfers[i].amount);
            unchecked {
                ++i;
            }
        }

        if (msg.value > ethSpent) {
            (bool ok,) = msg.sender.call{value: msg.value - ethSpent}("");
            if (!ok) revert EthRefundFailed();
        }
    }
}
