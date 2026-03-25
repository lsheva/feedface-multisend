// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

interface IERC20Permit {
    function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)
        external;
}

contract FeedFaceMultisend {
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
        for (uint256 i = 0; i < permits.length; i++) {
            IERC20Permit(permits[i].token).permit(
                sender, address(this), permits[i].value, permits[i].deadline, permits[i].v, permits[i].r, permits[i].s
            );
        }

        uint256 ethSpent;
        for (uint256 i = 0; i < ethTransfers.length; i++) {
            (bool ok,) = ethTransfers[i].to.call{value: ethTransfers[i].amount}("");
            require(ok, "ETH transfer failed");
            ethSpent += ethTransfers[i].amount;
        }

        for (uint256 i = 0; i < tokenTransfers.length; i++) {
            require(
                IERC20(tokenTransfers[i].token).transferFrom(sender, tokenTransfers[i].to, tokenTransfers[i].amount),
                "ERC20 transferFrom failed"
            );
        }

        if (msg.value > ethSpent) {
            (bool ok,) = msg.sender.call{value: msg.value - ethSpent}("");
            require(ok, "ETH refund failed");
        }
    }
}
