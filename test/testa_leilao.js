let LeilaoDeadline = artifacts.require('./TesteLeilao')
const BigNumber = require('bignumber.js')

contract('Leilao', function(accounts) {

    let contract;
    let contractCreator = accounts[0];
    let beneficiario = accounts[1];

    const ONE_ETH = new BigNumber(1000000000000000000);
    const ERROR_MSG = 'Returned error: VM Exception while processing transaction: revert';
    const ONGOING_STATE = 0;
    const FAILED_STATE = 1;
    const SUCCEEDED_STATE = 2;
    const PAID_OUT_STATE = 3;

    beforeEach(async function() {
        contract = await LeilaoDeadline.new('funding', 1, 10, beneficiario, {from: contractCreator, gas: 2000000});
    });

    it('Contrato Inicializado.', async function() {
        let contractName = await contract.name.call()
        expect(contractName).to.equal('funding');

        let targetAmount = await contract.targetAmount.call()
        expect(ONE_ETH.isEqualTo(targetAmount)).to.equal(true);

        let Deadline = await contract.Deadline.call()
        expect(Deadline.toNumber()).to.equal(600);

        let actualBeneficiary = await contract.beneficiario.call()
        expect(actualBeneficiary).to.equal(beneficiario);

        let estado = await contract.estado.call()
        expect(estado.valueOf().toNumber()).to.equal(ONGOING_STATE);
    });

    it('Lances realizados.', async function() {
        await contract.contribute({value: ONE_ETH, from: contractCreator});

        let contributed = await contract.amounts.call(contractCreator);
        expect(ONE_ETH.isEqualTo(contributed)).to.equal(true);

        let totalCollected = await contract.totalCollected.call();
        expect(ONE_ETH.isEqualTo(totalCollected)).to.equal(true);
    });

    it('Não pode efetuar lance após o deadline.', async function() {
        try {
            await contract.setCurrentTime(601);
            await contract.sendTransaction({
                value: ONE_ETH,
                from: contractCreator
            });
            expect.fail();
        } catch (error) {
            expect(error.message).to.equal(ERROR_MSG);
        }
    })

    it('Leilão Concluído Com Sucesso.', async function() {
        await contract.contribute({value: ONE_ETH, from: contractCreator});
        await contract.setCurrentTime(601);
        await contract.finishLeilao();
        let estado = await contract.estado.call();

        expect(estado.valueOf().toNumber()).to.equal(SUCCEEDED_STATE);
    });

    it('Leilão Falhou. Sem Vencedor.', async function() {
        await contract.setCurrentTime(601);
        await contract.finishLeilao();
        let estado = await contract.estado.call();

        expect(estado.valueOf().toNumber()).to.equal(FAILED_STATE);
    });

    it('Coletando dinheiro pago pelo vencedor.', async function() {
        await contract.contribute({value: ONE_ETH, from: contractCreator});
        await contract.setCurrentTime(601);
        await contract.finishLeilao();

        let initAmount = await web3.eth.getBalance(beneficiario);
        await contract.collect({from: contractCreator});

        let newBalance = await web3.eth.getBalance(beneficiario);
        let difference = newBalance - initAmount;
        expect(ONE_ETH.isEqualTo(difference)).to.equal(true);

        let fundingState = await contract.estado.call()
        expect(fundingState.valueOf().toNumber()).to.equal(PAID_OUT_STATE);
    });

    it('Coletando fundos do contrato.', async function() {
        await contract.contribute({value: ONE_ETH - 100, from: contractCreator});
        await contract.setCurrentTime(601);
        await contract.finishLeilao();

        await contract.withdraw({from: contractCreator});
        let amount = await contract.amounts.call(contractCreator);
        expect(amount.toNumber()).to.equal(0);
    });

    it('Evento emitido', async function() {
        await contract.setCurrentTime(601);
        const transaction = await contract.finishLeilao();

        const events = transaction.logs
        expect(events.length).to.equal(1);

        const event = events[0]
        expect(event.args.totalCollected.toNumber()).to.equal(0);
        expect(event.args.succeeded).to.equal(false);
    });

});
