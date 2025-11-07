// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ViceToads is ERC20, Ownable {
    using ECDSA for bytes32;

    address public authorizedSigner;
    mapping(address => mapping(uint256 => bool)) public usedNonces;

    bytes32 public constant VOUCHER_TYPEHASH = keccak256(
        "Voucher(address recipient,uint256 amount,uint256 nonce,uint256 expiry)"
    );
    bytes32 public DOMAIN_SEPARATOR;

    constructor(address _authorizedSigner) ERC20("ViceToads", "VTOAD") {
        authorizedSigner = _authorizedSigner;
        uint256 chainId;
        assembly { chainId := chainid() }
        DOMAIN_SEPARATOR = keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256(bytes("ViceToadsVoucher")),
            keccak256(bytes("1")),
            chainId,
            address(this)
        ));
    }

    function setAuthorizedSigner(address s) external onlyOwner { authorizedSigner = s; }

    function redeemVoucher(address recipient, uint256 amount, uint256 nonce, uint256 expiry, bytes calldata signature) external {
        require(block.timestamp <= expiry, "Voucher expired");
        require(!usedNonces[recipient][nonce], "Nonce used");

        bytes32 structHash = keccak256(abi.encode(
            VOUCHER_TYPEHASH,
            recipient,
            amount,
            nonce,
            expiry
        ));

        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
        address signer = digest.recover(signature);
        require(signer == authorizedSigner, "Invalid signer");

        usedNonces[recipient][nonce] = true;
        _mint(recipient, amount);
    }
}
