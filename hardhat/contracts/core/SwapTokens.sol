// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

import "../libraries/safeMath.sol";

contract SwapTokens {
    using SafeMath for uint256;

    string public constant name = "SwapTokens";
    string public constant symbol = "SWT";
    uint8 public constant decimals = 18;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => uint256) public nonces;

    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
    event Transfer(address indexed from, address indexed to, uint256 value);

    function approve(address _spender, uint256 _value) external returns (bool) {
        _approve(msg.sender, _spender, _value);
        return true;
    }

    function transfer(address _to, uint256 _value) external returns (bool) {
        _transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 value
    ) external returns (bool) {
        // set infinite approval if allowance is max
        // otherwise decrease allowance
        if (
            allowance[_from][msg.sender] != type(uint256).max &&
            allowance[_from][msg.sender] != 0
        ) {
            allowance[_from][msg.sender] = allowance[_from][msg.sender].sub(
                value
            );
        }

        _transfer(_from, _to, value);
        return true;
    }

    function _transfer(address _from, address _to, uint256 value) private {
        balanceOf[_from] = balanceOf[_from].sub(value);
        balanceOf[_to] = balanceOf[_to].add(value);
        emit Transfer(_from, _to, value);
    }

    function _approve(
        address _owner,
        address _spender,
        uint256 _value
    ) private {
        require(_spender != address(0), "Spender cannot be 0 address");
        require(_owner != address(0), "Owner cannot be 0 address");

        allowance[_owner][_spender] = _value;
        emit Approval(_owner, _spender, _value);
    }

    function _mint(address _to, uint256 _value) internal {
        totalSupply = totalSupply.add(_value);
        balanceOf[_to] = balanceOf[_to].add(_value);
        emit Transfer(address(0), _to, _value);
    }

    function _burn(address _from, uint256 _value) internal {
        balanceOf[_from] = balanceOf[_from].sub(_value);
        totalSupply = totalSupply.sub(_value);
        emit Transfer(_from, address(0), _value);
    }
}
