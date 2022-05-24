pragma solidity ^0.5.0;

import "./Biblioteca.sol";

contract Leilao {

    using Biblioteca for *;

    enum State { Andamento, Falha, Sucesso, Pago }

    event LeilaoFinished(
        address addr,
        uint totalCollected,
        bool succeeded
    );

    string public name;
    uint public targetAmount;
    uint public Deadline;
    address payable public beneficiario;
    address public owner;
    State public estado;

    mapping(address => uint) public amounts;
    bool public collected;
    uint public totalCollected;

    modifier inState(State expectedState) {
        require(estado == expectedState, "Estado Inválido");
        _;
    }

    constructor(
        string memory contractName,
        uint targetAmountEth,
        uint durationInMin,
        address payable beneficiaryAddress
    )
        public
    {
        name = contractName;
        targetAmount = Biblioteca.etherToWei(targetAmountEth);
        Deadline = currentTime() + Biblioteca.minutesToSeconds(durationInMin);
        beneficiario = beneficiaryAddress;
        owner = msg.sender;
        estado = State.Andamento;
    }

    function contribute() public payable inState(State.Andamento) {
        require(beforeDeadline(), "Não são permitidos lances após o deadline");
        amounts[msg.sender] += msg.value;
        totalCollected += msg.value;

        if (totalCollected >= targetAmount) {
            collected = true;
        }
    }

    function finishLeilao() public inState(State.Andamento) {
        require(!beforeDeadline(), "Não é possível terminaro leilão antes do deadline");

        if (!collected) {
            estado = State.Falha;
        } else {
            estado = State.Sucesso;
        }

        emit LeilaoFinished(address(this), totalCollected, collected);
    }

    function collect() public inState(State.Sucesso) {
        if (beneficiario.send(totalCollected)) {
            estado = State.Pago;
        } else {
            estado = State.Falha;
        }
    }

    function withdraw() public inState(State.Falha) {
        require(amounts[msg.sender] > 0, "Nenhum lance foi emitido.");
        uint contributed = amounts[msg.sender];
        amounts[msg.sender] = 0;

        if (!msg.sender.send(contributed)) {
            amounts[msg.sender] = contributed;
        }
    }

    function beforeDeadline() public view returns(bool) {
        return currentTime() < Deadline;
    }

    function currentTime() internal view returns(uint) {
        return now;
    }

    function getTotalCollected() public view returns(uint) {
        return totalCollected;
    }

    function inProgress() public view returns (bool) {
        return estado == State.Andamento || estado == State.Sucesso;
    }

    function isSuccessful() public view returns (bool) {
        return estado == State.Pago;
    }
}