// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WineBank24 is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    struct WineBottle {
        string cantinaId;
        string collectionId;
        string bottleNumber;
        uint256 vintage;
        bool burned;
    }

    mapping(uint256 => WineBottle) public bottles;

    event Minted(uint256 indexed tokenId, address indexed to, string cantinaId, string collectionId);
    event Burned(uint256 indexed tokenId, string reason);

    constructor(address platformWallet) ERC721("WineBank24", "WB24") Ownable(platformWallet) {}

    function mint(
        address to,
        string calldata tokenURI,
        string calldata cantinaId,
        string calldata collectionId,
        string calldata bottleNumber,
        uint256 vintage
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        bottles[tokenId] = WineBottle({
            cantinaId: cantinaId,
            collectionId: collectionId,
            bottleNumber: bottleNumber,
            vintage: vintage,
            burned: false
        });

        emit Minted(tokenId, to, cantinaId, collectionId);
        return tokenId;
    }

    function burnBottle(uint256 tokenId, string calldata reason) external onlyOwner {
        require(!bottles[tokenId].burned, "Gia bruciato");
        bottles[tokenId].burned = true;
        _burn(tokenId);
        emit Burned(tokenId, reason);
    }

    function getBottle(uint256 tokenId) external view returns (WineBottle memory) {
        return bottles[tokenId];
    }

    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }
}
