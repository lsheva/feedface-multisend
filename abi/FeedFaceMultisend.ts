//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// FeedFaceMultisend
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const feedFaceMultisendAbi = [
  {
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      {
        name: 'ethTransfers',
        internalType: 'struct FeedFaceMultisend.EthTransfer[]',
        type: 'tuple[]',
        components: [
          { name: 'to', internalType: 'address', type: 'address' },
          { name: 'amount', internalType: 'uint256', type: 'uint256' },
        ],
      },
      {
        name: 'tokenTransfers',
        internalType: 'struct FeedFaceMultisend.TokenTransfer[]',
        type: 'tuple[]',
        components: [
          { name: 'token', internalType: 'address', type: 'address' },
          { name: 'to', internalType: 'address', type: 'address' },
          { name: 'amount', internalType: 'uint256', type: 'uint256' },
        ],
      },
      {
        name: 'permits',
        internalType: 'struct FeedFaceMultisend.Permit[]',
        type: 'tuple[]',
        components: [
          { name: 'token', internalType: 'address', type: 'address' },
          { name: 'value', internalType: 'uint256', type: 'uint256' },
          { name: 'deadline', internalType: 'uint256', type: 'uint256' },
          { name: 'v', internalType: 'uint8', type: 'uint8' },
          { name: 'r', internalType: 'bytes32', type: 'bytes32' },
          { name: 's', internalType: 'bytes32', type: 'bytes32' },
        ],
      },
    ],
    name: 'disperse',
    outputs: [],
    stateMutability: 'payable',
  },
] as const
