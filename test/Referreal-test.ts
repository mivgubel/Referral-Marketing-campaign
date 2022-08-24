import { expect, use } from "chai";
import { ethers } from "hardhat";
import { Referral } from "../typechain-types";

describe("Referral Contract", function () {
	let referralContract: Referral;
	let accounts: any[];

	beforeEach(async function () {
		accounts = await ethers.getSigners();
		const referralFactory = await ethers.getContractFactory("Referral");
		referralContract = (await referralFactory.deploy()) as Referral; // casteamos el contrato para evitar el error de propiedades perdidas en el contrato
		await referralContract.deployed();
	});

	// Testing Constructor
	describe("Testing constructor: Contract Deploy...", function () {
		it("Set the owner", async function () {
			let owner = await referralContract.owner();
			expect(owner).to.eq(accounts[0].address);
		});
	});

	// Testing RegisterUser Function
	describe("Testing Register User Function", function () {
		it("Testing function revert if the user doesn't send the exact Fee", async function () {
			let fee = ethers.utils.parseUnits("0.02", "ether");
			let referidor_Address = accounts[0].address;
			let user1 = accounts[1];
			await expect(referralContract.connect(user1).RegisterUser("user1", referidor_Address, { value: fee })).to.be.revertedWith("Fee insuficiente");
		});
		/* este test fallara, solo revertira la transaccion exitosamente cuando el usuario referidor haya llenado los 9 spots de referidos por nivel
		it("Testing if the referring user has not reached the max number of users he can refer in the level", async function () {
			let fee = ethers.utils.parseUnits("0.25", "ether");
			let referidor_Address = accounts[0].address;
			expect(fee).to.
			await expect(referralContract.RegisterUser("user1", referidor_Address, { value: fee, customData })).to.be.revertedWith("El usuario referidor alcanzo el maximo de referidos en este nivel");
		});
		// este test fallara, solo revertira la transaccion exitosamente cuando el usuario referidor haya pasado los 10 niveles de referidos.
		it("Testing if the referring user hasn't reached the max level", async function () {
			let fee = ethers.utils.parseUnits("0.25", "ether");
			let referidor_Address = accounts[0].address;
			await expect(referralContract.RegisterUser("User 1", referidor_Address, { value: fee })).to.be.revertedWith("El usuario referidor ha completado los niveles disponibles");
		});
		*/
		it("Testing if the user is register correctly", async function () {
			let fee = ethers.utils.parseUnits("0.25", "ether");
			let referidor_Address = accounts[0].address;
			let user1 = accounts[1];
			await referralContract.connect(user1).RegisterUser("User 1", referidor_Address, { value: fee });
			let user = await referralContract.wallet_to_User(user1.address);
			expect(user.name).to.eq("User 1");
			expect(user.level).to.eq(1);
			expect(user.num_Referidos_PerLevel).to.eq(0);
			expect(user.wallet_Referidor).to.eq(referidor_Address);
		});

		it("Updating the number of referred users for the referring user", async function () {
			let fee = ethers.utils.parseUnits("0.25", "ether");
			let referidor_Address = accounts[0].address;
			let user1 = accounts[1];

			await referralContract.connect(user1).RegisterUser("User 1", referidor_Address, { value: fee });
			let num_Referidos = (await referralContract.wallet_to_User(referidor_Address)).num_Referidos_PerLevel;
			expect(num_Referidos).to.equal(1);

			await referralContract.connect(accounts[2]).RegisterUser("User 2", referidor_Address, { value: fee });
			let num_Referidos2 = (await referralContract.wallet_to_User(referidor_Address)).num_Referidos_PerLevel;
			expect(num_Referidos2).to.equal(2);
		});

		// con esto tambien queda testeada correctamente la funcion de CalculateFees()
		it("Testing if the Fees are split correctly (Function CalculateFees)", async function () {
			let fee = ethers.utils.parseUnits("0.25", "ether");
			let businessWallet = accounts[0].address;
			let referidor = accounts[1];
			let user1 = accounts[2];
			let user2 = accounts[3];
			let user3 = accounts[4];

			// Testing for first user
			await referralContract.connect(user1).RegisterUser("User 1", referidor.address, { value: fee });
			let feeToReferidor = await referralContract.Fees_Balances_Per_Wallet(referidor.address);
			let feeToBusiness = await referralContract.Fees_Balances_Per_Wallet(businessWallet);
			let feeExpectedReferidor = ethers.utils.parseUnits("0.175", "ether");
			let feeExpectedBusiness = ethers.utils.parseUnits("0.075", "ether");

			expect(feeToReferidor).to.eq(feeExpectedReferidor);
			expect(feeToBusiness).to.eq(feeExpectedBusiness);

			// Testing for second user
			await referralContract.connect(user2).RegisterUser("User 2", referidor.address, { value: fee });
			let feeToReferidor2 = await referralContract.Fees_Balances_Per_Wallet(referidor.address);
			let feeToBusiness2 = await referralContract.Fees_Balances_Per_Wallet(businessWallet);
			let feeExpectedReferidor2 = ethers.utils.parseUnits("0.35", "ether");
			let feeExpectedBusiness2 = ethers.utils.parseUnits("0.15", "ether");

			expect(feeToReferidor2).to.eq(feeExpectedReferidor2);
			expect(feeToBusiness2).to.eq(feeExpectedBusiness2);

			// Testing for third user
			await referralContract.connect(user3).RegisterUser("User 3", referidor.address, { value: fee });
			let feeToReferidor3 = await referralContract.Fees_Balances_Per_Wallet(referidor.address);
			let feeToBusiness3 = await referralContract.Fees_Balances_Per_Wallet(businessWallet);
			let feeExpectedReferidor3 = ethers.utils.parseUnits("0.475", "ether");
			let feeExpectedBusiness3 = ethers.utils.parseUnits("0.275", "ether");

			expect(feeToReferidor3).to.eq(feeExpectedReferidor3);
			expect(feeToBusiness3).to.eq(feeExpectedBusiness3);
		});

		it("Testing emit event of register successfully", async function () {
			let fee = ethers.utils.parseUnits("0.25", "ether");
			let referidor_Address = accounts[0].address;
			let user1 = accounts[1];

			await expect(referralContract.connect(user1).RegisterUser("User 1", referidor_Address, { value: fee }))
				.to.emit(referralContract, "RegisterSuccessfully")
				.withArgs("User 1", user1.address);
		});
	});

	// Testing LevelUp Function
	describe("Testing LevelUp Function", function () {
		it("Testing the function revert if the user doesn't send the correct Fee", async function () {
			let fee = ethers.utils.parseUnits("0.03", "ether");
			await expect(referralContract.LevelUp({ value: fee })).to.be.revertedWith("Fee Insuficiente");
		});
		/* Este Test solo pasara cuando el usuario haya llenado los 9 spots del nivel actual
		it("Testing if the function revert if the user has not filled the 9 spots available per level", async function () {
			let fee = ethers.utils.parseUnits("0.05", "ether");
			await expect(referralContract.LevelUp({ value: fee })).to.be.revertedWith("Aun hay Spots disponibles para tu actual nivel");
		});

		  este test solo pasara cuando el usuario haya alcanzado el nivel 10
		it("Testing if the function revert if the user has reached level 10", async function () {
			let fee = ethers.utils.parseUnits("0.05", "ether");
			await expect(referralContract.LevelUp({ value: fee })).to.be.revertedWith("Ya has usado todos tus spots de referidos disponibles");
		});
		*/
		// to run
		it("Testing if the Fee is asigned to the Business wallet correctly", async function () {
			let fee = ethers.utils.parseUnits("0.05", "ether");
			referralContract.LevelUp({ value: fee });
			let feeOwner = await referralContract.Fees_Balances_Per_Wallet(accounts[0].address);
			await expect(feeOwner).to.equal(fee);
		});

		it("Testing if the user level and spots available is updated correctly", async function () {
			let feePerUser = ethers.utils.parseUnits("0.25", "ether");
			let referidor = accounts[1].address;
			let user2 = accounts[2];
			let user3 = accounts[3];
			await referralContract.connect(user2).RegisterUser("User 2", referidor, { value: feePerUser });
			await referralContract.connect(user3).RegisterUser("User 3", user2.address, { value: feePerUser });
			let user = await referralContract.wallet_to_User(user2.address);
			expect(user.level).to.equal(1);
			expect(user.num_Referidos_PerLevel).to.equal(1);

			let feePerLevel = ethers.utils.parseUnits("0.05", "ether");
			await referralContract.connect(user2).LevelUp({ value: feePerLevel });
			user = await referralContract.wallet_to_User(user2.address);
			expect(user.level).to.eq(2);
			expect(user.num_Referidos_PerLevel).to.eq(0);
		});

		it("Testing the event of LevelUp is emitted", async function () {
			let fee = ethers.utils.parseUnits("0.05", "ether");
			let feePerUser = ethers.utils.parseUnits("0.25", "ether");
			let referidor = accounts[1].address;
			let user2 = accounts[2];
			await referralContract.connect(user2).RegisterUser("User 2", referidor, { value: feePerUser });
			await expect(referralContract.connect(user2).LevelUp({ value: fee }))
				.to.emit(referralContract, "levelUp")
				.withArgs("User 2", user2.address);
		});
	});

	// end close
});
