var Leilao = artifacts.require("./Leilao.sol");

module.exports = function(deployer) {
  deployer.deploy(
    Leilao, 
    "Leilao Ferrari",
    1,
    20,
    "0xfbc4725488A7e0E95bFae19BB674f5cfb1fa5924"
  );
};
