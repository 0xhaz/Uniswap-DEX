// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

library FixedPoint128 {
    uint8 internal constant RESOLUTION = 128;
    uint256 internal constant Q128 = 2 ** RESOLUTION;
}
