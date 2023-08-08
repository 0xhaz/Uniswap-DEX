// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

import "solmate/tokens/ERC721.sol";

import "./interfaces/IERC20.sol";
import "./interfaces/IUniswapV3Pool.sol";
import "./lib/LiquidityMath.sol";
import "./lib/NFTRenderer.sol";
import "./lib/PoolAddress.sol";
import "./lib/TickMath.sol";

error NotAuthorized();
error NotEnoughLiquidity();
error PositionNotCleared();
error SlippageCheckFailed(uint256 amount0, uint256 amount1);
error WrongToken();

contract UniswapV3NFTManager is ERC721 {
    uint256 public totalSupply;
    uint256 private nextTokenId;

    address public immutable factory;

    struct TokenPosition {
        address pool;
        int24 lowerTick;
        int24 upperTick;
    }

    struct MintParams {
        address recipient;
        address tokenA;
        address tokenB;
        uint24 fee;
        int24 lowerTick;
        int24 upperTick;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
    }

    struct AddLiquidityParams {
        uint256 tokenId;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
    }

    mapping(uint256 => TokenPosition) public positions;

    modifier isApprovedOrOwner(uint256 tokenId) {
        address owner = ownerOf(tokenId);
        if (
            msg.sender != owner &&
            !isApprovedForAll[owner][msg.sender] &&
            getApproved(tokenId) != msg.sender
        ) revert NotAuthorized();
        _;
    }

    event AddLiquidity(
        uint256 indexed tokenId,
        uint128 liquidity,
        uint256 amount0,
        uint256 amount1
    );

    event RemoveLiquidity(
        uint256 indexed tokenId,
        uint128 liquidity,
        uint256 amount0,
        uint256 amount1
    );

    constructor(
        address factoryAddress
    ) ERC721("UniswapV3 NFT Positions", "UNIV3") {
        factory = factoryAddress;
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        TokenPosition memory tokenPosition = positions[tokenId];
        if (tokenPosition.pool == address(0x00)) revert WrongToken();

        IUniswapV3Pool pool = IUniswapV3Pool(tokenPosition.pool);

        return
            NFTRenderer.render(
                NFTRenderer.RenderParams({
                    pool: tokenPosition.pool,
                    owner: address(this),
                    lowerTick: tokenPosition.lowerTick,
                    upperTick: tokenPosition.upperTick,
                    fee: pool.fee()
                })
            );
    }

    function mint(MintParams calldata params) public returns (uint256 tokenId) {
        IUniswapV3Pool pool = getPool(params.tokenA, params.tokenB, params.fee);

        (uint128 liquidity, uint256 amount0, uint256 amount1) = _addLiquidity(
            AddLiquidityInternalParams({
                pool: pool,
                lowerTick: params.lowerTick,
                upperTick: params.upperTick,
                amount0Desired: params.amount0Desired,
                amount1Desired: params.amount1Desired,
                amount0Min: params.amount0Min,
                amount1Min: params.amount1Min
            })
        );

        tokenId = nextTokenId++;
        _mint(params.recipient, tokenId);
        totalSupply++;

        TokenPosition memory tokenPosition = TokenPosition({
            pool: address(pool),
            lowerTick: params.lowerTick,
            upperTick: params.upperTick
        });

        positions[tokenId] = tokenPosition;

        emit AddLiquidity(tokenId, liquidity, amount0, amount1);
    }

    function addLiquidity(
        AddLiquidityParams calldata params
    ) public returns (uint128 liquidity, uint256 amount0, uint256 amount1) {
        TokenPosition memory tokenPosition = positions[params.tokenId];
        if (tokenPosition.pool == address(0x00)) revert WrongToken();

        (liquidity, amount0, amount1) = _addLiquidity(
            AddLiquidityParams({
                pool: IUniswapV3Pool(tokenPosition.pool),
                lowerTick: tokenPosition.lowerTick,
                upperTick: tokenPosition.upperTick,
                amount0Desired: params.amount0Desired,
                amount1Desired: params.amount1Desired,
                amount0Min: params.amount0Min,
                amount1Min: params.amount1Min
            })
        );

        emit AddLiquidity(params.tokenId, liquidity, amount0, amount1);
    }
}
