let Biblioteca = artifacts.require("./Biblioteca.sol");
let Leilao = artifacts.require("./Leilao.sol");
let TesteLeilao = artifacts.require("./TesteLeilao.sol");

module.exports = async function(deployer) {
    await deployer.deploy(Biblioteca);
    deployer.link(Biblioteca, Leilao);
    deployer.link(Biblioteca, TesteLeilao);
};
